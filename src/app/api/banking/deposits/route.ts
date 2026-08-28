import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { ensurePrimaryAccount } from "../../../../lib/banking";
import { db } from "../../../../lib/db";
import { reference } from "../../../../lib/references";

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
function receiptType(buffer: Buffer) {
  if (buffer.subarray(0,3).equals(Buffer.from([0xff,0xd8,0xff]))) return ["image/jpeg","jpg"] as const;
  if (buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) return ["image/png","png"] as const;
  if (buffer.subarray(0,4).toString("ascii") === "%PDF") return ["application/pdf","pdf"] as const;
  return null;
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  if (!user.kycVerified)
    return NextResponse.json({ error: "Verify your identity before making transactions.", verificationRequired: true, verificationUrl: "/dashboard/verification" }, { status: 403 });
  const multipart = request.headers.get("content-type")?.includes("multipart/form-data");
  const submitted = multipart ? await request.formData() : await request.json();
  const body = multipart ? Object.fromEntries(submitted as FormData) : submitted;
  const method = String(body.method || "").toLowerCase();
  const walletMethods = ["paypal", "cashapp", "skrill"];
  if (walletMethods.includes(method)) {
    const [providerSettings] = await db.execute<import("../../../../lib/db").DatabaseRow[]>(
      "SELECT provider FROM wallet_deposit_settings WHERE provider=? AND is_active=1 LIMIT 1",
      [method],
    );
    if (!providerSettings[0])
      return NextResponse.json({ error: "This deposit option is temporarily unavailable." }, { status: 503 });
    const amount = Number(body.amount);
    const senderIdentifier = String(body.senderIdentifier || "").trim();
    const externalReference = String(body.externalReference || "").trim();
    const note = String(body.note || "").trim().slice(0, 255);
    const receipt = multipart ? (submitted as FormData).get("receipt") : null;
    const validIdentifier = method === "cashapp"
      ? /^\\$[A-Za-z][A-Za-z0-9_]{0,19}$/.test(senderIdentifier)
      : /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(senderIdentifier);
    if (!Number.isFinite(amount) || amount <= 0 || !validIdentifier || externalReference.length < 4 || externalReference.length > 100)
      return NextResponse.json(
        { error: `Enter a valid amount, ${method === "cashapp" ? "cashtag" : "email address"}, and provider transaction ID.` },
        { status: 400 },
      );
    if (!(receipt instanceof File) || receipt.size <= 0 || receipt.size > MAX_RECEIPT_BYTES)
      return NextResponse.json({ error: "Upload a JPEG, PNG, or PDF receipt no larger than 5 MB." }, { status: 400 });
    const receiptBuffer = Buffer.from(await receipt.arrayBuffer());
    const detectedReceipt = receiptType(receiptBuffer);
    if (!detectedReceipt)
      return NextResponse.json({ error: "Upload a valid JPEG, PNG, or PDF receipt." }, { status: 400 });
    const [duplicates] = await db.execute<import("../../../../lib/db").DatabaseRow[]>(
      "SELECT id FROM deposits WHERE method=? AND external_reference=? LIMIT 1",
      [method, externalReference],
    );
    if (duplicates[0])
      return NextResponse.json({ error: "This provider transaction ID has already been submitted." }, { status: 409 });
    const account = await ensurePrimaryAccount(user.id);
    const ref = reference("LDP");
    const directory = path.resolve(process.cwd(), "storage", "deposit-receipts", String(user.id));
    await mkdir(directory, { recursive: true });
    const storageName = `${randomUUID()}.${detectedReceipt[1]}`;
    const target = path.join(directory, storageName);
    await writeFile(target, receiptBuffer, { flag: "wx" });
    try {
      await db.execute(
        "INSERT INTO deposits(reference,user_id,account_id,method,currency,amount,sender_identifier,external_reference,note,receipt_original_name,receipt_storage_name,receipt_mime_type,receipt_size_bytes,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,'pending')",
        [ref, user.id, account.id, method, account.currency, amount, senderIdentifier, externalReference, note || null, path.basename(receipt.name).slice(0,255), storageName, detectedReceipt[0], receipt.size],
      );
    } catch (error) {
      await unlink(target).catch(() => undefined);
      throw error;
    }
    await Promise.all([
      db.execute(
        "INSERT INTO audit_logs(actor_user_id,subject_user_id,action,entity_type,entity_id,details) VALUES(?,?,'deposit.created','deposit',?,?)",
        [user.id, user.id, ref, JSON.stringify({ method, amount, externalReference })],
      ),
      db.execute(
        "INSERT INTO notifications(user_id,type,title,body,action_url) VALUES(?,'deposit','Wallet deposit submitted',?,'/dashboard/activity')",
        [user.id, `Your ${method === "cashapp" ? "Cash App" : method === "paypal" ? "PayPal" : "Skrill"} deposit ${ref} is awaiting administrator confirmation.`],
      ),
    ]);
    return NextResponse.json({ reference: ref, method, amount, status: "pending" });
  }
  if (!["btc", "eth", "usdt"].includes(method))
    return NextResponse.json(
      { error: "Choose a supported deposit method." },
      { status: 400 },
    );
  const [walletRows] = await db.execute<import("../../../../lib/db").DatabaseRow[]>(
    "SELECT network,wallet_address,image_path FROM deposit_wallet_settings WHERE asset=? AND is_active=1 LIMIT 1",
    [method],
  );
  const wallet = walletRows[0];
  if (!wallet)
    return NextResponse.json(
      { error: `${String(method).toUpperCase()} deposits are temporarily unavailable. Please choose another asset or contact support.` },
      { status: 503 },
    );
  const account = await ensurePrimaryAccount(user.id),
    ref = reference("LDP");
  await db.execute(
    "INSERT INTO deposits(reference,user_id,account_id,method,network,wallet_address,currency,status) VALUES(?,?,?,?,?,?,?,'awaiting_payment')",
    [
      ref,
      user.id,
      account.id,
      method,
      wallet.network,
      wallet.wallet_address,
      account.currency,
    ],
  );
  await Promise.all([
    db.execute(
      "INSERT INTO audit_logs(actor_user_id,subject_user_id,action,entity_type,entity_id,details) VALUES(?,?,'deposit.created','deposit',?,?)",
      [user.id, user.id, ref, JSON.stringify({ method, network: wallet.network })],
    ),
    db.execute(
      "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'deposit','Deposit address generated',?)",
      [user.id, `${String(method).toUpperCase()} deposit ${ref} is awaiting payment over ${String(wallet.network)}.`],
    ),
  ]);
  return NextResponse.json({
    reference: ref,
    method,
    network: wallet.network,
    address: wallet.wallet_address,
    imageUrl: wallet.image_path || null,
    status: "awaiting_payment",
  });
}
