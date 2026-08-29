"use client";

import { useCallback, useEffect, useState } from "react";
import { SiBitcoin, SiEthereum, SiTether } from "react-icons/si";

type WalletBalances = Record<"btc" | "eth" | "usdt", { amount: number; fiatValue: number | null }>;
type BalanceResponse = { balances: WalletBalances; fiatCurrency: string };

export function CryptoBalanceStrip({ visible = true }: { visible?: boolean }) {
  const [data, setData] = useState<BalanceResponse | null>(null);
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/banking/crypto-equivalents", { cache: "no-store" });
      if (response.ok) setData(await response.json());
    } catch { /* Keep the last known balances during a temporary network error. */ }
  }, []);
  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30_000);
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [load]);

  const assets = [
    [SiBitcoin, "BTC", "btc", "text-[#f7931a]"],
    [SiEthereum, "ETH", "eth", "text-[#8fa5ff]"],
    [SiTether, "USDT", "usdt", "text-[#35c9b0]"],
  ] as const;
  return (
    <div className="relative grid grid-cols-3 border-t border-white/10 bg-black/10">
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3b82f6]/15 blur-sm" />
      {assets.map(([Icon, name, key, tone]) => {
        const balance = data?.balances[key];
        const amount = balance ? balance.amount.toLocaleString("en-US", { minimumFractionDigits: name === "USDT" ? 2 : 0, maximumFractionDigits: name === "USDT" ? 2 : 8 }) : "…";
        const fiat = balance?.fiatValue == null || !data ? null : new Intl.NumberFormat("en-US", { style: "currency", currency: data.fiatCurrency, maximumFractionDigits: 2 }).format(balance.fiatValue);
        return <div key={name} className="relative min-w-0 border-r border-white/10 p-3 last:border-0 sm:p-4"><p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/55"><Icon size={15} className={tone} />{name}</p><p className="mt-2 truncate text-sm font-semibold sm:text-base">{visible ? amount : "••••••"}</p><p className="mt-1 truncate text-[9px] text-white/45">{visible ? (fiat ? `≈ ${fiat}` : "Actual wallet balance") : "••••"}</p></div>;
      })}
    </div>
  );
}

// Hostinger source snapshot sync.
