"use client";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, LoaderCircle, Send, ShieldCheck } from "lucide-react";
import { SiCashapp, SiPaypal } from "react-icons/si";

type Provider = "paypal" | "cashapp" | "skrill";
type AccountState = {
  formattedBalance: string;
  account: { availableBalance: number; currency: string; accountNumber: string; name: string };
};
type Result = { reference: string; status: string; currency: string; fee: number };

const providerDetails = {
  paypal: {
    name: "PayPal",
    identifier: "Recipient PayPal email",
    placeholder: "recipient@example.com",
    type: "email",
    color: "bg-[#003087]",
    copy: "Send directly to a recipient's PayPal account.",
  },
  cashapp: {
    name: "Cash App",
    identifier: "Recipient $Cashtag",
    placeholder: "$RecipientName",
    type: "text",
    color: "bg-[#d6b45f]",
    copy: "Send directly using the recipient's unique Cash App $Cashtag.",
  },
  skrill: {
    name: "Skrill",
    identifier: "Recipient Skrill email",
    placeholder: "recipient@example.com",
    type: "email",
    color: "bg-[#862165]",
    copy: "Send directly to a recipient's Skrill wallet.",
  },
} as const;

export function WalletPaymentForm({ provider }: { provider: Provider }) {
  const details = providerDetails[provider];
  const [account, setAccount] = useState<AccountState | null>(null);
  const [step, setStep] = useState<"form" | "review" | "processing" | "success">("form");
  const [recipientName, setRecipientName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [paymentType, setPaymentType] = useState(provider === "paypal" ? "friends_family" : "personal");
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    fetch("/api/banking/account")
      .then((response) => response.json())
      .then(setAccount)
      .catch(() => setError("Unable to load your account."));
  }, []);

  const numericAmount = Number(amount || 0);
  const maskedAccount = account?.account.accountNumber
    ? `******${account.account.accountNumber.slice(-4)}`
    : "******";

  function review(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (numericAmount <= 0 || numericAmount > (account?.account.availableBalance || 0))
      return setError("Enter an amount within your available balance.");
    setStep("review");
  }

  async function submit() {
    setStep("processing");
    setError("");
    const response = await fetch("/api/banking/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: provider,
        amount,
        recipientName,
        recipientAccount: identifier.trim(),
        bankName: details.name,
        purpose,
        description: note,
        paymentType,
        pin,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || `The ${details.name} payment could not be submitted.`);
      setStep("review");
      return;
    }
    setResult(data);
    setStep("success");
  }

  if (step === "processing")
    return <PaymentState icon={<LoaderCircle className="animate-spin" />} title={`Submitting ${details.name} payment`} copy="We are validating your PIN, recipient, and available balance." />;

  if (step === "success" && result)
    return (
      <div className="mx-auto max-w-2xl">
        <PaymentState icon={<CheckCircle2 />} title="Payment successful" copy={`Your ${details.name} payment was completed successfully.`} />
        <div className="card mt-5 rounded-2xl p-6">
          <Review rows={[["Reference", result.reference], ["Provider", details.name], ["Recipient", recipientName], [details.identifier, maskIdentifier(identifier, provider)], ["Amount", money(numericAmount, result.currency)], ["Status", result.status]]} />
          <button onClick={() => { setRecipientName(""); setIdentifier(""); setAmount(""); setPurpose(""); setNote(""); setPin(""); setResult(null); setStep("form"); }} className="btn mt-6 w-full">Make another {details.name} payment</button>
        </div>
      </div>
    );

  if (step === "review")
    return (
      <div className="mx-auto max-w-2xl">
        <button type="button" onClick={() => { setPin(""); setError(""); setStep("form"); }} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-bank-700"><ArrowLeft size={16} /> Edit payment</button>
        <div className="card rounded-2xl p-6 sm:p-8">
          <Header provider={provider} title={`Review your ${details.name} payment`} copy="Confirm the recipient and payment details before authorizing." />
          <Review rows={[["From", `${account?.account.name || "SecurePath Bank account"} · ${maskedAccount}`], ["Provider", details.name], ["Recipient", recipientName], [details.identifier, maskIdentifier(identifier, provider)], ...(provider === "paypal" ? [["PayPal payment type", paymentType === "goods_services" ? "Goods and services" : "Friends and family"]] : []), ["Purpose", purpose], ["Note", note || "None"], ["Amount", money(numericAmount, account?.account.currency)], ["Fee", money(0, account?.account.currency)], ["Total debit", money(numericAmount, account?.account.currency)]]} />
          <div className="mt-6 border-t pt-6"><h2 className="text-xl">Authorize payment</h2><p className="mt-1 text-xs leading-5 text-neutral-500">Enter your 4-digit transaction PIN after checking every detail.</p><Field className="mt-4" label="4-digit transaction PIN" type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={pin} onChange={(value) => setPin(value.replace(/\D/g, "").slice(0, 4))} /></div>
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
          <button type="button" onClick={submit} disabled={pin.length !== 4} className="btn mt-6 w-full"><ShieldCheck size={17} /> Authorize {details.name} payment</button>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl">
      <Header provider={provider} title={`${details.name} payment`} copy={details.copy} />
      <div className={`mt-6 overflow-hidden rounded-2xl ${details.color} p-5 text-white shadow-lg`}><div className="flex items-center justify-between"><ProviderIcon provider={provider} /><span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">Secure payment</span></div><p className="mt-8 text-[10px] uppercase tracking-widest text-white/65">Available balance</p><p className="serif mt-2 text-3xl">{account?.formattedBalance || "Loading…"}</p><p className="mt-2 text-xs text-white/60">{maskedAccount}</p></div>
      <form onSubmit={review} className="card mt-5 space-y-6 rounded-2xl p-5 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Recipient full name" value={recipientName} onChange={setRecipientName} />
          <Field label={details.identifier} type={details.type} placeholder={details.placeholder} value={identifier} onChange={setIdentifier} pattern={provider === "cashapp" ? "\\$[A-Za-z][A-Za-z0-9_]{0,19}" : undefined} />
          <Field label="Amount" type="number" min="0.01" step="0.01" value={amount} onChange={setAmount} />
          <Select label="Payment purpose" value={purpose} onChange={setPurpose} options={[["", "Select purpose"], ["family_support", "Family support"], ["goods_services", "Goods or services"], ["bill_payment", "Bill payment"], ["business_payment", "Business payment"], ["other", "Other"]]} />
          {provider === "paypal" && <Select label="PayPal payment type" value={paymentType} onChange={setPaymentType} options={[["friends_family", "Friends and family"], ["goods_services", "Goods and services"]]} />}
          <Field label="Payment note (optional)" required={false} maxLength={120} value={note} onChange={setNote} />
        </div>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        <button className="btn w-full">Review {details.name} payment <Send size={16} /></button>
      </form>
    </div>
  );
}

