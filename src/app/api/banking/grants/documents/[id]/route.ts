import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { currentUser } from "../../../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../../../lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT d.*,g.user_id owner_id FROM grant_documents d JOIN grant_applications g ON g.id=d.grant_id WHERE d.id=? LIMIT 1",
    [(await params).id],
  );
  const document = rows[0];
  if (!document || (Number(document.owner_id) !== user.id && user.role !== "admin"))
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  try {
    const file = await readFile(safeTarget(document.user_id, document.stored_name));
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "content-type": String(document.mime_type),
        "content-disposition": `attachment; filename="${safeName(document.original_name)}"`,
        "cache-control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Document file is unavailable." }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT d.*,g.status FROM grant_documents d JOIN grant_applications g ON g.id=d.grant_id WHERE d.id=? AND d.user_id=? LIMIT 1",
    [(await params).id, user.id],
  );
  const document = rows[0];
  if (!document || document.status !== "draft")
    return NextResponse.json({ error: "Editable draft document not found." }, { status: 404 });
  await db.execute("DELETE FROM grant_documents WHERE id=?", [document.id]);
  await unlink(safeTarget(document.user_id, document.stored_name)).catch(() => undefined);
  return NextResponse.json({ ok: true });
}

function safeTarget(userId: unknown, storedName: unknown) {
  const directory = path.resolve(process.cwd(), "storage", "grants", String(userId));
  const target = path.resolve(directory, String(storedName));
  if (!target.startsWith(`${directory}${path.sep}`)) throw new Error("Invalid document path.");
  return target;
}
function safeName(value: unknown) {
  return String(value || "document").replace(/["\r\n]/g, "_");
}
