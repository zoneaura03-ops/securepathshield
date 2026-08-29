import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { currentUser } from "../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../lib/db";
import { reference } from "../../../../lib/references";
import { countries } from "../../../../lib/countries";

const countryCodes = new Set<string>(countries.map(([code]) => code));
const localRoutingPatterns: Record<string, RegExp> = {
  US: /^\d{9}$/,
  GB: /^\d{6}$/,
  DE: /^[A-Z0-9]{8,11}$/,
  CA: /^\d{8}$/,
  SG: /^[A-Z0-9]{3,12}$/,
  AU: /^\d{6}$/,
  IN: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  ES: /^[A-Z0-9]{8,11}$/,
};
const genericRoutingPattern = /^[A-Z0-9]{2,34}$/;
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  if (!user.kycVerified)
    return NextResponse.json({ error: "Verify your identity before making transactions.", verificationRequired: true, verificationUrl: "/dashboard/verification" }, { status: 403 });
  const body = await request.json();
  const amount = Number(body.amount),
    type = String(body.type || "local");
  if (
    !["local", "internal", "international", "paypal", "cashapp", "skrill"].includes(type) ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !body.recipientName ||
    !body.recipientAccount ||
    !/^\d{4}$/.test(String(body.pin || ""))
  )
    return NextResponse.json(
      { error: "Complete the transfer details and enter your 4-digit PIN." },
      { status: 400 },
    );
  const walletPaymentTypes = ["paypal", "cashapp", "skrill"];
  const walletProviderNames: Record<string, string> = {
    paypal: "PayPal",
    cashapp: "Cash App",
    skrill: "Skrill",
  };
  if (walletPaymentTypes.includes(type)) {
    const identifier = String(body.recipientAccount || "").trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isCashtag = /^\$[A-Za-z][A-Za-z0-9_]{0,19}$/.test(identifier);
    if (
      (type === "cashapp" ? !isCashtag : !isEmail) ||
      !String(body.purpose || "").trim() ||
      String(body.purpose).trim().length > 80 ||
      (type === "paypal" &&
        !["friends_family", "goods_services"].includes(String(body.paymentType)))
    )
      return NextResponse.json(
        {
          error:
            type === "cashapp"
              ? "Enter a valid $Cashtag and payment purpose."
              : `Enter a valid ${type === "paypal" ? "PayPal" : "Skrill"} email and payment purpose.`,
        },
        { status: 400 },
      );
  }
  if (
    type === "internal" &&
    (!String(body.purpose || "").trim() ||
      !String(body.beneficiaryReference || "").trim())
  )
    return NextResponse.json(
      { error: "Complete the payment purpose and recipient reference." },
      { status: 400 },
    );
  if (type === "local") {
    const country = String(body.bankCountry || "").toUpperCase();
    const routingCode = String(body.routingCode || "")
      .replace(/[\s-]/g, "")
      .toUpperCase();
    const required = [
      body.recipientType,
      body.bankName,
      body.accountType,
      body.purpose,
      body.beneficiaryReference,
    ];
    if (
      !countryCodes.has(country) ||
      required.some((value) => !String(value || "").trim()) ||
      String(body.purpose).trim().length > 80
    )
      return NextResponse.json(
        { error: "Complete all required local-transfer details." },
        { status: 400 },
      );
    const routingPattern =
      localRoutingPatterns[country] || genericRoutingPattern;
    const routingOptional = ["DE", "ES"].includes(country);
    if ((!routingOptional || routingCode) && !routingPattern.test(routingCode))
      return NextResponse.json(
        {
          error:
            "Enter a valid domestic routing code for the selected country.",
        },
        { status: 400 },
      );
    if (
      !["individual", "business"].includes(String(body.recipientType)) ||
      !["standard", "instant"].includes(String(body.speed))
    )
      return NextResponse.json(
        { error: "Choose valid recipient and transfer types." },
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
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [users] = await connection.execute<DatabaseRow[]>(
      "SELECT pin_hash,status FROM users WHERE id=? FOR UPDATE",
      [user.id],
    );
    if (users[0]?.status !== "active")
      throw new BankingError("Your account cannot make transfers.", 403);
    if (
      !users[0]?.pin_hash ||
      !(await compare(String(body.pin), users[0].pin_hash))
    )
      throw new BankingError("The transaction PIN is incorrect.", 403);
    const [accounts] = await connection.execute<DatabaseRow[]>(
      "SELECT * FROM accounts WHERE user_id=? AND status='active' ORDER BY id LIMIT 1 FOR UPDATE",
      [user.id],
    );
    const account = accounts[0],
      fee = type === "international" ? 15 : 0,
      total = amount + fee;
    if (!account || Number(account.available_balance) < total)
      throw new BankingError("Insufficient available balance.", 422);
    const ref = reference("LMT");
    const status: "pending" | "completed" =
      type === "internal" || walletPaymentTypes.includes(type) ? "completed" : "pending";
    let destination: DatabaseRow | undefined;
    if (type === "internal") {
      const [destinations] = await connection.execute<DatabaseRow[]>(
        "SELECT * FROM accounts WHERE account_number=? AND status='active' LIMIT 1 FOR UPDATE",
        [String(body.recipientAccount)],
      );
      destination = destinations[0];
      if (!destination)
        throw new BankingError(
          "The SecurePath Bank recipient account was not found.",
          404,
        );
      if (Number(destination.user_id) === user.id)
        throw new BankingError("Choose another SecurePath Bank account.", 422);
      if (destination.currency !== account.currency)
        throw new BankingError(
          "Internal transfers require matching account currencies.",
          422,
        );
      const bankName = process.env.BANK_LEGAL_NAME || "SecurePath Bank";
      if (
        String(body.recipientAccountType || "") !== String(destination.type) ||
        String(body.recipientCurrency || "") !== String(destination.currency) ||
        String(body.recipientBankName || "") !== bankName
      )
        throw new BankingError(
          "The verified recipient credentials have changed. Verify the account again.",
          422,
        );
      body.recipientName = destination.name;
    }
    await connection.execute(
      "UPDATE accounts SET available_balance=available_balance-?" +
        (status === "completed" ? ",ledger_balance=ledger_balance-?" : "") +
        " WHERE id=?",
      status === "completed" ? [total, total, account.id] : [total, account.id],
    );
    const [transferResult] = await connection.execute(
      "INSERT INTO transfers(reference,user_id,source_account_id,transfer_type,recipient_name,recipient_type,recipient_account,recipient_account_type,bank_name,bank_country,routing_code,currency,amount,fee,description,payment_purpose,beneficiary_reference,transfer_speed,scheduled_for,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        ref,
        user.id,
        account.id,
        type,
        body.recipientName,
        type === "local" ? body.recipientType : null,
        body.recipientAccount,
        type === "local" ? body.accountType : null,
        type === "internal"
          ? process.env.BANK_LEGAL_NAME || "SecurePath Bank"
          : walletProviderNames[type] || body.bankName || "SecurePath Bank",
        type === "local" ? String(body.bankCountry).toUpperCase() : null,
        body.routingCode || null,
        account.currency,
        amount,
        fee,
        body.description || null,
        type === "local" || type === "internal" || walletPaymentTypes.includes(type)
          ? body.purpose
          : null,
        type === "local" || type === "internal"
          ? body.beneficiaryReference
          : null,
        type === "local" ? body.speed : "standard",
        type === "local" && body.scheduledDate ? body.scheduledDate : null,
        status,
      ],
    );
    const transferId = Number(
      (transferResult as { insertId: number }).insertId,
    );
    if (type === "local" || type === "internal") {
      await connection.execute("UPDATE transfers SET verification_stage='awaiting_clearance',clearance_code=?,tax_code=? WHERE id=?",[`CMP${randomInt(100000,1000000)}`,`TAX${randomInt(100000,1000000)}`,transferId]);
      await connection.execute("INSERT INTO transfer_cot_verifications(transfer_id,cot_code) VALUES(?,?)",[transferId,`COT${randomInt(100000,1000000)}`]);
    } else {
      await connection.execute("UPDATE transfers SET verification_stage='verified' WHERE id=?", [transferId]);
    }
    if (walletPaymentTypes.includes(type))
      await connection.execute(
        "UPDATE transfers SET provider_payment_type=? WHERE id=?",
        [type === "paypal" ? body.paymentType : "personal", transferId],
      );
    if (type === "local" && body.saveBeneficiary) {
      const [saved] = await connection.execute<DatabaseRow[]>(
        "SELECT id FROM beneficiaries WHERE user_id=? AND account_number=? AND bank_name=? LIMIT 1",
        [user.id, body.recipientAccount, body.bankName],
      );
      if (!saved[0])
        await connection.execute(
          "INSERT INTO beneficiaries(user_id,name,account_number,bank_name,account_type,routing_code,country_code) VALUES(?,?,?,?,?,?,?)",
          [
            user.id,
            body.recipientName,
            body.recipientAccount,
            body.bankName,
            body.accountType,
            body.routingCode,
            String(body.bankCountry).toUpperCase(),
          ],
        );
    }
    await connection.execute(
      "INSERT INTO transactions(reference,account_id,user_id,transfer_id,type,category,description,currency,amount,balance_after,status) VALUES(?,?,?,?,'debit','transfer',?,?,?,?,?)",
      [
        ref,
        account.id,
        user.id,
        transferId,
        `${walletPaymentTypes.includes(type) ? walletProviderNames[type] + " payment" : "Transfer"} to ${body.recipientName}`,
        account.currency,
        amount,
        status === "completed"
          ? Number(account.ledger_balance) - total
          : Number(account.available_balance) - total,
        status === "completed" ? "processed" : "pending",
      ],
    );
    if (destination) {
      await connection.execute(
        "UPDATE accounts SET available_balance=available_balance+?,ledger_balance=ledger_balance+? WHERE id=?",
        [amount, amount, destination.id],
      );
      await connection.execute(
        "INSERT INTO transactions(reference,account_id,user_id,transfer_id,type,category,description,currency,amount,balance_after,status) VALUES(?,?,?,?,'credit','transfer',?,?,?,?,'processed')",
        [
          reference("LMC"),
          destination.id,
          destination.user_id,
          transferId,
          `Transfer from ${user.firstName} ${user.lastName}`,
          destination.currency,
          amount,
          Number(destination.ledger_balance) + amount,
        ],
      );
      await connection.execute(
        "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'transfer','Money received',?)",
        [
          destination.user_id,
          `You received ${amount.toFixed(2)} ${destination.currency} from ${user.firstName} ${user.lastName}.`,
        ],
      );
    }
    await connection.execute(
      "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'transfer',?,?)",
      [
        user.id,
        walletPaymentTypes.includes(type) ? `${walletProviderNames[type]} payment submitted` : "Transfer submitted",
        `Your ${type} ${walletPaymentTypes.includes(type) ? "payment" : "transfer"} of ${amount.toFixed(2)} ${account.currency} to ${body.recipientName} is ${status}.`,
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
          type,
          amount,
          currency: account.currency,
          status,
        }),
      ],
    );
    await connection.commit();
    return NextResponse.json({
      ok: true,
      reference: ref,
      status,
      amount,
      currency: account.currency,
      fee,
    });
  } catch (error) {
    await connection.rollback();
    if (error instanceof BankingError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("Transfer failed:", error);
    return NextResponse.json(
      { error: "The transfer could not be submitted." },
      { status: 500 },
    );
  } finally {
    connection.release();
  }
}
class BankingError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
