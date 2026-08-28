import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { cryptoEquivalents, ensurePrimaryAccount } from "../../../../lib/banking";
import { db, type DatabaseRow } from "../../../../lib/db";
import { reference } from "../../../../lib/references";

const CRYPTO = ["BTC", "ETH", "USDT"] as const;
const FEE_RATE = 0.01;

type CryptoAsset = (typeof CRYPTO)[number];

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const account = await ensurePrimaryAccount(user.id);
  await ensureWallets(user.id);
  const [wallets, swaps] = await Promise.all([
    db.execute<DatabaseRow[]>(
      "SELECT asset,balance FROM crypto_wallets WHERE user_id=? ORDER BY FIELD(asset,'BTC','ETH','USDT')",
      [user.id],
    ),
    db.execute<DatabaseRow[]>(
      "SELECT reference,from_asset,to_asset,from_amount,to_amount,rate,fee_amount,fee_currency,status,created_at FROM crypto_swaps WHERE user_id=? ORDER BY created_at DESC LIMIT 20",
      [user.id],
    ),
  ]);

  const from = String(request.nextUrl.searchParams.get("from") || "").toUpperCase();
  const to = String(request.nextUrl.searchParams.get("to") || "").toUpperCase();
  const amount = Number(request.nextUrl.searchParams.get("amount"));
  let quote = null;
  if (amount > 0 && isAsset(from, account.currency) && isAsset(to, account.currency) && from !== to) {
    quote = await createQuote(from, to, amount, account.currency);
  }

  return NextResponse.json({
    account: { currency: account.currency, availableBalance: account.availableBalance },
    balances: Object.fromEntries(wallets[0].map((row) => [String(row.asset), Number(row.balance)])),
    swaps: swaps[0].map((row) => ({
      ...row,
      from_amount: Number(row.from_amount),
      to_amount: Number(row.to_amount),
      rate: Number(row.rate),
      fee_amount: Number(row.fee_amount),
    })),
    quote,
  });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!user.kycVerified)
    return NextResponse.json({ error: "Verify your identity before making transactions.", verificationRequired: true, verificationUrl: "/dashboard/verification" }, { status: 403 });
  const body = await request.json();
  const from = String(body.from || "").toUpperCase();
  const to = String(body.to || "").toUpperCase();
  const amount = Number(body.amount);
  const pin = String(body.pin || "");
  const account = await ensurePrimaryAccount(user.id);
  if (!isAsset(from, account.currency) || !isAsset(to, account.currency) || from === to || !Number.isFinite(amount) || amount <= 0)
    return NextResponse.json({ error: "Choose two different assets and enter a valid amount." }, { status: 400 });
  if (!/^\d{4}$/.test(pin))
    return NextResponse.json({ error: "Enter your 4-digit transaction PIN." }, { status: 400 });

  const quote = await createQuote(from, to, amount, account.currency);
  if (!quote) return NextResponse.json({ error: "A live market quote is unavailable. Try again shortly." }, { status: 503 });

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.execute<DatabaseRow[]>(
      "SELECT pin_hash,status FROM users WHERE id=? FOR UPDATE",
      [user.id],
    );
    if (users[0]?.status !== "active") throw new SwapError("Your account cannot make swaps.", 403);
    if (!users[0]?.pin_hash || !(await compare(pin, String(users[0].pin_hash))))
      throw new SwapError("The transaction PIN is incorrect.", 403);

    await connection.execute(
      "INSERT IGNORE INTO crypto_wallets(user_id,asset) VALUES(?,'BTC'),(?,'ETH'),(?,'USDT')",
      [user.id, user.id, user.id],
    );
    const [accounts] = await connection.execute<DatabaseRow[]>(
      "SELECT id,currency,ledger_balance,available_balance,status FROM accounts WHERE id=? AND user_id=? FOR UPDATE",
      [account.id, user.id],
    );
    const lockedAccount = accounts[0];
    if (!lockedAccount || lockedAccount.status !== "active") throw new SwapError("Your funding account is unavailable.", 403);
    const [walletRows] = await connection.execute<DatabaseRow[]>(
      "SELECT asset,balance FROM crypto_wallets WHERE user_id=? FOR UPDATE",
      [user.id],
    );
    const walletBalances = Object.fromEntries(walletRows.map((row) => [String(row.asset), Number(row.balance)]));

    if (from === account.currency) {
      if (Number(lockedAccount.available_balance) < amount) throw new SwapError("Insufficient available cash balance.", 422);
      await connection.execute("UPDATE accounts SET ledger_balance=ledger_balance-?,available_balance=available_balance-? WHERE id=?", [amount, amount, account.id]);
    } else {
      if ((walletBalances[from] || 0) < amount) throw new SwapError(`Insufficient ${from} balance.`, 422);
      await connection.execute("UPDATE crypto_wallets SET balance=balance-? WHERE user_id=? AND asset=?", [amount, user.id, from]);
    }

    if (to === account.currency) {
      await connection.execute("UPDATE accounts SET ledger_balance=ledger_balance+?,available_balance=available_balance+? WHERE id=?", [quote.receiveAmount, quote.receiveAmount, account.id]);
    } else {
      await connection.execute("UPDATE crypto_wallets SET balance=balance+? WHERE user_id=? AND asset=?", [quote.receiveAmount, user.id, to]);
    }

    const swapReference = reference("LCS");
    await connection.execute(
      "INSERT INTO crypto_swaps(reference,user_id,account_id,from_asset,to_asset,from_amount,to_amount,rate,fee_amount,fee_currency,status) VALUES(?,?,?,?,?,?,?,?,?,?,'processed')",
      [swapReference, user.id, account.id, from, to, amount, quote.receiveAmount, quote.rate, quote.feeAmount, account.currency],
    );
    if (from === account.currency || to === account.currency) {
      const cashAmount = from === account.currency ? amount : quote.receiveAmount;
      const transactionType = from === account.currency ? "debit" : "credit";
      const balanceAfter = from === account.currency
        ? Number(lockedAccount.ledger_balance) - amount
        : Number(lockedAccount.ledger_balance) + quote.receiveAmount;
      await connection.execute(
        "INSERT INTO transactions(reference,account_id,user_id,type,category,description,currency,amount,balance_after,status,metadata) VALUES(?,?,?,?,'crypto_swap',?,?,?,?, 'processed',?)",
        [swapReference, account.id, user.id, transactionType, `Crypto swap ${from} to ${to}`, account.currency, cashAmount, balanceAfter, JSON.stringify({ from, to, rate: quote.rate })],
      );
    }
    await connection.execute(
      "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'crypto','Crypto swap completed',?)",
      [user.id, `${formatAmount(amount, from)} was exchanged for ${formatAmount(quote.receiveAmount, to)}.`],
    );
    await connection.commit();
    return NextResponse.json({ ok: true, reference: swapReference, quote });
  } catch (error) {
    await connection.rollback();
    if (error instanceof SwapError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "Unable to complete the crypto swap." }, { status: 500 });
  } finally {
    connection.release();
  }
}

