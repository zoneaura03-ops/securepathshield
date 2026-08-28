"use client";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Search,
  ShieldCheck,
} from "lucide-react";
import { TransferPinModal } from "../../../components/transfer-pin-modal";
import { TransferVerification } from "../../../components/transfer-verification";

type Account = {
  formattedBalance: string;
  account: {
    availableBalance: number;
    currency: string;
    accountNumber: string;
    name: string;
  };
};
type Recipient = {
  accountNumber: string;
  name: string;
  accountType: string;
  currency: string;
  bankName: string;
  isOwnAccount: boolean;
};
const empty = {
  recipientAccount: "",
  amount: "",
  purpose: "",
  reference: "",
  description: "",
  pin: "",
};

export default function Page() {
  const [pinOpen, setPinOpen] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [form, setForm] = useState(empty);
  const [step, setStep] = useState<
    "form" | "review" | "processing" | "verification" | "success"
  >("form");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    reference: string;
    status: string;
    currency: string;
  } | null>(null);
  useEffect(() => {
    fetch("/api/banking/account")
      .then((r) => r.json())
      .then(setAccount)
      .catch(() => setError("Unable to load your account."));
  }, []);
  const set = (key: keyof typeof empty, value: string) =>
    setForm((old) => ({ ...old, [key]: value }));
  const amount = Number(form.amount || 0);
  const masked = account?.account.accountNumber
    ? `******${account.account.accountNumber.slice(6)}`
    : "******";

  async function verify() {
    setChecking(true);
    setError("");
    setRecipient(null);
    const response = await fetch(
      `/api/banking/internal-recipient?accountNumber=${encodeURIComponent(form.recipientAccount)}`,
    );
    const data = await response.json();
    setChecking(false);
    if (!response.ok)
      return setError(data.error || "Unable to verify this account.");
    setRecipient(data.recipient);
  }
  function review(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!recipient || recipient.accountNumber !== form.recipientAccount)
      return setError("Verify the recipient account first.");
    if (recipient.isOwnAccount)
      return setError(
        "You cannot transfer to the same account you are sending from.",
      );
    if (recipient.currency !== account?.account.currency)
      return setError(
        "Internal transfers require matching account currencies.",
      );
    if (amount <= 0 || amount > (account?.account.availableBalance || 0))
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
        ...form,
        recipientName: recipient?.name,
        beneficiaryReference: form.reference,
        type: "internal",
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "The transfer could not be completed.");
      setStep("review");
      return;
    }
    setResult(data);
    setStep("verification");
  }

  if (step === "processing")
    return (
      <Status
        icon={<LoaderCircle className="animate-spin" />}
        title="Completing transfer"
        text="Validating the recipient, PIN, and available balance."
      />
    );
  if (step === "verification" && result)
    return <TransferVerification reference={result.reference} />;
  if (step === "success" && result)
    return (
      <div className="mx-auto max-w-2xl">
        <Status
          icon={<CheckCircle2 />}
          title="Transfer completed"
          text="Funds are now available in the recipient's SecurePath Shield account."
        />
        <div className="card mt-5 rounded-2xl p-6">
          <Rows
            rows={[
              ["Reference", result.reference],
              ["Recipient", recipient?.name || ""],
              ["Account", mask(form.recipientAccount)],
              ["Amount", money(amount, result.currency)],
              ["Status", result.status],
            ]}
          />
          <button
            className="btn mt-6 w-full"
            onClick={() => {
              setForm(empty);
              setRecipient(null);
              setResult(null);
              setStep("form");
            }}
          >
            Make another transfer
          </button>
        </div>
      </div>
    );
  if (step === "review")
    return (
      <div className="mx-auto max-w-2xl">
        <button
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-bank-700"
          onClick={() => {
            set("pin", "");
            setError("");
            setStep("form");
          }}
        >
          <ArrowLeft size={16} />
          Edit details
        </button>
        <div className="card rounded-2xl p-6 sm:p-8">
          <Header
            title="Review internal transfer"
            text="Confirm the recipient and amount before authorizing this immediate transfer."
          />
          <Rows
            rows={[
              [
                "From",
                `${account?.account.name || "SecurePath Shield account"} - ${masked}`,
              ],
              ["Recipient", recipient?.name || ""],
              ["SecurePath Shield account", mask(form.recipientAccount)],
              ["Bank", recipient?.bankName || ""],
              ["Account type", recipient?.accountType || ""],
              ["Currency", recipient?.currency || ""],
              ["Purpose", form.purpose],
              ["Recipient reference", form.reference],
              ["Description", form.description || "-"],
              ["Delivery", "Immediate"],
              ["Fee", money(0, account?.account.currency)],
              ["Total debit", money(amount, account?.account.currency)],
              [
                "Remaining available",
                money(
                  (account?.account.availableBalance || 0) - amount,
                  account?.account.currency,
                ),
              ],
            ]}
          />
          <p className="mt-5 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-900">
            Internal transfers complete immediately and normally cannot be
            cancelled. Check the verified account name carefully.
          </p>
          {pinOpen && <TransferPinModal value={form.pin} onChange={(value) => set("pin", value)} onClose={() => { set("pin", ""); setPinOpen(false); }} onConfirm={submit} />}
          {error && <Error text={error} />}
          <button
            className="btn mt-6 w-full"
            onClick={() => setPinOpen(true)}
          >
            <ShieldCheck size={17} />
            Authorize and send now
          </button>
        </div>
      </div>
    );
  return (
    <div className="mx-auto max-w-3xl">
      <Header
        title="Internal transfer"
        text="Send money instantly to another SecurePath Shield account."
      />
      <div className="mt-6 rounded-2xl bg-bank-900 p-5 text-white">
        <p className="text-[10px] uppercase tracking-widest text-white/50">
          Available balance
        </p>
        <p className="serif mt-2 text-3xl">
          {account?.formattedBalance || "Loading..."}
        </p>
        <p className="mt-2 text-xs text-white/50">{masked}</p>
      </div>
      <form
        onSubmit={review}
        className="card mt-5 space-y-7 rounded-2xl p-5 sm:p-8"
      >
        <section>
          <h2 className="text-xl">Recipient information</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field
              label="SecurePath Shield account number"
              inputMode="numeric"
              pattern="[0-9]{8,20}"
              value={form.recipientAccount}
              onChange={(v) => {
                set("recipientAccount", v.replace(/\D/g, "").slice(0, 20));
                setRecipient(null);
              }}
            />
            <button
              type="button"
              className="btn h-[46px] px-5"
              disabled={checking || form.recipientAccount.length < 8}
              onClick={verify}
            >
              <Search size={16} />
              {checking ? "Checking..." : "Verify account"}
            </button>
          </div>
          {recipient && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Verified SecurePath Shield recipient
              </p>
              <p className="mt-1 font-semibold text-emerald-950">
                {recipient.name}
              </p>
              <p className="text-xs text-emerald-700">
                {recipient.bankName} - {recipient.accountType} -{" "}
                {recipient.currency}
              </p>
            </div>
          )}
        </section>
        <section className="border-t pt-7">
          <h2 className="text-xl">Payment details</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field
              label={`Amount (${account?.account.currency || "USD"})`}
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(v) => set("amount", v)}
            />
            <Field
              label="Payment purpose"
              value={form.purpose}
              onChange={(v) => set("purpose", v)}
            />
            <Field
              label="Recipient reference"
              maxLength={80}
              value={form.reference}
              onChange={(v) => set("reference", v)}
            />
            <Field
              label="Description (optional)"
              required={false}
              maxLength={160}
              value={form.description}
              onChange={(v) => set("description", v)}
            />
          </div>
        </section>
        {error && <Error text={error} />}
        <button className="btn w-full" type="submit">
          Review transfer
        </button>
      </form>
    </div>
  );
}
function Header({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-bank-600">
        Send money
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-neutral-500">{text}</p>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  required = true,
  pattern,
  min,
  step,
  maxLength,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  pattern?: string;
  min?: string;
  step?: string;
  maxLength?: number;
  inputMode?: "numeric";
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        className="field"
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        pattern={pattern}
        min={min}
        step={step}
        maxLength={maxLength}
        inputMode={inputMode}
      />
    </label>
  );
}
function Rows({ rows }: { rows: string[][] }) {
  return (
    <dl className="divide-y">
      {rows.map(([key, value]) => (
        <div key={key} className="flex justify-between gap-5 py-3 text-sm">
          <dt className="text-neutral-500">{key}</dt>
          <dd className="break-all text-right font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
function Status({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border bg-white p-10 text-center shadow-sm">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-bank-50 text-bank-700">
        {icon}
      </span>
      <h1 className="mt-5 text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-neutral-500">{text}</p>
    </div>
  );
}
function Error({ text }: { text: string }) {
  return (
    <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
      {text}
    </p>
  );
}
function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    value,
  );
}
function mask(value: string) {
  return value.length > 4
    ? `${"*".repeat(Math.min(6, value.length - 4))}${value.slice(-4)}`
    : value;
}
