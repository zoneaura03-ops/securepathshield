import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../lib/db";
import { reference } from "../../../../lib/references";

const MAX_DOCUMENTS = 3;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const allowedFiles: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

export async function GET() {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const [applications] = await db.execute<DatabaseRow[]>(
    "SELECT * FROM grant_applications WHERE user_id=? ORDER BY created_at DESC",
    [user.id],
  );
  const ids = applications.map((item) => Number(item.id));
  let documents: DatabaseRow[] = [];
  if (ids.length) {
    const placeholders = ids.map(() => "?").join(",");
    try {
      const [rows] = await db.execute<DatabaseRow[]>(
        `SELECT id,grant_id,original_name,mime_type,size_bytes,created_at FROM grant_documents WHERE user_id=? AND grant_id IN (${placeholders}) ORDER BY created_at`,
        [user.id, ...ids],
      );
      documents = rows;
    } catch (error) {
      if (!isMissingTable(error)) throw error;
    }
  }
  return NextResponse.json({
    holder: {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
    },
    applications: applications.map((item) => ({
      ...item,
      amount: item.amount == null ? null : Number(item.amount),
      documents: documents.filter((document) => Number(document.grant_id) === Number(item.id)),
    })),
  });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const form = await request.formData();
  const action = text(form, "action") === "submit" ? "submit" : "draft";
  const applicationId = Number(text(form, "applicationId")) || null;
  const applicantType = text(form, "applicantType") === "company" ? "company" : "individual";
  const amount = number(form, "amount");
  const timelineMonths = number(form, "timelineMonths");
  const beneficiaries = number(form, "beneficiaries");
  const declaration = text(form, "declaration") === "true";
  const eligibility = text(form, "eligibility") === "true";
  const values = {
    legalName: text(form, "legalName"),
    projectTitle: text(form, "projectTitle"),
    category: text(form, "category"),
    country: text(form, "country"),
    contactEmail: text(form, "contactEmail"),
    contactPhone: text(form, "contactPhone"),
    registrationNumber: text(form, "registrationNumber"),
    registrationDate: text(form, "registrationDate"),
    organizationBackground: text(form, "organizationBackground"),
    projectLocation: text(form, "projectLocation"),
    purpose: text(form, "purpose"),
    useOfFunds: text(form, "useOfFunds"),
    budgetBreakdown: text(form, "budgetBreakdown"),
    milestones: text(form, "milestones"),
    otherFundingSources: text(form, "otherFundingSources"),
  };

  if (action === "submit") {
    const required = [
      values.legalName,
      values.projectTitle,
      values.category,
      values.country,
      values.contactEmail,
      values.contactPhone,
      values.organizationBackground,
      values.projectLocation,
      values.purpose,
      values.useOfFunds,
      values.budgetBreakdown,
      values.milestones,
      values.otherFundingSources,
    ];
    if (
      required.some((value) => !value) ||
      !/^\S+@\S+\.\S+$/.test(values.contactEmail) ||
      amount == null || amount < 500 ||
      timelineMonths == null || timelineMonths < 1 || timelineMonths > 60 ||
      beneficiaries == null || beneficiaries < 1 ||
      (applicantType === "company" && (!values.registrationNumber || !values.registrationDate)) ||
      !declaration || !eligibility
    )
      return NextResponse.json(
        { error: "Complete every required section, eligibility check, and declaration before submitting." },
        { status: 400 },
      );
  }

  const files = form.getAll("documents").filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length > MAX_DOCUMENTS)
    return NextResponse.json({ error: `Upload no more than ${MAX_DOCUMENTS} documents.` }, { status: 400 });
  for (const file of files) {
    if (!allowedFiles[file.type] || file.size > MAX_FILE_BYTES)
      return NextResponse.json(
        { error: "Documents must be PDF, JPG, or PNG files no larger than 5 MB each." },
        { status: 400 },
      );
  }

  const connection = await db.getConnection();
  const savedPaths: string[] = [];
  try {
    await connection.beginTransaction();
    let grantId = applicationId;
    let grantReference = "";
    if (grantId) {
      const [existing] = await connection.execute<DatabaseRow[]>(
        "SELECT id,reference,status FROM grant_applications WHERE id=? AND user_id=? FOR UPDATE",
        [grantId, user.id],
      );
      if (!existing[0] || existing[0].status !== "draft")
        throw new GrantError("Editable draft not found.", 404);
      grantReference = String(existing[0].reference);
      await connection.execute(
        "UPDATE grant_applications SET applicant_type=?,legal_name=?,project_title=?,category=?,country=?,contact_email=?,contact_phone=?,registration_number=?,registration_date=?,organization_background=?,project_location=?,amount=?,timeline_months=?,beneficiaries=?,purpose=?,use_of_funds=?,budget_breakdown=?,milestones=?,other_funding_sources=?,declaration_accepted_at=?,eligibility_confirmed_at=?,status=?,submitted_at=? WHERE id=?",
        [
          applicantType, nullable(values.legalName), nullable(values.projectTitle), nullable(values.category), nullable(values.country),
          nullable(values.contactEmail), nullable(values.contactPhone), nullable(values.registrationNumber), nullable(values.registrationDate),
          nullable(values.organizationBackground), nullable(values.projectLocation), amount, timelineMonths, beneficiaries,
          nullable(values.purpose), nullable(values.useOfFunds), nullable(values.budgetBreakdown), nullable(values.milestones),
          nullable(values.otherFundingSources), declaration ? new Date() : null, eligibility ? new Date() : null,
          action === "submit" ? "submitted" : "draft", action === "submit" ? new Date() : null, grantId,
        ],
      );
    } else {
      grantReference = reference("LGR");
      const [result] = await connection.execute(
        "INSERT INTO grant_applications(reference,user_id,applicant_type,legal_name,project_title,category,country,contact_email,contact_phone,registration_number,registration_date,organization_background,project_location,amount,timeline_months,beneficiaries,purpose,use_of_funds,budget_breakdown,milestones,other_funding_sources,declaration_accepted_at,eligibility_confirmed_at,status,submitted_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
          grantReference, user.id, applicantType, nullable(values.legalName), nullable(values.projectTitle), nullable(values.category), nullable(values.country),
          nullable(values.contactEmail), nullable(values.contactPhone), nullable(values.registrationNumber), nullable(values.registrationDate),
          nullable(values.organizationBackground), nullable(values.projectLocation), amount, timelineMonths, beneficiaries,
          nullable(values.purpose), nullable(values.useOfFunds), nullable(values.budgetBreakdown), nullable(values.milestones),
          nullable(values.otherFundingSources), declaration ? new Date() : null, eligibility ? new Date() : null,
          action === "submit" ? "submitted" : "draft", action === "submit" ? new Date() : null,
        ],
      );
      grantId = Number((result as { insertId: number }).insertId);
    }

    const [documentCount] = await connection.execute<DatabaseRow[]>(
      "SELECT COUNT(*) count FROM grant_documents WHERE grant_id=?",
      [grantId],
    );
    if (Number(documentCount[0]?.count || 0) + files.length > MAX_DOCUMENTS)
      throw new GrantError(`A grant application can have no more than ${MAX_DOCUMENTS} documents.`, 400);

    if (files.length) {
      const directory = path.join(process.cwd(), "storage", "grants", String(user.id));
      await mkdir(directory, { recursive: true });
      for (const file of files) {
        const storedName = `${randomUUID()}${allowedFiles[file.type]}`;
        const target = path.join(directory, storedName);
        await writeFile(target, Buffer.from(await file.arrayBuffer()), { flag: "wx" });
        savedPaths.push(target);
        await connection.execute(
          "INSERT INTO grant_documents(grant_id,user_id,original_name,stored_name,mime_type,size_bytes) VALUES(?,?,?,?,?,?)",
          [grantId, user.id, file.name.slice(0, 255), storedName, file.type, file.size],
        );
      }
    }

    if (action === "submit")
      await connection.execute(
        "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'grant','Grant application received',?)",
        [user.id, `Your grant application ${grantReference} has been submitted for administrator review.`],
      );
    await connection.commit();
    return NextResponse.json(
      { ok: true, id: grantId, reference: grantReference, status: action === "submit" ? "submitted" : "draft" },
      { status: applicationId ? 200 : 201 },
    );
  } catch (error) {
    await connection.rollback();
    await Promise.all(savedPaths.map((target) => unlink(target).catch(() => undefined)));
    if (error instanceof GrantError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "Unable to save the grant application." }, { status: 500 });
  } finally {
    connection.release();
  }
}

function text(form: FormData, key: string) {
  return String(form.get(key) || "").trim();
}
function number(form: FormData, key: string) {
  const value = Number(form.get(key));
  return Number.isFinite(value) && value >= 0 ? value : null;
}
function nullable(value: string) {
  return value || null;
}
class GrantError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
function isMissingTable(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ER_NO_SUCH_TABLE"
  );
}