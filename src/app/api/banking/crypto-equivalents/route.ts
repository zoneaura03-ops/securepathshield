import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { cryptoEquivalents, ensurePrimaryAccount } from "../../../../lib/banking";
import { db, type DatabaseRow } from "../../../../lib/db";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const account = await ensurePrimaryAccount(user.id);
  await db.execute("INSERT IGNORE INTO crypto_wallets(user_id,asset) VALUES(?,'BTC'),(?,'ETH'),(?,'USDT')", [user.id, user.id, user.id]);
  const [rows] = await db.execute<DatabaseRow[]>("SELECT asset,balance FROM crypto_wallets WHERE user_id=?", [user.id]);
  const amounts = Object.fromEntries(rows.map((row) => [String(row.asset).toLowerCase(), Number(row.balance)]));
  const rates = await cryptoEquivalents(1, account.currency);
  const balances = {
    btc: { amount: amounts.btc || 0, fiatValue: rates ? (amounts.btc || 0) / rates.btc : null },
    eth: { amount: amounts.eth || 0, fiatValue: rates ? (amounts.eth || 0) / rates.eth : null },
    usdt: { amount: amounts.usdt || 0, fiatValue: rates ? (amounts.usdt || 0) / rates.usdt : null },
  };
  return NextResponse.json({ balances, fiatCurrency: account.currency });
}