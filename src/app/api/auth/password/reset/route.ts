import { hash } from "bcryptjs";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db, type DatabaseRow } from "../../../../../lib/db";
export async function POST(request: Request) {
  const { token, password } = await request.json();
  if (
    typeof token !== "string" ||
    typeof password !== "string" ||
    password.length < 10
  )
    return NextResponse.json(
      { error: "The reset link or password is invalid." },
      { status: 400 },
    );
  const tokenHash = createHash("sha256").update(token).digest("hex"),
    [rows] = await db.execute<DatabaseRow[]>(
      "SELECT id,user_id FROM password_reset_tokens WHERE token_hash=? AND used_at IS NULL AND expires_at>NOW() LIMIT 1",
      [tokenHash],
    );
  if (!rows[0])
    return NextResponse.json(
      { error: "This reset link is invalid or expired." },
      { status: 400 },
    );
  const passwordHash = await hash(password, 12),
    connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      "UPDATE users SET password_hash=?,password=?,failed_login_attempts=0,locked_until=NULL WHERE id=?",
      [passwordHash, passwordHash, rows[0].user_id],
    );
    await connection.execute(
      "UPDATE password_reset_tokens SET used_at=NOW() WHERE id=?",
      [rows[0].id],
    );
    await connection.execute("DELETE FROM auth_sessions WHERE user_id=?", [
      rows[0].user_id,
    ]);
    await connection.execute(
      "INSERT INTO audit_logs(subject_user_id,action,entity_type,entity_id) VALUES(?,'password.reset','user',?)",
      [rows[0].user_id, String(rows[0].user_id)],
    );
    await connection.execute(
      "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'security','Password reset completed','Your password was reset and existing sessions were signed out. If this was not you, contact support immediately.')",
      [rows[0].user_id],
    );
    await connection.commit();
    return NextResponse.json({ ok: true });
  } catch (error) {
    await connection.rollback();
    return NextResponse.json(
      { error: "Password reset failed." },
      { status: 500 },
    );
  } finally {
    connection.release();
  }
}
