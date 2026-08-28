import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { db, type DatabaseRow } from "../../../../../lib/db";
import { sendPasswordResetEmail } from "../../../../../lib/mail";
import { clientIp, rateLimit } from "../../../../../lib/rate-limit";
export async function POST(request: Request) {
  const limit = rateLimit(`forgot:${clientIp(request)}`, 5, 30 * 60_000);
  if (!limit.allowed)
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 },
    );
  const { email } = await request.json(),
    normalized = String(email || "")
      .trim()
      .toLowerCase();
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT id,email FROM users WHERE email=? AND status<>'frozen' LIMIT 1",
    [normalized],
  );
  if (rows[0]) {
    const token = randomBytes(32).toString("base64url"),
      hash = createHash("sha256").update(token).digest("hex");
    await db.execute("DELETE FROM password_reset_tokens WHERE user_id=?", [
      rows[0].id,
    ]);
    await db.execute(
      "INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES(?,?,DATE_ADD(NOW(),INTERVAL 30 MINUTE))",
      [rows[0].id, hash],
    );
    await sendPasswordResetEmail(rows[0].email, token);
  }
  return NextResponse.json({
    ok: true,
    message:
      "If an eligible account exists, reset instructions have been sent.",
  });
}
