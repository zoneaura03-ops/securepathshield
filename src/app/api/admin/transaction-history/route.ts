import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../lib/db";
import { reference } from "../../../../lib/references";
import { sendTransactionHistoryEmail } from "../../../../lib/mail";
import { buildTransactionHistoryPdf } from "../../../../lib/transaction-history-pdf";

const rails = [
  "paypal",
  "cashapp",
  "local_transfer",
  "international_transfer",
  "internal_transfer",
  "btc",
  "eth",
  "usdt",
  "card",
  "stock_dividend",
] as const;
const railSet = new Set<string>(rails);
const statuses = [
  "processed",
  "pending",
  "processing",
  "failed",
  "declined",
  "resolved",
  "refunded",
] as const;
const statusSet = new Set<string>(statuses);
const descriptionTypes = [
  "salary",
  "merchant_purchase",
  "online_purchase",
  "bill_payment",
  "subscription",
  "transfer",
  "refund",
  "service_fee",
  "cash_withdrawal",
  "crypto_trade",
  "interest",
  "stock_dividend",
  "direct_debit",
  "card_payment",
  "remittance",
  "account_adjustment",
] as const;
const descriptionTypeSet = new Set<string>(descriptionTypes);
const railLabels: Record<string, string> = {
  paypal: "PayPal",
  cashapp: "Cash App",
  local_transfer: "Local transfer",
  international_transfer: "International transfer",
  internal_transfer: "Internal transfer",
  btc: "BTC",
  eth: "ETH",
  usdt: "USDT",
  card: "Card transaction",
  stock_dividend: "Stock dividend",
};

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
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT u.id,u.email,u.first_name,u.last_name,u.status,a.id account_id,a.account_number,a.name account_name,a.currency FROM users u JOIN accounts a ON a.user_id=u.id AND a.status='active' WHERE u.role='user' AND (u.email LIKE ? OR u.full_name LIKE ?) ORDER BY u.created_at DESC LIMIT 50",
    [`%${query}%`, `%${query}%`],
  );
  return NextResponse.json({ users: rows });
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
  const selectedRails: string[] = Array.isArray(body.rails)
    ? Array.from(new Set(body.rails.map((rail: unknown) => String(rail))))
    : [];
  const direction = String(body.direction || "mixed");
  const selectedStatuses: string[] = Array.isArray(body.statuses)
    ? Array.from(
        new Set(body.statuses.map((status: unknown) => String(status))),
      )
    : [];
  const selectedDescriptions: string[] = Array.isArray(body.descriptionTypes)
    ? Array.from(
        new Set(
          body.descriptionTypes.map((description: unknown) =>
            String(description),
          ),
        ),
      )
    : [];
  const count = Number(body.count);
  const minimum = Number(body.minimum);
  const maximum = Number(body.maximum);
  const fromTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(body.fromTime || ""))
    ? String(body.fromTime)
    : "";
  const toTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(body.toTime || ""))
    ? String(body.toTime)
    : "";
  const fromDate = new Date(`${String(body.from || "")}T${fromTime}:00`);
  const requestedToDate = new Date(`${String(body.to || "")}T${toTime}:59`);
  const now = new Date();
  const toDate = requestedToDate > now ? now : requestedToDate;

  if (
    !Number.isInteger(userId) ||
    userId < 1 ||
    !selectedRails.length ||
    selectedRails.some((rail) => !railSet.has(rail)) ||
    !["mixed", "debit", "credit"].includes(direction) ||
    !selectedStatuses.length ||
    selectedStatuses.some((status) => !statusSet.has(status)) ||
    !selectedDescriptions.length ||
    selectedDescriptions.some(
      (description) => !descriptionTypeSet.has(description),
    ) ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 200 ||
    !Number.isFinite(minimum) ||
    !Number.isFinite(maximum) ||
    minimum <= 0 ||
    maximum < minimum ||
    !fromTime ||
    !toTime ||
    Number.isNaN(fromDate.getTime()) ||
    Number.isNaN(requestedToDate.getTime()) ||
    fromDate > toDate ||
    String(body.to || "") > now.toISOString().slice(0, 10)
  )
    return NextResponse.json(
      {
        error:
          "Check the customer, rails, directions, dates, count, and amount range.",
      },
      { status: 400 },
    );

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [accounts] = await connection.execute<DatabaseRow[]>(
      "SELECT a.id,a.account_number,a.currency,a.ledger_balance,u.email,u.first_name,u.last_name FROM accounts a JOIN users u ON u.id=a.user_id WHERE a.user_id=? AND a.status='active' ORDER BY a.id LIMIT 1 FOR UPDATE",
      [userId],
    );
    const account = accounts[0];
    if (!account)
      throw new HistoryError(
        "The selected customer has no active account.",
        404,
      );

    const generated: Array<{
      reference: string;
      rail: string;
      type: string;
      amount: number;
      status: string;
      createdAt: string;
    }> = [];
    const range = Math.max(0, toDate.getTime() - fromDate.getTime());
    const customDescription = String(body.description || "")
      .trim()
      .slice(0, 100);
    for (let index = 0; index < count; index += 1) {
      const rail = selectedRails[index % selectedRails.length];
      const type =
        direction === "mixed"
          ? index % 2 === 0
            ? "credit"
            : "debit"
          : direction;
      const status = selectedStatuses[index % selectedStatuses.length];
      const amount = Number(
        (minimum + Math.random() * (maximum - minimum)).toFixed(2),
      );
      const createdAt = new Date(fromDate.getTime() + Math.random() * range);
      const transactionReference = reference("LHX");
      const label = railLabels[rail];
      const descriptionType =
        selectedDescriptions[index % selectedDescriptions.length];
      const description = buildDescription(
        descriptionType,
        label,
        type,
        customDescription,
      );
      await connection.execute(
        "INSERT INTO transactions(reference,account_id,user_id,type,category,description,currency,amount,balance_after,status,metadata,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
        [
          transactionReference,
          account.id,
          userId,
          type,
          rail,
          description,
          account.currency,
          amount,
          null,
          status,
          JSON.stringify({
            admin_generated: true,
            generated_by: actor.id,
            rail,
            direction: type,
            generated_status: status,
            affects_live_balance: false,
          }),
          toSqlDate(createdAt),
        ],
      );
      generated.push({
        reference: transactionReference,
        rail,
        type,
        amount,
        status,
        createdAt: createdAt.toISOString(),
      });
    }

    await connection.execute(
      "INSERT INTO audit_logs(actor_user_id,subject_user_id,action,entity_type,entity_id,details) VALUES(?,?,'transaction_history.generated','user',?,?)",
      [
        actor.id,
        userId,
        String(userId),
        JSON.stringify({
          count,
          rails: selectedRails,
          statuses: selectedStatuses,
          descriptionTypes: selectedDescriptions,
          direction,
          minimum,
          maximum,
          currency: account.currency,
          from: body.from,
          to: body.to,
          fromTime,
          toTime,
          affectsLiveBalance: false,
          references: generated.map((entry) => entry.reference),
        }),
      ],
    );
    await connection.commit();
    const notifications = generated.map((entry) => {
      const label = railLabels[entry.rail],
        displayStatus =
          entry.status === "processed" ? "completed" : entry.status;
      return db.execute(
        "INSERT INTO notifications(user_id,type,title,body,action_url,created_at) VALUES(?,'transaction',?,?,?,?)",
        [
          userId,
          `${label} ${entry.type === "credit" ? "credit" : "payment"}`,
          `${entry.type === "credit" ? "Credit" : "Debit"} of ${entry.amount.toFixed(2)} ${account.currency} via ${label} was ${displayStatus}. Reference: ${entry.reference}.`,
          `/dashboard/receipt?reference=${encodeURIComponent(entry.reference)}`,
          toSqlDate(new Date(entry.createdAt)),
        ],
      );
    });
    const notificationResults = await Promise.allSettled(notifications);
    const notificationCount = notificationResults.filter(
      (result) => result.status === "fulfilled",
    ).length;
    let emailDelivered = false;
    try {
      const pdf = await buildTransactionHistoryPdf({
        customerName: `${account.first_name} ${account.last_name}`,
        currency: String(account.currency),
        entries: generated,
      });
      await sendTransactionHistoryEmail({
        email: String(account.email),
        customerName: `${account.first_name} ${account.last_name}`,
        pdf,
        from: String(body.from),
        to: String(body.to),
      });
      emailDelivered = true;
    } catch (error) {
      console.error("Transaction history email failed:", error);
    }
    return NextResponse.json({
      success: true,
      count,
      currency: account.currency,
      generated,
      notificationCount,
      emailDelivered,
    });
  } catch (error) {
    await connection.rollback();
    if (error instanceof HistoryError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("Transaction history generation failed:", error);
    return NextResponse.json(
      { error: "Unable to generate transaction history." },
      { status: 500 },
    );
  } finally {
    connection.release();
  }
}

