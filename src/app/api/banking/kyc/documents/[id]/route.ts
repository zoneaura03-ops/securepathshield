import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { currentUser } from "../../../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../../../lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT d.storage_name,d.mime_type,s.user_id FROM kyc_documents d JOIN kyc_submissions s ON s.id=d.submission_id WHERE d.id=? LIMIT 1",
    [(await params).id],
  );
  const document = rows[0];
  if (!document || user.role !== "admin")
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  const directory = path.resolve(
    process.cwd(),
    "storage",
    "kyc",
    String(document.user_id),
  );
  const target = path.resolve(directory, String(document.storage_name));
  if (!target.startsWith(directory + path.sep))
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  try {
    const file = await readFile(target);
    return new NextResponse(file, {
      headers: {
        "Content-Type": String(document.mime_type),
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }
}
