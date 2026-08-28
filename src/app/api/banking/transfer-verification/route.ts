import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { currentUser } from "../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../lib/db";
import { sendTransferVerificationEmail } from "../../../../lib/mail";

type VerificationStage = "compliance" | "tax" | "cot";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const body = await request.json().catch(() => ({}));
  const reference = String(body.reference || "").trim();
  const code = String(body.code || "")
    .trim()
    .toUpperCase();
  const stage: VerificationStage =
    body.stage === "tax" ? "tax" : body.stage === "cot" ? "cot" : "compliance";
  if (!reference || !/^[A-Z0-9]{6,12}$/.test(code))
    return NextResponse.json(
      { error: "Enter the code supplied by customer care." },
      { status: 400 },
    );

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<DatabaseRow[]>(
      "SELECT t.id,t.verification_stage,t.clearance_code,t.tax_code,t.tax_verified_at,c.cot_code FROM transfers t LEFT JOIN transfer_cot_verifications c ON c.transfer_id=t.id WHERE t.reference=? AND t.user_id=? FOR UPDATE",
      [reference, user.id],
    );
    const transfer = rows[0];
    if (!transfer) throw new VerificationError("Transfer not found.", 404);
    if (!transfer.cot_code) {
      await connection.execute(
        "INSERT INTO transfer_cot_verifications(transfer_id,cot_code) VALUES(?,?) ON DUPLICATE KEY UPDATE cot_code=cot_code",
        [transfer.id, `COT${randomInt(100000, 1000000)}`],
      );
    }

    if (stage === "compliance") {
      if (
        transfer.verification_stage !== "awaiting_clearance" ||
        code !== String(transfer.clearance_code)
      )
        throw new VerificationError("The compliance code is invalid.", 403);
      await connection.execute(
        "UPDATE transfers SET verification_stage='awaiting_tax',clearance_verified_at=NOW() WHERE id=?",
        [transfer.id],
      );
    } else if (stage === "tax") {
      if (
        transfer.verification_stage !== "awaiting_tax" ||
        code !== String(transfer.tax_code)
      )
        throw new VerificationError("The tax code is invalid.", 403);
      await connection.execute(
        "UPDATE transfers SET tax_verified_at=NOW() WHERE id=?",
        [transfer.id],
      );
    } else {
      if (
        transfer.verification_stage !== "awaiting_tax" ||
        !transfer.tax_verified_at ||
        code !== String(transfer.cot_code)
      )
        throw new VerificationError("The COT is invalid.", 403);
      await connection.execute(
        "UPDATE transfers SET verification_stage='verified' WHERE id=?",
        [transfer.id],
      );
      await connection.execute(
        "UPDATE transfer_cot_verifications SET verified_at=NOW() WHERE transfer_id=?",
        [transfer.id],
      );
    }

    await connection.execute(
      "INSERT INTO audit_logs(actor_user_id,subject_user_id,action,entity_type,entity_id) VALUES(?,?,?,'transfer',?)",
      [user.id, user.id, `transfer.${stage}_verified`, String(transfer.id)],
    );
    await connection.commit();
    const emails = [
      sendTransferVerificationEmail({
        email: user.email,
        reference,
        stage,
        event: "verified",
      }),
    ];
    if (stage === "compliance")
      emails.push(
        sendTransferVerificationEmail({
          email: user.email,
          reference,
          stage: "tax",
          event: "required",
        }),
      );
    else if (stage === "tax")
      emails.push(
        sendTransferVerificationEmail({
          email: user.email,
          reference,
          stage: "cot",
          event: "required",
        }),
      );
    else
      emails.push(
        sendTransferVerificationEmail({
          email: user.email,
          reference,
          stage: "transfer",
          event: "pending",
        }),
      );
    const emailResults = await Promise.allSettled(emails);
    const emailDelivered = emailResults.every(
      (result) => result.status === "fulfilled",
    );
    if (!emailDelivered)
      console.error("One or more transfer verification emails failed.");
    return NextResponse.json({ ok: true, emailDelivered });
  } catch (error) {
    await connection.rollback();
    if (error instanceof VerificationError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    return NextResponse.json(
      { error: "The verification step could not be completed." },
      { status: 500 },
    );
  } finally {
    connection.release();
  }
}

class VerificationError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
