import mysql from "mysql2/promise";
import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
const baseUrl = process.env.APP_TEST_URL || "http://localhost:3000",
  email = `auth-smoke-${randomUUID()}@example.test`,
  password = "SecureTestPassword!42",
  pin = "4826";
const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE,
});
try {
  const passwordHash = await hash(password, 12),
    pinHash = await hash(pin, 12);
  await db.execute(
    "INSERT INTO users(email,password,password_hash,pin_hash,first_name,last_name,full_name,status,email_verified_at) VALUES(?,?,?,?,?,?,?,'active',NOW())",
    [email, passwordHash, passwordHash, pinHash, "Auth", "Smoke", "Auth Smoke"],
  );
  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!login.ok) throw new Error(`Login failed: ${await login.text()}`);
  const challenge = login.headers.get("set-cookie")?.split(";")[0];
  if (!challenge?.startsWith("securepathshield_login_challenge="))
    throw new Error("Login did not issue a PIN challenge.");
  const pinResponse = await fetch(`${baseUrl}/api/auth/pin`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: challenge },
    body: JSON.stringify({ pin }),
  });
  if (!pinResponse.ok)
    throw new Error(`PIN verification failed: ${await pinResponse.text()}`);
  const setCookie = pinResponse.headers.get("set-cookie") || "",
    session = setCookie
      .split(",")
      .map((value) => value.trim())
      .find((value) => value.startsWith("securepathshield_session="))
      ?.split(";")[0];
  if (!session) throw new Error("PIN verification did not issue a session.");
  const dashboard = await fetch(`${baseUrl}/dashboard`, {
      redirect: "manual",
      headers: { cookie: session },
    }),
    body = await dashboard.text();
  if (body.includes("NEXT_REDIRECT"))
    throw new Error("Valid session was rejected by the dashboard.");
  const logout = await fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    headers: { cookie: session },
  });
  if (!logout.ok) throw new Error("Logout failed.");
  console.log("Authentication smoke test passed.");
} finally {
  await db.execute("DELETE FROM users WHERE email=?", [email]);
  await db.end();
}
