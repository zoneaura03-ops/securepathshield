"use client";
import { useState } from "react";
import {
  CreditCard,
  LayoutDashboard,
  Send,
  WalletCards,
} from "lucide-react";
import { PINPad } from "../../components/pin-pad";
import Logo from "../../components/logo";
import { LogoLoader } from "../../components/logo-loader";
export default function Page() {
  const [pin, setPin] = useState(""),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  async function verify(next: string) {
    setPin(next);
    if (next.length !== 4) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: next }),
        }),
        data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to verify PIN.");
      const storedDestination =
        sessionStorage.getItem("securepathbank_login_destination") ||
        (data.role === "admin" ? "/admin" : "/dashboard");
      sessionStorage.removeItem("securepathbank_login_destination");
      const destination =
        storedDestination.startsWith("/") &&
        !storedDestination.startsWith("//")
          ? storedDestination
          : data.role === "admin"
            ? "/admin"
            : "/dashboard";

      // Authentication changes the cookies used by middleware and server
      // components. A document navigation avoids reusing a route prefetched
      // before the session cookie existed and guarantees a clean hand-off.
      window.location.replace(destination);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to verify PIN.",
      );
      setPin("");
      setLoading(false);
    }
  }
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#eef3ef] px-5 py-8">
      <DashboardBackdrop />
      <div className="absolute inset-0 bg-[#0a1728]/55 backdrop-blur-[3px]" />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/80 bg-white/95 px-7 py-6 text-center shadow-[0_30px_90px_rgba(0,20,12,.35)] sm:px-9 sm:py-7">
        <Logo />
        <h1 className="mt-7 text-3xl">Confirm it&apos;s you</h1>
        <p className="mb-5 mt-2 text-sm leading-6 text-gray-500">
          Enter your 4-digit secure banking PIN to finish signing in.
        </p>
        <PINPad value={pin} onChange={verify} />
        {loading && (
          <p className="mt-4 text-sm text-bank-700">Verifying securelyâ€¦</p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
      </div>
      {loading && (
        <div className="fixed inset-0 z-[200] bg-[#0a1728]/20 backdrop-blur-[1px]">
          <LogoLoader transparent />
        </div>
      )}
    </main>
  );
}

function DashboardBackdrop() {
  const items = [
    [LayoutDashboard, "Overview"],
    [Send, "Send money"],
    [WalletCards, "Accounts"],
    [CreditCard, "Cards"],
  ] as const;

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex min-w-[900px] select-none opacity-90"
    >
      <aside className="w-64 shrink-0 bg-[#0a1728] p-7 text-white">
        <Logo />
        <div className="mt-14 space-y-3 text-sm text-white/65">
          {items.map(([Icon, label], index) => (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 ${index === 0 ? "bg-white/10 text-white" : ""}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </aside>
      <section className="flex-1 p-10">
        <div className="h-8 w-64 rounded-lg bg-slate-300" />
        <div className="mt-8 h-56 rounded-3xl bg-gradient-to-br from-[#d6b45f] via-[#b78a32] to-[#0a1728] shadow-xl" />
        <div className="mt-8 grid grid-cols-4 gap-5">
          {[
            "bg-gold-100",
            "bg-gold-100",
            "bg-fuchsia-100",
            "bg-lime-100",
          ].map((tone) => (
            <div
              key={tone}
              className={`h-36 rounded-2xl border border-white/70 ${tone}`}
            />
          ))}
        </div>
        <div className="mt-8 grid grid-cols-3 gap-5">
          <div className="col-span-2 h-52 rounded-2xl bg-white shadow-sm" />
          <div className="h-52 rounded-2xl bg-white shadow-sm" />
        </div>
      </section>
    </div>
  );
}
