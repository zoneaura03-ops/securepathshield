import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../lib/db";
import { sendCampaignEmail } from "../../../../lib/mail";

export async function POST(request: Request) {
  const actor = await currentUser();
  if (actor?.role !== "admin" || actor.status !== "active")
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  const body = await request.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const message = String(body.message || "").trim();
  const actionUrl = String(body.actionUrl || "").trim();
  if (
    title.length < 3 ||
    title.length > 180 ||
    message.length < 5 ||
    message.length > 5000 ||
    (actionUrl && !actionUrl.startsWith("/"))
  )
    return NextResponse.json(
      {
        error:
          "Enter a title, message, and an optional internal link beginning with /.",
      },
      { status: 400 },
    );
  const [result] = await db.execute<DatabaseRow[]>(
    "SELECT id,email,first_name FROM users WHERE role='user' AND status='active'",
  );
  if (!result.length)
    return NextResponse.json(
      { error: "No active customers were found." },
      { status: 404 },
    );
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    for (const user of result)
      await connection.execute(
        "INSERT INTO notifications(user_id,type,title,body,action_url) VALUES(?,'campaign',?,?,?)",
        [user.id, title, message, actionUrl || null],
      );
    await connection.execute(
      "INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,details) VALUES(?,'campaign.sent','campaign',?,?)",
      [
        actor.id,
        String(Date.now()),
        JSON.stringify({
          title,
          recipientCount: result.length,
          actionUrl: actionUrl || null,
        }),
      ],
    );
    await connection.commit();
    const emailResults = await Promise.allSettled(
      result.map((user) =>
        sendCampaignEmail({
          email: String(user.email),
          firstName: String(user.first_name || ""),
          title,
          message,
          actionUrl: actionUrl || undefined,
        }),
      ),
    );
    const emailDeliveredCount = emailResults.filter(
      (item) => item.status === "fulfilled",
    ).length;
    const emailFailedCount = emailResults.length - emailDeliveredCount;
    if (emailFailedCount)
      console.error(
        `Campaign email delivery failed for ${emailFailedCount} recipient(s).`,
      );
    return NextResponse.json({
      ok: true,
      recipientCount: result.length,
      emailDeliveredCount,
      emailFailedCount,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Campaign delivery failed:", error);
    return NextResponse.json(
      { error: "Unable to send the campaign." },
      { status: 500 },
    );
  } finally {
    connection.release();
  }
}
