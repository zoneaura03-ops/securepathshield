import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../lib/db";
import { ensurePrimaryAccount } from "../../../../lib/banking";
export async function GET() {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT id,brand,card_name,last_four,currency,balance,daily_limit,status,expiry_month,expiry_year,created_at FROM cards WHERE user_id=? ORDER BY created_at DESC",
    [user.id],
  );
  return NextResponse.json({
    holderName: `${user.firstName} ${user.lastName}`,
    cards: rows.map((row) => ({
      ...row,
      holder_name: `${user.firstName} ${user.lastName}`,
      balance: Number(row.balance),
      daily_limit: Number(row.daily_limit),
    })),
  });
}
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  if (!user.kycVerified)
    return NextResponse.json({ error: "Verify your identity before applying for or funding a card.", verificationRequired: true, verificationUrl: "/dashboard/verification" }, { status: 403 });
  const body = await request.json(),
    account = await ensurePrimaryAccount(user.id);
  if (body.action === "apply") {
    const brand = String(body.brand || "").toLowerCase();
    if (!(["visa", "mastercard", "amex"] as const).includes(brand as "visa" | "mastercard" | "amex"))
      return NextResponse.json(
        { error: "Choose Visa, Mastercard, or Credit Card." },
        { status: 400 },
      );
    const [existingCards] = await db.execute<DatabaseRow[]>(
      "SELECT status FROM cards WHERE user_id=? AND brand=? ORDER BY id DESC LIMIT 1",
      [user.id, brand],
    );
    if (existingCards[0] && ["pending", "active", "frozen"].includes(String(existingCards[0].status)))
      return NextResponse.json(
        {
          error:
            existingCards[0].status === "pending"
              ? "This card application is already under review."
              : "You cannot apply for a duplicate card type.",
        },
        { status: 409 },
      );    const cardName =
      brand === "visa"
        ? "SecurePath Shield Visa"
        : brand === "mastercard"
          ? "SecurePath Shield Mastercard"
          : "SecurePath Shield Credit Card";
    await db.execute(
      "INSERT INTO cards(user_id,account_id,brand,card_name,currency,status) VALUES(?,?,?,?,?,'pending')",
      [user.id, account.id, brand, cardName, account.currency],
    );
    await Promise.all([
      db.execute(
        "INSERT INTO audit_logs(actor_user_id,subject_user_id,action,entity_type) VALUES(?,?, 'card.applied','card')",
        [user.id, user.id],
      ),
      db.execute(
        "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'card','Card application received',?)",
        [user.id, `Your ${cardName} application is now awaiting administrator review.`],
      ),
    ]);
    return NextResponse.json({ ok: true, status: "pending", brand });
  }
  const amount = Number(body.amount);
  if (
    !["fund", "withdraw"].includes(body.action) ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !/^\d{4}$/.test(String(body.pin || ""))
  )
    return NextResponse.json(
      { error: "Enter a valid amount and PIN." },
      { status: 400 },
    );
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.execute<DatabaseRow[]>(
      "SELECT pin_hash FROM users WHERE id=?",
      [user.id],
    );
    if (
      !users[0]?.pin_hash ||
      !(await compare(String(body.pin), users[0].pin_hash))
    )
      throw new CardError("The transaction PIN is incorrect.", 403);
    const [cards] = await connection.execute<DatabaseRow[]>(
      "SELECT * FROM cards WHERE id=? AND user_id=? AND status='active' FOR UPDATE",
      [body.cardId, user.id],
    );
    const card = cards[0];
    if (!card) throw new CardError("Active card not found.", 404);
    const [accounts] = await connection.execute<DatabaseRow[]>(
      "SELECT * FROM accounts WHERE id=? FOR UPDATE",
      [card.account_id],
    );
    const source = accounts[0];
    if (body.action === "fund") {
      if (Number(source.available_balance) < amount)
        throw new CardError("Insufficient account balance.", 422);
      await connection.execute(
        "UPDATE accounts SET available_balance=available_balance-?,ledger_balance=ledger_balance-? WHERE id=?",
        [amount, amount, source.id],
      );
      await connection.execute(
        "UPDATE cards SET balance=balance+? WHERE id=?",
        [amount, card.id],
      );
    } else {
      if (Number(card.balance) < amount)
        throw new CardError("Insufficient card balance.", 422);
      await connection.execute(
        "UPDATE cards SET balance=balance-? WHERE id=?",
        [amount, card.id],
      );
      await connection.execute(
        "UPDATE accounts SET available_balance=available_balance+?,ledger_balance=ledger_balance+? WHERE id=?",
        [amount, amount, source.id],
      );
    }
    await connection.execute(
      "INSERT INTO audit_logs(actor_user_id,subject_user_id,action,entity_type,entity_id,details) VALUES(?,?,?,'card',?,?)",
      [
        user.id,
        user.id,
        `card.${body.action}`,
        String(card.id),
        JSON.stringify({ amount, currency: card.currency }),
      ],
    );
    await connection.execute(
      "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'card',?,?)",
      [
        user.id,
        body.action === "fund" ? "Virtual card funded" : "Card funds withdrawn",
        body.action === "fund"
          ? `${amount.toFixed(2)} ${String(card.currency)} was moved from your account to ${String(card.card_name)}.`
          : `${amount.toFixed(2)} ${String(card.currency)} was moved from ${String(card.card_name)} back to your account.`,
      ],
    );
    await connection.commit();
    return NextResponse.json({ ok: true });
  } catch (error) {
    await connection.rollback();
    if (error instanceof CardError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    return NextResponse.json(
      { error: "Card balance update failed." },
      { status: 500 },
    );
  } finally {
    connection.release();
  }
}
class CardError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
