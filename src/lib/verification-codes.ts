import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { db, type DatabaseRow } from "./db";

const digest = (userId: number, code: string) =>
  createHash("sha256").update(`${userId}:${code}`).digest("hex");

export async function issueVerificationCode(userId: number) {
  const code = randomInt(100000, 1000000).toString();
  await db.execute("DELETE FROM email_verification_codes WHERE user_id = ?", [
    userId,
  ]);
  await db.execute(
    "INSERT INTO email_verification_codes (user_id, code_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))",
    [userId, digest(userId, code)],
  );
  return code;
}

export async function verifyCode(userId: number, code: string) {
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT id, code_hash, attempts FROM email_verification_codes WHERE user_id=? AND expires_at>NOW() ORDER BY id DESC LIMIT 1",
    [userId],
  );
  const entry = rows[0];
  if (!entry || entry.attempts >= 5) return false;
  await db.execute(
    "UPDATE email_verification_codes SET attempts=attempts+1 WHERE id=?",
    [entry.id],
  );
  const valid = timingSafeEqual(
    Buffer.from(entry.code_hash, "hex"),
    Buffer.from(digest(userId, code), "hex"),
  );
  if (valid)
    await db.execute("DELETE FROM email_verification_codes WHERE user_id=?", [
      userId,
    ]);
  return valid;
}
