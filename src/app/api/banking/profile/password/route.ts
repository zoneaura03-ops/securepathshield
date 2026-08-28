import { compare, hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { currentUser, destroySession } from "../../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../../lib/db";
import { clientIp, rateLimit } from "../../../../../lib/rate-limit";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const limit = rateLimit(
    `password-change:${user.id}:${clientIp(request)}`,
    5,
    15 * 60_000,
  );
  if (!limit.allowed)
    return NextResponse.json(
      { error: "Too many password attempts. Try again later." },
      { status: 429 },
    );
  const body = await request.json();
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");
  if (
    newPassword.length < 10 ||
    !/[A-Z]/.test(newPassword) ||
    !/[a-z]/.test(newPassword) ||
    !/\d/.test(newPassword)
  )
    return NextResponse.json(
      {
        error:
          "Use at least 10 characters with uppercase, lowercase, and a number.",
      },
      { status: 400 },
    );
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT password_hash FROM users WHERE id=? LIMIT 1",
    [user.id],
  );
  if (!rows[0] || !(await compare(currentPassword, rows[0].password_hash)))
    return NextResponse.json(
      { error: "Your current password is incorrect." },
      { status: 400 },
    );
  if (await compare(newPassword, rows[0].password_hash))
    return NextResponse.json(
      { error: "Choose a password you have not just used." },
      { status: 400 },
    );
  const passwordHash = await hash(newPassword, 12);
  await db.execute("UPDATE users SET password_hash=?,password=? WHERE id=?", [
    passwordHash,
    passwordHash,
    user.id,
  ]);
  await Promise.all([
    db.execute(
      "INSERT INTO audit_logs(subject_user_id,action,entity_type,entity_id) VALUES(?,'password.changed','user',?)",
      [user.id, String(user.id)],
    ),
    db.execute(
      "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'security','Password changed','Your account password was changed. If this was not you, contact support immediately.')",
      [user.id],
    ),
  ]);
  await destroySession();
  return NextResponse.json({ ok: true, signedOut: true });
}
