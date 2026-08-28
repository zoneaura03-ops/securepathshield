import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../lib/db";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const fields = [
  "nationality",
  "countryOfBirth",
  "residentialAddress",
  "countryOfResidence",
  "occupation",
  "employer",
  "taxResidency",
  "taxId",
  "documentType",
  "documentNumber",
  "issuingCountry",
  "documentExpiry",
  "accountPurpose",
  "expectedMonthlyVolume",
  "sourceOfFunds",
] as const;
const documentKinds = [
  "identity_front",
  "identity_back",
  "proof_of_address",
  "selfie",
] as const;

function fileType(buffer: Buffer) {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])))
    return ["image/jpeg", "jpg"] as const;
  if (
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return ["image/png", "png"] as const;
  if (buffer.subarray(0, 4).toString("ascii") === "%PDF")
    return ["application/pdf", "pdf"] as const;
  return null;
}

export async function GET() {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT * FROM kyc_submissions WHERE user_id=? LIMIT 1",
    [user.id],
  );
  if (!rows[0]) return NextResponse.json({ submission: null, documents: [] });
  const documents: DatabaseRow[] = [];
  return NextResponse.json({ submission: rows[0], documents });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const form = await request.formData();
  const values = Object.fromEntries(
    fields.map((field) => [field, String(form.get(field) || "").trim()]),
  );
  const required = fields.filter(
    (field) => !["employer", "taxId"].includes(field),
  );
  if (required.some((field) => !values[field]))
    return NextResponse.json(
      { error: "Complete every required verification field." },
      { status: 400 },
    );
  if (
    ![
      "passport",
      "national_id",
      "drivers_license",
      "residence_permit",
    ].includes(values.documentType)
  )
    return NextResponse.json(
      { error: "Choose a valid identity document type." },
      { status: 400 },
    );
  if (new Date(values.documentExpiry) <= new Date())
    return NextResponse.json(
      { error: "The identity document must not be expired." },
      { status: 400 },
    );
  if (Object.values(values).some((value) => value.length > 500))
    return NextResponse.json(
      { error: "One or more fields are too long." },
      { status: 400 },
    );
  const uploads: {
    kind: (typeof documentKinds)[number];
    file: File;
    buffer: Buffer;
    mime: string;
    extension: string;
  }[] = [];
  for (const kind of documentKinds) {
    const file = form.get(kind);
    if (!(file instanceof File) || file.size <= 0)
      return NextResponse.json(
        { error: `Upload ${kind.replaceAll("_", " ")}.` },
        { status: 400 },
      );
    if (file.size > MAX_FILE_SIZE)
      return NextResponse.json(
        { error: "Each document must be 5 MB or smaller." },
        { status: 400 },
      );
    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = fileType(buffer);
    if (!detected || (kind === "selfie" && !detected[0].startsWith("image/")))
      return NextResponse.json(
        { error: "Use valid JPEG/PNG images, or PDF for documents." },
        { status: 400 },
      );
    uploads.push({
      kind,
      file,
      buffer,
      mime: detected[0],
      extension: detected[1],
    });
  }
  const directory = path.resolve(
    process.cwd(),
    "storage",
    "kyc",
    String(user.id),
  );
  await mkdir(directory, { recursive: true });
  const saved: string[] = [];
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute<DatabaseRow[]>(
      "SELECT id,status FROM kyc_submissions WHERE user_id=? FOR UPDATE",
      [user.id],
    );
    if (
      existing[0]?.status === "approved" ||
      existing[0]?.status === "under_review" ||
      existing[0]?.status === "submitted"
    )
      throw new KycError(
        "This verification is already awaiting review or approved.",
        409,
      );
    await connection.execute(
      `INSERT INTO kyc_submissions(user_id,nationality,country_of_birth,residential_address,country_of_residence,occupation,employer,tax_residency,tax_id,document_type,document_number,issuing_country,document_expiry,account_purpose,expected_monthly_volume,source_of_funds,is_pep,is_beneficial_owner,status,rejection_reason,reviewed_by,reviewed_at,submitted_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'submitted',NULL,NULL,NULL,NOW()) ON DUPLICATE KEY UPDATE nationality=VALUES(nationality),country_of_birth=VALUES(country_of_birth),residential_address=VALUES(residential_address),country_of_residence=VALUES(country_of_residence),occupation=VALUES(occupation),employer=VALUES(employer),tax_residency=VALUES(tax_residency),tax_id=VALUES(tax_id),document_type=VALUES(document_type),document_number=VALUES(document_number),issuing_country=VALUES(issuing_country),document_expiry=VALUES(document_expiry),account_purpose=VALUES(account_purpose),expected_monthly_volume=VALUES(expected_monthly_volume),source_of_funds=VALUES(source_of_funds),is_pep=VALUES(is_pep),is_beneficial_owner=VALUES(is_beneficial_owner),status='submitted',rejection_reason=NULL,reviewed_by=NULL,reviewed_at=NULL,submitted_at=NOW()`,
      [
        user.id,
        values.nationality,
        values.countryOfBirth,
        values.residentialAddress,
        values.countryOfResidence,
        values.occupation,
        values.employer || null,
        values.taxResidency,
        values.taxId || null,
        values.documentType,
        values.documentNumber,
        values.issuingCountry,
        values.documentExpiry,
        values.accountPurpose,
        values.expectedMonthlyVolume,
        values.sourceOfFunds,
        form.get("isPep") === "true",
        form.get("isBeneficialOwner") === "true",
      ],
    );
    const [submissionRows] = await connection.execute<DatabaseRow[]>(
      "SELECT id FROM kyc_submissions WHERE user_id=?",
      [user.id],
    );
    const submissionId = submissionRows[0].id;
    const [oldDocuments] = await connection.execute<DatabaseRow[]>(
      "SELECT storage_name FROM kyc_documents WHERE submission_id=?",
      [submissionId],
    );
    await connection.execute(
      "DELETE FROM kyc_documents WHERE submission_id=?",
      [submissionId],
    );
    for (const upload of uploads) {
      const storageName = `${randomUUID()}.${upload.extension}`;
      const target = path.join(directory, storageName);
      await writeFile(target, upload.buffer, { flag: "wx" });
      saved.push(target);
      await connection.execute(
        "INSERT INTO kyc_documents(submission_id,kind,original_name,storage_name,mime_type,size_bytes) VALUES(?,?,?,?,?,?)",
        [
          submissionId,
          upload.kind,
          path.basename(upload.file.name).slice(0, 255),
          storageName,
          upload.mime,
          upload.file.size,
        ],
      );
    }
    await connection.execute(
      "INSERT INTO audit_logs(subject_user_id,action,entity_type,entity_id) VALUES(?,'kyc.submitted','kyc',?)",
      [user.id, String(submissionId)],
    );
    await connection.execute(
      "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'kyc','Verification submitted','Your identity verification and supporting documents were submitted for administrator review.')",
      [user.id],
    );
    await connection.commit();
    await Promise.all(
      oldDocuments.map((row) =>
        unlink(path.join(directory, String(row.storage_name))).catch(
          () => undefined,
        ),
      ),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    await connection.rollback();
    await Promise.all(saved.map((file) => unlink(file).catch(() => undefined)));
    if (error instanceof KycError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error(error);
    return NextResponse.json(
      { error: "Unable to submit verification." },
      { status: 500 },
    );
  } finally {
    connection.release();
  }
}
class KycError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
