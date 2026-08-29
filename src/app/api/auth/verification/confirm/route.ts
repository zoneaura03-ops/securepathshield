import { NextResponse } from "next/server";
import { verifyCode } from "../../../../../lib/verification-codes";
import { createSession } from "../../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../../lib/db";
import { ensurePrimaryAccount } from "../../../../../lib/banking";
import { sendAccountReadyEmail } from "../../../../../lib/mail";

export async function POST(request: Request) {
  const { email, code } = await request.json();
  if (
    typeof email !== "string" ||
    typeof code !== "string" ||
    !/^\d{6}$/.test(code)
  ) {
    return NextResponse.json(
      { error: "Enter the complete 6-digit code." },
      { status: 400 },
    );
  }
  const [users] = await db.execute<DatabaseRow[]>(
    "SELECT id FROM users WHERE email=? AND status='pending' LIMIT 1",
    [email.trim().toLowerCase()],
  );
  if (!users[0] || !(await verifyCode(users[0].id, code))) {
    return NextResponse.json(
      { error: "That code is invalid or has expired." },
      { status: 400 },
    );
  }
  await db.execute(
    "UPDATE users SET status='active', email_verified_at=NOW() WHERE id=?",
    [users[0].id],
  );
  await ensurePrimaryAccount(users[0].id);
  await db.execute(
    "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'account','Welcome to SecurePath Bank','Your email is verified and your secure banking account is ready.')",
    [users[0].id],
  );
  try {
    await sendAccountReadyEmail(email.trim().toLowerCase());
  } catch (error) {
    console.error("Unable to send account-ready email", error);
  }
  await createSession(users[0].id);
  return NextResponse.json({ ok: true });
}
