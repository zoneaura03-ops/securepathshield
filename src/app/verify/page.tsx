"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { BrowserBackButton } from "../../components/browser-back-button";
import { LogoLoader } from "../../components/logo-loader";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    setEmail(
      searchParams.get("email") ||
        sessionStorage.getItem("securepathshield_verification_email") ||
        "",
    );
  }, [searchParams]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setTimeout(
      () => setSeconds((value) => value - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [seconds]);

  async function verify() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/verification/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json();
      if (response.ok) {
        sessionStorage.removeItem("securepathshield_verification_email");
        router.push("/dashboard");
        return;
      }
      setError(data.error || "Unable to verify the code.");
    } catch {
      setError(
        "Unable to verify the code. Check your connection and try again.",
      );
    }
    setLoading(false);
  }

  async function resend() {
    setResending(true);
    setError("");
    const response = await fetch("/api/auth/verification/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (response.ok) setSeconds(30);
    else setError(data.error || "Unable to resend the code.");
    setResending(false);
  }

  return (
    <main className="relative grid min-h-screen place-items-center bg-white px-5 py-20">
      <BrowserBackButton className="absolute left-4 top-4 !border-[#d8dfeb] !bg-white !text-bank-800 shadow-sm hover:!bg-bank-50 sm:left-8 sm:top-8" />
      <div className="w-full max-w-md text-center">
        <ShieldCheck className="mx-auto h-16 w-16 rounded-full bg-bank-50 p-4 text-bank-600" />
        <h1 className="mt-6 text-3xl">Verify Your Email</h1>
        <p className="mt-2 text-sm text-gray-500">
          We sent a 6-digit code to{" "}
          <strong className="text-gray-700">
            {email || "your email address"}
          </strong>
          .
        </p>
        <input
          aria-label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          className="field mt-8 text-center text-2xl tracking-[.55em]"
          placeholder="000000"
        />
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <p className="mt-4 text-xs text-gray-500">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            disabled={seconds > 0 || resending || !email}
            onClick={resend}
            className="font-semibold text-bank-700 disabled:text-gray-400"
          >
            {resending
              ? "Sending…"
              : seconds > 0
                ? `Resend in ${seconds}s`
                : "Resend code"}
          </button>
        </p>
        <button
          onClick={verify}
          disabled={code.length !== 6 || loading || !email}
          className="btn mt-8 w-full"
        >
          {loading ? "Verifying…" : "Verify Code"}
        </button>
      </div>
      {loading && (
        <div className="fixed inset-0 z-[200] bg-[#062b1d]/20 backdrop-blur-[1px]">
          <LogoLoader transparent />
        </div>
      )}
    </main>
  );
}
