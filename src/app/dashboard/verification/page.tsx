"use client";
import { FormEvent, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FileCheck2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { countries } from "../../../lib/countries";

type Submission = { status: string; rejection_reason: string | null };
type DocumentRow = { id: number; kind: string; original_name: string };
const inputClass = "field";
export default function Page() {
  const [submission, setSubmission] = useState<Submission | null>(null),
    [documents, setDocuments] = useState<DocumentRow[]>([]),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  async function load() {
    const r = await fetch("/api/banking/kyc"),
      d = await r.json();
    if (r.ok) {
      setSubmission(d.submission);
      setDocuments(d.documents);
    } else setError(d.error);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const r = await fetch("/api/banking/kyc", {
        method: "POST",
        body: new FormData(e.currentTarget),
      }),
      d = await r.json();
    if (r.ok) await load();
    else setError(d.error);
    setSaving(false);
  }
  if (loading) return <div className="card h-72 animate-pulse rounded-2xl" />;
  const locked =
    submission &&
    ["submitted", "under_review", "approved"].includes(submission.status);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.18em] text-bank-600">
          Customer due diligence
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl">Identity verification</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
          Provide accurate identity, tax, and account-purpose information. Your
          documents are visible only to authorized reviewers.
        </p>
      </div>
      {submission && (
        <Status
          status={submission.status}
          reason={submission.rejection_reason}
        />
      )}
      {locked && submission?.status !== "approved" ? (
        <div className="card rounded-2xl p-6">
          <h2 className="text-xl">Documents submitted securely</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {documents.map((d) => (
              <a
                target="_blank"
                rel="noreferrer"
                href={`/api/banking/kyc/documents/${d.id}`}
                key={d.id}
                className="flex items-center gap-3 rounded-xl border p-4 text-sm font-semibold hover:border-bank-300"
              >
                <FileCheck2 className="text-blue-600" size={19} />
                <span className="min-w-0">
                  <span className="block capitalize">
                    {d.kind.replaceAll("_", " ")}
                  </span>
                  <span className="block truncate text-xs font-normal text-neutral-500">
                    {d.original_name}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>
      ) : submission?.status !== "approved" ? (
        <form
          onSubmit={submit}
          className="card space-y-8 rounded-2xl p-5 sm:p-8"
        >
          <FormSection title="Personal and residency information">
            <Grid>
              <CountryField name="nationality" label="Nationality" />
              <CountryField name="countryOfBirth" label="Country of birth" />
              <Field
                name="residentialAddress"
                label="Full residential address"
                wide
              />
              <CountryField
                name="countryOfResidence"
                label="Country of residence"
              />
              <Field name="occupation" label="Occupation" />
              <Field name="employer" label="Employer (optional)" />
              <CountryField
                name="taxResidency"
                label="Country of tax residence"
              />
              <Field
                name="taxId"
                label="Tax identification number (if issued)"
              />
            </Grid>
          </FormSection>
          <FormSection title="Government-issued identification">
            <Grid>
              <label>
                <span className="label">Document type</span>
                <select required name="documentType" className={inputClass}>
                  <option value="">Select document</option>
                  <option value="passport">Passport</option>
                  <option value="national_id">National identity card</option>
                  <option value="drivers_license">Driver’s licence</option>
                  <option value="residence_permit">Residence permit</option>
                </select>
              </label>
              <Field name="documentNumber" label="Document number" />
              <CountryField name="issuingCountry" label="Issuing country" />
              <Field name="documentExpiry" label="Expiry date" type="date" />
            </Grid>
          </FormSection>
          <FormSection title="Account activity and risk profile">
            <Grid>
              <Field
                name="accountPurpose"
                label="Purpose of the account"
                wide
              />
              <label>
                <span className="label">Expected monthly volume</span>
                <select
                  required
                  name="expectedMonthlyVolume"
                  className={inputClass}
                >
                  <option value="">Select range</option>
                  <option>Under $1,000</option>
                  <option>$1,000 – $10,000</option>
                  <option>$10,001 – $50,000</option>
                  <option>Above $50,000</option>
                </select>
              </label>
              <Field name="sourceOfFunds" label="Primary source of funds" />
              <label className="flex items-start gap-3 rounded-xl border p-4 text-sm">
                <input
                  name="isPep"
                  value="true"
                  type="checkbox"
                  className="mt-1 accent-bank-600"
                />
                <span>
                  I am a politically exposed person, or a close family
                  member/associate of one.
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border p-4 text-sm">
                <input
                  required
                  name="isBeneficialOwner"
                  value="true"
                  type="checkbox"
                  className="mt-1 accent-bank-600"
                />
                <span>
                  I confirm I am the beneficial owner of this account and its
                  funds.
                </span>
              </label>
            </Grid>
          </FormSection>
          <FormSection title="Supporting documents">
            <p className="mb-4 text-xs leading-5 text-neutral-500">
              JPEG, PNG, or PDF; maximum 5 MB each. The selfie must be JPEG or
              PNG.
            </p>
            <Grid>
              <Upload
                name="identity_front"
                label="Identity document — front/photo page"
              />
              <Upload name="identity_back" label="Identity document — back" />
              <Upload name="proof_of_address" label="Recent proof of address" />
              <Upload
                name="selfie"
                label="Current selfie"
                accept="image/jpeg,image/png"
              />
            </Grid>
          </FormSection>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <button disabled={saving} className="btn w-full">
            <ShieldCheck size={18} />
            {saving ? "Submitting securely…" : "Submit for verification"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
function Status({ status, reason }: { status: string; reason: string | null }) {
  const approved = status === "approved",
    rejected = status === "rejected",
    Icon = approved ? CheckCircle2 : rejected ? XCircle : Clock3;
  return (
    <div
      className={`rounded-2xl border p-5 ${approved ? "border-gold-300 bg-gold-50 text-[#0a1728]" : rejected ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}
    >
      <div className="flex items-center gap-3">
        <Icon />
        <div>
          <p className="font-bold capitalize">{status.replaceAll("_", " ")}</p>
          <p className="mt-1 text-sm">
            {approved
              ? "Your identity has been verified."
              : rejected
                ? reason
                : "Your information is waiting for an administrator review."}
          </p>
        </div>
      </div>
    </div>
  );
}
function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 border-b pb-3 text-xl">{title}</h2>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}
function Field({
  name,
  label,
  type = "text",
  wide = false,
}: {
  name: string;
  label: string;
  type?: string;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "sm:col-span-2" : ""}>
      <span className="label">{label}</span>
      <input
        required={!label.includes("optional") && !label.includes("if issued")}
        name={name}
        type={type}
        className={inputClass}
      />
    </label>
  );
}
function CountryField({ name, label }: { name: string; label: string }) {
  return (
    <label>
      <span className="label">{label}</span>
      <select required name={name} className={inputClass} defaultValue="">
        <option value="">Select country</option>
        {countries.map(([code, country]) => (
          <option key={code} value={country}>
            {country}
          </option>
        ))}
      </select>
    </label>
  );
}
function Upload({
  name,
  label,
  accept = ".jpg,.jpeg,.png,.pdf",
}: {
  name: string;
  label: string;
  accept?: string;
}) {
  return (
    <label>
      <span className="label">{label}</span>
      <input
        required
        name={name}
        type="file"
        accept={accept}
        className="block w-full rounded-xl border bg-neutral-50 p-3 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-bank-50 file:px-3 file:py-2 file:font-semibold file:text-bank-700"
      />
    </label>
  );
}
