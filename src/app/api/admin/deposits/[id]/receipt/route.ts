import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { currentUser } from "../../../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../../../lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await currentUser();
  if (!admin || admin.role !== "admin" || admin.status !== "active")
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT user_id,receipt_storage_name,receipt_original_name,receipt_mime_type FROM deposits WHERE id=? LIMIT 1",
    [(await params).id],
  );
  const item = rows[0];
  if (!item?.receipt_storage_name)
    return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
  const directory = path.resolve(process.cwd(), "storage", "deposit-receipts", String(item.user_id));
  const target = path.resolve(directory, String(item.receipt_storage_name));
  if (!target.startsWith(directory + path.sep))
    return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
  try {
    const file = await readFile(target);
    const safeName = String(item.receipt_original_name || "receipt").replace(/["\r\n]/g, "_");
    return new NextResponse(file, {
      headers: {
        "Content-Type": String(item.receipt_mime_type || "application/octet-stream"),
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
  }
}
