import { NextResponse } from "next/server";
import { sendVerificationEmail } from "../../../../../lib/mail";
import { issueVerificationCode } from "../../../../../lib/verification-codes";
import { db, type DatabaseRow } from "../../../../../lib/db";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    }
    const normalizedEmail = email.trim().toLowerCase();
    const [users] = await db.execute<DatabaseRow[]>(
      "SELECT id FROM users WHERE email=? AND status='pending' LIMIT 1",
      [normalizedEmail],
    );
    if (!users[0]) {
      return NextResponse.json(
        { error: "No pending account was found for this email." },
        { status: 404 },
      );
    }
    const code = await issueVerificationCode(users[0].id);
    await sendVerificationEmail(email, code);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "Verification email failed:",
      error instanceof Error ? error.message : error,
    );
    const message =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "We could not send the verification email. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
