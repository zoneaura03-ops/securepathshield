"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Clock3, RefreshCw, ShieldCheck, X } from "lucide-react";

type Transfer = Record<string, string | number | null>;

const stageLabels: Record<string, string> = {
  awaiting_clearance: "Awaiting compliance",
  awaiting_tax: "Awaiting tax / COT",
  verified: "Verification complete",
};

export default function AdminTransferQueue() {
  const [rows, setRows] = useState<Transfer[] | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");

  async function load() {
    setError("");
    const response = await fetch("/api/admin/transfers");
    const result = await response.json();
    if (response.ok) setRows(result.rows);
    else setError(result.error);
  }

  useEffect(() => { load(); }, []);

  async function act(id: string, action: "approve" | "decline" | "clear_verification") {
    setWorking(`${id}:${action}`);
    setError("");
    const response = await fetch("/api/admin/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    const result = await response.json();
    setWorking("");
    if (!response.ok) return setError(result.error);
    await load();
  }

  const visibleRows = (rows || []).filter((row) =>
    (typeFilter === "all" || row.transfer_type === typeFilter) &&
    (stageFilter === "all" || row.verification_stage === stageFilter),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <section className="relative overflow-hidden rounded-[28px] bg-[#09251b] p-7 text-white shadow-[0_22px_65px_rgba(7,36,25,.17)] sm:p-9">
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-emerald-300"><Check size={14}/>Payment operations</p><h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Transfer approvals</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Monitor customer verification, securely share required codes, and make the final transfer decision.</p></div>
          <button type="button" onClick={load} className="grid size-12 place-items-center rounded-2xl border border-white bg-white shadow-lg" aria-label="Refresh transfers"><RefreshCw size={20} strokeWidth={2.5} color="#17233f" /></button>
        </div>
      </section>

      {error && <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <section className="mt-6 grid gap-4 rounded-2xl border bg-white p-4 sm:grid-cols-2">
        <label><span className="label">Transfer type</span><select className="field" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">All transfer types</option><option value="local">Local transfers</option><option value="internal">Internal transfers</option><option value="international">International transfers</option></select></label>
        <label><span className="label">Verification stage</span><select className="field" value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}><option value="all">All verification stages</option><option value="awaiting_clearance">Awaiting compliance</option><option value="awaiting_tax">Awaiting tax or COT</option><option value="verified">Verification complete</option></select></label>
      </section>
      <div className="mt-6 space-y-5">
        {rows === null ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-3xl bg-white" />) : visibleRows.length === 0 ? (
          <div className="rounded-3xl border bg-white p-14 text-center"><ShieldCheck className="mx-auto text-bank-600" size={32} /><h2 className="mt-4 text-xl">No matching transfers</h2><p className="mt-2 text-sm text-neutral-500">Adjust the filters or refresh the queue.</p></div>
        ) : visibleRows.map((row) => {
          const id = String(row.id);
          const verified = row.verification_stage === "verified";
          const requiresDecision = row.status === "pending";
          const amount = Number(row.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          return (
            <article key={id} className="overflow-hidden rounded-3xl border border-[#dfe5ef] bg-white shadow-[0_12px_35px_rgba(23,35,63,.06)]">
              <div className="grid gap-5 border-b border-[#e9eeeb] p-5 sm:p-6 lg:grid-cols-[1.3fr_.8fr_auto] lg:items-center">
                <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-bank-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-bank-700">{String(row.transfer_type || "transfer")}</span><span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{stageLabels[String(row.verification_stage)] || String(row.verification_stage || "Pending")}</span></div><h2 className="mt-3 text-xl font-bold">{String(row.recipient_name || "Recipient")}</h2><p className="mt-1 text-xs text-neutral-500">{String(row.email)} · {String(row.reference)}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Transfer amount</p><p className="mt-2 text-2xl font-bold text-[#143a2b]">{amount} {String(row.currency || "")}</p><p className="mt-1 text-xs text-neutral-500">{String(row.bank_name || "SecurePath Shield")} · {String(row.created_at || "")}</p></div>
                <ArrowRight className="hidden text-neutral-300 lg:block" />
              </div>

              <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-3">
                <CodeCard label="Compliance code" value={row.clearance_code} active={row.verification_stage === "awaiting_clearance"} />
                <CodeCard label="Tax code" value={row.tax_code} active={row.verification_stage === "awaiting_tax" && !row.tax_verified_at} />
                <CodeCard label="COT" value={row.cot_code} active={row.verification_stage === "awaiting_tax" && Boolean(row.tax_verified_at)} />
              </div>

              <div className="flex flex-col gap-3 border-t bg-[#f8f9fc] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="flex items-center gap-2 text-xs text-neutral-500"><Clock3 size={15} /> {requiresDecision ? "Final approval becomes available after all verification stages." : "This transfer settles automatically after customer verification."}</p>
                <div className="flex flex-wrap gap-2">
                  {!verified && <button type="button" disabled={Boolean(working)} onClick={() => act(id, "clear_verification")} className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 disabled:opacity-40"><ShieldCheck size={16} />Manually clear</button>}
                  {requiresDecision && <>
                  <button type="button" disabled={Boolean(working)} onClick={() => act(id, "decline")} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 disabled:opacity-40"><X size={16} />Decline</button>
                  <button type="button" disabled={!verified || Boolean(working)} onClick={() => act(id, "approve")} className="btn disabled:cursor-not-allowed disabled:opacity-40"><Check size={16} />Approve transfer</button>
                  </>}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function CodeCard({ label, value, active }: { label: string; value: string | number | null; active: boolean }) {
  return <div className={`rounded-2xl border p-4 ${active ? "border-amber-200 bg-amber-50" : "border-[#e2e7f0] bg-[#f8f9fc]"}`}><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{label}</p>{active && <span className="size-2 rounded-full bg-amber-500" />}</div><p className="mt-3 font-mono text-lg font-bold tracking-[.12em] text-[#17233f]">{String(value || "Not issued")}</p></div>;
}

// Hostinger source snapshot sync.
