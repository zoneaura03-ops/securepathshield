import { randomInt } from "node:crypto";
import { cache } from "react";
import { db, type DatabaseRow } from "./db";

export type AccountSummary = {
  id: number;
  accountNumber: string;
  name: string;
  type: string;
  currency: string;
  ledgerBalance: number;
  availableBalance: number;
  status: string;
};
export type TransactionSummary = {
  id: string;
  name: string;
  kind: string;
  amount: number;
  currency: string;
  date: string;
  status: "Processed" | "Pending" | "Processing" | "Declined" | "Failed" | "Resolved" | "Refunded";
};
export type CardPreview = {
  id: number;
  brand: string;
  name: string;
  lastFour: string | null;
  currency: string;
  balance: number;
  status: string;
};
export type NotificationSummary = {
  id: number;
  type: string;
  title: string;
  body: string;
  actionUrl: string | null;
  readAt: string | null;
  createdAt: string;
  date: string;
};

export async function notificationData(userId: number) {
  const [notificationResult, countResult] = await Promise.all([
    db.execute<DatabaseRow[]>(
      "SELECT id,type,title,body,action_url,read_at,created_at FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 30",
      [userId],
    ),
    db.execute<DatabaseRow[]>(
      "SELECT COUNT(*) unread FROM notifications WHERE user_id=? AND read_at IS NULL",
      [userId],
    ),
  ]);
  const [rows] = notificationResult;
  const [counts] = countResult;
  const notifications: NotificationSummary[] = rows.map((row) => ({
    id: Number(row.id),
    type: String(row.type),
    title: String(row.title),
    body: String(row.body),
    actionUrl: row.action_url ? String(row.action_url) : null,
    readAt: row.read_at ? new Date(row.read_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    date: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
    }).format(new Date(row.created_at)),
  }));

  return { notifications, unreadCount: Number(counts[0]?.unread || 0) };
}

export async function cryptoEquivalents(amount: number, currency: string) {
  const quote = currency.toLowerCase();
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=${encodeURIComponent(quote)}`,
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(3000) },
    );
    if (!response.ok) return null;
    const prices = (await response.json()) as Record<
      string,
      Record<string, number>
    >;
    const bitcoin = prices.bitcoin?.[quote];
    const ethereum = prices.ethereum?.[quote];
    const tether = prices.tether?.[quote];
    if (!bitcoin || !ethereum || !tether) return null;
    return {
      btc: amount / bitcoin,
      eth: amount / ethereum,
      usdt: amount / tether,
    };
  } catch {
    return null;
  }
}

export const ensurePrimaryAccount = cache(async function ensurePrimaryAccount(
  userId: number,
  accountType = "Checking Account",
) {
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT id,account_number,name,type,currency,ledger_balance,available_balance,status FROM accounts WHERE user_id=? AND status<>'closed' ORDER BY id LIMIT 1",
    [userId],
  );
  if (rows[0]) return mapAccount(rows[0]);
  const accountNumber = String(randomInt(1000000000, 2147483647));
  await db.execute(
    "INSERT INTO accounts(user_id,account_number,name,type,currency) VALUES(?,?,?,?,'USD')",
    [userId, accountNumber, accountType, accountType],
  );
  const [created] = await db.execute<DatabaseRow[]>(
    "SELECT id,account_number,name,type,currency,ledger_balance,available_balance,status FROM accounts WHERE user_id=? ORDER BY id DESC LIMIT 1",
    [userId],
  );
  return mapAccount(created[0]);
});

export async function dashboardData(userId: number) {
  const account = await ensurePrimaryAccount(userId);
  const [transactionResult, cardResult] = await Promise.all([
    db.execute<DatabaseRow[]>(
      "SELECT reference,description,type,amount,currency,status,created_at FROM transactions WHERE user_id=? AND account_id=? ORDER BY created_at DESC LIMIT 8",
      [userId, account.id],
    ),

    db.execute<DatabaseRow[]>(
      "SELECT id,brand,card_name,last_four,currency,balance,status FROM cards WHERE user_id=? AND status<>'pending' ORDER BY created_at DESC LIMIT 2",
      [userId],
    ),
  ]);
  const [rows] = transactionResult;
  const [cardRows] = cardResult;
  const transactions: TransactionSummary[] = rows.map((row) => ({
    id: row.reference,
    name: row.description,
    kind: row.category,
    amount: (row.type === "credit" ? 1 : -1) * Number(row.amount),
    currency: row.currency,
    date: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(row.created_at)),
    status:
      row.status === "processed"
        ? "Processed"
        : row.status === "declined"
          ? "Declined"
          : row.status === "failed"
            ? "Failed"
            : row.status === "resolved"
              ? "Resolved"
              : row.status === "refunded" || row.status === "reversed"
                ? "Refunded"
                : row.status === "processing"
                  ? "Processing"
                  : "Pending",
  }));
  const cards: CardPreview[] = cardRows.map((row) => ({
    id: Number(row.id),
    brand: String(row.brand),
    name: String(row.card_name),
    lastFour: row.last_four ? String(row.last_four) : null,
    currency: String(row.currency),
    balance: Number(row.balance),
    status: String(row.status),
  }));
  return {
    account,
    transactions,
    cards,
  };
}

function mapAccount(row: DatabaseRow): AccountSummary {
  return {
    id: row.id,
    accountNumber: row.account_number,
    name: row.name,
    type: row.type,
    currency: row.currency,
    ledgerBalance: Number(row.ledger_balance),
    availableBalance: Number(row.available_balance),
    status: row.status,
  };
}

export function money(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
