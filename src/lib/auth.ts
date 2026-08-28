import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, type DatabaseRow } from "./db";

export const SESSION_COOKIE = "securepathshield_session";
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: "user" | "admin";
  status: "pending" | "active" | "frozen";
  kycVerified: boolean;
};

export async function createSession(userId: number, remember = false) {
  const token = randomBytes(32).toString("base64url");
  const maxAge = remember ? 30 * 24 * 60 * 60 : 8 * 60 * 60;
  await db.execute(
    "INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))",
    [userId, hashToken(token), maxAge],
  );
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token)
    await db.execute("DELETE FROM auth_sessions WHERE token_hash = ?", [
      hashToken(token),
    ]);
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export const currentUser = cache(async (): Promise<AuthUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT u.id, u.email, u.first_name, u.last_name, u.avatar_path, u.role, u.status, (EXISTS(SELECT 1 FROM kyc_submissions k WHERE k.user_id=u.id AND k.status='approved') OR EXISTS(SELECT 1 FROM user_verification_overrides v WHERE v.user_id=u.id AND v.is_verified=1)) AS kyc_verified FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>NOW() LIMIT 1",
    [hashToken(token)],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    avatarUrl: row.avatar_path || null,
    role: row.role,
    status: row.status,
    kycVerified: Boolean(row.kyc_verified),
  };
});

export async function requireUser(role?: "admin" | "user") {
  const user = await currentUser();
  if (!user || user.status !== "active")
    redirect(role === "admin" ? "/admin-login" : "/login");
  if (role && user.role !== role)
    redirect(user.role === "admin" ? "/admin" : "/dashboard");
  return user;
}
