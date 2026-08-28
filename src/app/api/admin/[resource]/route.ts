import { randomInt } from "node:crypto";
import { hash } from "bcryptjs";
import type { ResultSetHeader } from "mysql2/promise";
import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../lib/db";
import { reference } from "../../../../lib/references";
import { sendCreditNotificationEmail } from "../../../../lib/mail";
async function admin() {
  const user = await currentUser();
  return user?.role === "admin" && user.status === "active" ? user : null;
}
export async function GET(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  const actor = await admin();
  if (!actor)
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  const q = new URL(request.url).searchParams.get("q") || "",
    filter = new URL(request.url).searchParams.get("filter") || "all",
    resource = (await params).resource;
  if (resource === "overview") {
    const [[users], [transfers], [deposits], [cards], [grants]] =
      await Promise.all([
        db.execute<DatabaseRow[]>("SELECT COUNT(*) count FROM users"),
        db.execute<DatabaseRow[]>(
          "SELECT COUNT(*) count FROM transfers WHERE status='pending'",
        ),
        db.execute<DatabaseRow[]>(
          "SELECT COUNT(*) count FROM deposits WHERE status IN ('awaiting_payment','pending')",
        ),
        db.execute<DatabaseRow[]>(
          "SELECT COUNT(*) count FROM cards WHERE status='pending'",
        ),
        db.execute<DatabaseRow[]>(
          "SELECT COUNT(*) count FROM grant_applications WHERE status IN ('submitted','under_review')",
        ),
      ]);
    return NextResponse.json({
      stats: {
        users: Number(users[0].count),
        transfers: Number(transfers[0].count),
        deposits: Number(deposits[0].count),
        cards: Number(cards[0].count),
        grants: Number(grants[0].count),
      },
    });
  }
  let sql = "",
    values: string[] = [];
  if (resource === "users") {
    const filterCondition =
      filter === "active"
        ? " AND u.status='active' AND u.admin_archived_at IS NULL"
        : filter === "with_account"
          ? " AND a.account_number IS NOT NULL"
          : filter === "unverified"
            ? " AND u.admin_archived_at IS NULL AND NOT (EXISTS(SELECT 1 FROM kyc_submissions k WHERE k.user_id=u.id AND k.status='approved') OR EXISTS(SELECT 1 FROM user_verification_overrides v WHERE v.user_id=u.id AND v.is_verified=1))"
            : filter === "archived"
              ? " AND u.admin_archived_at IS NOT NULL"
              : " AND u.admin_archived_at IS NULL";
    sql = `SELECT u.id,u.email,u.first_name,u.last_name,u.role,u.status,u.email_verified_at,u.created_at,a.account_number,a.name account_name,a.type account_type,a.currency,(EXISTS(SELECT 1 FROM kyc_submissions k WHERE k.user_id=u.id AND k.status='approved') OR EXISTS(SELECT 1 FROM user_verification_overrides v WHERE v.user_id=u.id AND v.is_verified=1)) kyc_verified FROM users u LEFT JOIN accounts a ON a.user_id=u.id AND a.status<>'closed' WHERE u.role='user' AND (u.email LIKE ? OR u.full_name LIKE ? OR a.account_number LIKE ?)${filterCondition} ORDER BY u.created_at DESC LIMIT 100`;
    values = [`%${q}%`, `%${q}%`, `%${q}%`];
  } else if (resource === "transfers")
    sql =
      "SELECT t.*,c.cot_code,c.verified_at cot_verified_at,u.email FROM transfers t JOIN users u ON u.id=t.user_id LEFT JOIN transfer_cot_verifications c ON c.transfer_id=t.id WHERE t.status='pending' OR t.verification_stage<>'verified' ORDER BY t.created_at";
  else if (resource === "deposits")
    sql =
      "SELECT d.*,u.email FROM deposits d JOIN users u ON u.id=d.user_id WHERE d.status IN ('awaiting_payment','pending') ORDER BY d.created_at";
  else if (resource === "cards")
    sql =
      "SELECT c.*,u.email,u.first_name,u.last_name FROM cards c JOIN users u ON u.id=c.user_id WHERE c.status IN ('pending','active','frozen','revoked') ORDER BY FIELD(c.status,'pending','active','frozen','revoked'),c.created_at DESC";
  else if (resource === "grants")
    sql =
      "SELECT g.*,u.email,GROUP_CONCAT(CONCAT(d.id,'|',REPLACE(d.original_name,'|','')) SEPARATOR ';;') documents FROM grant_applications g JOIN users u ON u.id=g.user_id LEFT JOIN grant_documents d ON d.grant_id=g.id WHERE g.status IN ('submitted','under_review') GROUP BY g.id,u.email ORDER BY g.created_at";
  else if (resource === "support")
    sql =
      "SELECT s.*,u.email,u.first_name,u.last_name FROM support_tickets s JOIN users u ON u.id=s.user_id WHERE s.status<>'closed' ORDER BY FIELD(s.priority,'urgent','high','normal','low'),s.updated_at";
  else if (resource === "audit")
    sql =
      "SELECT a.*,u.email actor_email FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id ORDER BY a.id DESC LIMIT 200";
  else
    return NextResponse.json({ error: "Unknown resource." }, { status: 404 });
  const [rows] = await db.execute<DatabaseRow[]>(sql, values);
  if (resource === "audit")
    return NextResponse.json({
      rows: rows.map((row) => {
        const action = String(row.action || "system.activity"),
          category = auditCategory(action);
        return { ...row, category, action: `${category}: ${action}` };
      }),
    });
  return NextResponse.json({ rows });
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  const actor = await admin();
  if (!actor)
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  const resource = (await params).resource;
  const body = await request.json(),
    connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    let subject: number | undefined;
    let depositEmail: {
      email: string;
      amount: string;
      currency: string;
      reference: string;
      channel: string;
      balanceAfter?: string;
    } | null = null;
    if (resource === "users") {
      if (
        body.action === "archive_unverified" ||
        body.action === "restore_archived"
      ) {
        const [targetRows] = await connection.execute<DatabaseRow[]>(
          "SELECT id FROM users WHERE id=? AND role='user' FOR UPDATE",
          [body.id],
        );
        if (!targetRows[0]) throw new AdminError("Customer not found.", 404);
        if (body.action === "archive_unverified") {
          const [verified] = await connection.execute<DatabaseRow[]>(
            "SELECT (EXISTS(SELECT 1 FROM kyc_submissions WHERE user_id=? AND status='approved') OR EXISTS(SELECT 1 FROM user_verification_overrides WHERE user_id=? AND is_verified=1)) verified",
            [body.id, body.id],
          );
          if (verified[0]?.verified)
            throw new AdminError(
              "Verified customers cannot be cleared from the unverified workspace.",
              409,
            );
          await connection.execute(
            "UPDATE users SET admin_archived_at=NOW() WHERE id=?",
            [body.id],
          );
        } else
          await connection.execute(
            "UPDATE users SET admin_archived_at=NULL WHERE id=?",
            [body.id],
          );
        subject = Number(body.id);
      } else if (body.action === "revoke_identity") {
        const [targetRows] = await connection.execute<DatabaseRow[]>(
          "SELECT id FROM users WHERE id=? AND role='user' FOR UPDATE",
          [body.id],
        );
        if (!targetRows[0]) throw new AdminError("Customer not found.", 404);
        await connection.execute(
          "INSERT INTO user_verification_overrides(user_id,is_verified,verified_by,verified_at) VALUES(?,0,?,NOW()) ON DUPLICATE KEY UPDATE is_verified=0,verified_by=VALUES(verified_by),verified_at=NOW()",
          [body.id, actor.id],
        );
        await connection.execute(
          "UPDATE kyc_submissions SET status='rejected',rejection_reason='Verification revoked by administrator. Submit current documents to reapply.',reviewed_by=?,reviewed_at=NOW() WHERE user_id=? AND status='approved'",
          [actor.id, body.id],
        );
        await connection.execute(
          "INSERT INTO notifications(user_id,type,title,body,action_url) VALUES(?,'kyc','Identity verification revoked','Your identity verification was revoked. Please submit current government identification to reapply.','/dashboard/verification')",
          [body.id],
        );
        subject = Number(body.id);
      } else if (body.action === "verify_identity") {
        const [targetRows] = await connection.execute<DatabaseRow[]>(
          "SELECT id FROM users WHERE id=? AND role='user' FOR UPDATE",
          [body.id],
        );
        if (!targetRows[0]) throw new AdminError("Customer not found.", 404);
        await connection.execute(
          "INSERT INTO user_verification_overrides(user_id,is_verified,verified_by,verified_at) VALUES(?,1,?,NOW()) ON DUPLICATE KEY UPDATE is_verified=1,verified_by=VALUES(verified_by),verified_at=NOW()",
          [body.id, actor.id],
        );
        await connection.execute(
          "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'kyc','Identity manually verified','An administrator has verified your identity. Transaction services are now available.')",
          [body.id],
        );
        subject = Number(body.id);
      } else if (body.action === "create") {
        const email = String(body.email || "")
          .trim()
          .toLowerCase();
        const firstName = String(body.firstName || "").trim();
        const lastName = String(body.lastName || "").trim();
        const password = String(body.password || "");
        const pin = String(body.pin || "");
        if (
          !/^\S+@\S+\.\S+$/.test(email) ||
          firstName.length < 2 ||
          lastName.length < 2 ||
          password.length < 8 ||
          !/^\d{4}$/.test(pin)
        )
          throw new AdminError(
            "Enter a valid name, email, password of at least 8 characters, and 4-digit PIN.",
            400,
          );
        const [existing] = await connection.execute<DatabaseRow[]>(
          "SELECT id FROM users WHERE email=? LIMIT 1",
          [email],
        );
        if (existing[0])
          throw new AdminError(
            "An account with this email already exists.",
            409,
          );
        const passwordHash = await hash(password, 12);
        const [created] = await connection.execute<ResultSetHeader>(
          "INSERT INTO users(email,password,password_hash,pin_hash,first_name,last_name,full_name,phone,date_of_birth,account_type,country,role,status,email_verified_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,'user','active',NOW())",
          [
            email,
            passwordHash,
            passwordHash,
            await hash(pin, 12),
            firstName,
            lastName,
            `${firstName} ${lastName}`,
            String(body.phone || "").trim(),
            body.dateOfBirth || null,
            body.accountType === "business" ? "business" : "personal",
            String(body.country || "").trim(),
          ],
        );
        subject = Number(created.insertId);
        const accountNumber = `LC${Date.now().toString().slice(-10)}${randomInt(1000, 10000)}`;
        await connection.execute(
          "INSERT INTO accounts(user_id,account_number,name,type,currency) VALUES(?,?,?,?,?)",
          [
            subject,
            accountNumber,
            body.accountType === "business"
              ? "Business Account"
              : "Personal Account",
            body.accountType === "business" ? "business" : "checking",
            "USD",
          ],
        );
        await connection.execute(
          "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'account','Account created','An administrator created and activated your SecurePath Shield account.')",
          [subject],
        );
      } else {
        const status = body.action === "freeze" ? "frozen" : "active";
        await connection.execute(
          "UPDATE users SET status=? WHERE id=? AND role<>'admin'",
          [status, body.id],
        );
        await connection.execute(
          "UPDATE accounts SET status=? WHERE user_id=?",
          [status === "frozen" ? "frozen" : "active", body.id],
        );
        await connection.execute(
          "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'account',?,?)",
          [
            body.id,
            status === "frozen"
              ? "Account access restricted"
              : "Account access restored",
            status === "frozen"
              ? "An administrator restricted your account. Contact customer support if you need assistance."
              : "Your account restriction was removed and account access has been restored.",
          ],
        );
        subject = body.id;
      }
    } else if (resource === "transfers") {
      const [rows] = await connection.execute<DatabaseRow[]>(
        "SELECT * FROM transfers WHERE id=? FOR UPDATE",
        [body.id],
      );
      const item = rows[0];
      if (!item) throw new AdminError("Transfer not found.", 404);
      if (body.action === "clear_verification") {
        if (item.verification_stage === "verified")
          throw new AdminError("This transfer is already verified.", 409);
        await connection.execute(
          "UPDATE transfers SET verification_stage='verified',clearance_verified_at=COALESCE(clearance_verified_at,NOW()),tax_verified_at=COALESCE(tax_verified_at,NOW()) WHERE id=?",
          [item.id],
        );
        await connection.execute(
          "UPDATE transfer_cot_verifications SET verified_at=COALESCE(verified_at,NOW()) WHERE transfer_id=?",
          [item.id],
        );
        await connection.execute(
          "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'transfer','Transfer verification cleared',?)",
          [
            item.user_id,
            `An administrator cleared the remaining verification requirements for transfer ${String(item.reference)}.`,
          ],
        );
      } else {
        if (item.status !== "pending")
          throw new AdminError(
            "This transfer no longer requires a decision.",
            409,
          );
        const approved = body.action === "approve";
        if (approved && item.verification_stage !== "verified")
          throw new AdminError(
            "Complete verification or use the audited manual-clear action before approval.",
            409,
          );
        await connection.execute(
          "UPDATE transfers SET status=?,reviewed_by=?,reviewed_at=NOW() WHERE id=?",
          [approved ? "completed" : "declined", actor.id, item.id],
        );
        if (approved)
          await connection.execute(
            "UPDATE accounts SET ledger_balance=ledger_balance-? WHERE id=?",
            [Number(item.amount) + Number(item.fee), item.source_account_id],
          );
        else
          await connection.execute(
            "UPDATE accounts SET available_balance=available_balance+? WHERE id=?",
            [Number(item.amount) + Number(item.fee), item.source_account_id],
          );
        await connection.execute(
          "UPDATE transactions SET status=? WHERE transfer_id=?",
          [approved ? "processed" : "declined", item.id],
        );
        await connection.execute(
          "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'transfer',?,?)",
          [
            item.user_id,
            approved ? "Transfer approved" : "Transfer declined",
            `Transfer ${String(item.reference)} for ${Number(item.amount).toFixed(2)} ${String(item.currency)} was ${approved ? "approved and processed" : "declined"}.`,
          ],
        );
      }
      subject = item.user_id;
    } else if (resource === "deposits") {
      const approved = body.action === "approve";
      const [rows] = await connection.execute<DatabaseRow[]>(
        "SELECT * FROM deposits WHERE id=? AND status IN ('awaiting_payment','pending') FOR UPDATE",
        [body.id],
      );
      const item = rows[0];
      if (!item) throw new AdminError("Pending deposit not found.", 404);
      const isWalletDeposit = ["paypal", "cashapp", "skrill"].includes(
        String(item.method),
      );
      if (isWalletDeposit && !item.receipt_storage_name)
        throw new AdminError(
          "A payment receipt is required before this wallet deposit can be reviewed.",
          409,
        );
      const amount = isWalletDeposit
        ? Number(item.amount)
        : Number(body.amount);
      if (!approved) {
        await connection.execute(
          "UPDATE deposits SET status='declined',confirmed_by=?,confirmed_at=NOW() WHERE id=?",
          [actor.id, item.id],
        );
        await connection.execute(
          "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'deposit','Deposit declined',?)",
          [
            item.user_id,
            `Deposit ${String(item.reference)} was declined during administrator review.`,
          ],
        );
      } else {
        if (!Number.isFinite(amount) || amount <= 0)
          throw new AdminError("Enter a valid confirmed deposit amount.", 400);
        const asset = String(item.method).toUpperCase();
        const isCrypto = ["BTC", "ETH", "USDT"].includes(asset);
        await connection.execute(
          "UPDATE deposits SET amount=?,status='confirmed',confirmed_by=?,confirmed_at=NOW() WHERE id=?",
          [amount, actor.id, item.id],
        );
        if (isCrypto) {
          await connection.execute(
            "INSERT IGNORE INTO crypto_wallets(user_id,asset) VALUES(?,?)",
            [item.user_id, asset],
          );
          await connection.execute(
            "UPDATE crypto_wallets SET balance=balance+? WHERE user_id=? AND asset=?",
            [amount, item.user_id, asset],
          );
          await connection.execute(
            "INSERT INTO crypto_deposit_credits(deposit_id,user_id,asset,amount,confirmed_by) VALUES(?,?,?,?,?)",
            [item.id, item.user_id, asset, amount, actor.id],
          );
          const displayAmount = amount.toLocaleString("en-US", {
            maximumFractionDigits: asset === "USDT" ? 2 : 8,
          });
          await connection.execute(
            "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'deposit','Crypto deposit confirmed',?)",
            [
              item.user_id,
              `${displayAmount} ${asset} was credited to your crypto wallet and is now available for swapping.`,
            ],
          );
          const [deliveryRows] = await connection.execute<DatabaseRow[]>(
            "SELECT u.email,w.balance FROM users u JOIN crypto_wallets w ON w.user_id=u.id AND w.asset=? WHERE u.id=? LIMIT 1",
            [asset, item.user_id],
          );
          if (deliveryRows[0])
            depositEmail = {
              email: String(deliveryRows[0].email),
              amount: displayAmount,
              currency: asset,
              reference: String(item.reference),
              channel: `${asset} deposit`,
              balanceAfter: Number(deliveryRows[0].balance).toLocaleString(
                "en-US",
                { maximumFractionDigits: asset === "USDT" ? 2 : 8 },
              ),
            };
        } else {
          await connection.execute(
            "UPDATE accounts SET ledger_balance=ledger_balance+?,available_balance=available_balance+? WHERE id=?",
            [amount, amount, item.account_id],
          );
          await connection.execute(
            "INSERT INTO transactions(reference,account_id,user_id,deposit_id,type,category,description,currency,amount,balance_after,status) SELECT ?,a.id,a.user_id,?,'credit','deposit','Confirmed deposit',a.currency,?,a.ledger_balance,'processed' FROM accounts a WHERE a.id=?",
            [reference("LMC"), item.id, amount, item.account_id],
          );
          await connection.execute(
            "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'deposit','Deposit confirmed',?)",
            [
              item.user_id,
              `${amount.toFixed(2)} ${String(item.currency)} was credited for deposit ${String(item.reference)}.`,
            ],
          );
          const [deliveryRows] = await connection.execute<DatabaseRow[]>(
            "SELECT u.email,a.available_balance FROM users u JOIN accounts a ON a.id=? WHERE u.id=? LIMIT 1",
            [item.account_id, item.user_id],
          );
          if (deliveryRows[0])
            depositEmail = {
              email: String(deliveryRows[0].email),
              amount: amount.toFixed(2),
              currency: String(item.currency),
              reference: String(item.reference),
              channel: `${String(item.method === "cashapp" ? "Cash App" : item.method === "paypal" ? "PayPal" : item.method === "skrill" ? "Skrill" : item.method).toUpperCase()} deposit`,
              balanceAfter: Number(deliveryRows[0].available_balance).toFixed(
                2,
              ),
            };
        }
      }
      subject = item.user_id;
    } else if (resource === "cards") {
      const [rows] = await connection.execute<DatabaseRow[]>(
        "SELECT * FROM cards WHERE id=? FOR UPDATE",
        [body.id],
      );
      const item = rows[0];
      if (!item) throw new AdminError("Card not found.", 404);
      if (body.action === "revoke") {
        if (!["active", "frozen"].includes(String(item.status)))
          throw new AdminError(
            "Only an active or frozen card can be revoked.",
            409,
          );
        const balance = Number(item.balance);
        if (balance > 0) {
          await connection.execute(
            "UPDATE accounts SET ledger_balance=ledger_balance+?,available_balance=available_balance+? WHERE id=?",
            [balance, balance, item.account_id],
          );
          await connection.execute(
            "INSERT INTO transactions(reference,account_id,user_id,type,category,description,currency,amount,balance_after,status,metadata) SELECT ?,a.id,a.user_id,'credit','card','Card balance returned after revocation',a.currency,?,a.available_balance,'processed',? FROM accounts a WHERE a.id=?",
            [
              reference("LCR"),
              balance,
              JSON.stringify({
                card_id: item.id,
                admin_revoked: true,
                revoked_by: actor.id,
              }),
              item.account_id,
            ],
          );
        }
        await connection.execute(
          "UPDATE cards SET status='revoked',balance=0 WHERE id=?",
          [item.id],
        );
        await connection.execute(
          "INSERT INTO notifications(user_id,type,title,body,action_url) VALUES(?,'card','Virtual card revoked',?,'/dashboard/cards')",
          [
            item.user_id,
            balance > 0
              ? `Your ${item.card_name} was revoked by an administrator. Its remaining ${balance.toFixed(2)} ${String(item.currency)} balance was returned to your account.`
              : `Your ${item.card_name} was revoked by an administrator. Contact support if you need assistance.`,
          ],
        );
      } else {
        if (item.status !== "pending")
          throw new AdminError(
            "This card application no longer requires a decision.",
            409,
          );
        const approved = body.action === "approve";
        if (!approved && body.action !== "decline")
          throw new AdminError("Choose approve, decline, or revoke.", 400);
        await connection.execute(
          "UPDATE cards SET status=?,last_four=?,expiry_month=?,expiry_year=?,approved_by=?,approved_at=NOW() WHERE id=?",
          [
            approved ? "active" : "declined",
            approved ? String(randomInt(1000, 10000)) : null,
            approved ? 12 : null,
            approved ? new Date().getFullYear() + 3 : null,
            actor.id,
            item.id,
          ],
        );
        await connection.execute(
          "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'card',?,?)",
          [
            item.user_id,
            approved
              ? "Card application approved"
              : "Card application declined",
            approved
              ? `Your ${item.card_name} has been approved and activated. Secure card-details access is being prepared.`
              : `Your ${item.card_name} application was declined. Contact support if you need assistance.`,
          ],
        );
      }
      subject = item.user_id;
    } else if (resource === "support") {
      const response = String(body.response || "").trim();
      if (response.length < 5 || response.length > 5000)
        throw new AdminError("Enter a response of at least 5 characters.", 400);
      const [rows] = await connection.execute<DatabaseRow[]>(
        "SELECT user_id,reference FROM support_tickets WHERE id=? FOR UPDATE",
        [body.id],
      );
      if (!rows[0]) throw new AdminError("Support ticket not found.", 404);
      await connection.execute(
        "UPDATE support_tickets SET admin_response=?,responded_by=?,responded_at=NOW(),status=? WHERE id=?",
        [
          response,
          actor.id,
          body.action === "close" ? "closed" : "resolved",
          body.id,
        ],
      );
      await connection.execute(
        "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'support','Support team replied',?)",
        [
          rows[0].user_id,
          `Our support team replied to request ${String(rows[0].reference)}. Open Customer Support to view the response.`,
        ],
      );
      subject = Number(rows[0].user_id);
    } else if (resource === "grants") {
      const [rows] = await connection.execute<DatabaseRow[]>(
        "SELECT user_id,status FROM grant_applications WHERE id=? AND status IN ('submitted','under_review') FOR UPDATE",
        [body.id],
      );
      if (!rows[0])
        throw new AdminError("Reviewable grant application not found.", 404);
      const approved = body.action === "approve";
      const feedback = String(body.feedback || "").trim();
      if (!approved && feedback.length < 5)
        throw new AdminError(
          "Provide a decline reason of at least 5 characters.",
          400,
        );
      await connection.execute(
        "UPDATE grant_applications SET status=?,admin_feedback=?,reviewed_by=?,reviewed_at=NOW() WHERE id=?",
        [
          approved ? "approved" : "declined",
          feedback || null,
          actor.id,
          body.id,
        ],
      );
      if (rows[0]?.user_id)
        await connection.execute(
          "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'grant',?,?)",
          [
            rows[0].user_id,
            approved
              ? "Grant application approved"
              : "Grant application declined",
            approved
              ? "Your grant application has been approved. A SecurePath Shield representative will contact you with the next steps."
              : "Your grant application was declined. You may contact support for more information.",
          ],
        );
      subject = rows[0]?.user_id;
    } else throw new AdminError("Unknown operation.", 404);
    await connection.execute(
      "INSERT INTO audit_logs(actor_user_id,subject_user_id,action,entity_type,entity_id,details) VALUES(?,?,?,?,?,?)",
      [
        actor.id,
        subject ?? null,
        `${resource}.${body.action}`,
        resource,
        String(body.id),
        JSON.stringify({ action: body.action }),
      ],
    );
    await connection.commit();
    let emailDelivered: boolean | undefined;
    if (depositEmail) {
      try {
        await sendCreditNotificationEmail(depositEmail);
        emailDelivered = true;
      } catch (error) {
        emailDelivered = false;
        console.error("Deposit confirmation email delivery failed:", error);
      }
    }
    return NextResponse.json({ ok: true, emailDelivered });
  } catch (error) {
    await connection.rollback();
    if (error instanceof AdminError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error(error);
    return NextResponse.json(
      { error: "Administration action failed." },
      { status: 500 },
    );
  } finally {
    connection.release();
  }
}
class AdminError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
function auditCategory(action: string) {
  if (/support|chat/i.test(action)) return "Customer care";
  if (/transfer|payment/i.test(action)) return "Transfers";
  if (/kyc|verification/i.test(action)) return "Identity";
  if (/deposit/i.test(action)) return "Deposits";
  if (/card/i.test(action)) return "Cards";
  if (/crypto|wallet/i.test(action)) return "Crypto";
  if (/grant/i.test(action)) return "Grants";
  if (/user|account|profile|password|auth|session/i.test(action))
    return "Accounts & security";
  return "System";
}
