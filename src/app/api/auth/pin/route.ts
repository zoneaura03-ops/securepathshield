import { compare } from "bcryptjs";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSession } from "../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../lib/db";
import { clientIp, rateLimit } from "../../../../lib/rate-limit";
export async function POST(request: Request) {
  const limit = rateLimit(`pin:${clientIp(request)}`, 8, 10 * 60_000);
  if (!limit.allowed)
    return NextResponse.json(
      { error: "Too many PIN attempts. Try again later." },
      { status: 429 },
    );
  const cookieStore = await cookies();
  const { pin } = await request.json(),
    token = cookieStore.get("securepathshield_login_challenge")?.value;
  if (!token || !/^\d{4}$/.test(String(pin || "")))
    return NextResponse.json(
      { error: "Your sign-in challenge expired. Start again." },
      { status: 400 },
    );
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT c.id,c.user_id,c.remember_me,u.pin_hash,u.status,u.role FROM login_challenges c JOIN users u ON u.id=c.user_id WHERE c.token_hash=? AND c.expires_at>NOW() LIMIT 1",
    [tokenHash],
  );
  const challenge = rows[0];
  if (
    !challenge ||
    challenge.status !== "active" ||
    !(await compare(String(pin), challenge.pin_hash))
  )
    return NextResponse.json(
      { error: "The PIN is incorrect or the challenge expired." },
      { status: 403 },
    );
  await db.execute("DELETE FROM login_challenges WHERE id=?", [challenge.id]);
  cookieStore.set("securepathshield_login_challenge", "", { path: "/", maxAge: 0 });
  await createSession(challenge.user_id, Boolean(challenge.remember_me));
  return NextResponse.json({ ok: true, role: challenge.role });
}
