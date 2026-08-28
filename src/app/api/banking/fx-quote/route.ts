import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../lib/db";

const currencies = new Set([
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "SGD",
  "JPY",
  "CHF",
  "NZD",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
  "CZK",
  "HUF",
  "RON",
  "BGN",
  "TRY",
  "BRL",
  "MXN",
  "INR",
  "ZAR",
]);
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const body = await request.json(),
    amount = Number(body.amount),
    destinationCurrency = String(body.destinationCurrency || "").toUpperCase();
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !currencies.has(destinationCurrency)
  )
    return NextResponse.json(
      { error: "Enter a valid amount and recipient currency." },
      { status: 400 },
    );
  const [accounts] = await db.execute<DatabaseRow[]>(
    "SELECT currency,available_balance FROM accounts WHERE user_id=? AND status='active' ORDER BY id LIMIT 1",
    [user.id],
  );
  const account = accounts[0];
  if (!account)
    return NextResponse.json(
      { error: "Active account not found." },
      { status: 404 },
    );
  const sourceCurrency = String(account.currency).toUpperCase();
  if (amount > Number(account.available_balance))
    return NextResponse.json(
      { error: "Insufficient available balance for this amount." },
      { status: 422 },
    );
  try {
    let rate = 1;
    if (sourceCurrency !== destinationCurrency) {
      const response = await fetch(
        `https://api.frankfurter.app/latest?from=${sourceCurrency}&to=${destinationCurrency}`,
        { cache: "no-store", signal: AbortSignal.timeout(5000) },
      );
      if (!response.ok) throw new Error("Rate provider unavailable");
      const data = await response.json();
      rate = Number(data.rates?.[destinationCurrency]);
      if (!Number.isFinite(rate) || rate <= 0) throw new Error("Invalid rate");
    }
    const recipientAmount = Math.round(amount * rate * 100) / 100,
      id = randomUUID();
    await db.execute(
      "INSERT INTO fx_quotes(id,user_id,source_currency,destination_currency,source_amount,exchange_rate,recipient_amount,expires_at) VALUES(?,?,?,?,?,?,?,DATE_ADD(NOW(),INTERVAL 10 MINUTE))",
      [
        id,
        user.id,
        sourceCurrency,
        destinationCurrency,
        amount,
        rate,
        recipientAmount,
      ],
    );
    return NextResponse.json({
      quote: {
        id,
        sourceCurrency,
        destinationCurrency,
        sourceAmount: amount,
        exchangeRate: rate,
        recipientAmount,
        fee: 0,
        totalDebit: amount,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error("FX quote failed:", error);
    return NextResponse.json(
      {
        error:
          "Live exchange rates are temporarily unavailable. Try again shortly.",
      },
      { status: 503 },
    );
  }
}
