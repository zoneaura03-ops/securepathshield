import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db, DatabaseRow } from "../../../../lib/db";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const number = new URL(request.url).searchParams
    .get("accountNumber")
    ?.replace(/\s/g, "");
  if (!number || !/^\d{8,20}$/.test(number))
    return NextResponse.json(
      { error: "Enter a valid SecurePath Shield account number." },
      { status: 400 },
    );
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT a.account_number,CASE WHEN a.user_id=? THEN CONCAT_WS(' ',u.first_name,u.last_name) ELSE a.name END name,a.type,a.currency,a.user_id FROM accounts a JOIN users u ON u.id=a.user_id WHERE a.account_number=? AND a.status='active' LIMIT 1",
    [user.id, number],
  );
  const row = rows[0];
  if (!row)
    return NextResponse.json(
      { error: "The SecurePath Shield account was not found." },
      { status: 404 },
    );
  return NextResponse.json({
    recipient: {
      accountNumber: row.account_number,
      name: row.name,
      accountType: row.type,
      currency: row.currency,
      bankName: process.env.BANK_LEGAL_NAME || "SecurePath Shield",
      isOwnAccount: Number(row.user_id) === user.id,
    },
  });
}
