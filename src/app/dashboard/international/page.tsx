"use client";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Landmark,
  LoaderCircle,
  Send,
  ShieldCheck,
} from "lucide-react";
import { countries, countryName } from "../../../lib/countries";
import { TransferPinModal } from "../../../components/transfer-pin-modal";
import { TransferVerification } from "../../../components/transfer-verification";

type Form = {
  amount: string;
  destinationCurrency: string;
  recipientType: string;
  recipientName: string;
  recipientCountry: string;
  recipientAddress: string;
  recipientCity: string;
  recipientState: string;
  recipientPostalCode: string;
  recipientAccount: string;
  bankName: string;
  bankCountry: string;
  swiftCode: string;
  routingCode: string;
  purpose: string;
  customPurpose: string;
  speed: string;
  scheduledDate: string;
  useIntermediary: boolean;
  intermediaryBankName: string;
  intermediarySwift: string;
  intermediaryAccount: string;
  intermediaryRouting: string;
  pin: string;
};
type Quote = {
  id: string;
  sourceCurrency: string;
  destinationCurrency: string;
  sourceAmount: number;
  exchangeRate: number;
  recipientAmount: number;
  fee: number;
  totalDebit: number;
  expiresAt: string;
};
type Account = {
  formattedBalance: string;
  account: {
    availableBalance: number;
    currency: string;
    accountNumber: string;
    name: string;
  };
};
const initial: Form = {
  amount: "",
  destinationCurrency: "EUR",
  recipientType: "individual",
  recipientName: "",
  recipientCountry: "",
  recipientAddress: "",
  recipientCity: "",
  recipientState: "",
  recipientPostalCode: "",
  recipientAccount: "",
  bankName: "",
  bankCountry: "",
  swiftCode: "",
  routingCode: "",
  purpose: "",
  customPurpose: "",
  speed: "standard",
  scheduledDate: "",
  useIntermediary: false,
  intermediaryBankName: "",
  intermediarySwift: "",
  intermediaryAccount: "",
  intermediaryRouting: "",
  pin: "",
};
const currencies = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "SGD",
  "JPY",
  "CHF",
  "NZD",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
  "CZK",
  "HUF",
  "RON",
  "BGN",
  "TRY",
  "BRL",
  "MXN",
  "INR",
  "ZAR",
];
export default function Page() {
  const [pinOpen, setPinOpen] = useState(false);
  const [form, setForm] = useState(initial),
    [account, setAccount] = useState<Account | null>(null),
    [quote, setQuote] = useState<Quote | null>(null),
    [step, setStep] = useState<
      "form" | "quoting" | "review" | "processing" | "verification" | "success"
    >("form"),
    [error, setError] = useState(""),
    [result, setResult] = useState<{
      reference: string;
      status: string;
    } | null>(null);
  useEffect(() => {
    fetch("/api/banking/account")
      .then((r) => r.json())
      .then(setAccount)
      .catch(() => setError("Unable to load your account."));
  }, []);
  const update = (key: keyof Form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  const purpose =
    form.purpose === "other" ? form.customPurpose.trim() : form.purpose;
  async function prepare(e: FormEvent) {
    e.preventDefault();
    setError("");
    setStep("quoting");
    const r = await fetch("/api/banking/fx-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: form.amount,
          destinationCurrency: form.destinationCurrency,
        }),
      }),
      d = await r.json();
    if (!r.ok) {
      setError(d.error);
      setStep("form");
      return;
    }
    setQuote(d.quote);
    setStep("review");
  }
  async function submit() {
    if (!quote) return;
    setStep("processing");
    setError("");
    const r = await fetch("/api/banking/international-transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          purpose,
          quoteId: quote.id,
          type: "international",
        }),
      }),
      d = await r.json();
    if (!r.ok) {
      setError(d.error);
      setStep("review");
      return;
    }
    setResult(d);
    setStep("verification");
  }
  if (step === "quoting")
    return (
      <State
        icon={<LoaderCircle className="animate-spin" />}
        title="Preparing live quote"
        copy="We’re checking the exchange rate, fee, and expected recipient amount."
      />
    );
  if (step === "processing")
    return (
      <State
        icon={<LoaderCircle className="animate-spin" />}
        title="Submitting securely"
        copy="We’re validating the quote, payment instructions, PIN, and available balance."
      />
    );
  if (step === "verification" && result)
    return <TransferVerification reference={result.reference} />;
  if (step === "success" && result)
    return (
      <div className="mx-auto max-w-2xl">
        <State
          icon={<CheckCircle2 />}
          title="International transfer submitted"
          copy="Your payment is pending compliance and correspondent-bank processing."
        />
        <div className="card mt-5 rounded-2xl p-6">
          <Review
            rows={[
              ["Reference", result.reference],
              ["Recipient", form.recipientName],
              [
                "Send amount",
                money(quote?.sourceAmount || 0, quote?.sourceCurrency),
              ],
              [
                "Expected recipient amount",
                money(quote?.recipientAmount || 0, quote?.destinationCurrency),
              ],
              ["Status", result.status],
            ]}
          />
          <button
            className="btn mt-6 w-full"
            onClick={() => {
              setForm(initial);
              setQuote(null);
              setResult(null);
              setStep("form");
            }}
          >
            Make another transfer
          </button>
        </div>
      </div>
    );
  if (step === "review" && quote)
    return (
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => {
            update("pin", "");
            setQuote(null);
            setError("");
            setStep("form");
          }}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-bank-700"
        >
          <ArrowLeft size={16} />
          Edit details
        </button>
        <div className="card rounded-2xl p-6 sm:p-8">
          <Header
            title="Review international transfer"
            copy="Confirm the beneficiary, banking, exchange, and compliance information."
          />
          <Review
            rows={[
              [
                "From",
                `${account?.account.name || "SecurePath Bank account"} · ******${account?.account.accountNumber.slice(6) || ""}`,
              ],
              ["Recipient", form.recipientName],
              [
                "Recipient address",
                `${form.recipientAddress}, ${form.recipientCity}, ${countryName(form.recipientCountry)}`,
              ],
              ["Recipient account / IBAN", mask(form.recipientAccount)],
              ["Recipient bank", form.bankName],
              ["SWIFT / BIC", form.swiftCode],
              ["Domestic routing", form.routingCode || "Not provided"],
              [
                "Intermediary bank",
                form.useIntermediary
                  ? `${form.intermediaryBankName} · ${form.intermediarySwift}`
                  : "Not used",
              ],
              ["Purpose", purpose],
              ["Transfer speed", form.speed],
              ["Send amount", money(quote.sourceAmount, quote.sourceCurrency)],
              [
                "Exchange rate",
                `1 ${quote.sourceCurrency} = ${quote.exchangeRate.toFixed(6)} ${quote.destinationCurrency}`,
              ],
              [
                "Expected recipient amount",
                money(quote.recipientAmount, quote.destinationCurrency),
              ],
              ["Total debit", money(quote.totalDebit, quote.sourceCurrency)],
              ["Quote expires", new Date(quote.expiresAt).toLocaleTimeString()],
            ]}
          />
          <p className="mt-5 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-900">
            Correspondent or receiving banks may deduct additional charges
            during processing. The final credit can also be affected by
            downstream processing rules.
          </p>
          {pinOpen && <TransferPinModal value={form.pin} onChange={(value) => update("pin", value)} onClose={() => { update("pin", ""); setPinOpen(false); }} onConfirm={submit} />}
          {error && <Error text={error} />}
          <button
            disabled={new Date(quote.expiresAt) <= new Date()}
            onClick={() => setPinOpen(true)}
            className="btn mt-6 w-full"
          >
            <ShieldCheck size={17} />
            Authorize and submit transfer
          </button>
        </div>
      </div>
    );
  return (
    <div className="mx-auto max-w-4xl">
      <Header
        title="International transfer"
        copy="Send funds across borders with structured beneficiary, SWIFT, FX, and compliance details."
      />
      <div className="mt-6 rounded-2xl bg-bank-900 p-5 text-white">
        <p className="text-[10px] uppercase tracking-widest text-white/50">
          Available balance
        </p>
        <p className="serif mt-2 text-3xl">
          {account?.formattedBalance || "Loading…"}
        </p>
        <p className="mt-2 text-xs text-white/50">
          ******{account?.account.accountNumber.slice(6) || ""}
        </p>
      </div>
      <form
        onSubmit={prepare}
        className="card mt-5 space-y-8 rounded-2xl p-5 sm:p-8"
      >
        <Section icon={<Building2 />} title="Recipient">
          <Grid>
            <Select
              label="Recipient type"
              value={form.recipientType}
              onChange={(v) => update("recipientType", v)}
              options={[
                ["individual", "Individual"],
                ["business", "Business"],
              ]}
            />
            <Field
              label="Recipient’s exact account name"
              value={form.recipientName}
              onChange={(v) => update("recipientName", v)}
            />
            <Country
              label="Recipient country"
              value={form.recipientCountry}
              onChange={(v) => {
                update("recipientCountry", v);
                update("bankCountry", v);
              }}
            />
            <Field
              label="Address line"
              value={form.recipientAddress}
              onChange={(v) => update("recipientAddress", v)}
            />
            <Field
              label="City / town"
              value={form.recipientCity}
              onChange={(v) => update("recipientCity", v)}
            />
            <Field
              label="State / province (optional)"
              required={false}
              value={form.recipientState}
              onChange={(v) => update("recipientState", v)}
            />
            <Field
              label="Postal code"
              value={form.recipientPostalCode}
              onChange={(v) => update("recipientPostalCode", v)}
            />
            <Field
              label="Account number / IBAN"
              value={form.recipientAccount}
              onChange={(v) => update("recipientAccount", normalize(v))}
            />
          </Grid>
        </Section>
        <Section icon={<Landmark />} title="Recipient bank">
          <Grid>
            <Field
              label="Bank name"
              value={form.bankName}
              onChange={(v) => update("bankName", v)}
            />
            <Country
              label="Bank country"
              value={form.bankCountry}
              onChange={(v) => update("bankCountry", v)}
            />
            <Field
              label="SWIFT / BIC"
              pattern="[A-Za-z0-9]{8}([A-Za-z0-9]{3})?"
              maxLength={11}
              value={form.swiftCode}
              onChange={(v) => update("swiftCode", normalize(v))}
            />
            <Field
              label="Domestic clearing / routing code (optional)"
              required={false}
              value={form.routingCode}
              onChange={(v) => update("routingCode", normalize(v))}
            />
          </Grid>
          <label className="mt-5 flex items-center gap-3 rounded-xl border p-4 text-sm">
            <input
              type="checkbox"
              checked={form.useIntermediary}
              onChange={(e) => update("useIntermediary", e.target.checked)}
              className="accent-bank-600"
            />
            Use an intermediary or correspondent bank
          </label>
          {form.useIntermediary && (
            <Grid extra="mt-5">
              <Field
                label="Intermediary bank name"
                value={form.intermediaryBankName}
                onChange={(v) => update("intermediaryBankName", v)}
              />
              <Field
                label="Intermediary SWIFT / BIC"
                pattern="[A-Za-z0-9]{8}([A-Za-z0-9]{3})?"
                maxLength={11}
                value={form.intermediarySwift}
                onChange={(v) => update("intermediarySwift", normalize(v))}
              />
              <Field
                label="Intermediary account (optional)"
                required={false}
                value={form.intermediaryAccount}
                onChange={(v) => update("intermediaryAccount", v)}
              />
              <Field
                label="Intermediary routing code (optional)"
                required={false}
                value={form.intermediaryRouting}
                onChange={(v) => update("intermediaryRouting", normalize(v))}
              />
            </Grid>
          )}
        </Section>
        <Section icon={<Send />} title="Amount and delivery">
          <Grid>
            <Field
              label={`Send amount (${account?.account.currency || "USD"})`}
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(v) => update("amount", v)}
            />
            <Select
              label="Recipient currency"
              value={form.destinationCurrency}
              onChange={(v) => update("destinationCurrency", v)}
              options={currencies.map((c) => [c, c])}
            />
            <Select
              label="Transfer speed"
              value={form.speed}
              onChange={(v) => update("speed", v)}
              options={[
                ["standard", "Standard"],
                ["urgent", "Urgent"],
              ]}
            />
            {form.speed === "standard" && (
              <Field
                label="Schedule date (optional)"
                type="date"
                required={false}
                min={new Date().toISOString().slice(0, 10)}
                value={form.scheduledDate}
                onChange={(v) => update("scheduledDate", v)}
              />
            )}
          </Grid>
        </Section>
        <Section icon={<ShieldCheck />} title="Purpose and compliance">
          <Grid>
            <Select
              label="Payment purpose"
              value={form.purpose}
              onChange={(v) => {
                update("purpose", v);
                if (v !== "other") update("customPurpose", "");
              }}
              options={[
                ["", "Select purpose"],
                ["family_support", "Family support"],
                ["goods_services", "Goods or services"],
                ["education", "Education"],
                ["medical", "Medical"],
                ["investment", "Investment"],
                ["property", "Property"],
                ["travel", "Travel"],
                ["other", "Other"],
              ]}
            />
            {form.purpose === "other" && (
              <Field
                label="Specify transfer purpose"
                maxLength={80}
                value={form.customPurpose}
                onChange={(v) => update("customPurpose", v)}
              />
            )}
          </Grid>
        </Section>
        {error && <Error text={error} />}
        <button className="btn w-full">
          Get live quote and review <Send size={16} />
        </button>
      </form>
    </div>
  );
}
function Header({ title, copy }: { title: string; copy: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-bank-600">
        Cross-border payments
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
        {copy}
      </p>
    </div>
  );
}
function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-5 flex items-center gap-2 border-b pb-3 text-xl">
        <span className="text-bank-600">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
