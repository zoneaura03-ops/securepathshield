import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../lib/db";
import { sendKycApprovalEmail } from "../../../../lib/mail";

async function admin() {
  const user = await currentUser();
  return user?.role === "admin" && user.status === "active" ? user : null;
}
export async function GET(request: Request) {
  const actor = await admin();
  if (!actor)
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  const status = new URL(request.url).searchParams.get("status") || "pending";
  const condition =
    status === "all"
      ? ""
      : status === "pending"
        ? "WHERE k.status IN ('submitted','under_review')"
        : "WHERE k.status=?";
  const values = status === "all" || status === "pending" ? [] : [status];
  const [rows] = await db.execute<DatabaseRow[]>(
    `SELECT k.*,u.email,u.first_name,u.last_name,u.date_of_birth FROM kyc_submissions k JOIN users u ON u.id=k.user_id ${condition} ORDER BY k.submitted_at DESC LIMIT 100`,
    values,
  );
  if (rows.length) {
    const ids = rows.map((row) => row.id),
      placeholders = ids.map(() => "?").join(",");
    const [documents] = await db.execute<DatabaseRow[]>(
      `SELECT id,submission_id,kind,original_name,mime_type,size_bytes FROM kyc_documents WHERE submission_id IN (${placeholders}) ORDER BY id`,
      ids,
    );
    for (const row of rows)
      row.documents = documents.filter(
        (document) => Number(document.submission_id) === Number(row.id),
      );
  }
  return NextResponse.json({ rows });
}
export async function POST(request: Request) {
  const actor = await admin();
  if (!actor)
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  const body = await request.json(),
    approved = body.action === "approve",
    reason = String(body.reason || "").trim();
  if (!approved && reason.length < 5)
    return NextResponse.json(
      { error: "Provide a clear rejection reason." },
      { status: 400 },
    );
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<DatabaseRow[]>(
      "SELECT k.id,k.user_id,k.status,u.email,u.first_name FROM kyc_submissions k JOIN users u ON u.id=k.user_id WHERE k.id=? AND k.status IN ('submitted','under_review') FOR UPDATE",
      [body.id],
    );
    const item = rows[0];
    if (!item) {
      await connection.rollback();
      return NextResponse.json(
        { error: "Pending verification not found." },
        { status: 404 },
      );
    }
    await connection.execute(
      "UPDATE kyc_submissions SET status=?,rejection_reason=?,reviewed_by=?,reviewed_at=NOW() WHERE id=?",
      [
        approved ? "approved" : "rejected",
        approved ? null : reason,
        actor.id,
        item.id,
      ],
    );
    await connection.execute(
      "INSERT INTO notifications(user_id,type,title,body) VALUES(?,?,?,?)",
      [
        item.user_id,
        "kyc",
        approved ? "Identity verified" : "Verification needs attention",
        approved
          ? "Your identity verification has been approved."
          : `Your verification was rejected: ${reason}`,
      ],
    );
    await connection.execute(
      "INSERT INTO audit_logs(actor_user_id,subject_user_id,action,entity_type,entity_id,details) VALUES(?,?,?,?,?,?)",
      [
        actor.id,
        item.user_id,
        approved ? "kyc.approved" : "kyc.rejected",
        "kyc",
        String(item.id),
        JSON.stringify({ reason: approved ? null : reason }),
      ],
    );
    await connection.commit();
    let emailDelivered: boolean | undefined;
    if (approved) {
      try {
        await sendKycApprovalEmail(
          String(item.email),
          String(item.first_name || ""),
        );
        emailDelivered = true;
      } catch (error) {
        emailDelivered = false;
        console.error("KYC approval email delivery failed:", error);
      }
    }
    return NextResponse.json({ ok: true, emailDelivered });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return NextResponse.json(
      { error: "Unable to review verification." },
      { status: 500 },
    );
  } finally {
    connection.release();
  }
}
