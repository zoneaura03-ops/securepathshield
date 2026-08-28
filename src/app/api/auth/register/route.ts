import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { db, type DatabaseRow } from "../../../../lib/db";
import { sendVerificationEmail } from "../../../../lib/mail";
import { issueVerificationCode } from "../../../../lib/verification-codes";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const password = String(body.password || "");
    const pin = String(body.pin || "");
    if (
      !firstName ||
      !lastName ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 10 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password) ||
      !/[^A-Za-z0-9]/.test(password) ||
      !/^\d{4}$/.test(pin)
    ) {
      return NextResponse.json(
        {
          error:
            "Complete all required fields. Passwords must contain at least 10 characters with uppercase, lowercase, number, and symbol; the PIN must contain 4 digits.",
        },
        { status: 400 },
      );
    }
    const [existing] = await db.execute<DatabaseRow[]>(
      "SELECT id, status FROM users WHERE email=? LIMIT 1",
      [email],
    );
    if (existing[0]?.status === "active")
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    const passwordHash = await hash(password, 12);
    const pinHash = await hash(pin, 12);
    let userId: number;
    if (existing[0]) {
      userId = existing[0].id;
      await db.execute(
        "UPDATE users SET password_hash=?, password=?, pin_hash=?, first_name=?, last_name=?, full_name=?, phone=?, date_of_birth=?, account_type=?, country=?, status='pending' WHERE id=?",
        [
          passwordHash,
          passwordHash,
          pinHash,
          firstName,
          lastName,
          `${firstName} ${lastName}`,
          body.phone || null,
          body.dateOfBirth || null,
          body.accountType || "Checking Account",
          body.country || null,
          userId,
        ],
      );
    } else {
      const [result] = await db.execute(
        "INSERT INTO users (email,password,password_hash,pin_hash,first_name,last_name,full_name,phone,date_of_birth,account_type,country,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,'pending')",
        [
          email,
          passwordHash,
          passwordHash,
          pinHash,
          firstName,
          lastName,
          `${firstName} ${lastName}`,
          body.phone || null,
          body.dateOfBirth || null,
          body.accountType || "Checking Account",
          body.country || null,
        ],
      );
      userId = Number((result as { insertId: number }).insertId);
    }
    const code = await issueVerificationCode(userId);
    await sendVerificationEmail(email, code);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "Registration failed:",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Account creation is temporarily unavailable.",
      },
      { status: 500 },
    );
  }
}
