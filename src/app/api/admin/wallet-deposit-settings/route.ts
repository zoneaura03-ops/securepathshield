import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../lib/db";

const PROVIDERS = ["paypal", "cashapp", "skrill"] as const;
const MAX_QR_BYTES = 5 * 1024 * 1024;
function imageExtension(buffer: Buffer) {
  if (buffer.subarray(0,3).equals(Buffer.from([0xff,0xd8,0xff]))) return "jpg";
  if (buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) return "png";
  if (buffer.subarray(0,4).toString("ascii")==="RIFF" && buffer.subarray(8,12).toString("ascii")==="WEBP") return "webp";
  return null;
}
async function removeQr(imagePath: unknown) {
  if (typeof imagePath !== "string" || !imagePath.startsWith("/uploads/wallet-deposit-qr/")) return;
  const directory = path.resolve(process.cwd(), "public", "uploads", "wallet-deposit-qr");
  const target = path.resolve(process.cwd(), "public", imagePath.slice(1));
  if (target.startsWith(directory + path.sep)) await unlink(target).catch(() => undefined);
}

async function requireAdmin() {
  const user = await currentUser();
  return user?.role === "admin" && user.status === "active" ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT provider,account_name,payment_identifier,instructions,qr_image_path,is_active,updated_at FROM wallet_deposit_settings ORDER BY FIELD(provider,'paypal','cashapp','skrill')",
  );
  return NextResponse.json({
    settings: PROVIDERS.map((provider) => {
      const row = rows.find((item) => item.provider === provider);
      return {
        provider,
        accountName: row?.account_name || "",
        identifier: row?.payment_identifier || "",
        instructions: row?.instructions || "",
        qrImageUrl: row?.qr_image_path || null,
        active: Boolean(row?.is_active),
        updatedAt: row?.updated_at || null,
      };
    }),
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const form = await request.formData();
  const provider = String(form.get("provider") || "").toLowerCase();
  const accountName = String(form.get("accountName") || "").trim();
  const identifier = String(form.get("identifier") || "").trim();
  const instructions = String(form.get("instructions") || "").trim();
  const active = String(form.get("active")) === "true";
  const validIdentifier = provider === "cashapp"
    ? /^\$[A-Za-z][A-Za-z0-9_]{0,19}$/.test(identifier)
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  if (!PROVIDERS.includes(provider as (typeof PROVIDERS)[number]) || accountName.length < 2 || accountName.length > 120 || !validIdentifier || instructions.length > 1000)
    return NextResponse.json({ error: "Enter a valid account name, receiving email or cashtag, and instructions." }, { status: 400 });
  const file = form.get("qrImage");
  let qrImageUrl: string | null = null;
  let writtenPath: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_QR_BYTES) return NextResponse.json({ error: "The QR image must be 5 MB or smaller." }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = imageExtension(buffer);
    if (!extension) return NextResponse.json({ error: "Upload a valid JPEG, PNG, or WebP QR image." }, { status: 400 });
    const directory = path.resolve(process.cwd(), "public", "uploads", "wallet-deposit-qr");
    await mkdir(directory, { recursive: true });
    const filename = `${provider}-${randomUUID()}.${extension}`;
    writtenPath = path.join(directory, filename);
    await writeFile(writtenPath, buffer, { flag: "wx" });
    qrImageUrl = `/uploads/wallet-deposit-qr/${filename}`;
  }
  const [existing] = await db.execute<DatabaseRow[]>("SELECT qr_image_path FROM wallet_deposit_settings WHERE provider=? LIMIT 1", [provider]);
  try {
    await db.execute(
      "INSERT INTO wallet_deposit_settings(provider,account_name,payment_identifier,instructions,qr_image_path,is_active,updated_by) VALUES(?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE account_name=VALUES(account_name),payment_identifier=VALUES(payment_identifier),instructions=VALUES(instructions),qr_image_path=IFNULL(VALUES(qr_image_path),qr_image_path),is_active=VALUES(is_active),updated_by=VALUES(updated_by)",
      [provider, accountName, identifier, instructions || null, qrImageUrl, active, admin.id],
    );
  } catch (error) {
    if (writtenPath) await unlink(writtenPath).catch(() => undefined);
    throw error;
  }
  if (qrImageUrl) await removeQr(existing[0]?.qr_image_path);
  await db.execute(
    "INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,details) VALUES(?,'wallet_deposit_settings.updated','wallet_deposit_settings',?,?)",
    [admin.id, provider, JSON.stringify({ active, qrUpdated: Boolean(qrImageUrl) })],
  );
  return NextResponse.json({ ok: true });
}
