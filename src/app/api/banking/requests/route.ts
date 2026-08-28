import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../lib/db";
import { reference } from "../../../../lib/references";
export async function GET(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const type = new URL(request.url).searchParams.get("type");
  if (type === "support") {
    const [rows] = await db.execute<DatabaseRow[]>(
      "SELECT id,reference,category,subject,message,admin_response,responded_at,priority,status,created_at,updated_at FROM support_tickets WHERE user_id=? ORDER BY updated_at DESC,created_at DESC",
      [user.id],
    );
    return NextResponse.json({ tickets: rows });
  }
  if (type === "grant") {
    const [rows] = await db.execute<DatabaseRow[]>(
      "SELECT id,reference,applicant_type,legal_name,project_title,category,country,amount,timeline_months,beneficiaries,purpose,use_of_funds,status,reviewed_at,created_at FROM grant_applications WHERE user_id=? ORDER BY created_at DESC",
      [user.id],
    );
    return NextResponse.json({
      applications: rows.map((row) => ({ ...row, amount: Number(row.amount) })),
    });
  }
  return NextResponse.json({ error: "Unsupported request type." }, { status: 400 });
}
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const body = await request.json();
  if (body.type === "support") {
    const category = String(body.category || "").trim();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();
    const priority = String(body.priority || "normal");
    const categories = ["account", "transfer", "card", "deposit", "investment", "grant", "crypto", "security", "technical", "other"];
    if (!categories.includes(category) || !["low", "normal", "high", "urgent"].includes(priority) || subject.length < 5 || subject.length > 180 || message.length < 20 || message.length > 5000)
      return NextResponse.json(
        { error: "Choose a category and provide a subject and message with enough detail." },
        { status: 400 },
      );
    const ref = reference("LST");
    await Promise.all([
      db.execute(
        "INSERT INTO support_tickets(reference,user_id,category,subject,message,priority) VALUES(?,?,?,?,?,?)",
        [ref, user.id, category, subject, message, priority],
      ),
      db.execute(
        "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'support','Support request received',?)",
        [user.id, `Your support request ${ref} has been received and routed to our support team.`],
      ),
    ]);
    return NextResponse.json({ ok: true, reference: ref }, { status: 201 });
  }
  if (body.type === "grant") {
    const amount = Number(body.amount);
    const timelineMonths = Number(body.timelineMonths);
    const beneficiaries = Number(body.beneficiaries);
    const required = [
      body.legalName,
      body.projectTitle,
      body.category,
      body.country,
      body.purpose,
      body.useOfFunds,
    ];
    if (
      required.some((value) => !String(value || "").trim()) ||
      !Number.isFinite(amount) ||
      amount < 500 ||
      !Number.isInteger(timelineMonths) ||
      timelineMonths < 1 ||
      timelineMonths > 60 ||
      !Number.isInteger(beneficiaries) ||
      beneficiaries < 1
    )
      return NextResponse.json(
        { error: "Complete every grant section with valid project details." },
        { status: 400 },
      );
    const ref = reference("LGR");
    await Promise.all([
      db.execute(
        "INSERT INTO grant_applications(reference,user_id,applicant_type,legal_name,project_title,category,country,amount,timeline_months,beneficiaries,purpose,use_of_funds) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
        [
          ref,
          user.id,
          body.applicantType === "company" ? "company" : "individual",
          String(body.legalName).trim(),
          String(body.projectTitle).trim(),
          String(body.category).trim(),
          String(body.country).trim(),
          amount,
          timelineMonths,
          beneficiaries,
          String(body.purpose).trim(),
          String(body.useOfFunds).trim(),
        ],
      ),
      db.execute(
        "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'grant','Grant application received',?)",
        [user.id, `Your grant application ${ref} has been submitted for administrator review.`],
      ),
    ]);
    return NextResponse.json({ ok: true, reference: ref }, { status: 201 });
  }
  return NextResponse.json({ error: "Unsupported request." }, { status: 400 });
}
