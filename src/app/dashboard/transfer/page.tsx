"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { countries as countryOptions, countryName } from "../../../lib/countries";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  LoaderCircle,
  Send,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { TransferPinModal } from "../../../components/transfer-pin-modal";
import { TransferVerification } from "../../../components/transfer-verification";

type FormState = {
  amount: string;
  bankCountry: string;
  recipientType: string;
  recipientName: string;
  bankName: string;
  recipientAccount: string;
  accountType: string;
  routingCode: string;
  purpose: string;
  customPurpose: string;
  beneficiaryReference: string;
  description: string;
  speed: string;
  scheduledDate: string;
  saveBeneficiary: boolean;
  pin: string;
};
type AccountState = {
  formattedBalance: string;
  account: {
    availableBalance: number;
    currency: string;
    accountNumber: string;
    name: string;
  };
};
const routingRules = {
  US: {
    name: "United States",
    routing: "9-digit ABA routing number",
    account: "Account number",
    pattern: "[0-9]{9}",
    hint: "ACH / domestic wire",
  },
  GB: {
    name: "United Kingdom",
    routing: "6-digit sort code",
    account: "8-digit account number",
    pattern: "[0-9]{6}",
    hint: "Faster Payments",
  },
  DE: {
    name: "Germany / SEPA",
    routing: "BIC (optional)",
    account: "IBAN",
    pattern: "[A-Za-z0-9]{8,11}",
    hint: "SEPA credit transfer",
  },
  CA: {
    name: "Canada",
    routing: "Institution + transit number",
    account: "Account number",
    pattern: "[0-9]{8}",
    hint: "3-digit institution + 5-digit transit",
  },
  SG: {
    routing: "Bank / branch code",
    account: "Account number",
    pattern: "[A-Za-z0-9]{3,12}",
    hint: "Singapore FAST / GIRO",
  },
  AU: {
    name: "Australia",
    routing: "6-digit BSB",
    account: "Account number",
    pattern: "[0-9]{6}",
    hint: "BECS / NPP",
  },
  IN: {
    name: "India",
    routing: "IFSC",
    account: "Account number",
    pattern: "[A-Za-z]{4}0[A-Za-z0-9]{6}",
    hint: "NEFT / IMPS",
  },
  ES: {
    routing: "BIC (optional)",
    account: "Spanish IBAN",
    pattern: "[A-Za-z0-9]{8,11}",
    hint: "SEPA credit transfer",
  },
} as const;
const initial: FormState = {
  amount: "",
  bankCountry: "",
  recipientType: "individual",
  recipientName: "",
  bankName: "",
  recipientAccount: "",
  accountType: "Checking Account",
  routingCode: "",
  purpose: "",
  customPurpose: "",
  beneficiaryReference: "",
  description: "",
  speed: "standard",
  scheduledDate: "",
  saveBeneficiary: false,
  pin: "",
};
export default function Page() {
  const [pinOpen, setPinOpen] = useState(false);
  const [form, setForm] = useState(initial),
    [step, setStep] = useState<"form" | "review" | "processing" | "verification" | "success">(
      "form",
    ),
    [account, setAccount] = useState<AccountState | null>(null),
    [error, setError] = useState(""),
    [result, setResult] = useState<{
      reference: string;
      status: string;
      currency: string;
      fee: number;
    } | null>(null);
  useEffect(() => {
    fetch("/api/banking/account")
      .then((r) => r.json())
      .then(setAccount)
      .catch(() => setError("Unable to load your account."));
  }, []);
  const country = form.bankCountry
    ? routingRules[form.bankCountry as keyof typeof routingRules] || {
        routing: "Domestic bank / routing code",
        account: "Account number or IBAN",
        pattern: "[A-Za-z0-9]{2,34}",
        hint: "Use the domestic code supplied by the recipient bank",
      }
    : null;
  const total = Number(form.amount || 0);
  const transferPurpose =
    form.purpose === "other" ? form.customPurpose.trim() : form.purpose;
  const masked = account?.account.accountNumber
    ? `******${account.account.accountNumber.slice(6)}`
    : "******";
  const update = (key: keyof FormState, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  const delivery = useMemo(
    () =>
      form.speed === "instant"
        ? "Usually within minutes"
        : form.scheduledDate
          ? `Scheduled for ${form.scheduledDate}`
          : "Usually same day or next business day",
    [form.speed, form.scheduledDate],
  );
  function review(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (total <= 0 || total > (account?.account.availableBalance || 0))
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
          purpose: transferPurpose,
          type: "local",
        }),
      }),
      data = await response.json();
    if (!response.ok) {
      setError(data.error || "The transfer could not be submitted.");
      setStep("review");
      return;
    }
    setResult(data);
    setStep("verification");
  }
  if (step === "processing")
    return (
      <State
        icon={<LoaderCircle className="animate-spin" />}
        title="Submitting transfer"
        copy="We’re validating your PIN, routing details, and available balance."
      />
    );
  if (step === "verification" && result)
    return <TransferVerification reference={result.reference} />;
  if (step === "success" && result)
    return (
      <div className="mx-auto max-w-2xl">
        <State
          icon={<CheckCircle2 />}
          title="Transfer submitted"
          copy="Your local transfer is pending secure processing."
        />
        <div className="card mt-5 rounded-2xl p-6">
          <Review
            rows={[
              ["Reference", result.reference],
              ["Recipient", form.recipientName],
              ["Bank", form.bankName],
              ["Amount", money(Number(form.amount), result.currency)],
              ["Delivery", delivery],
              ["Status", result.status],
            ]}
          />
          <button
            onClick={() => {
              setForm(initial);
              setResult(null);
              setStep("form");
            }}
            className="btn mt-6 w-full"
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
          onClick={() => {
            update("pin", "");
            setError("");
            setStep("form");
          }}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-bank-700"
        >
          <ArrowLeft size={16} />
          Edit details
        </button>
        <div className="card rounded-2xl p-6 sm:p-8">
          <Eyebrow
            title="Review your local transfer"
            copy="Confirm the recipient and payment information before authorizing."
          />
          <Review
            rows={[
              [
                "From",
                `${account?.account.name || "SecurePath Bank account"} · ${masked}`,
              ],
              ["Country", countryName(form.bankCountry)],
              ["Recipient", form.recipientName],
              ["Recipient type", form.recipientType],
              ["Account", maskRecipient(form.recipientAccount)],
              ["Bank", form.bankName],
              [
                country?.routing || "Routing code",
                form.routingCode || "Not required",
              ],
              ["Account type", form.accountType],
              ["Purpose", transferPurpose],
              ["Reference", form.beneficiaryReference],
              ["Transfer speed", form.speed],
              ["Estimated delivery", delivery],
              ["Amount", money(total, account?.account.currency)],
              ["Fee", money(0, account?.account.currency)],
              ["Total debit", money(total, account?.account.currency)],
              [
                "Remaining available",
                money(
                  (account?.account.availableBalance || 0) - total,
                  account?.account.currency,
                ),
              ],
            ]}
          />
          <div className="mt-5 flex gap-3 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-900">
            <UserCheck className="shrink-0" size={18} />
            <span>
              Recipient-name matching will be performed by the destination
              payment network when supported. Review any mismatch warning before
              funds are released.
            </span>
          </div>
          {pinOpen && <TransferPinModal value={form.pin} onChange={(value) => update("pin", value)} onClose={() => { update("pin", ""); setPinOpen(false); }} onConfirm={submit} />}
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <button
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
    <div className="mx-auto max-w-3xl">
      <Eyebrow
        title="Local bank transfer"
        copy="Send through the recipient country’s domestic banking network."
      />
      <div className="mt-6 rounded-2xl bg-bank-900 p-5 text-white">
        <p className="text-[10px] uppercase tracking-widest text-white/50">
          Available balance
        </p>
        <p className="serif mt-2 text-3xl">
          {account?.formattedBalance || "Loading…"}
        </p>
        <p className="mt-2 text-xs text-white/50">{masked}</p>
      </div>
      <form
        onSubmit={review}
        className="card mt-5 space-y-7 rounded-2xl p-5 sm:p-8"
      >
        <Section title="Destination and recipient">
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="Destination country"
              value={form.bankCountry}
              onChange={(v) => {
                update("bankCountry", v);
                update("routingCode", "");
                update("recipientAccount", "");
              }}
              options={[
                ["", "Select country"],
                ...countryOptions.map(([code, name]) => [code, name]),
              ]}
            />
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
            <Field
              label="Recipient bank"
              value={form.bankName}
              onChange={(v) => update("bankName", v)}
            />
            {country && (
              <>
                <Field
                  label={country.account}
                  value={form.recipientAccount}
                  onChange={(v) => update("recipientAccount", normalize(v))}
                />
                <Field
                  label={country.routing}
                  value={form.routingCode}
                  required={!country.routing.includes("optional")}
                  pattern={country.pattern}
                  hint={country.hint}
                  onChange={(v) => update("routingCode", normalize(v))}
                />
              </>
            )}
            <Select
              label="Recipient account type"
              value={form.accountType}
              onChange={(v) => update("accountType", v)}
              options={[
                ["Checking Account", "Checking account"],
                ["Savings Account", "Savings account"],
                ["Current Account", "Current account"],
                ["Business Account", "Business account"],
              ]}
            />
          </div>
        </Section>
        <Section title="Payment details">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Amount"
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(v) => update("amount", v)}
            />
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
                ["rent_utilities", "Rent or utilities"],
                ["salary", "Salary or payroll"],
                ["education", "Education"],
                ["medical", "Medical"],
                ["investment", "Investment"],
                ["other", "Other"],
              ]}
            />
            {form.purpose === "other" && (
              <Field
                label="Specify transfer purpose"
                value={form.customPurpose}
                maxLength={80}
                onChange={(value) => update("customPurpose", value)}
              />
            )}
            <Field
              label="Recipient reference"
              value={form.beneficiaryReference}
              maxLength={80}
              onChange={(v) => update("beneficiaryReference", v)}
            />
            <Select
              label="Transfer speed"
              value={form.speed}
              onChange={(v) => update("speed", v)}
              options={[
                ["standard", "Standard"],
                ["instant", "Instant (when available)"],
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
            <Field
              label="Description (optional)"
              required={false}
              value={form.description}
              onChange={(v) => update("description", v)}
            />
          </div>
        </Section>
        <Section title="Recipient preferences">
          <label className="flex items-center gap-3 rounded-xl border p-4 text-sm">
            <input
              type="checkbox"
              checked={form.saveBeneficiary}
              onChange={(e) => update("saveBeneficiary", e.target.checked)}
              className="accent-bank-600"
            />
            Save this recipient for future transfers
          </label>
        </Section>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <button className="btn w-full">
          Review transfer <Send size={16} />
        </button>
      </form>
    </div>
  );
}
function Eyebrow({ title, copy }: { title: string; copy: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-bank-600">
        Domestic payments
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-500">{copy}</p>
    </div>
  );
}
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-5 flex items-center gap-2 border-b pb-3 text-xl">
        <Building2 size={19} className="text-bank-600" />
        {title}
      </h2>
      {children}
    </section>
  );
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  required = true,
  pattern,
  hint,
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
  hint?: string;
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
      {hint && (
        <span className="mt-1 block text-[11px] text-neutral-400">{hint}</span>
      )}
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
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
function Review({ rows }: { rows: string[][] }) {
  return (
    <dl className="divide-y">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-5 py-3 text-sm">
          <dt className="text-neutral-500">{label}</dt>
          <dd className="break-all text-right font-semibold capitalize">
            {value}
          </dd>
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
function money(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount,
  );
}
function normalize(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}
function maskRecipient(value: string) {
  return value.length > 4
    ? `${"*".repeat(Math.min(6, value.length - 4))}${value.slice(-4)}`
    : value;
}
