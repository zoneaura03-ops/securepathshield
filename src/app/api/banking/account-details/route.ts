import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { ensurePrimaryAccount } from "../../../../lib/banking";
import { db, DatabaseRow } from "../../../../lib/db";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const { pin } = await request.json();
  if (!/^\d{4}$/.test(String(pin || "")))
    return NextResponse.json(
      { error: "Enter your 4-digit transaction PIN." },
      { status: 400 },
    );
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT pin_hash,status FROM users WHERE id=? LIMIT 1",
    [user.id],
  );
  if (rows[0]?.status !== "active")
    return NextResponse.json(
      { error: "Your account is not active." },
      { status: 403 },
    );
  if (!rows[0]?.pin_hash || !(await compare(String(pin), rows[0].pin_hash)))
    return NextResponse.json(
      { error: "The transaction PIN is incorrect." },
      { status: 403 },
    );
  const account = await ensurePrimaryAccount(user.id);
  return NextResponse.json({
    details: {
      accountHolder: `${user.firstName} ${user.lastName}`,
      accountNumber: account.accountNumber,
      accountName: account.name,
      accountType: account.type,
      currency: account.currency,
      status: account.status,
      bankName: process.env.BANK_LEGAL_NAME || "SecurePath Bank",
    },
  });
}
