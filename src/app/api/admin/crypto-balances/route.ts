import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../lib/db";
import { reference } from "../../../../lib/references";
import { sendCreditNotificationEmail } from "../../../../lib/mail";

const ASSETS = ["BTC", "ETH", "USDT"] as const;
async function requireAdmin() {
  const user = await currentUser();
  return user?.role === "admin" && user.status === "active" ? user : null;
}
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const query = new URL(request.url).searchParams.get("q")?.trim() || "";
  const assetFilter = new URL(request.url).searchParams.get("asset")?.toUpperCase() || "ALL";
  const balanceFilter = new URL(request.url).searchParams.get("balance") || "all";
  const search = `%${query}%`;
  const having = balanceFilter === "positive"
    ? assetFilter === "BTC" ? " HAVING btc_balance>0" : assetFilter === "ETH" ? " HAVING eth_balance>0" : assetFilter === "USDT" ? " HAVING usdt_balance>0" : " HAVING btc_balance>0 OR eth_balance>0 OR usdt_balance>0"
    : balanceFilter === "zero"
      ? assetFilter === "BTC" ? " HAVING btc_balance=0" : assetFilter === "ETH" ? " HAVING eth_balance=0" : assetFilter === "USDT" ? " HAVING usdt_balance=0" : " HAVING btc_balance=0 AND eth_balance=0 AND usdt_balance=0"
      : "";
  const [rows] = await db.execute<DatabaseRow[]>(
    `SELECT u.id,u.email,u.first_name,u.last_name,u.status,
      COALESCE(MAX(CASE WHEN w.asset='BTC' THEN w.balance END),0) btc_balance,
      COALESCE(MAX(CASE WHEN w.asset='ETH' THEN w.balance END),0) eth_balance,
      COALESCE(MAX(CASE WHEN w.asset='USDT' THEN w.balance END),0) usdt_balance
     FROM users u LEFT JOIN crypto_wallets w ON w.user_id=u.id
     WHERE u.role='user' AND (u.email LIKE ? OR u.full_name LIKE ?)
     GROUP BY u.id,u.email,u.first_name,u.last_name,u.status${having}
     ORDER BY u.created_at DESC LIMIT 50`,
    [search, search],
  );
  return NextResponse.json({ users: rows.map((row) => ({ ...row, btc_balance: Number(row.btc_balance), eth_balance: Number(row.eth_balance), usdt_balance: Number(row.usdt_balance) })) });
}
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const body = await request.json();
  const userId = Number(body.userId);
  const asset = String(body.asset || "").toUpperCase();
  const amount = Number(body.amount);
  const reason = String(body.reason || "").trim();
  if (!Number.isInteger(userId) || !ASSETS.includes(asset as (typeof ASSETS)[number]) || !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000 || reason.length < 5 || reason.length > 255)
    return NextResponse.json({ error: "Choose a customer and asset, enter a positive amount, and provide a clear reason." }, { status: 400 });
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.execute<DatabaseRow[]>("SELECT id,email,status,role FROM users WHERE id=? FOR UPDATE", [userId]);
    const customer = users[0];
    if (!customer || customer.role !== "user") throw new CreditError("Customer account not found.", 404);
    if (customer.status !== "active") throw new CreditError("Only active customer accounts can receive manual crypto credits.", 422);
    await connection.execute("INSERT IGNORE INTO crypto_wallets(user_id,asset) VALUES(?,?)", [userId, asset]);
    await connection.execute("UPDATE crypto_wallets SET balance=balance+? WHERE user_id=? AND asset=?", [amount, userId, asset]);
    const creditReference = reference("LCC");
    await connection.execute("INSERT INTO crypto_manual_credits(reference,user_id,asset,amount,reason,credited_by) VALUES(?,?,?,?,?,?)", [creditReference, userId, asset, amount, reason, admin.id]);
    const displayAmount = amount.toLocaleString("en-US", { maximumFractionDigits: asset === "USDT" ? 2 : 8 });
    await connection.execute("INSERT INTO notifications(user_id,type,title,body) VALUES(?,'crypto','Crypto balance credited',?)", [userId, `${displayAmount} ${asset} was credited to your crypto wallet. Reference: ${creditReference}. Reason: ${reason}`]);
    await connection.execute("INSERT INTO audit_logs(actor_user_id,subject_user_id,action,entity_type,entity_id,details) VALUES(?,?,'crypto.manual_credit','crypto_wallet',?,?)", [admin.id, userId, creditReference, JSON.stringify({ asset, amount, reason })]);
    await connection.commit();
    let emailDelivered = false;
    try {
      await sendCreditNotificationEmail({ email: String(customer.email), amount: displayAmount, currency: asset, reference: creditReference, channel: `${asset} wallet`, reason });
      emailDelivered = true;
    } catch (emailError) {
      console.error("Crypto credit email delivery failed:", emailError);
    }
    return NextResponse.json({ ok: true, emailDelivered, reference: creditReference });
  } catch (error) {
    await connection.rollback();
    if (error instanceof CreditError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "Unable to credit the crypto balance." }, { status: 500 });
  } finally { connection.release(); }
}
class CreditError extends Error { constructor(message: string, public status: number) { super(message); } }
