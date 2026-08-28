import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { currentUser } from "../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../lib/db";
import { sendTransferVerificationEmail } from "../../../../lib/mail";
import { countries } from "../../../../lib/countries";
import { reference } from "../../../../lib/references";
const countryCodes = new Set<string>(countries.map(([code]) => code));
const swift = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/;
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  if (!user.kycVerified)
    return NextResponse.json(
      {
        error: "Verify your identity before making transactions.",
        verificationRequired: true,
        verificationUrl: "/dashboard/verification",
      },
      { status: 403 },
    );
  const body = await request.json(),
    amount = Number(body.amount),
    recipientCountry = String(body.recipientCountry || "").toUpperCase(),
    bankCountry = String(body.bankCountry || "").toUpperCase(),
    swiftCode = String(body.swiftCode || "").toUpperCase(),
    purpose = String(body.purpose || "").trim();
  const required = [
    body.recipientType,
    body.recipientName,
    body.recipientAddress,
    body.recipientCity,
    body.recipientPostalCode,
    body.recipientAccount,
    body.bankName,
  ];
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !countryCodes.has(recipientCountry) ||
    !countryCodes.has(bankCountry) ||
    !swift.test(swiftCode) ||
    !/^\d{4}$/.test(String(body.pin || "")) ||
    required.some((value) => !String(value || "").trim()) ||
    !purpose ||
    purpose.length > 80 ||
    !["standard", "urgent"].includes(body.speed)
  )
    return NextResponse.json(
      {
        error:
          "Complete all required international-transfer details and enter a valid PIN.",
      },
      { status: 400 },
    );
  if (
    body.useIntermediary &&
    (!body.intermediaryBankName ||
      !swift.test(String(body.intermediarySwift || "").toUpperCase()))
  )
    return NextResponse.json(
      { error: "Enter a valid intermediary bank name and SWIFT/BIC." },
      { status: 400 },
    );
  if (
    body.scheduledDate &&
    String(body.scheduledDate) < new Date().toISOString().slice(0, 10)
  )
    return NextResponse.json(
      { error: "A transfer cannot be scheduled in the past." },
      { status: 400 },
    );
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.execute<DatabaseRow[]>(
      "SELECT pin_hash,status FROM users WHERE id=? FOR UPDATE",
      [user.id],
    );
    if (users[0]?.status !== "active")
      throw new TransferError("Your account cannot make transfers.", 403);
    if (
      !users[0]?.pin_hash ||
      !(await compare(String(body.pin), users[0].pin_hash))
    )
      throw new TransferError("The transaction PIN is incorrect.", 403);
    const [accounts] = await connection.execute<DatabaseRow[]>(
      "SELECT * FROM accounts WHERE user_id=? AND status='active' ORDER BY id LIMIT 1 FOR UPDATE",
      [user.id],
    );
    const account = accounts[0];
    if (!account) throw new TransferError("Active account not found.", 404);
    const [quotes] = await connection.execute<DatabaseRow[]>(
      "SELECT * FROM fx_quotes WHERE id=? AND user_id=? AND used_at IS NULL AND expires_at>NOW() FOR UPDATE",
      [body.quoteId, user.id],
    );
    const quote = quotes[0];
    if (
      !quote ||
      Number(quote.source_amount) !== amount ||
      String(quote.source_currency) !== String(account.currency) ||
      String(quote.destination_currency) !== String(body.destinationCurrency)
    )
      throw new TransferError(
        "The exchange-rate quote expired or no longer matches this transfer.",
        409,
      );
    const fee = 0,
      total = amount + fee;
    if (Number(account.available_balance) < total)
      throw new TransferError("Insufficient available balance.", 422);
    const ref = reference("LWI");
    await connection.execute(
      "UPDATE accounts SET available_balance=available_balance-? WHERE id=?",
      [total, account.id],
    );
    const [transferResult] = await connection.execute(
      "INSERT INTO transfers(reference,user_id,source_account_id,transfer_type,recipient_name,recipient_type,recipient_account,bank_name,bank_country,routing_code,intermediary_bank_name,intermediary_swift,intermediary_account,intermediary_routing,currency,destination_currency,exchange_rate,recipient_amount,amount,fee,fee_payer,description,payment_purpose,recipient_relationship,source_of_funds,regulatory_code,beneficiary_reference,transfer_speed,scheduled_for,beneficiary_address,beneficiary_city,beneficiary_state,beneficiary_postal_code,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        ref,
        user.id,
        account.id,
        "international",
        body.recipientName,
        body.recipientType,
        body.recipientAccount,
        body.bankName,
        bankCountry,
        body.routingCode || null,
        body.useIntermediary ? body.intermediaryBankName : null,
        body.useIntermediary
          ? String(body.intermediarySwift).toUpperCase()
          : null,
        body.useIntermediary ? body.intermediaryAccount || null : null,
        body.useIntermediary ? body.intermediaryRouting || null : null,
        account.currency,
        quote.destination_currency,
        quote.exchange_rate,
        quote.recipient_amount,
        amount,
        fee,
        "SHA",
        null,
        purpose,
        null,
        null,
        null,
        null,
        body.speed,
        body.scheduledDate || null,
        body.recipientAddress,
        body.recipientCity,
        body.recipientState || null,
        body.recipientPostalCode,
        "pending",
      ],
    );
    const transferId = Number(
      (transferResult as { insertId: number }).insertId,
    );
    await connection.execute(
      "UPDATE transfers SET verification_stage='awaiting_clearance',clearance_code=?,tax_code=? WHERE id=?",
      [
        `CMP${randomInt(100000, 1000000)}`,
        `TAX${randomInt(100000, 1000000)}`,
        transferId,
      ],
    );
    await connection.execute(
      "INSERT INTO transfer_cot_verifications(transfer_id,cot_code) VALUES(?,?)",
      [transferId, `COT${randomInt(100000, 1000000)}`],
    );
    await connection.execute("UPDATE fx_quotes SET used_at=NOW() WHERE id=?", [
      quote.id,
    ]);
    await connection.execute(
      "INSERT INTO transactions(reference,account_id,user_id,transfer_id,type,category,description,currency,amount,balance_after,status) VALUES(?,?,?,?,'debit','transfer',?,?,?,?, 'pending')",
      [
        ref,
        account.id,
        user.id,
        transferId,
        `International transfer to ${body.recipientName}`,
        account.currency,
        amount,
        Number(account.available_balance) - total,
      ],
    );
    await connection.execute(
      "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'transfer','International transfer submitted',?)",
      [
        user.id,
        `Your transfer of ${amount.toFixed(2)} ${account.currency} to ${body.recipientName} is pending review.`,
      ],
    );
    await connection.execute(
      "INSERT INTO audit_logs(actor_user_id,subject_user_id,action,entity_type,entity_id,details) VALUES(?,?,'transfer.created','transfer',?,?)",
      [
        user.id,
        user.id,
        String(transferId),
        JSON.stringify({
          reference: ref,
          type: "international",
          amount,
          currency: account.currency,
          destinationCurrency: quote.destination_currency,
          recipientAmount: Number(quote.recipient_amount),
          status: "pending",
        }),
      ],
    );
    await connection.commit();
    let verificationEmailDelivered = true;
    try {
      await sendTransferVerificationEmail({
        email: user.email,
        reference: ref,
        stage: "compliance",
        event: "required",
      });
    } catch (error) {
      verificationEmailDelivered = false;
      console.error("Compliance requirement email failed:", error);
    }
    return NextResponse.json({
      verificationEmailDelivered,
      ok: true,
      reference: ref,
      status: "pending",
      amount,
      currency: account.currency,
      fee,
      recipientAmount: Number(quote.recipient_amount),
      destinationCurrency: quote.destination_currency,
    });
  } catch (error) {
    await connection.rollback();
    if (error instanceof TransferError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("International transfer failed:", error);
    return NextResponse.json(
      { error: "The international transfer could not be submitted." },
      { status: 500 },
    );
  } finally {
    connection.release();
  }
}
class TransferError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