async function ensureWallets(userId: number) {
  await db.execute(
    "INSERT IGNORE INTO crypto_wallets(user_id,asset) VALUES(?,'BTC'),(?,'ETH'),(?,'USDT')",
    [userId, userId, userId],
  );
}

async function createQuote(from: string, to: string, amount: number, fiat: string) {
  const equivalents = await cryptoEquivalents(1, fiat);
  if (!equivalents) return null;
  const prices: Record<string, number> = {
    [fiat]: 1,
    BTC: 1 / equivalents.btc,
    ETH: 1 / equivalents.eth,
    USDT: 1 / equivalents.usdt,
  };
  if (!prices[from] || !prices[to]) return null;
  const grossTarget = (amount * prices[from]) / prices[to];
  const feeAmount = amount * prices[from] * FEE_RATE;
  const receiveAmount = grossTarget * (1 - FEE_RATE);
  return {
    from,
    to,
    amount,
    receiveAmount,
    rate: receiveAmount / amount,
    feeAmount,
    feeCurrency: fiat,
    expiresAt: new Date(Date.now() + 30_000).toISOString(),
  };
}

function isAsset(asset: string, fiat: string) {
  return asset === fiat || CRYPTO.includes(asset as CryptoAsset);
}
function formatAmount(amount: number, asset: string) {
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: asset === "USDT" ? 2 : 8 })} ${asset}`;
}
class SwapError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}