function Grid({
  children,
  extra = "",
}: {
  children: React.ReactNode;
  extra?: string;
}) {
  return <div className={`grid gap-5 sm:grid-cols-2 ${extra}`}>{children}</div>;
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
    <label>
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
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[][];
}) {
  return (
    <label>
      <span className="label">{label}</span>
      <select
        required
        className="field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
function Country({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select
      label={label}
      value={value}
      onChange={onChange}
      options={[["", "Select country"], ...countries.map(([c, n]) => [c, n])]}
    />
  );
}
function Review({ rows }: { rows: string[][] }) {
  return (
    <dl className="divide-y">
      {rows.map(([l, v]) => (
        <div className="flex justify-between gap-5 py-3 text-sm" key={l}>
          <dt className="text-neutral-500">{l}</dt>
          <dd className="break-all text-right font-semibold">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
function State({
  icon,
  title,
  copy,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border bg-white p-10 text-center shadow-sm">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-bank-50 text-bank-700">
        {icon}
      </span>
      <h1 className="mt-5 text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-neutral-500">{copy}</p>
    </div>
  );
}
function Error({ text }: { text: string }) {
  return (
    <p
      role="alert"
      className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
    >
      {text}
    </p>
  );
}
function normalize(v: string) {
  return v.replace(/[\s-]/g, "").toUpperCase();
}
function mask(v: string) {
  return v.length > 4
    ? `${"*".repeat(Math.min(8, v.length - 4))}${v.slice(-4)}`
    : v;
}
function money(v: number, c = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: c,
  }).format(v);
}
