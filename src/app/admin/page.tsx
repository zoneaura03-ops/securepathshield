"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Gift,
  Landmark,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const cards = [
  [Users, "Total customers", "users", "/admin/users", "from-emerald-600 to-emerald-800"],
  [Activity, "Pending transfers", "transfers", "/admin/transactions", "from-slate-700 to-slate-900"],
  [Landmark, "Deposit reviews", "deposits", "/admin/deposits", "from-blue-600 to-blue-800"],
  [CreditCard, "Card requests", "cards", "/admin/cards", "from-violet-600 to-violet-800"],
  [Gift, "Grant reviews", "grants", "/admin/grants", "from-amber-500 to-amber-700"],
] as const;

export default function Page() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    setError("");
    try {
      const response = await fetch("/api/admin/overview", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load overview.");
      setStats(data.stats);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load overview.");
    } finally {
      setRefreshing(false);
    }
  }
  useEffect(() => { load(); }, []);

  const pendingActions = useMemo(() => stats ? stats.transfers + stats.deposits + stats.cards + stats.grants : 0, [stats]);

  return (
    <div className="mx-auto max-w-[1500px]">
      <section className="relative overflow-hidden rounded-[28px] bg-[#09251b] px-6 py-7 text-white shadow-[0_24px_70px_rgba(7,36,25,.18)] sm:px-8 sm:py-9">
        <div className="absolute -right-16 -top-24 size-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute bottom-0 right-[26%] size-36 rounded-full bg-[#d9aa3c]/10 blur-2xl" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-emerald-300"><Sparkles size={14} /> SecurePath Shield control center</div><h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Good day, Administrator.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Monitor customer activity, resolve operational queues, and make accountable decisions from one secure workspace.</p></div>
          <div className="flex items-center gap-3"><div className="rounded-2xl border border-white/10 bg-white/[.07] px-5 py-3 backdrop-blur"><p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-white/40"><Activity size={12} className="text-emerald-300"/>Open actions</p><p className="mt-1 text-2xl font-semibold">{stats ? pendingActions : "—"}</p></div><button type="button" onClick={load} disabled={refreshing} className="grid size-12 place-items-center rounded-2xl border border-white bg-white shadow-lg disabled:opacity-60" aria-label="Refresh dashboard"><RefreshCw size={20} strokeWidth={2.5} color="#176b43" className={refreshing ? "animate-spin" : ""} /></button></div>
        </div>
      </section>

      {error && <p role="alert" className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([Icon, label, key, href, gradient], index) => (
          <Link href={href} key={key} className="group relative overflow-hidden rounded-2xl border border-[#dfe7e2] bg-white p-5 shadow-[0_12px_35px_rgba(21,57,41,.055)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(21,57,41,.11)]">
            <div className="flex items-start justify-between"><span className={`grid size-11 place-items-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}><Icon size={19} /></span><ArrowUpRight size={17} className="text-neutral-300 transition group-hover:text-bank-600" /></div>
            <p className="mt-6 text-xs font-semibold text-neutral-500">{label}</p><div className="mt-1 flex items-end justify-between"><p className="text-3xl font-semibold tracking-tight text-neutral-900">{stats ? stats[key] : "—"}</p>{index > 0 && stats && stats[key] > 0 && <span className="rounded-full bg-red-50 px-2 py-1 text-[9px] font-bold uppercase text-red-600">Action needed</span>}</div>
          </Link>
        ))}
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-3xl border border-[#dfe7e2] bg-white p-6 shadow-[0_12px_35px_rgba(21,57,41,.05)] sm:p-7">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-bank-600">Priority queues</p><h2 className="mt-2 text-2xl">Operations requiring review</h2></div><span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">{stats ? pendingActions : "—"} open</span></div>
          <div className="mt-6 divide-y divide-[#edf1ee]">
            {cards.slice(1).map(([Icon, label, key, href]) => (
              <Link href={href} key={key} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"><span className="grid size-10 place-items-center rounded-xl bg-bank-50 text-bank-700"><Icon size={18} /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{label}</p><p className="mt-0.5 text-[11px] text-neutral-400">Review submissions and record a decision</p></div><span className="grid min-w-9 place-items-center rounded-full bg-neutral-100 px-2 py-1 text-xs font-bold text-neutral-700">{stats ? stats[key] : "—"}</span><ArrowUpRight size={16} className="text-neutral-300" /></Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-gradient-to-b from-[#123c2b] to-[#09251b] p-6 text-white shadow-[0_18px_50px_rgba(7,36,25,.16)] sm:p-7">
          <span className="grid size-12 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300"><ShieldCheck size={23} /></span><p className="mt-6 text-[10px] font-bold uppercase tracking-[.18em] text-emerald-300">Governance status</p><h2 className="mt-2 text-2xl">Protected and accountable</h2><p className="mt-3 text-sm leading-6 text-white/55">Every approval, decline, balance adjustment, and account change is attributed to the signed-in administrator.</p>
          <div className="mt-6 space-y-3 border-t border-white/10 pt-5">{["Administrator session active", "Audit logging enabled", "Approval controls operational"].map((item) => <div key={item} className="flex items-center gap-2 text-xs text-white/70"><CheckCircle2 size={15} className="text-emerald-300" />{item}</div>)}</div>
          <Link href="/admin/audit" className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300">Review audit history <ArrowUpRight size={14} /></Link>
        </div>
      </section>
    </div>
  );
}
