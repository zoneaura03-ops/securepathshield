import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../lib/db";
import { reference } from "../../../../lib/references";
import { sendCreditNotificationEmail } from "../../../../lib/mail";

const fundingLabels: Record<string, string> = {
  bank_deposit: "Bank deposit",
  wire_transfer: "Wire transfer",
  local_transfer: "Local transfer",
  international_transfer: "International transfer",
  internal_transfer: "Internal transfer",
  paypal: "PayPal",
  cashapp: "Cash App",
  skrill: "Skrill",
  card: "Card funding",
  cash_deposit: "Cash deposit",
  stock_dividend: "Stock dividend",
  btc: "BTC",
  eth: "ETH",
  usdt: "USDT",
};
const cryptoAssets = new Set(["btc", "eth", "usdt"]);

async function administrator() {
  const user = await currentUser();
  return user?.role === "admin" && user.status === "active" ? user : null;
}

export async function GET(request: Request) {
  const actor = await administrator();
  if (!actor)
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  const query = new URL(request.url).searchParams.get("q")?.trim() || "";
  const search = `%${query}%`;
  const [rows] = await db.execute<DatabaseRow[]>(
    `SELECT u.id,u.email,u.first_name,u.last_name,u.status,a.id account_id,a.account_number,a.name account_name,a.currency,a.available_balance,a.ledger_balance,
      COALESCE(MAX(CASE WHEN w.asset='BTC' THEN w.balance END),0) btc_balance,
      COALESCE(MAX(CASE WHEN w.asset='ETH' THEN w.balance END),0) eth_balance,
      COALESCE(MAX(CASE WHEN w.asset='USDT' THEN w.balance END),0) usdt_balance
     FROM users u JOIN accounts a ON a.user_id=u.id AND a.status='active'
     LEFT JOIN crypto_wallets w ON w.user_id=u.id
     WHERE u.role='user' AND (u.email LIKE ? OR u.full_name LIKE ?)
     GROUP BY u.id,u.email,u.first_name,u.last_name,u.status,a.id,a.account_number,a.name,a.currency,a.available_balance,a.ledger_balance
     ORDER BY u.created_at DESC LIMIT 50`,
    [search, search],
  );
  const [cardRows] = await db.execute<DatabaseRow[]>(
    "SELECT id,user_id,brand,card_name,last_four,currency,balance,status FROM cards WHERE status='active' ORDER BY approved_at DESC LIMIT 250",
  );
  return NextResponse.json({
    users: rows.map((row) => ({
      ...row,
      available_balance: Number(row.available_balance),
      ledger_balance: Number(row.ledger_balance),
      btc_balance: Number(row.btc_balance),
      eth_balance: Number(row.eth_balance),
      usdt_balance: Number(row.usdt_balance),
    })),
    cards: cardRows.map((card) => ({ ...card, balance: Number(card.balance) })),
  });
}

