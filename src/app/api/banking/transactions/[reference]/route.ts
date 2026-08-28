import { NextResponse } from "next/server";
import { currentUser } from "../../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../../lib/db";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const [rows] = await db.execute<DatabaseRow[]>(
    `SELECT tx.reference,tx.description,tx.type,tx.category,tx.currency,tx.amount,tx.status,tx.balance_after,tx.created_at,
      a.account_number,u.first_name,u.last_name,tr.transfer_type,tr.recipient_name,tr.recipient_account,tr.bank_name,
      su.first_name sender_first_name,su.last_name sender_last_name,sa.account_number sender_account
     FROM transactions tx
     JOIN accounts a ON a.id=tx.account_id JOIN users u ON u.id=tx.user_id
     LEFT JOIN transfers tr ON tr.id=tx.transfer_id
     LEFT JOIN users su ON su.id=tr.user_id LEFT JOIN accounts sa ON sa.id=tr.source_account_id
     WHERE tx.user_id=? AND tx.reference=? LIMIT 1`,
    [user.id, (await params).reference],
  );
  return rows[0]
    ? NextResponse.json({ transaction: rows[0] })
    : NextResponse.json({ error: "Receipt not found." }, { status: 404 });
}
