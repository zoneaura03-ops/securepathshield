import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../lib/db";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const provider = new URL(request.url).searchParams.get("provider")?.toLowerCase();
  if (!["paypal", "cashapp", "skrill"].includes(String(provider)))
    return NextResponse.json({ error: "Unsupported deposit provider." }, { status: 400 });
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT provider,account_name,payment_identifier,instructions,qr_image_path FROM wallet_deposit_settings WHERE provider=? AND is_active=1 LIMIT 1",
    [String(provider)],
  );
  if (!rows[0])
    return NextResponse.json({ error: "This deposit option is temporarily unavailable." }, { status: 503 });
  return NextResponse.json({
    setting: {
      provider: rows[0].provider,
      accountName: rows[0].account_name,
      identifier: rows[0].payment_identifier,
      instructions: rows[0].instructions || "",
      qrImageUrl: rows[0].qr_image_path || null,
    },
  });
}
