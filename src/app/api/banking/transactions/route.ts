import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../lib/db";
export async function GET() {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT reference,description,type,category,currency,amount,status,created_at FROM transactions WHERE user_id=? ORDER BY created_at DESC LIMIT 100",
    [user.id],
  );
  return NextResponse.json({
    transactions: rows.map((row) => ({
      id: row.reference,
      name: row.description,
      kind: row.category,
      amount: (row.type === "credit" ? 1 : -1) * Number(row.amount),
      currency: row.currency,
      date: new Date(row.created_at).toISOString(),
      status: displayStatus(String(row.status)),
    })),
  });
}
function displayStatus(status: string) {
  if (status === "processed") return "Processed";
  if (status === "processing") return "Processing";
  if (status === "declined") return "Declined";
  if (status === "failed") return "Failed";
  if (status === "resolved") return "Resolved";
  if (status === "refunded" || status === "reversed") return "Refunded";
  return "Pending";
}