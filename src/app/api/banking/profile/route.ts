import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../lib/db";
import { clientIp, rateLimit } from "../../../../lib/rate-limit";

export async function GET() {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT first_name,last_name,email,phone,date_of_birth,avatar_path,residential_address,country,preferred_language,transaction_alerts,marketing_emails FROM users WHERE id=? LIMIT 1",
    [user.id],
  );
  const row = rows[0];
  return NextResponse.json({
    profile: {
      firstName: row.first_name || "",
      lastName: row.last_name || "",
      email: row.email,
      phone: row.phone || "",
      dateOfBirth: row.date_of_birth
        ? new Date(row.date_of_birth).toISOString().slice(0, 10)
        : "",
      avatarUrl: row.avatar_path || null,
      residentialAddress: row.residential_address || "",
      country: row.country || "",
      preferredLanguage: row.preferred_language || "en",
      transactionAlerts: Boolean(row.transaction_alerts),
      marketingEmails: Boolean(row.marketing_emails),
    },
  });
}

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const limit = rateLimit(
    `profile:${user.id}:${clientIp(request)}`,
    10,
    60_000,
  );
  if (!limit.allowed)
    return NextResponse.json(
      { error: "Too many profile updates. Try again shortly." },
      { status: 429 },
    );
  const body = await request.json();
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const phone = String(body.phone || "").trim();
  const residentialAddress = String(body.residentialAddress || "").trim();
  const country = String(body.country || "").trim();
  const dateOfBirth = String(body.dateOfBirth || "").trim();
  const preferredLanguage = ["en", "fr", "de", "es"].includes(
    body.preferredLanguage,
  )
    ? body.preferredLanguage
    : "en";
  if (
    firstName.length < 2 ||
    lastName.length < 2 ||
    firstName.length > 100 ||
    lastName.length > 100
  )
    return NextResponse.json(
      { error: "Enter a valid first and last name." },
      { status: 400 },
    );
  if (
    phone.length > 40 ||
    residentialAddress.length > 255 ||
    country.length > 100
  )
    return NextResponse.json(
      { error: "One or more profile fields are too long." },
      { status: 400 },
    );
  await db.execute(
    "UPDATE users SET first_name=?,last_name=?,full_name=?,phone=?,date_of_birth=?,residential_address=?,country=?,preferred_language=?,transaction_alerts=?,marketing_emails=? WHERE id=?",
    [
      firstName,
      lastName,
      `${firstName} ${lastName}`,
      phone || null,
      dateOfBirth || null,
      residentialAddress || null,
      country || null,
      preferredLanguage,
      Boolean(body.transactionAlerts),
      Boolean(body.marketingEmails),
      user.id,
    ],
  );
  await Promise.all([
    db.execute(
      "INSERT INTO audit_logs(subject_user_id,action,entity_type,entity_id) VALUES(?,'profile.updated','user',?)",
      [user.id, String(user.id)],
    ),
    db.execute(
      "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'profile','Profile settings updated','Your personal details and communication preferences were updated successfully.')",
      [user.id],
    ),
  ]);
  return NextResponse.json({ ok: true });
}
