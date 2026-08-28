"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Plus } from "lucide-react";
import { CryptoBalanceStrip } from "./crypto-balance-strip";

type Props = {
  balance: string;
  accountType: string;
  maskedAccount: string;
};

export function BalanceOverview({
  balance,
  accountType,
  maskedAccount,
}: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem("securepathshield-balance-visible");
    if (saved !== null) setVisible(saved === "true");
  }, []);

  function toggle() {
    setVisible((current) => {
      const next = !current;
      window.localStorage.setItem("securepathshield-balance-visible", String(next));
      return next;
    });
  }

  return (
    <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#087649] via-[#075f3c] to-[#063d29] text-white shadow-[0_22px_55px_rgba(6,69,44,.22)]">
      <div className="absolute -left-20 -top-24 size-64 rounded-full bg-[#2b9a6d]/20" />
      <div className="absolute left-16 top-8 size-32 rounded-full bg-white/[.035] blur-sm" />
      <div className="absolute -right-12 -top-20 size-64 rounded-full bg-white/[.06]" />
      <div className="relative flex items-start justify-between gap-4 p-6 sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/65">
            Available balance
          </p>
          <div className="mt-3 flex items-center gap-3">
            <p className="text-4xl font-bold tracking-tight sm:text-5xl">
              {visible ? balance : "••••••"}
            </p>
            <button
              type="button"
              onClick={toggle}
              aria-label={visible ? "Hide all balances" : "Show all balances"}
              aria-pressed={visible}
              title={visible ? "Hide all balances" : "Show all balances"}
              className="grid size-9 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {visible ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
          <p className="mt-3 text-xs text-white/55">
            {accountType} · {maskedAccount}
          </p>
        </div>
        <Link
          href="/dashboard/deposit"
          className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold backdrop-blur hover:bg-white/15"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Fund account</span>
          <span className="sm:hidden">Fund</span>
        </Link>
      </div>
      <CryptoBalanceStrip visible={visible} />
    </section>
  );
}

// Hostinger source snapshot sync.
