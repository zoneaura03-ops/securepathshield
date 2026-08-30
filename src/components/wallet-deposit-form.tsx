"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Copy, LoaderCircle, ShieldCheck } from "lucide-react";
import { SiCashapp, SiPaypal } from "react-icons/si";

type Provider = "paypal" | "cashapp" | "skrill";

const providers = {
  paypal: { name: "PayPal", identifier: "PayPal email", placeholder: "you@example.com" },
  cashapp: { name: "Cash App", identifier: "Cash App cashtag", placeholder: "$YourCashtag" },
  skrill: { name: "Skrill", identifier: "Skrill email", placeholder: "you@example.com" },
} as const;

export function WalletDepositForm({ provider }: { provider: Provider }) {
  const details = providers[provider];
  const [amount, setAmount] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [externalReference, setExternalReference] = useState("");
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [setting, setSetting] = useState<{accountName:string;identifier:string;instructions:string;qrImageUrl:string|null} | null>(null);
  const [loadingSetting, setLoadingSetting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ reference: string; status: string } | null>(null);
  useEffect(() => {
    fetch(`/api/banking/wallet-deposit-settings?provider=${provider}`)
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({response,data}) => response.ok ? setSetting(data.setting) : setError(data.error))
      .catch(() => setError("Unable to load receiving details."))
      .finally(() => setLoadingSetting(false));
  }, [provider]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    if (!receipt) { setError("Upload your payment receipt."); setSaving(false); return; }
    const form = new FormData();
    form.set("method", provider);
    form.set("amount", amount);
    form.set("senderIdentifier", identifier);
    form.set("externalReference", externalReference);
    form.set("note", note);
    form.set("receipt", receipt);
    const response = await fetch("/api/banking/deposits", {
      method: "POST",
      body: form,
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(data.error || "Unable to submit this deposit.");
      return;
    }
    setResult(data);
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl">
        <section className="rounded-3xl border border-gold-300 bg-white p-7 text-center shadow-sm sm:p-10">
          <CheckCircle2 className="mx-auto text-gold-500" size={48} />
          <h1 className="mt-5 text-3xl font-bold">Deposit submitted</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-500">
            Your {details.name} deposit is awaiting administrator confirmation. Your balance will update after the payment is verified.
          </p>
          <div className="mt-6 rounded-2xl bg-bank-50 p-4 text-sm">
            Reference: <b>{result.reference}</b>
          </div>
          <Link href="/dashboard" className="btn mt-6 w-full justify-center">Return to dashboard</Link>
        </section>
      </div>
    );
  }
  if (loadingSetting) return <div className="mx-auto h-96 max-w-2xl animate-pulse rounded-3xl bg-white" />;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-bank-700">
        <ArrowLeft size={16} /> Back to dashboard
      </Link>
      <section className="mt-5 overflow-hidden rounded-3xl border border-[#dfe5ef] bg-white shadow-sm">
        <div className="bg-[#0a1728] p-7 text-white sm:p-9">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-white text-bank-800">
              <ProviderIcon provider={provider} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-gold-300">Wallet deposit</p>
              <h1 className="mt-1 text-3xl font-bold">Deposit with {details.name}</h1>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/65">Submit the payment details below. Funds are credited only after administrator verification.</p>
        </div>

        <form onSubmit={submit} className="space-y-5 p-6 sm:p-8">
          {setting && <div className="rounded-2xl border border-bank-200 bg-bank-50 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-bank-700">Send your payment to</p>
            <p className="mt-3 text-sm text-neutral-500">Recipient/account name</p><p className="font-bold">{setting.accountName}</p>
            <p className="mt-3 text-sm text-neutral-500">{details.identifier}</p>
            <div className="mt-1 flex items-center gap-2"><code className="min-w-0 flex-1 break-all rounded-lg bg-white p-3 font-bold text-bank-800">{setting.identifier}</code><button type="button" onClick={()=>navigator.clipboard.writeText(setting.identifier)} className="grid size-11 shrink-0 place-items-center rounded-lg border bg-white text-bank-700" aria-label="Copy receiving details"><Copy size={17}/></button></div>
            {setting.instructions && <p className="mt-4 whitespace-pre-wrap text-xs leading-5 text-neutral-600">{setting.instructions}</p>}
            {setting.qrImageUrl && <div className="mt-5 rounded-xl bg-white p-4 text-center"><Image src={setting.qrImageUrl} alt={`${details.name} payment QR code`} width={360} height={360} className="mx-auto size-52 object-contain" unoptimized /><p className="mt-2 text-[10px] text-neutral-500">Scan this QR code in your {details.name} app.</p></div>}
          </div>}
          <label className="block"><span className="label">Deposit amount</span><input required min="0.01" step="0.01" type="number" inputMode="decimal" className="field" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></label>
          <label className="block"><span className="label">{details.identifier}</span><input required className="field" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={details.placeholder} /></label>
          <label className="block"><span className="label">{details.name} transaction ID</span><input required minLength={4} maxLength={100} className="field" value={externalReference} onChange={(event) => setExternalReference(event.target.value)} placeholder="Enter the provider payment reference" /></label>
          <label className="block"><span className="label">Note (optional)</span><textarea maxLength={255} className="field min-h-24 resize-y" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Additional information for the reviewer" /></label>
          <label className="block"><span className="label">Payment receipt</span><input required type="file" accept=".jpg,.jpeg,.png,.pdf" className="block w-full rounded-xl border bg-neutral-50 p-3 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-bank-50 file:px-3 file:py-2 file:font-semibold file:text-bank-700" onChange={(event)=>setReceipt(event.target.files?.[0] || null)} /><span className="mt-2 block text-[10px] text-neutral-400">JPEG, PNG, or PDF; maximum 5 MB.</span></label>
          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900"><ShieldCheck className="shrink-0" size={18} /><p>Use a transaction ID that belongs to this payment. Duplicate references are rejected.</p></div>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
          <button disabled={saving} className="btn w-full justify-center">{saving ? <><LoaderCircle className="animate-spin" size={17} /> Submitting deposit?</> : `Submit ${details.name} deposit`}</button>
        </form>
      </section>
    </div>
  );
}

function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === "paypal") return <SiPaypal aria-label="PayPal" size={30} style={{ color: "#003087", fill: "#003087" }} />;
  if (provider === "cashapp") return <SiCashapp className="text-[#d6b45f]" size={28} />;
  return <span className="font-black text-[#862165]">Skrill</span>;
}

// Hostinger source snapshot sync.
