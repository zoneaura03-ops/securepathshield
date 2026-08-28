import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../lib/db";

const ASSETS = ["btc", "eth", "usdt"] as const;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

async function requireAdmin() {
  const user = await currentUser();
  return user?.role === "admin" && user.status === "active" ? user : null;
}
function imageExtension(buffer: Buffer) {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "jpg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) return "png";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}
async function removeImage(imagePath: unknown) {
  if (typeof imagePath !== "string" || !imagePath.startsWith("/uploads/deposit-wallets/")) return;
  const directory = path.resolve(process.cwd(), "public", "uploads", "deposit-wallets");
  const target = path.resolve(process.cwd(), "public", imagePath.slice(1));
  if (!target.startsWith(directory + path.sep)) return;
  await unlink(target).catch(() => undefined);
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const [rows] = await db.execute<DatabaseRow[]>("SELECT asset,network,wallet_address,image_path,is_active,updated_at FROM deposit_wallet_settings ORDER BY FIELD(asset,'btc','eth','usdt')");
  const settings = ASSETS.map((asset) => {
    const row = rows.find((item) => item.asset === asset);
    return { asset, network: row?.network || defaultNetwork(asset), address: row?.wallet_address || "", imageUrl: row?.image_path || null, active: Boolean(row?.is_active), updatedAt: row?.updated_at || null };
  });
  return NextResponse.json({ settings });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const form = await request.formData();
  const asset = String(form.get("asset") || "").toLowerCase();
  const network = String(form.get("network") || "").trim();
  const address = String(form.get("address") || "").trim();
  const active = String(form.get("active")) === "true";
  if (!ASSETS.includes(asset as (typeof ASSETS)[number]) || network.length < 2 || network.length > 80 || address.length < 8 || address.length > 255)
    return NextResponse.json({ error: "Enter a valid asset, network, and wallet address." }, { status: 400 });
  const file = form.get("image");
  let imageUrl: string | null = null;
  let writtenPath: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "The wallet screenshot must be 5 MB or smaller." }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = imageExtension(buffer);
    if (!extension) return NextResponse.json({ error: "Upload a valid JPEG, PNG, or WebP screenshot." }, { status: 400 });
    const directory = path.resolve(process.cwd(), "public", "uploads", "deposit-wallets");
    await mkdir(directory, { recursive: true });
    const filename = `${asset}-${randomUUID()}.${extension}`;
    writtenPath = path.join(directory, filename);
    await writeFile(writtenPath, buffer, { flag: "wx" });
    imageUrl = `/uploads/deposit-wallets/${filename}`;
  }
  try {
    const [existing] = await db.execute<DatabaseRow[]>("SELECT image_path FROM deposit_wallet_settings WHERE asset=? LIMIT 1", [asset]);
    await db.execute(
      "INSERT INTO deposit_wallet_settings(asset,network,wallet_address,image_path,is_active,updated_by) VALUES(?,?,?,?,?,?) ON DUPLICATE KEY UPDATE network=VALUES(network),wallet_address=VALUES(wallet_address),image_path=IFNULL(VALUES(image_path),image_path),is_active=VALUES(is_active),updated_by=VALUES(updated_by)",
      [asset, network, address, imageUrl, active, admin.id],
    );
    if (imageUrl && existing[0]?.image_path !== imageUrl) await removeImage(existing[0]?.image_path);
    await db.execute("INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,details) VALUES(?,'deposit_wallet.updated','deposit_wallet',?,?)", [admin.id, asset, JSON.stringify({ network, active, screenshotUpdated: Boolean(imageUrl) })]);
    return NextResponse.json({ ok: true, imageUrl: imageUrl || existing[0]?.image_path || null });
  } catch (error) {
    if (writtenPath) await unlink(writtenPath).catch(() => undefined);
    console.error(error);
    return NextResponse.json({ error: "Unable to update the deposit wallet." }, { status: 500 });
  }
}
function defaultNetwork(asset: string) {
  return asset === "btc" ? "Bitcoin" : asset === "eth" ? "Ethereum ERC20" : "TRON TRC20";
}