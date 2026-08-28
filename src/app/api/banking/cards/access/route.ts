import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { currentUser } from "../../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../../lib/db";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const cardId = Number(body.cardId);
  const pin = String(body.pin || "");
  if (!Number.isInteger(cardId) || cardId < 1 || !/^\d{4}$/.test(pin))
    return NextResponse.json({ error: "Choose an active card and enter your 4-digit transaction PIN." }, { status: 400 });
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT c.id,c.card_name,c.status,u.pin_hash FROM cards c JOIN users u ON u.id=c.user_id WHERE c.id=? AND c.user_id=? LIMIT 1",
    [cardId, user.id],
  );
  const card = rows[0];
  if (!card || card.status !== "active") return NextResponse.json({ error: "Active card not found." }, { status: 404 });
  if (!card.pin_hash || !(await compare(pin, String(card.pin_hash))))
    return NextResponse.json({ error: "The transaction PIN is incorrect." }, { status: 403 });
  await db.execute(
    "INSERT INTO audit_logs(actor_user_id,subject_user_id,action,entity_type,entity_id) VALUES(?,?, 'card.secure_access_requested','card',?)",
    [user.id, user.id, String(card.id)],
  );
  return NextResponse.json({
    status: "hold",
    title: "Hold on…",
    message: "Your full card number, CVV, expiry, and card PIN are still being prepared. Please contact our customer care team for assistance.",
  });
}
