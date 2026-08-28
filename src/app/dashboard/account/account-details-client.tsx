"use client";
import { useState } from "react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Landmark,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

type Details = {
  accountHolder: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  currency: string;
  status: string;
  bankName: string;
};
export function AccountDetailsClient({
  preview,
}: {
  preview: Omit<Details, "accountNumber"> & { accountNumber: string };
}) {
  const [details, setDetails] = useState<Details | null>(null);
  const [pin, setPin] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  async function unlock() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/banking/account-details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok)
      return setError(data.error || "Unable to reveal account details.");
    setDetails(data.details);
    setShow(true);
    setPin("");
  }
  async function copy(label: string, value?: string | null) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1400);
  }
  const revealed = details && show ? details : null;
  const accountNumber = revealed?.accountNumber || preview.accountNumber;
  const hidden = "••••••";
  const rows: [string, string | null][] = [
    ["Account holder", details?.accountHolder || preview.accountHolder],
    ["Account number", accountNumber],
    ["Account name", revealed?.accountName || hidden],
    ["Account type", revealed?.accountType || hidden],
    ["Currency", revealed?.currency || hidden],
    ["Bank name", revealed?.bankName || hidden],
    ["Account status", revealed?.status || hidden],
  ];
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-bank-600">
        Your account
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl">Account details</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Use these details when receiving money into your SecurePath Shield account.
      </p>
      <div className="mt-6 rounded-2xl bg-bank-900 p-6 text-white">
        <Landmark size={24} />
        <p className="mt-5 text-xs uppercase tracking-widest text-white/50">
          {revealed?.bankName || "Bank details locked"}
        </p>
        <p className="mt-2 text-2xl font-semibold">
          {details?.accountHolder || preview.accountHolder}
        </p>
        <p className="mt-2 font-mono text-lg tracking-wider">{accountNumber}</p>
      </div>
      {!details && (
        <div className="card mt-5 rounded-2xl p-5 sm:p-6">
          <div className="flex gap-3">
            <ShieldCheck className="shrink-0 text-bank-700" />
            <div>
              <h2 className="font-semibold">Reveal full account details</h2>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Enter your transaction PIN to reveal and copy sensitive banking
                details.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              aria-label="4-digit transaction PIN"
              className="field"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              placeholder="4-digit PIN"
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
            />
            <button
              className="btn shrink-0"
              disabled={pin.length !== 4 || loading}
              onClick={unlock}
            >
              {loading ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Eye size={17} />
              )}
              Reveal details
            </button>
          </div>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
        </div>
      )}
      {details && (
        <button
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-bank-700"
          onClick={() => setShow((old) => !old)}
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
          {show ? "Hide sensitive details" : "Show sensitive details"}
        </button>
      )}
      <div className="card mt-5 overflow-hidden rounded-2xl">
        <dl className="divide-y">
          {rows.map(([label, item]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <div className="min-w-0">
                <dt className="text-xs text-neutral-500">{label}</dt>
                <dd className="mt-1 break-all font-semibold">
                  {item || "Not assigned / configured"}
                </dd>
              </div>
              {details && show && item && (
                <button
                  type="button"
                  aria-label={`Copy ${label}`}
                  className="grid size-9 shrink-0 place-items-center rounded-lg border hover:bg-neutral-50"
                  onClick={() => copy(label, item)}
                >
                  {copied === label ? (
                    <Check size={16} className="text-emerald-600" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              )}
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
