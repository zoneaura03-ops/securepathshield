"use client";
import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, ShieldAlert, X } from "lucide-react";
type Doc = { id: number; kind: string; original_name: string };
type Row = Record<string, unknown> & {
  id: number;
  status: string;
  email: string;
  first_name: string;
  last_name: string;
  documents: Doc[];
};
export default function Page() {
  const [rows, setRows] = useState<Row[] | null>(null),
    [status, setStatus] = useState("pending"),
    [selected, setSelected] = useState<Row | null>(null),
    [reason, setReason] = useState(""),
    [error, setError] = useState("");
  const load = useCallback(
    async (filter = status) => {
      setRows(null);
      const r = await fetch(`/api/admin/kyc?status=${filter}`),
        d = await r.json();
      if (r.ok) setRows(d.rows);
      else setError(d.error);
    },
    [status],
  );
  useEffect(() => {
    load(status);
  }, [status, load]);
  async function act(action: string) {
    if (!selected) return;
    const r = await fetch("/api/admin/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, action, reason }),
      }),
      d = await r.json();
    if (!r.ok) return setError(d.error);
    setSelected(null);
    setReason("");
    load();
  }
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-bank-600">
        Administration
      </p>
      <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl">Identity verification</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Review customer information and protected supporting documents.
          </p>
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="field !w-48"
        >
          <option value="pending">Awaiting review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All submissions</option>
        </select>
      </div>
      {error && (
        <p className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="card mt-6 overflow-hidden rounded-xl">
        {rows === null ? (
          <div className="h-72 animate-pulse bg-neutral-50" />
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldAlert className="mx-auto text-bank-600" />
            <h2 className="mt-4 text-xl">Queue is clear</h2>
          </div>
        ) : (
          rows.map((row) => (
            <button
              onClick={() => setSelected(row)}
              key={row.id}
              className="flex w-full items-center justify-between gap-4 border-b p-5 text-left hover:bg-neutral-50"
            >
              <span>
                <span className="font-semibold">
                  {row.first_name} {row.last_name}
                </span>
                <span className="mt-1 block text-xs text-neutral-500">
                  {row.email} · {String(row.nationality)} ·{" "}
                  {String(row.document_type).replaceAll("_", " ")}
                </span>
              </span>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold capitalize">
                {row.status.replaceAll("_", " ")}
              </span>
            </button>
          ))
        )}
      </div>
      {selected && (
        <div className="fixed inset-0 z-[300] overflow-y-auto bg-black/55 p-4 backdrop-blur-sm">
          <div className="mx-auto my-6 max-w-4xl rounded-2xl bg-white p-5 shadow-2xl sm:p-8">
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-bank-600">
                  KYC case #{selected.id}
                </p>
                <h2 className="mt-2 text-3xl">
                  {selected.first_name} {selected.last_name}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {selected.email}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="grid size-10 place-items-center rounded-full bg-neutral-100"
              >
                <X />
              </button>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {detailFields.map(([key, label]) => (
                <div key={key} className="rounded-xl border p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    {label}
                  </p>
                  <p className="mt-2 break-words text-sm font-semibold">
                    {format(selected[key])}
                  </p>
                </div>
              ))}
            </div>
            <h3 className="mt-8 text-xl">Protected documents</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {selected.documents.map((doc) => (
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`/api/banking/kyc/documents/${doc.id}`}
                  key={doc.id}
                  className="flex items-center justify-between rounded-xl border p-4 text-sm font-semibold hover:border-bank-300"
                >
                  <span>
                    <span className="block capitalize">
                      {doc.kind.replaceAll("_", " ")}
                    </span>
                    <span className="mt-1 block max-w-xs truncate text-xs font-normal text-neutral-500">
                      {doc.original_name}
                    </span>
                  </span>
                  <ExternalLink size={17} />
                </a>
              ))}
            </div>
            {["submitted", "under_review"].includes(selected.status) && (
              <div className="mt-8 border-t pt-6">
                <label>
                  <span className="label">
                    Rejection reason (required when rejecting)
                  </span>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="field min-h-24"
                    placeholder="Explain what the customer must correct…"
                    maxLength={500}
                  />
                </label>
                <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => act("reject")}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-red-200 px-5 text-sm font-bold text-red-700"
                  >
                    <X size={16} />
                    Reject
                  </button>
                  <button onClick={() => act("approve")} className="btn">
                    <Check size={16} />
                    Verify customer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
const detailFields = [
  ["date_of_birth", "Date of birth"],
  ["nationality", "Nationality"],
  ["country_of_birth", "Country of birth"],
  ["residential_address", "Residential address"],
  ["country_of_residence", "Country of residence"],
  ["occupation", "Occupation"],
  ["employer", "Employer"],
  ["tax_residency", "Tax residency"],
  ["tax_id", "Tax ID"],
  ["document_type", "Document type"],
  ["document_number", "Document number"],
  ["issuing_country", "Issuing country"],
  ["document_expiry", "Document expiry"],
  ["account_purpose", "Account purpose"],
  ["expected_monthly_volume", "Expected volume"],
  ["source_of_funds", "Source of funds"],
  ["is_pep", "Politically exposed"],
  ["is_beneficial_owner", "Beneficial owner"],
] as const;
function format(value: unknown) {
  if (value === null || value === "") return "Not provided";
  if (value === 1) return "Yes";
  if (value === 0) return "No";
  return String(value).replaceAll("_", " ");
}