function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === "paypal") return <SiPaypal size={34} />;
  if (provider === "cashapp") return <SiCashapp size={34} />;
  return <span className="text-xl font-black tracking-[-.08em]">Skrill</span>;
}
function Header({ provider, title, copy }: { provider: Provider; title: string; copy: string }) {
  return <div><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.2em] text-bank-600"><ProviderIcon provider={provider} /> Digital wallet payment</div><h1 className="mt-3 text-3xl sm:text-4xl">{title}</h1><p className="mt-2 text-sm leading-6 text-neutral-500">{copy}</p></div>;
}
function Field({ label, value, onChange, type = "text", required = true, placeholder, pattern, min, step, maxLength, inputMode, className = "" }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string; pattern?: string; min?: string; step?: string; maxLength?: number; inputMode?: "numeric"; className?: string }) {
  return <label className={`block ${className}`}><span className="label">{label}</span><input className="field mt-2" required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} pattern={pattern} min={min} step={step} maxLength={maxLength} inputMode={inputMode} /></label>;
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return <label className="block"><span className="label">{label}</span><select required className="field mt-2" value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}
function Review({ rows }: { rows: string[][] }) {
  return <dl className="mt-6 divide-y">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-5 py-3 text-sm"><dt className="text-neutral-500">{label}</dt><dd className="break-all text-right font-semibold capitalize">{value}</dd></div>)}</dl>;
}
function PaymentState({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return <div className="mx-auto max-w-xl rounded-2xl border bg-white p-10 text-center shadow-sm"><span className="mx-auto grid size-14 place-items-center rounded-full bg-gold-50 text-gold-600">{icon}</span><h1 className="mt-5 text-3xl">{title}</h1><p className="mt-2 text-sm text-neutral-500">{copy}</p></div>;
}
function money(amount: number, currency = "USD") { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount); }
function maskIdentifier(value: string, provider: Provider) {
  if (provider === "cashapp") return value;
  const [name, domain] = value.split("@");
  return domain ? `${name.slice(0, 2)}${"*".repeat(Math.max(2, name.length - 2))}@${domain}` : value;
}

// Hostinger source snapshot sync.