export async function POST(request: Request) {
  const actor = await administrator();
  if (!actor)
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  const body = await request.json().catch(() => ({}));
  const userId = Number(body.userId);
  const fundingType = String(body.fundingType || "").toLowerCase();
  const amount = Number(body.amount);
  const reason = String(body.reason || "").trim();
  const externalReference = String(body.externalReference || "")
    .trim()
    .slice(0, 80);
  if (
    !Number.isInteger(userId) ||
    userId < 1 ||
    !fundingLabels[fundingType] ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 1_000_000_000 ||
    reason.length < 5 ||
    reason.length > 255
  )
    return NextResponse.json(
      {
        error:
          "Choose a customer and funding type, enter a positive amount, and provide a clear reason.",
      },
      { status: 400 },
    );

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.execute<DatabaseRow[]>(
      "SELECT id,email,status,role FROM users WHERE id=? FOR UPDATE",
      [userId],
    );
    const customer = users[0];
    if (!customer || customer.role !== "user")
      throw new FundingError("Customer account not found.", 404);
    if (customer.status !== "active")
      throw new FundingError("Only active customers can receive funding.", 422);

    if (fundingType === "card") {
      const cardId = Number(body.cardId);
      if (!Number.isInteger(cardId) || cardId < 1)
        throw new FundingError(
          "Choose an approved customer card to fund.",
          400,
        );
      const [cards] = await connection.execute<DatabaseRow[]>(
        "SELECT id,card_name,last_four,currency,balance FROM cards WHERE id=? AND user_id=? AND status='active' FOR UPDATE",
        [cardId, userId],
      );
      const card = cards[0];
      if (!card)
        throw new FundingError("The selected active card was not found.", 404);
      await connection.execute(
        "UPDATE cards SET balance=balance+? WHERE id=?",
        [amount, card.id],
      );
      const fundingReference = reference("LCF");
      const balanceAfter = Number(card.balance) + amount;
      await connection.execute(
        "INSERT INTO notifications(user_id,type,title,body,action_url) VALUES(?,'card',?,?,?)",
        [
          userId,
          "Card balance funded",
          `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${card.currency} was credited to ${card.card_name} ending in ${card.last_four}. Reference: ${fundingReference}.`,
          "/dashboard/cards",
        ],
      );
      await connection.execute(
        "INSERT INTO audit_logs(actor_user_id,subject_user_id,action,entity_type,entity_id,details) VALUES(?,?,'card.admin_funded','card',?,?)",
        [
          actor.id,
          userId,
          String(card.id),
          JSON.stringify({
            reference: fundingReference,
            amount,
            currency: card.currency,
            reason,
            externalReference,
            balanceAfter,
          }),
        ],
      );
      await connection.commit();
      const emailDelivered = await creditEmail(
        String(customer.email),
        amount.toFixed(2),
        String(card.currency),
        fundingReference,
        `${String(card.card_name)} card`,
        balanceAfter.toFixed(2),
        reason,
      );
      return NextResponse.json({
        success: true,
        emailDelivered,
        reference: fundingReference,
        kind: "card",
        cardId: card.id,
        currency: card.currency,
        amount,
        balanceAfter,
      });
    }
    if (cryptoAssets.has(fundingType)) {
      const asset = fundingType.toUpperCase();
      await connection.execute(
        "INSERT IGNORE INTO crypto_wallets(user_id,asset) VALUES(?,?)",
        [userId, asset],
      );
      await connection.execute(
        "UPDATE crypto_wallets SET balance=balance+? WHERE user_id=? AND asset=?",
        [amount, userId, asset],
      );
      const fundingReference = reference("LCF");
      await connection.execute(
        "INSERT INTO crypto_manual_credits(reference,user_id,asset,amount,reason,credited_by) VALUES(?,?,?,?,?,?)",
        [fundingReference, userId, asset, amount, reason, actor.id],
      );
      const displayAmount = amount.toLocaleString("en-US", {
        maximumFractionDigits: asset === "USDT" ? 2 : 8,
      });
      await connection.execute(
        "INSERT INTO notifications(user_id,type,title,body,action_url) VALUES(?,'crypto',?,?,?)",
        [
          userId,
          `${asset} wallet funded`,
          `${displayAmount} ${asset} was credited to your crypto wallet. Reference: ${fundingReference}.`,
          "/dashboard/crypto",
        ],
      );
      await connection.execute(
        "INSERT INTO audit_logs(actor_user_id,subject_user_id,action,entity_type,entity_id,details) VALUES(?,?,'user.funded','crypto_wallet',?,?)",
        [
          actor.id,
          userId,
          fundingReference,
          JSON.stringify({
            fundingType,
            asset,
            amount,
            reason,
            externalReference,
          }),
        ],
      );
      await connection.commit();
      const emailDelivered = await creditEmail(
        String(customer.email),
        displayAmount,
        asset,
        fundingReference,
        `${asset} wallet`,
        undefined,
        reason,
      );
      return NextResponse.json({
        success: true,
        emailDelivered,
        reference: fundingReference,
        kind: "crypto",
        asset,
        amount,
      });
    }

    const [accounts] = await connection.execute<DatabaseRow[]>(
      "SELECT id,currency,available_balance,ledger_balance FROM accounts WHERE user_id=? AND status='active' ORDER BY id LIMIT 1 FOR UPDATE",
      [userId],
    );
    const account = accounts[0];
    if (!account)
      throw new FundingError("The customer has no active account.", 404);
    await connection.execute(
      "UPDATE accounts SET available_balance=available_balance+?,ledger_balance=ledger_balance+? WHERE id=?",
      [amount, amount, account.id],
    );
    const fundingReference = reference("LFD");
    const label = fundingLabels[fundingType];
    const balanceAfter = Number(account.ledger_balance) + amount;
    const description =
      `${label} funding${externalReference ? ` · ${externalReference}` : ""}`.slice(
        0,
        255,
      );
    await connection.execute(
      "INSERT INTO transactions(reference,account_id,user_id,type,category,description,currency,amount,balance_after,status,metadata) VALUES(?,?,?,'credit',?,?,?,?,?,'processed',?)",
      [
        fundingReference,
        account.id,
        userId,
        fundingType,
        description,
        account.currency,
        amount,
        balanceAfter,
        JSON.stringify({
          admin_funding: true,
          funded_by: actor.id,
          reason,
          external_reference: externalReference || null,
        }),
      ],
    );
    await connection.execute(
      "INSERT INTO notifications(user_id,type,title,body,action_url) VALUES(?,'transaction',?,?,?)",
      [
        userId,
        `${label} received`,
        `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${account.currency} was credited through ${label}. Reference: ${fundingReference}.`,
        `/dashboard/receipt?reference=${encodeURIComponent(fundingReference)}`,
      ],
    );
    await connection.execute(
      "INSERT INTO audit_logs(actor_user_id,subject_user_id,action,entity_type,entity_id,details) VALUES(?,?,'user.funded','transaction',?,?)",
      [
        actor.id,
        userId,
        fundingReference,
        JSON.stringify({
          fundingType,
          amount,
          currency: account.currency,
          reason,
          externalReference,
          balanceAfter,
        }),
      ],
    );
    await connection.commit();
    const emailDelivered = await creditEmail(
      String(customer.email),
      amount.toFixed(2),
      String(account.currency),
      fundingReference,
      "bank account",
      balanceAfter.toFixed(2),
      reason,
    );
    return NextResponse.json({
      success: true,
      emailDelivered,
      reference: fundingReference,
      kind: "account",
      currency: account.currency,
      amount,
      balanceAfter,
    });
  } catch (error) {
    await connection.rollback();
    if (error instanceof FundingError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("User funding failed:", error);
    return NextResponse.json(
      { error: "Unable to fund the customer account." },
      { status: 500 },
    );
  } finally {
    connection.release();
  }
}
class FundingError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
async function creditEmail(
  email: string,
  amount: string,
  currency: string,
  referenceValue: string,
  channel: string,
  balanceAfter?: string,
  reason?: string,
) {
  try {
    await sendCreditNotificationEmail({
      email,
      amount,
      currency,
      reference: referenceValue,
      channel,
      balanceAfter,
      reason,
    });
    return true;
  } catch (error) {
    console.error("Credit email delivery failed:", error);
    return false;
  }
}