function toSqlDate(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}
class HistoryError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
function buildDescription(
  kind: string,
  rail: string,
  direction: string,
  extra: string,
) {
  const incoming = direction === "credit";
  const descriptions: Record<string, string> = {
    salary: incoming ? "Salary payment received" : "Payroll payment sent",
    merchant_purchase: incoming
      ? "Merchant purchase reversal"
      : "Merchant point-of-sale purchase",
    online_purchase: incoming
      ? "Online purchase refund"
      : "Online merchant purchase",
    bill_payment: incoming
      ? "Bill payment reversal"
      : "Utility and bill payment",
    subscription: incoming
      ? "Subscription refund"
      : "Recurring subscription payment",
    transfer: incoming ? "Transfer received" : "Transfer sent",
    refund: incoming ? "Refund received" : "Refund issued",
    service_fee: incoming ? "Service fee reversal" : "Account service fee",
    cash_withdrawal: incoming
      ? "Cash withdrawal reversal"
      : "ATM cash withdrawal",
    crypto_trade: incoming ? "Crypto sale proceeds" : "Crypto asset purchase",
    interest: incoming ? "Interest credit" : "Interest adjustment debit",
    stock_dividend: incoming
      ? "Stock dividend income"
      : "Stock dividend reversal",
    direct_debit: incoming ? "Direct debit reversal" : "Direct debit payment",
    card_payment: incoming ? "Card payment refund" : "Card purchase payment",
    remittance: incoming ? "Remittance received" : "Remittance sent",
    account_adjustment: incoming
      ? "Account adjustment credit"
      : "Account adjustment debit",
  };
  return `${rail} · ${descriptions[kind] || (incoming ? "Credit received" : "Payment sent")}${extra ? ` · ${extra}` : ""}`.slice(
    0,
    255,
  );
}
