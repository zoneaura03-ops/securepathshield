import { compare } from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db, type DatabaseRow } from "../../../../lib/db";
import { clientIp, rateLimit } from "../../../../lib/rate-limit";
import { currentUser } from "../../../../lib/auth";

export async function POST(request: Request) {
  try {
    const limit = rateLimit(`login:${clientIp(request)}`, 10, 15 * 60_000);
    if (!limit.allowed)
      return NextResponse.json(
        { error: "Too many sign-in attempts. Try again later." },
        { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
      );
    const { email, password, remember, admin, website } = await request.json();
    if (website) return NextResponse.json({ error: "Automated submission rejected." }, { status: 400 });
    if (admin) {
      const existingUser = await currentUser();
      if (existingUser)
        return NextResponse.json(
          {
            error:
              existingUser.role === "admin"
                ? "An administrator is already signed in on this browser."
                : "Sign out of your customer account before using administrator access.",
          },
          { status: 409 },
        );
    }
    if (typeof email !== "string" || typeof password !== "string")
      return NextResponse.json(
        { error: "Enter your email and password." },
        { status: 400 },
      );
    const [rows] = await db.execute<DatabaseRow[]>(
      "SELECT id,password_hash,pin_hash,status,role,failed_login_attempts,locked_until FROM users WHERE email=? LIMIT 1",
      [email.trim().toLowerCase()],
    );
    const user = rows[0];
    if (user?.locked_until && new Date(user.locked_until) > new Date())
      return NextResponse.json(
        { error: "This account is temporarily locked. Try again later." },
        { status: 423 },
      );
    if (
      !user?.password_hash ||
      !(await compare(password, user.password_hash))
    ) {
      if (user?.id)
        await db.execute(
          "UPDATE users SET failed_login_attempts=failed_login_attempts+1,locked_until=IF(failed_login_attempts+1>=5,DATE_ADD(NOW(),INTERVAL 15 MINUTE),locked_until) WHERE id=?",
          [user.id],
        );
      return NextResponse.json(
        { error: "The email or password is incorrect." },
        { status: 401 },
      );
    }
    if (user.status === "pending")
      return NextResponse.json(
        {
          error: "Verify your email before signing in.",
          verificationRequired: true,
        },
        { status: 403 },
      );
    if (user.status === "frozen")
      return NextResponse.json(
        { error: "This account is currently restricted. Contact support." },
        { status: 403 },
      );
    if (admin && user.role !== "admin")
      return NextResponse.json(
        { error: "This account does not have administrator access." },
        { status: 403 },
      );
    if (!admin && user.role !== "user")
      return NextResponse.json(
        { error: "Administrator accounts must use the administrator sign-in page." },
        { status: 403 },
      );
    if (!user.pin_hash)
      return NextResponse.json(
        {
          error:
            "A transaction PIN has not been configured for this account. Contact support.",
        },
        { status: 403 },
      );
    await db.execute(
      "UPDATE users SET failed_login_attempts=0,locked_until=NULL WHERE id=?",
      [user.id],
    );
    const token = randomBytes(32).toString("base64url"),
      tokenHash = createHash("sha256").update(token).digest("hex");
    await db.execute("DELETE FROM login_challenges WHERE user_id=?", [user.id]);
    await db.execute(
      "INSERT INTO login_challenges(user_id,token_hash,remember_me,expires_at) VALUES(?,?,?,DATE_ADD(NOW(),INTERVAL 5 MINUTE))",
      [user.id, tokenHash, Boolean(remember)],
    );
    (await cookies()).set("securepathbank_login_challenge", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 300,
    });
    return NextResponse.json({ ok: true, role: user.role, requiresPin: true });
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json(
      { error: "Sign in is temporarily unavailable." },
      { status: 500 },
    );
  }
}
