import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { ensurePrimaryAccount } from "../../../../lib/banking";
import { db, type DatabaseRow } from "../../../../lib/db";
import { reference } from "../../../../lib/references";

const products = {
  treasury: {
    id: "treasury",
    name: "Treasury portfolio",
    description: "Short-term government-backed instruments selected for capital stability.",
    risk: "Low",
    targetRate: 4.25,
    termMonths: 6,
    minimum: 100,
  },
  fixed_income: {
    id: "fixed_income",
    name: "Fixed income portfolio",
    description: "A diversified selection of investment-grade fixed-income assets.",
    risk: "Moderate",
    targetRate: 6.5,
    termMonths: 12,
    minimum: 500,
  },
  real_estate: {
    id: "real_estate",
    name: "Real estate income",
    description: "Longer-term exposure to professionally managed income properties.",
    risk: "Growth",
    targetRate: 9.2,
    termMonths: 24,
    minimum: 1000,
  },
} as const;

type ProductId = keyof typeof products;

export async function GET() {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const account = await ensurePrimaryAccount(user.id);
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT id,reference,product,principal,current_value,currency,target_rate,term_months,status,started_at,maturity_date FROM investments WHERE user_id=? ORDER BY started_at DESC",
    [user.id],
  );
  const holdings = rows.map((row) => ({
    ...row,
    principal: Number(row.principal),
    current_value: Number(row.current_value),
    target_rate: Number(row.target_rate),
    term_months: Number(row.term_months),
    product_name: products[row.product as ProductId]?.name || row.product,
  }));
  return NextResponse.json({
    account: {
      currency: account.currency,
      availableBalance: account.availableBalance,
    },
    products: Object.values(products),
    holdings,
  });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!user.kycVerified)
    return NextResponse.json({ error: "Verify your identity before making transactions.", verificationRequired: true, verificationUrl: "/dashboard/verification" }, { status: 403 });

  const body = await request.json();
  const product = products[String(body.product) as ProductId];
  const amount = Number(body.amount);
  const pin = String(body.pin || "");
  if (!product)
    return NextResponse.json({ error: "Choose a valid investment product." }, { status: 400 });
  if (!Number.isFinite(amount) || amount < product.minimum)
    return NextResponse.json(
      { error: `The minimum investment is $${product.minimum.toLocaleString("en-US")}.` },
      { status: 400 },
    );
  if (!/^\d{4}$/.test(pin))
    return NextResponse.json({ error: "Enter your 4-digit transaction PIN." }, { status: 400 });

  const account = await ensurePrimaryAccount(user.id);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.execute<DatabaseRow[]>(
      "SELECT pin_hash FROM users WHERE id=?",
      [user.id],
    );
    if (!users[0]?.pin_hash || !(await compare(pin, users[0].pin_hash)))
      throw new InvestmentError("The transaction PIN is incorrect.", 403);

    const [accounts] = await connection.execute<DatabaseRow[]>(
      "SELECT available_balance,currency FROM accounts WHERE id=? AND user_id=? AND status='active' FOR UPDATE",
      [account.id, user.id],
    );
    const source = accounts[0];
    if (!source) throw new InvestmentError("Active funding account not found.", 404);
    if (Number(source.available_balance) < amount)
      throw new InvestmentError("Insufficient available balance.", 422);

    const investmentReference = reference("INV");
    await connection.execute(
      "UPDATE accounts SET available_balance=available_balance-?,ledger_balance=ledger_balance-? WHERE id=?",
      [amount, amount, account.id],
    );
    await connection.execute(
      "INSERT INTO investments(user_id,account_id,reference,product,principal,current_value,currency,target_rate,term_months,maturity_date) VALUES(?,?,?,?,?,?,?,?,?,DATE_ADD(CURDATE(),INTERVAL ? MONTH))",
      [
        user.id,
        account.id,
        investmentReference,
        product.id,
        amount,
        amount,
        source.currency,
        product.targetRate,
        product.termMonths,
        product.termMonths,
      ],
    );
    await connection.execute(
      "INSERT INTO transactions(reference,account_id,user_id,type,category,description,currency,amount,balance_after,status) VALUES(?,?,?,'debit','investment',?,?,?,?,'processed')",
      [
        investmentReference,
        account.id,
        user.id,
        `Investment in ${product.name}`,
        source.currency,
        amount,
        Number(source.available_balance) - amount,
      ],
    );
    await connection.execute(
      "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'investment','Investment opened',?)",
      [user.id, `${product.name} was funded with ${source.currency} ${amount.toFixed(2)}.`],
    );
    await connection.commit();
    return NextResponse.json({ ok: true, reference: investmentReference }, { status: 201 });
  } catch (error) {
    await connection.rollback();
    if (error instanceof InvestmentError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "Unable to open the investment." }, { status: 500 });
  } finally {
    connection.release();
  }
}

class InvestmentError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
