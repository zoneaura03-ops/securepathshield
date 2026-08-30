"use client";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Logo from "../../../components/logo";

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, admin: true }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to sign in.");
      setLoading(false);
      return;
    }
    sessionStorage.setItem("securepathbank_login_destination", "/admin");
    router.push("/pin");
  }

  return (
    <main
      className="relative grid min-h-screen overflow-hidden bg-[#06111f] px-4 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_28rem] lg:place-items-center lg:gap-12 lg:px-16"
      style={{
        backgroundImage: "url('/images/securepathbank-admin-login-v2.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,17,32,.94)_0%,rgba(10,23,40,.76)_46%,rgba(7,17,32,.58)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_25%,rgba(37,99,235,.18),transparent_38%)]" />

      <section className="relative z-10 hidden max-w-xl justify-self-start text-white lg:block">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold tracking-wide backdrop-blur-md">
          <ShieldCheck size={16} className="text-gold-300" /> Secure operations portal
        </div>
        <h1 className="mt-7 text-5xl font-semibold leading-[1.08] tracking-tight">
          Banking operations,<br />protected by design.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-white/70">
          Review customers, verification requests, transactions, cards, and account activity from the SecurePath Bank administration workspace.
        </p>
      </section>

      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-md justify-self-center rounded-3xl border border-white/20 bg-white/95 p-7 shadow-[0_30px_90px_rgba(0,0,0,.42)] backdrop-blur-xl sm:p-9 lg:justify-self-end"
      >
        <Logo />
        <div className="mt-8 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-bank-50 text-bank-700"><ShieldCheck size={21} /></span>
          <div><h2 className="text-2xl font-semibold text-neutral-900">Admin access</h2><p className="mt-0.5 text-xs text-neutral-500">Authorized SecurePath Bank personnel only</p></div>
        </div>
        <label className="mt-7 block">
          <span className="label">Admin email</span>
          <input required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="field mt-2" type="email" placeholder="admin@securepathgroups.com" />
        </label>
        <label className="mt-4 block">
          <span className="label">Password</span>
          <input required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="field mt-2" type="password" placeholder="Enter your password" />
        </label>
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="btn mt-6 w-full disabled:cursor-not-allowed disabled:opacity-70">
          {loading ? "Signing in…" : "Sign in securely"}
        </button>
        <p className="mt-5 text-center text-[11px] leading-5 text-neutral-400">Access is monitored and restricted to approved administrators.</p>
      </form>
    </main>
  );
}