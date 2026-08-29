"use client";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowLeftRight,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  FileText,
  Landmark,
  LoaderCircle,
  QrCode,
  Send,
  ShieldCheck,
  TrendingUp,
  Users,
  Trash2,
  Upload,
} from "lucide-react";
import {
  SiBitcoin,
  SiEthereum,
  SiTether,
} from "react-icons/si";
import { QRCodeSVG } from "qrcode.react";
import { TransactionCard } from "./transaction-card";
import type { TransactionSummary } from "../lib/banking";
import { countries } from "../lib/countries";
import { VirtualCardArt, VirtualCardBack } from "./virtual-card-art";
import { BrandMark } from "./logo";
import { SupportLiveChat } from "./support-live-chat";

const accountTypes = [
  "Checking Account",
  "Savings Account",
  "Current Account",
  "Joint Account",
  "Business Account",
  "Corporate Account",
  "Money Market Account",
  "Investment Account",
];
function Field({
  label,
  type = "text",
  placeholder,
  required = true,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="field"
        placeholder={placeholder || label}
      />
    </label>
  );
}
function Header({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-bank-600">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
        {copy}
      </p>
    </div>
  );
}

export function FeaturePage({ feature }: { feature: string }) {
  if (["transfer", "international", "internal"].includes(feature))
    return (
      <TransferFlow
        type={
          feature === "transfer"
            ? "local"
            : (feature as "internal" | "international")
        }
      />
    );
  if (feature === "activity") return <Activity />;
  if (feature === "receipt") return <Receipt />;
  if (feature === "deposit") return <Deposit />;
  if (feature === "cards") return <PremiumCards />;
  if (feature === "investments") return <Investments />;
  if (feature === "crypto") return <CryptoSwap />;
  if (feature === "statement") return <Statement />;
  if (feature === "support") return <CustomerSupport />;
  if (feature === "grants") return <GrantApplications />;
  if (feature === "profile") return <ProfileSettings />;
  return (
    <Generic
      title={feature[0].toUpperCase() + feature.slice(1)}
      copy="Manage this service securely from your SecurePath Bank account."
      fields={["Amount", "Description"]}
    />
  );
}

type TransferForm = {
  amount: string;
  recipientName: string;
  recipientAccount: string;
  bankName: string;
  accountType: string;
  routingCode: string;
  description: string;
  pin: string;
};
const initialTransfer: TransferForm = {
  amount: "",
  recipientName: "",
  recipientAccount: "",
  bankName: "",
  accountType: "Checking Account",
  routingCode: "",
  description: "",
  pin: "",
};
function TransferFlow({
  type,
}: {
  type: "local" | "internal" | "international";
}) {
  const [step, setStep] = useState<
      "form" | "review" | "processing" | "success"
    >("form"),
    [form, setForm] = useState(initialTransfer),
    [error, setError] = useState(""),
    [result, setResult] = useState<{
      reference: string;
      status: string;
      currency: string;
      fee: number;
    } | null>(null),
    [account, setAccount] = useState<{
      formattedBalance: string;
      account: { availableBalance: number; currency: string };
    } | null>(null);
  useEffect(() => {
    fetch("/api/banking/account")
      .then((r) => r.json())
      .then(setAccount)
      .catch(() => setError("Unable to load your account balance."));
  }, []);
  const update = (key: keyof TransferForm) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const total = Number(form.amount || 0) + (type === "international" ? 15 : 0);
  async function submit() {
    setStep("processing");
    setError("");
    const response = await fetch("/api/banking/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type }),
      }),
      data = await response.json();
    if (!response.ok) {
      setError(data.error || "The transfer could not be submitted.");
      setStep("review");
      return;
    }
    setResult(data);
    setTimeout(() => setStep("success"), 650);
  }
  const title =
    type === "international"
      ? "International Transfer"
      : type === "internal"
        ? "Internal SecurePath Bank Transfer"
        : "Local Bank Transfer";
  if (step === "processing")
    return (
      <StateCard
        icon={<LoaderCircle className="animate-spin" />}
        title="Processing securely"
        copy="Weâ€™re validating the account, PIN, and available balance. Please do not close this page."
      />
    );
  if (step === "success" && result)
    return (
      <div className="mx-auto max-w-xl">
        <StateCard
          icon={<CheckCircle2 />}
          title={
            result.status === "completed"
              ? "Transfer completed"
              : "Transfer submitted"
          }
          copy={
            result.status === "completed"
              ? "The recipient account has been credited."
              : "Your transfer is pending secure review."
          }
        />
        <div className="mt-4 rounded-xl border bg-white p-6">
          <Review
            rows={[
              ["Reference", result.reference],
              ["Amount", formatMoney(Number(form.amount), result.currency)],
              ["Fee", formatMoney(result.fee, result.currency)],
              ["Recipient", form.recipientName],
              ["Status", result.status],
            ]}
          />
          <button
            onClick={() => {
              setForm(initialTransfer);
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
          onClick={() => setStep("form")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-bank-700"
        >
          <ArrowLeft size={16} />
          Edit details
        </button>
        <div className="rounded-xl border bg-white p-6 shadow-sm sm:p-8">
          <Header
            eyebrow="Confirmation required"
            title="Review your transfer"
            copy="Confirm every detail before authorizing this transaction."
          />
          <Review
            rows={[
              ["Transfer type", title],
              ["Recipient", form.recipientName],
              ["Account", form.recipientAccount],
              ["Bank", type === "internal" ? "SecurePath Bank" : form.bankName],
              [
                "Amount",
                formatMoney(Number(form.amount), account?.account.currency),
              ],
              [
                "Fee",
                formatMoney(
                  type === "international" ? 15 : 0,
                  account?.account.currency,
                ),
              ],
              ["Total debit", formatMoney(total, account?.account.currency)],
              [
                "Remaining available",
                formatMoney(
                  (account?.account.availableBalance || 0) - total,
                  account?.account.currency,
                ),
              ],
            ]}
          />
          {error && <ErrorMessage text={error} />}
          <div className="mt-5 rounded-lg bg-amber-50 p-4 text-xs leading-6 text-amber-800">
            Transfers may be irreversible after processing. Your PIN is verified
            securely and is never stored in readable form.
          </div>
          <button onClick={submit} className="btn mt-6 w-full">
            <ShieldCheck size={17} />
            Confirm with PIN
          </button>
        </div>
      </div>
    );
  return (
    <div className="mx-auto max-w-2xl">
      <Header
        eyebrow="Move money"
        title={title}
        copy={
          type === "international"
            ? "Send funds internationally with routing or SWIFT details."
            : type === "internal"
              ? "Send instantly to another SecurePath Bank account."
              : "Transfer securely to an account at another bank."
        }
      />
      <div className="mt-6 rounded-xl bg-bank-900 p-5 text-white">
        <p className="text-[10px] uppercase tracking-widest text-white/50">
          Available balance
        </p>
        <p className="serif mt-2 text-3xl">
          {account?.formattedBalance || "Loadingâ€¦"}
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          setStep("review");
        }}
        className="mt-4 space-y-5 rounded-xl border bg-white p-5 shadow-sm sm:p-7"
      >
        <Field
          label="Transfer amount"
          type="number"
          placeholder="0.00"
          value={form.amount}
          onChange={update("amount")}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Beneficiary name"
            value={form.recipientName}
            onChange={update("recipientName")}
          />
          <Field
            label="Account number"
            value={form.recipientAccount}
            onChange={update("recipientAccount")}
          />
        </div>
        {type !== "internal" && (
          <Field
            label="Bank name"
            value={form.bankName}
            onChange={update("bankName")}
          />
        )}
        <label>
          <span className="label">Account type</span>
          <select
            className="field"
            value={form.accountType}
            onChange={(e) => update("accountType")(e.target.value)}
          >
            {accountTypes.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        {type === "international" && (
          <Field
            label="Routing / SWIFT code"
            value={form.routingCode}
            onChange={update("routingCode")}
          />
        )}
        <Field
          label="Description (optional)"
          required={false}
          value={form.description}
          onChange={update("description")}
        />
        <Field
          label="4-digit transaction PIN"
          type="password"
          placeholder="â€¢â€¢â€¢â€¢"
          value={form.pin}
          onChange={(value) =>
            update("pin")(value.replace(/\D/g, "").slice(0, 4))
          }
        />
        <button className="btn w-full">
          Review transfer <Send size={16} />
        </button>
      </form>
    </div>
  );
}

type SwapQuote = {
  from: string;
  to: string;
  amount: number;
  receiveAmount: number;
  rate: number;
  feeAmount: number;
  feeCurrency: string;
  expiresAt: string;
};
type CryptoSwapData = {
  account: { currency: string; availableBalance: number };
  balances: Record<string, number>;
  swaps: Array<{
    reference: string;
    from_asset: string;
    to_asset: string;
    from_amount: number;
    to_amount: number;
    fee_amount: number;
    fee_currency: string;
    status: string;
    created_at: string;
  }>;
  quote: SwapQuote | null;
};

function CryptoSwap() {
  const [data, setData] = useState<CryptoSwapData | null>(null);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/banking/crypto-swap");
    const result = await response.json();
    if (response.ok) {
      setData(result);
      setFrom((current) => current === "USD" ? result.account.currency : current);
    } else setError(result.error);
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    setQuote(null);
    setReviewing(false);
    setError("");
    const numericAmount = Number(amount);
    if (!data || !Number.isFinite(numericAmount) || numericAmount <= 0 || from === to) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const params = new URLSearchParams({ from, to, amount });
        const response = await fetch(`/api/banking/crypto-swap?${params}`, { signal: controller.signal });
        const result = await response.json();
        if (response.ok && result.quote) setQuote(result.quote);
        else if (!controller.signal.aborted) setError(result.error || "A market quote is unavailable.");
      } catch {
        if (!controller.signal.aborted) setError("Unable to retrieve a live market quote.");
      } finally {
        if (!controller.signal.aborted) setQuoteLoading(false);
      }
    }, 450);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [amount, data, from, to]);

  const assets = data ? [data.account.currency, "BTC", "ETH", "USDT"] : ["USD", "BTC", "ETH", "USDT"];
  const sourceBalance = data
    ? from === data.account.currency
      ? data.account.availableBalance
      : data.balances[from] || 0
    : 0;

  function switchAssets() {
    setFrom(to);
    setTo(from);
    setAmount("");
    setQuote(null);
  }
  function useMaximum() {
    setAmount(String(sourceBalance));
  }
  async function completeSwap(event: FormEvent) {
    event.preventDefault();
    if (!quote || !/^\d{4}$/.test(pin)) {
      setError("Enter your 4-digit transaction PIN to confirm the swap.");
      return;
    }
    setSubmitting(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/banking/crypto-swap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, amount: Number(amount), pin }),
    });
    const result = await response.json();
    setSubmitting(false);
    if (!response.ok) {
      setError(result.error);
      return;
    }
    setMessage(`Swap ${result.reference} completed successfully.`);
    setAmount("");
    setPin("");
    setQuote(null);
    setReviewing(false);
    await load();
  }

  return (
    <div>
      <Header eyebrow="Digital assets" title="Crypto Swap" copy="Exchange cash, Bitcoin, Ethereum, and Tether using a live market quote and one clear fee." />
      {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">{message}</p>}

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
        <form onSubmit={completeSwap} className="rounded-3xl border border-[#dfe5ef] bg-white p-5 shadow-sm sm:p-7">
          <div className="rounded-2xl border border-[#e1e7e3] bg-neutral-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">You send</span>
              <button type="button" onClick={useMaximum} className="text-xs font-bold text-bank-700">Balance {formatAsset(sourceBalance, from)}</button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <input aria-label="Swap amount" inputMode="decimal" className="min-w-0 flex-1 bg-transparent text-3xl font-bold outline-none" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} />
              <AssetSelect value={from} assets={assets} onChange={(value) => { setFrom(value); if (value === to) setTo(from); }} />
            </div>
          </div>

          <div className="relative z-10 -my-3 flex justify-center">
            <button type="button" onClick={switchAssets} aria-label="Switch assets" className="grid size-11 place-items-center rounded-full border-4 border-white bg-bank-700 text-white shadow-md transition hover:rotate-180">
              <ArrowLeftRight size={18} />
            </button>
          </div>

          <div className="rounded-2xl border border-[#e1e7e3] bg-neutral-50 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">You receive</span>
            <div className="mt-3 flex items-center gap-3">
              <div className="min-w-0 flex-1 text-3xl font-bold">{quoteLoading ? <LoaderCircle className="animate-spin text-bank-600" /> : quote ? formatAsset(quote.receiveAmount, to, false) : "0.00"}</div>
              <AssetSelect value={to} assets={assets} onChange={(value) => { setTo(value); if (value === from) setFrom(to); }} />
            </div>
          </div>

          {quote && (
            <div className="mt-5 space-y-3 rounded-2xl bg-bank-50 p-4 text-sm">
              <div className="flex justify-between gap-4"><span className="text-neutral-500">Exchange rate</span><b>1 {from} = {formatAsset(quote.rate, to)}</b></div>
              <div className="flex justify-between gap-4"><span className="text-neutral-500">Service fee (1%)</span><b>{formatAsset(quote.feeAmount, quote.feeCurrency)}</b></div>
              <div className="flex justify-between gap-4"><span className="text-neutral-500">You receive</span><b>{formatAsset(quote.receiveAmount, to)}</b></div>
            </div>
          )}

          {!reviewing ? (
            <button type="button" disabled={!quote || Number(amount) > sourceBalance} onClick={() => setReviewing(true)} className="btn mt-6 w-full disabled:cursor-not-allowed disabled:opacity-40">
              {Number(amount) > sourceBalance ? "Insufficient balance" : quoteLoading ? "Getting live quoteâ€¦" : "Review swap"}
            </button>
          ) : (
            <div className="mt-6 rounded-2xl border border-bank-200 p-5">
              <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 text-bank-700" /><div><b>Confirm this exchange</b><p className="mt-1 text-xs leading-5 text-neutral-500">Rates move quickly. The final amount is recalculated securely when you confirm.</p></div></div>
              <Field label="4-digit transaction PIN" type="password" value={pin} onChange={(value) => setPin(value.replace(/\D/g, "").slice(0, 4))} />
              <div className="mt-4 grid grid-cols-2 gap-3"><button type="button" onClick={() => { setReviewing(false); setPin(""); }} className="rounded-xl border px-4 py-3 text-sm font-bold">Back</button><button disabled={submitting} className="btn justify-center">{submitting ? "Swappingâ€¦" : "Confirm swap"}</button></div>
            </div>
          )}
        </form>

        <aside className="space-y-5">
          <div className="rounded-3xl bg-[#0b3b2b] p-6 text-white shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-200">Portfolio balances</p>
            <div className="mt-5 space-y-4">
              {assets.map((asset) => <div key={asset} className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0"><span className="font-bold">{asset}</span><span>{formatAsset(asset === data?.account.currency ? data.account.availableBalance : data?.balances[asset] || 0, asset, false)}</span></div>)}
            </div>
          </div>
          <div className="rounded-2xl border border-[#e1e6ef] bg-white p-5"><div className="flex gap-3"><ShieldCheck className="shrink-0 text-bank-600" /><div><b className="text-sm">Protected exchange</b><p className="mt-1 text-xs leading-5 text-neutral-500">Every swap requires your transaction PIN and is settled atomicallyâ€”both balances update together or neither does.</p></div></div></div>
        </aside>
      </div>

      <section className="mt-9">
        <p className="text-[11px] font-bold uppercase tracking-[.18em] text-neutral-500">Swap history</p>
        <h2 className="mt-2 text-2xl font-bold">Recent exchanges</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[#e1e6ef] bg-white">
          {!data ? <RowsLoading /> : data.swaps.length ? data.swaps.map((swap) => (
            <article key={swap.reference} className="flex flex-col gap-3 border-b p-5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="flex items-center gap-2"><b>{swap.from_asset} â†’ {swap.to_asset}</b><span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold uppercase text-blue-700">{swap.status}</span></div><p className="mt-1 text-xs text-neutral-500">{swap.reference} Â· {new Date(swap.created_at).toLocaleString("en-GB")}</p></div>
              <div className="text-left sm:text-right"><b>{formatAsset(swap.to_amount, swap.to_asset)}</b><p className="mt-1 text-xs text-neutral-500">From {formatAsset(swap.from_amount, swap.from_asset)}</p></div>
            </article>
          )) : <Empty title="No crypto swaps yet" copy="Your completed exchanges will appear here." />}
        </div>
      </section>
    </div>
  );
}

function AssetSelect({ value, assets, onChange }: { value: string; assets: string[]; onChange: (value: string) => void }) {
  return <select aria-label="Asset" className="rounded-xl border bg-white px-3 py-2 font-bold outline-none" value={value} onChange={(event) => onChange(event.target.value)}>{assets.map((asset) => <option key={asset} value={asset}>{asset}</option>)}</select>;
}
function formatAsset(amount: number, asset: string, includeAsset = true) {
  const value = Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: asset === "BTC" || asset === "ETH" ? 0 : 2, maximumFractionDigits: asset === "BTC" || asset === "ETH" ? 8 : 2 });
  return includeAsset ? `${value} ${asset}` : value;
}
function Deposit() {
  const [method, setMethod] = useState<"btc" | "eth" | "usdt">("usdt"),
    [details, setDetails] = useState<{
      address: string;
      network: string;
      reference: string;
      imageUrl: string | null;
    } | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [copied, setCopied] = useState(false);
  async function create(next = method) {
    setMethod(next);
    setLoading(true);
    setDetails(null);
    setCopied(false);
    setError("");
    const response = await fetch("/api/banking/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: next }),
      }),
      data = await response.json();
    response.ok ? setDetails(data) : setError(data.error);
    setLoading(false);
  }
  return (
    <div className="mx-auto max-w-3xl">
      <Header
        eyebrow="Fund your account"
        title="Deposit funds"
        copy="Choose a supported digital asset and send only over the displayed network."
      />
      <div className="mt-7 grid grid-cols-3 gap-3">
        {(["btc", "eth", "usdt"] as const).map((value) => {
          const Icon =
            value === "btc"
              ? SiBitcoin
              : value === "eth"
                ? SiEthereum
                : SiTether;
          const tone =
            value === "btc"
              ? "text-[#f7931a]"
              : value === "eth"
                ? "text-[#627eea]"
                : "text-[#2563eb]";
          return (
            <button
              key={value}
              onClick={() => create(value)}
              className={`rounded-xl border bg-white p-4 text-left ${method === value && details ? "border-bank-600 ring-2 ring-bank-100" : "border-[#e2e7f0]"}`}
            >
              <Icon className={tone} size={22} />
              <b className="mt-3 block uppercase">{value}</b>
              <span className="text-[11px] text-neutral-400">
                {value === "btc"
                  ? "Bitcoin"
                  : value === "eth"
                    ? "Ethereum"
                    : "Tether"}
              </span>
            </button>
          );
        })}
      </div>
      {!details && !loading && (
        <button onClick={() => create()} className="btn mt-5 w-full">
          Generate deposit address
        </button>
      )}
      {loading && (
        <StateCard
          icon={<LoaderCircle className="animate-spin" />}
          title="Generating address"
          copy="Preparing a unique deposit reference for your account."
        />
      )}
      {error && <ErrorMessage text={error} />}{" "}
      {details && (
        <div className="mt-5 rounded-xl border bg-white p-6 text-center shadow-sm sm:p-8">
          <span className="mx-auto inline-flex items-center gap-2 rounded-full bg-bank-50 px-3 py-1 text-xs font-semibold text-bank-700">
            <QrCode size={14} />
            {details.network}
          </span>
          <div className="mx-auto mt-6 w-fit max-w-full overflow-hidden rounded-xl border bg-white p-4">
            {details.imageUrl ? (
              <Image
                src={details.imageUrl}
                alt={`${method.toUpperCase()} deposit address`}
                width={520}
                height={520}
                className="max-h-72 w-auto max-w-full object-contain"
                unoptimized
              />
            ) : (
              <QRCodeSVG value={details.address} size={190} />
            )}
          </div>
          <p className="label mt-6">Deposit address</p>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(details.address);
              setCopied(true);
            }}
            className="flex w-full items-center rounded-lg border bg-neutral-50 p-3 text-left text-xs"
          >
            <span className="min-w-0 flex-1 truncate">{details.address}</span>
            {copied ? (
              <Check className="text-bank-600" size={16} />
            ) : (
              <Copy size={16} />
            )}
          </button>
          <p className="mt-4 text-xs text-neutral-500">
            Reference: <b>{details.reference}</b>
          </p>
          <div className="mt-5 rounded-lg bg-amber-50 p-4 text-left text-xs leading-6 text-amber-800">
            Send only {method.toUpperCase()} using {details.network}. Deposits
            require network confirmation and may remain pending during review.
          </div>
        </div>
      )}
    </div>
  );
}

function Activity() {
  const [items, setItems] = useState<TransactionSummary[] | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/banking/transactions")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setItems(
          d.transactions.map((x: TransactionSummary) => ({
            ...x,
            date: new Intl.DateTimeFormat("en-GB", {
              dateStyle: "medium",
            }).format(new Date(x.date)),
            status: x.status,
          })),
        );
      })
      .catch((e) => setError(e.message));
  }, []);
  return (
    <div>
      <Header
        eyebrow="Account activity"
        title="Transactions"
        copy="Searchable account activity and payment status in one place."
      />
      {error && <ErrorMessage text={error} />}
      <div className="mt-6 overflow-hidden rounded-xl border bg-white">
        {items === null ? (
          <RowsLoading />
        ) : items.length ? (
          items.map((item) => <TransactionCard key={item.id} item={item} />)
        ) : (
          <Empty
            title="No transaction history"
            copy="Your completed and pending activity will appear here."
          />
        )}
      </div>
    </div>
  );
}
function Receipt() {
  const reference = useSearchParams().get("reference"),
    [item, setItem] = useState<Record<string, string | number> | null>(null),
    [receiptError, setReceiptError] = useState("");
  useEffect(() => {
    if (!reference) return;
    fetch(`/api/banking/transactions/${encodeURIComponent(reference)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setItem(data.transaction);
      })
      .catch((e) => setReceiptError(e.message));
  }, [reference]);
  if (receiptError) return <ErrorMessage text={receiptError} />;
  if (!item) return <RowsLoading />;
  return (
    <div className="receipt-page mx-auto max-w-xl">
      <div className="receipt-paper relative overflow-hidden rounded-2xl border bg-white p-7 shadow-sm">
        <div className="receipt-watermark pointer-events-none absolute inset-0 grid place-items-center" aria-hidden><BrandMark className="h-72 w-72 opacity-[.045]" /></div>
        <div className="relative">
          <div className="flex items-center justify-between border-b pb-5"><div className="flex items-center gap-3"><BrandMark className="h-9 w-9" /><div><p className="text-xs font-bold tracking-[.22em] text-bank-700">SECUREPATH BANK</p><p className="mt-1 text-[10px] uppercase tracking-widest text-neutral-400">Transaction receipt</p></div></div><span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${String(item.status).toLowerCase().startsWith("declin")||String(item.status).toLowerCase()==="failed"?"bg-red-50 text-red-700":"bg-blue-50 text-blue-700"}`}>{String(item.status)}</span></div>
          <p className="mt-6 text-center text-3xl font-bold text-bank-800">{formatMoney(Number(item.amount), String(item.currency))}</p>
          <p className="mt-1 text-center text-xs text-neutral-500">{String(item.description)}</p>
        <Review
          rows={[
            ["Reference", String(item.reference)],
            ["Type", String(item.type)],
            ["Sender", String(item.sender_first_name ? `${item.sender_first_name} ${item.sender_last_name}` : item.type === "debit" ? `${item.first_name} ${item.last_name}` : "SecurePath Bank Administration")],
            ["Sender account", String(item.sender_account || (item.type === "debit" ? item.account_number : "SecurePath Bank"))],
            ["Receiver", String(item.recipient_name || (item.type === "credit" ? `${item.first_name} ${item.last_name}` : "Not provided"))],
            ["Receiver account", String(item.recipient_account || (item.type === "credit" ? item.account_number : "Not provided"))],
            ...(item.bank_name ? [["Receiving institution", String(item.bank_name)] as [string, string]] : []),
            ["Date", new Date(String(item.created_at)).toLocaleString("en-GB")],
          ]}
        />
        <button onClick={() => window.print()} className="receipt-print-button btn mt-6 w-full">
          <Download size={16} />
          Print receipt
        </button>
        </div>
      </div>
    </div>
  );
}
function Statement() {
  const today = new Date().toISOString().slice(0, 10),
    month = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    [from, setFrom] = useState(month),
    [to, setTo] = useState(today);
  return (
    <div className="mx-auto max-w-2xl">
      <Header
        eyebrow="Documents"
        title="Account statement"
        copy="Generate a downloadable record of transactions for any date range."
      />
      <div className="mt-6 space-y-5 rounded-xl border bg-white p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="From date"
            type="date"
            value={from}
            onChange={setFrom}
          />
          <Field label="To date" type="date" value={to} onChange={setTo} />
        </div>
        <a
          href={`/api/banking/statements?from=${from}&to=${to}`}
          className="btn w-full"
        >
          <Download size={16} />
          Download statement (PDF)
        </a>
      </div>
    </div>
  );
}
function PremiumCards() {
  type PremiumCard = {
    id: number;
    brand: string;
    card_name: string;
    last_four: string | null;
    currency: string;
    balance: number;
    daily_limit: number;
    status: string;
    expiry_month: number | null;
    expiry_year: number | null;
    holder_name: string;
  };
  const [cards, setCards] = useState<PremiumCard[] | null>(null);
  const [allCards, setAllCards] = useState<PremiumCard[] | null>(null);
  const [error, setError] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [operation, setOperation] = useState<{
    cardId: number;
    action: "fund" | "withdraw";
  } | null>(null);
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [applyingBrand, setApplyingBrand] = useState<"visa" | "mastercard" | "amex" | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<"visa" | "mastercard" | "amex" | null>(null);
  const [accessCard, setAccessCard] = useState<PremiumCard | null>(null);
  const [accessPin, setAccessPin] = useState("");
  const [accessResult, setAccessResult] = useState<{ title: string; message: string } | null>(null);

  async function load() {
    const response = await fetch("/api/banking/cards");
    const data = await response.json();
    if (response.ok) {
      setAccountHolder(data.holderName);
      setAllCards(data.cards);
      setCards(data.cards.filter((card: PremiumCard) => !["pending", "declined", "revoked"].includes(card.status)));
    } else setError(data.error);
  }

  useEffect(() => {
    load();
  }, []);

  async function apply(brand: "visa" | "mastercard" | "amex") {
    setSaving(true);
    setApplyingBrand(brand);
    setError("");
    const response = await fetch("/api/banking/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "apply", brand }),
    });
    const data = await response.json();
    if (response.ok) {
      setSelectedBrand(null);
      await load();
    }
    else setError(data.error);
    setApplyingBrand(null);
    setSaving(false);
  }

  async function changeBalance() {
    if (!operation) return;
    setSaving(true);
    setError("");
    const response = await fetch("/api/banking/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...operation, amount, pin }),
    });
    const data = await response.json();
    if (response.ok) {
      setOperation(null);
      setAmount("");
      setPin("");
      await load();
    } else setError(data.error);
    setSaving(false);
  }

  async function requestCardAccess() {
    if (!accessCard) return;
    setSaving(true);
    setError("");
    const response = await fetch("/api/banking/cards/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: accessCard.id, pin: accessPin }),
    });
    const data = await response.json();
    if (response.ok) setAccessResult({ title: data.title, message: data.message });
    else setError(data.error);
    setSaving(false);
  }
  return (
    <div>
      <Header
        eyebrow="Cards"
        title="Virtual cards"
        copy="Apply for a Visa, Mastercard, or SecurePath Bank Credit Card, then manage it securely."
      />

      <section className="mt-6 rounded-2xl border border-[#e1e6ef] bg-white p-5 shadow-[0_8px_24px_rgba(16,35,63,.05)] sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">Apply for a new card</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Choose your preferred card network. Applications are reviewed before activation.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-bank-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-bank-700">
            <ShieldCheck size={14} /> Secure application
          </span>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {([
            ["visa", "Visa virtual card", "Apply for Visa"],
            ["mastercard", "Mastercard virtual card", "Apply for Mastercard"],
            ["amex", "SecurePath Bank credit card", "Apply for credit"],
          ] as const).map(([brand, title, defaultCopy]) => {
            const brandCards = allCards?.filter((card) => card.brand === brand) || [];
            const owned = brandCards.find((card) => ["active", "frozen"].includes(card.status));
            const pendingApplication = brandCards.find((card) => card.status === "pending");
            const declinedApplication = brandCards.find((card) => card.status === "declined");
            const unavailable = allCards === null || Boolean(owned || pendingApplication);
            const copy = allCards === null
              ? "Checking card ownership…"
              : owned
              ? `Owned · Balance ${formatMoney(owned.balance, owned.currency)} · Ending ${owned.last_four || "pending"}`
              : pendingApplication
                ? "Application under administrator review"
                : declinedApplication
                  ? `Previous application declined · Reapply for ${title}`
                  : defaultCopy;
            return (
              <button
                key={brand}
                type="button"
                onClick={() => { if (!unavailable) setSelectedBrand(brand); }}
                disabled={saving || unavailable}
                aria-label={owned ? `${title} owned` : pendingApplication ? `${title} under review` : defaultCopy}
                className={`group relative overflow-hidden rounded-2xl border bg-white p-3 text-left transition ${owned ? "border-blue-300 bg-blue-50/30" : pendingApplication ? "border-amber-200 bg-amber-50/30" : "border-[#dfe5ef] hover:-translate-y-0.5 hover:border-bank-300 hover:shadow-[0_12px_30px_rgba(16,35,63,.1)]"}`}
              >
                <CardArtwork brand={brand} holder={accountHolder} />
                <span className="flex items-center gap-3 px-1 pb-1 pt-4">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2"><span className="block truncate font-bold">{title}</span>{owned && <span className="rounded-full bg-blue-100 px-2 py-1 text-[9px] font-bold uppercase text-blue-700">Owned</span>}{pendingApplication && <span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-bold uppercase text-amber-700">Under review</span>}</span>
                    <span className="mt-1 block text-xs leading-5 text-neutral-500">{copy}</span>
                  </span>
                  {!unavailable && <ChevronRight className="shrink-0 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-bank-700" size={19} />}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {error && <ErrorMessage text={error} />}

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-neutral-500">Your cards</p>
            {cards && cards.length > 0 && (
              <p className="mt-1 text-xs text-neutral-400">{cards.length} virtual {cards.length === 1 ? "card" : "cards"}</p>
            )}
          </div>
        </div>

        {cards === null ? (
          <div className="mt-4"><RowsLoading /></div>
        ) : cards.length ? (
          <div className="mt-4 space-y-4">
            {cards.map((card) => {
              const active = card.status === "active";
              const pending = card.status === "pending";
              const statusLabel =
                active
                  ? "Active"
                  : pending
                    ? "Pending"
                    : card.status === "declined"
                      ? "Declined"
                      : "Frozen";
              const statusTone = active
                ? "bg-blue-50 text-blue-700"
                : pending
                  ? "bg-amber-50 text-amber-700"
                  : card.status === "declined"
                    ? "bg-red-50 text-red-700"
                    : "bg-sky-50 text-sky-700";

              return (
                <article
                  key={card.id}
                  className="rounded-2xl border border-[#e1e6ef] bg-white p-4 shadow-[0_7px_22px_rgba(16,35,63,.055)] sm:p-5"
                >
                  <div className="grid min-w-0 gap-5 sm:grid-cols-[260px_1fr] sm:items-center lg:grid-cols-[260px_1fr_auto]">
                    <VirtualCardThumb card={card} />

                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-bold text-[#111827] sm:text-lg">
                          {card.card_name}
                        </h3>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusTone}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-neutral-500">
                        {card.last_four ? `Virtual card ending in ${card.last_four}` : "Awaiting card approval and assignment"}
                      </p>
                      <p className="mt-2 text-xs text-neutral-400">
                        {active
                          ? `Daily limit ${formatMoney(card.daily_limit, card.currency)}`
                          : "Funding becomes available once the card is approved."}
                      </p>
                    </div>

                    <div className="flex items-end justify-between gap-4 border-t border-neutral-100 pt-4 sm:col-span-2 lg:col-span-1 lg:block lg:min-w-40 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 lg:text-right">
                      <div>
                        <p className="text-[10px] text-neutral-400">{active ? "Balance" : "Status"}</p>
                        <p className={`mt-1 font-bold ${active ? "text-xl text-[#111827]" : pending ? "text-amber-700" : "text-sky-700"}`}>
                          {active ? formatMoney(card.balance, card.currency) : statusLabel}
                        </p>
                      </div>
                      {active && (
                        <div className="flex gap-2 lg:mt-4 lg:justify-end">
                          <button
                            type="button"
                            onClick={() => setOperation({ cardId: card.id, action: "fund" })}
                            className="rounded-lg bg-bank-700 px-4 py-2 text-xs font-bold text-white hover:bg-bank-800"
                          >
                            Fund
                          </button>
                          <button
                            type="button"
                            onClick={() => setOperation({ cardId: card.id, action: "withdraw" })}
                            className="rounded-lg border border-[#d8dfeb] px-4 py-2 text-xs font-bold hover:bg-neutral-50"
                          >
                            Withdraw
                          </button>                          <button
                            type="button"
                            onClick={() => { setAccessCard(card); setAccessPin(""); setAccessResult(null); setError(""); }}
                            className="rounded-lg border border-bank-200 bg-bank-50 px-4 py-2 text-xs font-bold text-bank-700 hover:bg-bank-100"
                          >
                            Card details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-4">
            <Empty
              title="No virtual cards yet"
              copy="Choose Visa or Mastercard above to submit your first card application."
            />
          </div>
        )}
      </section>

      {selectedBrand && (
        <div
          className="fixed inset-0 z-[210] grid place-items-center bg-[#061f16]/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-application-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setSelectedBrand(null);
          }}
        >
          <section className="w-full max-w-4xl rounded-3xl bg-white p-5 shadow-[0_30px_90px_rgba(0,25,15,.3)] sm:p-7">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-neutral-400">Front</p>
                <div className="overflow-hidden rounded-2xl shadow-lg">
                  <VirtualCardArt brand={selectedBrand} holder={accountHolder} />
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-neutral-400">Back</p>
                <div className="overflow-hidden rounded-2xl shadow-lg">
                  <VirtualCardBack brand={selectedBrand} holder={accountHolder} />
                </div>
              </div>
            </div>
            <h2 id="card-application-title" className="mt-6 text-2xl font-bold">
              Apply for {selectedBrand === "visa" ? "Visa" : selectedBrand === "mastercard" ? "Mastercard" : "Credit Card"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Your application will be sent to a SecurePath Bank administrator for review. Card details and funding controls become available after approval.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedBrand(null)}
                disabled={saving}
                className="min-h-12 rounded-xl border px-5 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => apply(selectedBrand)}
                disabled={saving}
                className="btn flex-1 rounded-xl"
              >
                {applyingBrand ? "Submittingâ€¦" : "Send for review"}
              </button>
            </div>
          </section>
        </div>
      )}
      {accessCard && (
        <div className="fixed inset-0 z-[215] grid place-items-center bg-[#061f16]/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="card-access-title">
          <section className="w-full max-w-lg rounded-3xl border border-white/70 bg-white p-6 shadow-[0_30px_90px_rgba(0,25,15,.3)] sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-bank-600">Protected card access</p><h2 id="card-access-title" className="mt-2 text-2xl">{accessCard.card_name}</h2><p className="mt-1 text-xs text-neutral-500">Card ending in {accessCard.last_four}</p></div><button type="button" onClick={() => setAccessCard(null)} className="grid size-10 place-items-center rounded-full bg-neutral-100 text-neutral-600" aria-label="Close">×</button></div>
            {accessResult ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-amber-100 text-amber-700"><ShieldCheck size={23} /></span><h3 className="mt-4 text-2xl font-semibold text-amber-950">{accessResult.title}</h3><p className="mt-3 text-sm leading-6 text-amber-800">{accessResult.message}</p><button type="button" onClick={() => setAccessCard(null)} className="mt-6 min-h-11 rounded-xl border border-amber-300 bg-white px-5 text-sm font-semibold text-amber-900">Close</button></div>
            ) : (
              <><div className="mt-6 rounded-2xl bg-[#f7f9fc] p-4 text-xs leading-5 text-neutral-600"><b className="text-neutral-900">Secure verification required.</b> Enter your 4-digit transaction PIN to request access to the full card number, CVV, expiry, and card PIN.</div><div className="mt-5"><Field label="4-digit transaction PIN" type="password" value={accessPin} onChange={(value) => setAccessPin(value.replace(/\D/g, "").slice(0, 4))} /></div>{error && <div className="mt-4"><ErrorMessage text={error} /></div>}<button type="button" onClick={requestCardAccess} disabled={saving || accessPin.length !== 4} className="btn mt-6 w-full rounded-xl"><ShieldCheck size={17} />{saving ? "Verifying…" : "Verify PIN and continue"}</button></>
            )}
          </section>
        </div>
      )}      {operation && (
        <div
          className="fixed inset-0 z-[210] grid place-items-center bg-[#061f16]/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-operation-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setOperation(null);
          }}
        >
          <section className="w-full max-w-xl rounded-3xl border border-white/70 bg-white p-6 shadow-[0_30px_90px_rgba(0,25,15,.3)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-bank-600">Secure card transfer</p>
                <h2 id="card-operation-title" className="mt-2 text-2xl capitalize">{operation.action} card</h2>
              </div>
              <button
                type="button"
                onClick={() => setOperation(null)}
                disabled={saving}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                aria-label="Close"
              >
                Ã—
              </button>
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Confirm this balance update with your secure transaction PIN.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Amount" type="number" value={amount} onChange={setAmount} />
              <Field
                label="Transaction PIN"
                type="password"
                value={pin}
                onChange={(value) => setPin(value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setOperation(null)}
                disabled={saving}
                className="min-h-12 rounded-xl border px-5 text-sm font-semibold"
              >
                Cancel
              </button>
              <button onClick={changeBalance} disabled={saving} className="btn flex-1 rounded-xl">
                {saving ? "Processingâ€¦" : "Confirm securely"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function CardArtwork({ brand, holder }: { brand: "visa" | "mastercard" | "amex"; holder: string }) {
  return (
    <span className="block aspect-[1.586/1] w-full overflow-hidden rounded-xl shadow-md">
      <VirtualCardArt brand={brand} holder={holder} />
    </span>
  );
}

function VirtualCardThumb({
  card,
}: {
  card: {
    brand: string;
    last_four: string | null;
    expiry_month: number | null;
    expiry_year: number | null;
    holder_name: string;
  };
}) {
  return (
    <div className="aspect-[1.586/1] w-full max-w-[260px] overflow-hidden rounded-2xl shadow-lg">
      <VirtualCardArt
        brand={card.brand}
        lastFour={card.last_four}
        expiryMonth={card.expiry_month}
        expiryYear={card.expiry_year}
        holder={card.holder_name}
      />
    </div>
  );
}

type GrantDocument = {
  id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
};
type GrantApplication = {
  id: number;
  reference: string;
  applicant_type: "individual" | "company";
  legal_name: string | null;
  project_title: string | null;
  category: string | null;
  country: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  registration_number: string | null;
  registration_date: string | null;
  organization_background: string | null;
  project_location: string | null;
  amount: number | null;
  timeline_months: number | null;
  beneficiaries: number | null;
  purpose: string | null;
  use_of_funds: string | null;
  budget_breakdown: string | null;
  milestones: string | null;
  other_funding_sources: string | null;
  declaration_accepted_at: string | null;
  eligibility_confirmed_at: string | null;
  admin_feedback: string | null;
  status: "draft" | "submitted" | "under_review" | "approved" | "declined";
  submitted_at: string | null;
  updated_at: string;
  created_at: string;
  documents: GrantDocument[];
};

const initialGrantForm = {
  applicantType: "individual",
  legalName: "",
  country: "",
  contactEmail: "",
  contactPhone: "",
  registrationNumber: "",
  registrationDate: "",
  organizationBackground: "",
  projectTitle: "",
  category: "Community development",
  projectLocation: "",
  amount: "",
  timelineMonths: "12",
  beneficiaries: "",
  purpose: "",
  useOfFunds: "",
  budgetBreakdown: "",
  milestones: "",
  otherFundingSources: "None",
  eligibility: false,
  declaration: false,
};

function GrantApplications() {
  const [applications, setApplications] = useState<GrantApplication[] | null>(null);
  const [applying, setApplying] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialGrantForm);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [existingDocuments, setExistingDocuments] = useState<GrantDocument[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadGrants() {
    const response = await fetch("/api/banking/grants");
    const result = await response.json();
    if (response.ok) {
      setApplications(result.applications);
      if (!form.contactEmail && result.holder) {
        setForm((current) => ({
          ...current,
          legalName: current.legalName || result.holder.name,
          contactEmail: current.contactEmail || result.holder.email,
        }));
      }
    } else setError(result.error);
  }

  useEffect(() => {
    const recovered = sessionStorage.getItem("securepathbank_grant_recovery");
    if (recovered) {
      try {
        const saved = JSON.parse(recovered) as {
          form?: Partial<typeof initialGrantForm>;
          step?: number;
          draftId?: number | null;
        };
        if (saved.form) setForm({ ...initialGrantForm, ...saved.form });
        setStep(Math.min(4, Math.max(1, Number(saved.step) || 1)));
        setDraftId(saved.draftId || null);
        setApplying(true);
        setMessage("Your grant form was restored after signing in. Reattach any supporting files before saving.");
      } catch {
        // Ignore invalid recovery data and load a clean form.
      }
      sessionStorage.removeItem("securepathbank_grant_recovery");
    }
    loadGrants();
  }, []);

  function recoverExpiredSession() {
    sessionStorage.setItem(
      "securepathbank_grant_recovery",
      JSON.stringify({ form, step, draftId }),
    );
    sessionStorage.setItem("securepathbank_login_destination", "/dashboard/grants");
    window.location.assign("/login");
  }

  function next() {
    setError("");
    if (
      step === 1 &&
      (!form.legalName.trim() ||
        !form.country.trim() ||
        !form.contactEmail.trim() ||
        !form.contactPhone.trim())
    ) {
      setError("Complete the applicant and contact information.");
      return;
    }
    if (
      step === 2 &&
      (!form.organizationBackground.trim() ||
        (form.applicantType === "company" &&
          (!form.registrationNumber.trim() || !form.registrationDate)))
    ) {
      setError("Complete the organization background and registration information.");
      return;
    }
    if (
      step === 3 &&
      (!form.projectTitle.trim() ||
        !form.projectLocation.trim() ||
        Number(form.amount) < 500 ||
        Number(form.timelineMonths) < 1 ||
        Number(form.beneficiaries) < 1)
    ) {
      setError("Complete the project details with a request of at least $500.");
      return;
    }
    setStep((current) => Math.min(4, current + 1));
  }

  function grantFormData(action: "draft" | "submit") {
    const data = new FormData();
    data.set("action", action);
    if (draftId) data.set("applicationId", String(draftId));
    for (const [key, value] of Object.entries(form))
      data.set(key, typeof value === "boolean" ? String(value) : value);
    files.forEach((file) => data.append("documents", file));
    return data;
  }

  async function save(action: "draft" | "submit") {
    setSaving(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/banking/grants", {
      method: "POST",
      body: grantFormData(action),
    });
    const result = await response.json();
    if (response.status === 401) {
      recoverExpiredSession();
      return;
    }
    if (response.ok) {
      setFiles([]);
      if (action === "draft") {
        setDraftId(result.id);
        setMessage(`Draft ${result.reference} saved. You can continue editing or return later.`);
        await loadGrants();
      } else {
        setMessage(`Application ${result.reference} was submitted for administrator review.`);
        resetForm();
        await loadGrants();
      }
    } else setError(result.error);
    setSaving(false);
  }

  function resetForm() {
    setForm(initialGrantForm);
    setDraftId(null);
    setExistingDocuments([]);
    setFiles([]);
    setStep(1);
    setApplying(false);
  }

  function resume(application: GrantApplication) {
    setDraftId(application.id);
    setExistingDocuments(application.documents || []);
    setFiles([]);
    setForm({
      applicantType: application.applicant_type || "individual",
      legalName: application.legal_name || "",
      country: application.country || "",
      contactEmail: application.contact_email || "",
      contactPhone: application.contact_phone || "",
      registrationNumber: application.registration_number || "",
      registrationDate: application.registration_date?.slice(0, 10) || "",
      organizationBackground: application.organization_background || "",
      projectTitle: application.project_title || "",
      category: application.category || "Community development",
      projectLocation: application.project_location || "",
      amount: application.amount == null ? "" : String(application.amount),
      timelineMonths: application.timeline_months == null ? "12" : String(application.timeline_months),
      beneficiaries: application.beneficiaries == null ? "" : String(application.beneficiaries),
      purpose: application.purpose || "",
      useOfFunds: application.use_of_funds || "",
      budgetBreakdown: application.budget_breakdown || "",
      milestones: application.milestones || "",
      otherFundingSources: application.other_funding_sources || "None",
      eligibility: Boolean(application.eligibility_confirmed_at),
      declaration: Boolean(application.declaration_accepted_at),
    });
    setStep(1);
    setError("");
    setMessage("");
    setApplying(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeDocument(id: number) {
    const response = await fetch(`/api/banking/grants/documents/${id}`, { method: "DELETE" });
    const result = await response.json();
    if (response.ok)
      setExistingDocuments((current) => current.filter((document) => document.id !== id));
    else setError(result.error);
  }

  const steps = ["Applicant", "Organization", "Project", "Proposal"];

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <Header
          eyebrow="Funding opportunities"
          title="Grant applications"
          copy="Prepare, save, and track a complete funding proposal."
        />
        {!applying && (
          <button onClick={() => { setApplying(true); setMessage(""); }} className="btn shrink-0 rounded-xl">
            Start application
          </button>
        )}
      </div>

      {message && <p className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">{message}</p>}
      {error && <ErrorMessage text={error} />}

      {applying && (
        <section className="mt-7 overflow-hidden rounded-3xl border border-[#dfe5ef] bg-white shadow-[0_14px_40px_rgba(16,35,63,.07)]">
          <div className="border-b bg-[#f7faf8] px-5 py-5 sm:px-7">
            <div className="flex items-center justify-between gap-2">
              {steps.map((label, index) => {
                const number = index + 1;
                return (
                  <div key={label} className={`flex items-center gap-2 ${number <= step ? "text-bank-700" : "text-neutral-400"}`}>
                    <span className={`grid size-7 place-items-center rounded-full text-xs font-bold ${number <= step ? "bg-bank-700 text-white" : "bg-neutral-200"}`}>{number}</span>
                    <span className="hidden text-xs font-bold sm:block">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 sm:p-7">
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold">Applicant and contact details</h2>
                <p className="mt-2 text-sm text-neutral-500">Identify the applicant and primary contact for this proposal.</p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label>
                    <span className="label">Applicant type</span>
                    <select className="field" value={form.applicantType} onChange={(event) => setForm({ ...form, applicantType: event.target.value })}>
                      <option value="individual">Individual</option>
                      <option value="company">Company or organization</option>
                    </select>
                  </label>
                  <Field label="Legal applicant name" value={form.legalName} onChange={(value) => setForm({ ...form, legalName: value })} />
                  <Field label="Contact email" type="email" value={form.contactEmail} onChange={(value) => setForm({ ...form, contactEmail: value })} />
                  <Field label="Contact phone" type="tel" value={form.contactPhone} onChange={(value) => setForm({ ...form, contactPhone: value })} />
                  <label className="sm:col-span-2">
                    <span className="label">Country of operation</span>
                    <select
                      className="field"
                      value={form.country}
                      onChange={(event) =>
                        setForm({ ...form, country: event.target.value })
                      }
                      required
                    >
                      <option value="">Select country</option>
                      {form.country &&
                        !countries.some(([code]) => code === form.country) && (
                          <option value={form.country}>{form.country}</option>
                        )}
                      {countries.map(([code, country]) => (
                        <option key={code} value={code}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold">Organization information</h2>
                <p className="mt-2 text-sm text-neutral-500">Provide registration details where applicable and summarize your operating history.</p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="Registration number" required={form.applicantType === "company"} value={form.registrationNumber} onChange={(value) => setForm({ ...form, registrationNumber: value })} />
                  <Field label="Registration date" type="date" required={form.applicantType === "company"} value={form.registrationDate} onChange={(value) => setForm({ ...form, registrationDate: value })} />
                  <label className="sm:col-span-2">
                    <span className="label">Organization background and operating history</span>
                    <textarea className="field min-h-40" value={form.organizationBackground} onChange={(event) => setForm({ ...form, organizationBackground: event.target.value })} placeholder="Describe your mission, experience, previous projects, and operating capacity." />
                  </label>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold">Project and funding request</h2>
                <p className="mt-2 text-sm text-neutral-500">Define the project, location, timeline, and intended reach.</p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="Project title" value={form.projectTitle} onChange={(value) => setForm({ ...form, projectTitle: value })} />
                  <label>
                    <span className="label">Grant category</span>
                    <select className="field" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                      {[
                        "Community development", "Small business", "Education", "Healthcare", "Agriculture", "Technology and innovation", "Environment",
                      ].map((category) => <option key={category}>{category}</option>)}
                    </select>
                  </label>
                  <div className="sm:col-span-2"><Field label="Project location" value={form.projectLocation} onChange={(value) => setForm({ ...form, projectLocation: value })} /></div>
                  <Field label="Requested amount (USD)" type="number" value={form.amount} onChange={(value) => setForm({ ...form, amount: value })} />
                  <Field label="Project timeline (months)" type="number" value={form.timelineMonths} onChange={(value) => setForm({ ...form, timelineMonths: value })} />
                  <div className="sm:col-span-2"><Field label="Estimated beneficiaries" type="number" value={form.beneficiaries} onChange={(value) => setForm({ ...form, beneficiaries: value })} /></div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-2xl font-bold">Proposal, budget, and documents</h2>
                <p className="mt-2 text-sm text-neutral-500">Explain the impact, provide measurable milestones, and attach supporting evidence.</p>
                <div className="mt-6 space-y-5">
                  {[
                    ["Project purpose and expected impact", "purpose", "Describe the need, solution, and measurable outcomes."],
                    ["Detailed budget breakdown", "budgetBreakdown", "List line items, quantities, and estimated costs."],
                    ["Planned use of funds", "useOfFunds", "Explain how the requested funding will be allocated."],
                    ["Milestones and measurable outcomes", "milestones", "List milestones, dates, and success measures."],
                    ["Other funding sources", "otherFundingSources", "List confirmed or pending funding, or state None."],
                  ].map(([label, key, placeholder]) => (
                    <label className="block" key={key}>
                      <span className="label">{label}</span>
                      <textarea className="field min-h-28" value={String(form[key as keyof typeof form])} onChange={(event) => setForm({ ...form, [key]: event.target.value })} placeholder={placeholder} />
                    </label>
                  ))}

                  <div className="rounded-2xl border border-dashed border-[#cfdcd4] p-5">
                    <p className="font-bold">Supporting documents</p>
                    <p className="mt-1 text-xs text-neutral-500">Upload up to three PDF, JPG, or PNG files, maximum 5 MB each.</p>
                    <input
                      className="mt-4 block w-full text-sm"
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      multiple
                      onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, Math.max(0, 3 - existingDocuments.length)))}
                    />
                    {(existingDocuments.length > 0 || files.length > 0) && (
                      <div className="mt-4 space-y-2">
                        {existingDocuments.map((document) => (
                          <div key={document.id} className="flex items-center justify-between gap-3 rounded-lg bg-neutral-50 px-3 py-2 text-xs">
                            <a className="truncate font-semibold text-bank-700" href={`/api/banking/grants/documents/${document.id}`}>{document.original_name}</a>
                            <button type="button" onClick={() => removeDocument(document.id)} className="text-red-600">Remove</button>
                          </div>
                        ))}
                        {files.map((file) => <p key={`${file.name}-${file.size}`} className="truncate rounded-lg bg-bank-50 px-3 py-2 text-xs text-bank-800">New: {file.name}</p>)}
                      </div>
                    )}
                  </div>

                  <label className="flex items-start gap-3 rounded-xl border p-4 text-sm">
                    <input type="checkbox" checked={form.eligibility} onChange={(event) => setForm({ ...form, eligibility: event.target.checked })} className="mt-1 accent-bank-700" />
                    <span><b className="block">Eligibility confirmation</b><span className="mt-1 block text-xs leading-5 text-neutral-500">I confirm that the applicant is eligible to apply, the project is lawful, and the requested funds will be used only for the stated purpose.</span></span>
                  </label>
                  <label className="flex items-start gap-3 rounded-xl border p-4 text-sm">
                    <input type="checkbox" checked={form.declaration} onChange={(event) => setForm({ ...form, declaration: event.target.checked })} className="mt-1 accent-bank-700" />
                    <span><b className="block">Declaration and consent</b><span className="mt-1 block text-xs leading-5 text-neutral-500">I declare that the information is accurate and consent to SecurePath Bank reviewing the application and supporting documents.</span></span>
                  </label>
                </div>
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-3 border-t pt-5">
              <button type="button" onClick={() => { if (step === 1) resetForm(); else setStep(step - 1); }} disabled={saving} className="min-h-12 rounded-xl border px-5 text-sm font-semibold">
                {step === 1 ? "Cancel" : "Back"}
              </button>
              <button type="button" onClick={() => save("draft")} disabled={saving} className="min-h-12 rounded-xl border border-bank-200 px-5 text-sm font-bold text-bank-700">
                {saving ? "Savingâ€¦" : "Save draft"}
              </button>
              {step < 4 ? (
                <button type="button" onClick={next} className="btn ml-auto rounded-xl">Continue</button>
              ) : (
                <button type="button" onClick={() => save("submit")} disabled={saving || !form.eligibility || !form.declaration} className="btn ml-auto rounded-xl">
                  {saving ? "Submittingâ€¦" : "Submit for review"}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="mt-9">
        <p className="text-[11px] font-bold uppercase tracking-[.18em] text-neutral-500">Application history</p>
        <h2 className="mt-2 text-2xl font-bold">Your submissions and drafts</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[#e1e6ef] bg-white">
          {applications === null ? <RowsLoading /> : applications.length ? applications.map((application) => {
            const tone = application.status === "approved" ? "bg-blue-50 text-blue-700" : application.status === "declined" ? "bg-red-50 text-red-700" : application.status === "under_review" ? "bg-blue-50 text-blue-700" : application.status === "draft" ? "bg-neutral-100 text-neutral-700" : "bg-amber-50 text-amber-700";
            return (
              <article key={application.id} className="border-b p-5 last:border-0">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-bold">{application.project_title || application.legal_name || "Untitled grant draft"}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase ${tone}`}>{application.status.replace("_", " ")}</span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">{application.reference} Â· Updated {new Date(application.updated_at || application.created_at).toLocaleDateString("en-GB")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {application.amount != null && <b>{formatMoney(application.amount, "USD")}</b>}
                    {application.status === "draft" && <button onClick={() => resume(application)} className="rounded-lg border border-bank-200 px-4 py-2 text-xs font-bold text-bank-700">Resume</button>}
                  </div>
                </div>
                {application.documents?.length > 0 && <p className="mt-3 text-xs text-neutral-500">{application.documents.length} supporting {application.documents.length === 1 ? "document" : "documents"}</p>}
                {application.admin_feedback && (
                  <div className={`mt-4 rounded-xl p-4 text-sm ${application.status === "declined" ? "bg-red-50 text-red-800" : "bg-bank-50 text-bank-800"}`}>
                    <b className="block">Administrator feedback</b>
                    <p className="mt-1 leading-6">{application.admin_feedback}</p>
                  </div>
                )}
              </article>
            );
          }) : <Empty title="No grant applications" copy="Start an application and save it as a draft whenever you need more time." />}
        </div>
      </section>
    </div>
  );
}

type SupportTicket = {
  id: number;
  reference: string;
  category: string;
  subject: string;
  message: string;
  admin_response: string | null;
  responded_at: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
};

const supportCategories = [
  ["account", "Account and profile"],
  ["transfer", "Transfers and payments"],
  ["card", "Virtual cards"],
  ["deposit", "Deposits"],
  ["investment", "Investments"],
  ["grant", "Grant applications"],
  ["crypto", "Crypto swap"],
  ["security", "Security concern"],
  ["technical", "Technical issue"],
  ["other", "Something else"],
] as const;

function CustomerSupport() {
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("normal");
  const [subject, setSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadTickets() {
    const response = await fetch("/api/banking/requests?type=support");
    const result = await response.json();
    if (response.ok) setTickets(result.tickets);
    else setError(result.error || "Unable to load your support requests.");
  }
  useEffect(() => { loadTickets(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    const response = await fetch("/api/banking/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "support", category, priority, subject, message: supportMessage }),
    });
    const result = await response.json();
    setSubmitting(false);
    if (!response.ok) {
      setError(result.error || "Unable to submit your support request.");
      return;
    }
    setSuccess(`Request ${result.reference} was sent to the support team.`);
    setCategory("");
    setPriority("normal");
    setSubject("");
    setSupportMessage("");
    await loadTickets();
  }

  return (
    <div>
      <Header eyebrow="Help centre" title="Customer Support" copy="Tell us what happened, set the urgency, and track every request from one place." />
      <SupportLiveChat />
      {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {success && <p className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">{success}</p>}

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,.8fr)]">
        <form onSubmit={submit} className="space-y-5 rounded-3xl border border-[#dfe5ef] bg-white p-6 shadow-sm">
          <div><p className="text-[11px] font-bold uppercase tracking-[.17em] text-bank-600">New request</p><h2 className="mt-2 text-2xl font-bold">How can we help?</h2><p className="mt-2 text-sm leading-6 text-neutral-500">Include relevant references, dates, or error messages. Never include your password or transaction PIN.</p></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label><span className="label">Support category</span><select required className="field" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Choose a category</option>{supportCategories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label><span className="label">Priority</span><select required className="field" value={priority} onChange={(event) => setPriority(event.target.value)}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
          </div>
          <Field label="Subject" value={subject} onChange={setSubject} placeholder="Briefly describe the issue" />
          <label><span className="label">What happened?</span><textarea required minLength={20} maxLength={5000} className="field min-h-40 resize-y" value={supportMessage} onChange={(event) => setSupportMessage(event.target.value)} placeholder="Describe what you expected, what happened, and any reference number involved." /><span className="mt-1 block text-right text-[10px] text-neutral-400">{supportMessage.length}/5000</span></label>
          <button disabled={submitting} className="btn w-full justify-center disabled:opacity-50"><Send size={16} />{submitting ? "Sending requestâ€¦" : "Send to support"}</button>
        </form>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-[#0b3b2b] p-6 text-white"><ShieldCheck className="text-blue-300" /><h3 className="mt-4 text-xl font-bold">Your security matters</h3><p className="mt-2 text-sm leading-6 text-blue-50/75">SecurePath Bank support will never ask for your password, full card number, CVV, or transaction PIN.</p></div>
          <div className="rounded-2xl border border-[#e1e6ef] bg-white p-5"><b className="text-sm">Expected response</b><p className="mt-2 text-xs leading-5 text-neutral-500">Urgent security issues are prioritized. Other requests are handled according to their category and submission time.</p></div>
        </aside>
      </div>

      <section className="mt-9">
        <p className="text-[11px] font-bold uppercase tracking-[.18em] text-neutral-500">Support history</p>
        <h2 className="mt-2 text-2xl font-bold">Your requests</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[#e1e6ef] bg-white">
          {tickets === null ? <RowsLoading /> : tickets.length ? tickets.map((ticket) => {
            const statusTone = ticket.status === "resolved" || ticket.status === "closed" ? "bg-blue-50 text-blue-700" : ticket.status === "in_progress" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700";
            const priorityTone = ticket.priority === "urgent" ? "text-red-600" : ticket.priority === "high" ? "text-amber-600" : "text-neutral-500";
            return <article key={ticket.id} className="border-b p-5 last:border-0"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{ticket.subject}</h3><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase ${statusTone}`}>{ticket.status.replace("_", " ")}</span></div><p className="mt-1 text-xs text-neutral-500">{ticket.reference} Â· {supportCategories.find(([value]) => value === ticket.category)?.[1] || ticket.category} Â· {new Date(ticket.created_at).toLocaleString("en-GB")}</p></div><span className={`text-[10px] font-bold uppercase ${priorityTone}`}>{ticket.priority} priority</span></div><p className="mt-3 text-sm leading-6 text-neutral-600">{ticket.message}</p>{ticket.admin_response&&<div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-blue-700">Customer care response</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-950">{ticket.admin_response}</p>{ticket.responded_at&&<p className="mt-2 text-[10px] text-blue-700">{new Date(ticket.responded_at).toLocaleString("en-GB")}</p>}</div>}</article>;
          }) : <Empty title="No support requests" copy="When you contact support, your request and its status will appear here." />}
        </div>
      </section>
    </div>
  );
}
type InvestmentProduct = {
  id: "treasury" | "fixed_income" | "real_estate";
  name: string;
  description: string;
  risk: string;
  targetRate: number;
  termMonths: number;
  minimum: number;
};
type InvestmentHolding = {
  id: number;
  reference: string;
  product: string;
  product_name: string;
  principal: number;
  current_value: number;
  currency: string;
  target_rate: number;
  term_months: number;
  status: string;
  started_at: string;
  maturity_date: string;
};

function Investments() {
  const [data, setData] = useState<{
    account: { currency: string; availableBalance: number };
    products: InvestmentProduct[];
    holdings: InvestmentHolding[];
  } | null>(null);
  const [selected, setSelected] = useState<InvestmentProduct | null>(null);
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadInvestments() {
    const response = await fetch("/api/banking/investments");
    const result = await response.json();
    response.ok ? setData(result) : setError(result.error);
  }

  useEffect(() => {
    loadInvestments();
  }, []);

  async function invest() {
    if (!selected) return;
    setSaving(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/banking/investments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product: selected.id, amount, pin }),
    });
    const result = await response.json();
    if (response.ok) {
      setMessage(`Investment opened successfully. Reference ${result.reference}.`);
      setSelected(null);
      setAmount("");
      setPin("");
      await loadInvestments();
    } else setError(result.error);
    setSaving(false);
  }

  const portfolioValue =
    data?.holdings.reduce((sum, holding) => sum + holding.current_value, 0) || 0;
  const totalInvested =
    data?.holdings.reduce((sum, holding) => sum + holding.principal, 0) || 0;
  const currency = data?.account.currency || "USD";

  return (
    <div>
      <Header
        eyebrow="Wealth"
        title="Investments"
        copy="Build a diversified portfolio directly from your SecurePath Bank account."
      />

      <section className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#06291d] via-[#0a573a] to-[#148258] p-6 text-white shadow-[0_22px_60px_rgba(8,65,43,.2)] sm:p-8">
        <div className="absolute -right-20 -top-24 size-64 rounded-full bg-white/[.06]" />
        <div className="relative grid gap-7 lg:grid-cols-[1.25fr_1fr] lg:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/60">Portfolio value</p>
            <p className="mt-2 text-3xl font-bold sm:text-4xl">{formatMoney(portfolioValue, currency)}</p>
            <p className="mt-3 text-xs text-white/60">
              {data?.holdings.length || 0} active {(data?.holdings.length || 0) === 1 ? "holding" : "holdings"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[.08] p-4">
              <p className="text-[9px] uppercase tracking-[.14em] text-white/55">Total invested</p>
              <p className="mt-2 font-bold">{formatMoney(totalInvested, currency)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.08] p-4">
              <p className="text-[9px] uppercase tracking-[.14em] text-white/55">Available cash</p>
              <p className="mt-2 font-bold">{formatMoney(data?.account.availableBalance || 0, currency)}</p>
            </div>
          </div>
        </div>
      </section>

      {error && <ErrorMessage text={error} />}
      {message && (
        <p className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          {message}
        </p>
      )}

      <section className="mt-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-bank-600">Investment options</p>
          <h2 className="mt-2 text-2xl font-bold">Choose a portfolio</h2>
          <p className="mt-2 text-sm text-neutral-500">Target returns are estimates and are not guaranteed.</p>
        </div>

        {data === null ? (
          <div className="mt-5"><RowsLoading /></div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {data.products.map((product) => {
              const Icon =
                product.id === "treasury"
                  ? Landmark
                  : product.id === "fixed_income"
                    ? BarChart3
                    : Building2;
              const riskTone =
                product.risk === "Low"
                  ? "bg-blue-50 text-blue-700"
                  : product.risk === "Moderate"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-violet-50 text-violet-700";
              return (
                <article key={product.id} className="flex flex-col rounded-2xl border border-[#dfe5ef] bg-white p-5 shadow-[0_8px_24px_rgba(16,35,63,.05)]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-xl bg-bank-50 text-bank-700"><Icon size={20} /></span>
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase ${riskTone}`}>{product.risk} risk</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{product.name}</h3>
                  <p className="mt-2 flex-1 text-xs leading-5 text-neutral-500">{product.description}</p>
                  <div className="mt-5 grid grid-cols-2 gap-3 border-y border-neutral-100 py-4">
                    <div>
                      <p className="text-[9px] uppercase tracking-wide text-neutral-400">Target p.a.</p>
                      <p className="mt-1 font-bold text-bank-700">{product.targetRate.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wide text-neutral-400">Term</p>
                      <p className="mt-1 font-bold">{product.termMonths} months</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-neutral-500">Min. {formatMoney(product.minimum, currency)}</span>
                    <button onClick={() => { setSelected(product); setAmount(String(product.minimum)); setError(""); }} className="inline-flex items-center gap-1 text-xs font-bold text-bank-700">
                      Invest <ChevronRight size={15} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-9">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-neutral-500">Your portfolio</p>
            <h2 className="mt-2 text-2xl font-bold">Current holdings</h2>
          </div>
          <TrendingUp className="text-bank-600" />
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[#e1e6ef] bg-white">
          {data === null ? (
            <RowsLoading />
          ) : data.holdings.length ? (
            data.holdings.map((holding) => (
              <article key={holding.id} className="flex flex-col gap-4 border-b p-5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{holding.product_name}</h3>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold uppercase text-blue-700">{holding.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">{holding.reference} Â· Matures {new Date(holding.maturity_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                </div>
                <div className="grid grid-cols-2 gap-6 sm:text-right">
                  <div>
                    <p className="text-[9px] uppercase text-neutral-400">Invested</p>
                    <p className="mt-1 text-sm font-bold">{formatMoney(holding.principal, holding.currency)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase text-neutral-400">Current value</p>
                    <p className="mt-1 text-sm font-bold text-bank-700">{formatMoney(holding.current_value, holding.currency)}</p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <Empty title="No investments yet" copy="Choose a portfolio above to make your first investment." />
          )}
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-[210] grid place-items-center bg-[#061f16]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="investment-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setSelected(null); }}>
          <section className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-[0_30px_90px_rgba(0,25,15,.3)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-bank-600">Review investment</p>
                <h2 id="investment-title" className="mt-2 text-2xl font-bold">{selected.name}</h2>
              </div>
              <span className="grid size-11 place-items-center rounded-full bg-bank-50 text-bank-700"><TrendingUp size={19} /></span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label={`Amount (${currency})`} type="number" value={amount} onChange={setAmount} />
              <Field label="Transaction PIN" type="password" value={pin} onChange={(value) => setPin(value.replace(/\D/g, "").slice(0, 4))} />
            </div>
            <div className="mt-5 rounded-xl bg-neutral-50 p-4 text-xs">
              <div className="flex justify-between gap-4"><span className="text-neutral-500">Target annual return</span><b>{selected.targetRate.toFixed(2)}%</b></div>
              <div className="mt-3 flex justify-between gap-4"><span className="text-neutral-500">Term</span><b>{selected.termMonths} months</b></div>
              <div className="mt-3 flex justify-between gap-4"><span className="text-neutral-500">Estimated value at maturity</span><b>{formatMoney((Number(amount) || 0) * (1 + (selected.targetRate / 100) * (selected.termMonths / 12)), currency)}</b></div>
            </div>
            <p className="mt-4 text-[11px] leading-5 text-neutral-500">Investment values can rise or fall. The displayed target is an estimate, not a guaranteed return.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setSelected(null)} disabled={saving} className="min-h-12 rounded-xl border px-5 text-sm font-semibold">Cancel</button>
              <button onClick={invest} disabled={saving || !amount || pin.length !== 4} className="btn flex-1 rounded-xl">{saving ? "Investingâ€¦" : "Confirm investment"}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
function Generic({
  title,
  copy,
  fields,
}: {
  title: string;
  copy: string;
  fields: string[];
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <Header eyebrow="Secure service" title={title} copy={copy} />
      <form
        onSubmit={(e: FormEvent) => e.preventDefault()}
        className="mt-6 space-y-5 rounded-xl border bg-white p-6"
      >
        {fields.map((x) =>
          x === "Message" || x === "Purpose of grant" ? (
            <label key={x}>
              <span className="label">{x}</span>
              <textarea required className="field min-h-32" />
            </label>
          ) : (
            <Field key={x} label={x} />
          ),
        )}
        <button className="btn w-full">Submit securely</button>
      </form>
    </div>
  );
}

function ProfileSettings() {
  const router = useRouter();
  const fallback = "/images/profile-neutral.svg";
  const [profile, setProfile] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    avatarUrl: string | null;
    residentialAddress: string;
    country: string;
    preferredLanguage: string;
    transactionAlerts: boolean;
    marketingEmails: boolean;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/banking/profile")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setProfile(data.profile);
      })
      .catch((reason) =>
        setError(reason.message || "Unable to load your profile."),
      );
  }, []);

  async function upload(file?: File) {
    if (!file) return;
    setSaving(true);
    setError("");
    setMessage("");
    const form = new FormData();
    form.set("avatar", file);
    const response = await fetch("/api/banking/profile/avatar", {
      method: "POST",
      body: form,
    });
    const data = await response.json();
    if (response.ok) {
      setProfile((current) =>
        current ? { ...current, avatarUrl: data.avatarUrl } : current,
      );
      setMessage("Profile picture updated.");
      router.refresh();
    } else setError(data.error || "Unable to update your profile picture.");
    setSaving(false);
  }

  async function remove() {
    setSaving(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/banking/profile/avatar", {
      method: "DELETE",
    });
    const data = await response.json();
    if (response.ok) {
      setProfile((current) =>
        current ? { ...current, avatarUrl: null } : current,
      );
      setMessage("Profile picture removed.");
      router.refresh();
    } else setError(data.error || "Unable to remove your profile picture.");
    setSaving(false);
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setProfileSaving(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/banking/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await response.json();
    if (response.ok) {
      setMessage("Profile settings saved.");
      router.refresh();
    } else setError(data.error || "Unable to save your profile settings.");
    setProfileSaving(false);
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    const response = await fetch("/api/banking/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await response.json();
    if (response.ok) {
      setMessage("Your password has been changed successfully. Sign in again with your new password.");
      window.setTimeout(() => router.push("/login?notice=password-changed"), 1200);
    } else {
      setError(data.error || "Unable to change your password.");
      setPasswordSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Header
        eyebrow="Profile settings"
        title="Account overview"
        copy="Manage your identity, contact preferences, profile picture, and account security."
      />
      <section className="mt-6 overflow-hidden rounded-2xl border border-[#e1e6ef] bg-white shadow-sm">
        <div className="flex flex-col items-center gap-5 border-b border-[#edf0ee] p-6 text-center sm:flex-row sm:text-left">
          {profile ? (
            <Image
              key={profile.avatarUrl || "profile-placeholder"}
              src={profile.avatarUrl || fallback}
              alt="Profile picture"
              width={112}
              height={112}
              priority
              className="size-28 rounded-full object-cover ring-4 ring-bank-50"
            />
          ) : (
            <div aria-label="Loading profile picture" className="size-28 shrink-0 animate-pulse rounded-full bg-neutral-100 ring-4 ring-bank-50" />
          )}
          <div className="flex-1">
            <h2 className="text-xl font-semibold">Profile picture</h2>
            <p className="mt-1 text-xs leading-5 text-neutral-500">
              JPEG, PNG, or WebP. Maximum file size 3 MB.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
              <label className="btn cursor-pointer">
                <Upload size={16} />
                {saving ? "Savingâ€¦" : "Upload photo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={saving}
                  onChange={(event) => upload(event.target.files?.[0])}
                  className="sr-only"
                />
              </label>
              {profile?.avatarUrl && (
                <button
                  type="button"
                  onClick={remove}
                  disabled={saving}
                  className="inline-flex min-h-12 items-center gap-2 rounded-md border border-rose-200 px-4 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 size={16} /> Remove
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <ReadOnlyDetail
            label="Full name"
            value={
              profile ? `${profile.firstName} ${profile.lastName}` : "Loadingâ€¦"
            }
          />
          <ReadOnlyDetail
            label="Email address"
            value={profile?.email || "Loadingâ€¦"}
          />
        </div>
        {message && (
          <p className="mx-6 mb-6 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
            {message}
          </p>
        )}
        {error && (
          <div className="mx-6 mb-6">
            <ErrorMessage text={error} />
          </div>
        )}
      </section>
      {profile && (
        <form
          onSubmit={saveProfile}
          className="mt-6 space-y-5 rounded-2xl border border-[#e1e6ef] bg-white p-6 shadow-sm"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-bank-600">
              Personal information
            </p>
            <h2 className="mt-2 text-2xl">Your details</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="First name"
              value={profile.firstName}
              onChange={(value) => setProfile({ ...profile, firstName: value })}
            />
            <Field
              label="Last name"
              value={profile.lastName}
              onChange={(value) => setProfile({ ...profile, lastName: value })}
            />
            <Field
              label="Phone number"
              type="tel"
              value={profile.phone}
              onChange={(value) => setProfile({ ...profile, phone: value })}
            />
            <Field
              label="Date of birth"
              type="date"
              required={false}
              value={profile.dateOfBirth}
              onChange={(value) =>
                setProfile({ ...profile, dateOfBirth: value })
              }
            />
            <div className="sm:col-span-2">
              <Field
                label="Residential address"
                required={false}
                value={profile.residentialAddress}
                onChange={(value) =>
                  setProfile({ ...profile, residentialAddress: value })
                }
              />
            </div>
            <label>
              <span className="label">Country</span>
              <select
                className="field"
                value={profile.country}
                onChange={(event) =>
                  setProfile({ ...profile, country: event.target.value })
                }
              >
                <option value="">Select country</option>
                {countries.map(([code, country]) => (
                  <option key={code} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Preferred language</span>
              <select
                className="field"
                value={profile.preferredLanguage}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    preferredLanguage: event.target.value,
                  })
                }
              >
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="es">Spanish</option>
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-start gap-3 rounded-xl border border-[#e2e7f0] p-4 text-sm">
              <input
                type="checkbox"
                checked={profile.transactionAlerts}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    transactionAlerts: event.target.checked,
                  })
                }
                className="mt-1 accent-bank-600"
              />
              <span>
                <b className="block">Transaction alerts</b>
                <span className="mt-1 block text-xs text-neutral-500">
                  Receive important account activity notices.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-[#e2e7f0] p-4 text-sm">
              <input
                type="checkbox"
                checked={profile.marketingEmails}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    marketingEmails: event.target.checked,
                  })
                }
                className="mt-1 accent-bank-600"
              />
              <span>
                <b className="block">Product updates</b>
                <span className="mt-1 block text-xs text-neutral-500">
                  Receive optional SecurePath Bank product news.
                </span>
              </span>
            </label>
          </div>
          <button disabled={profileSaving} className="btn w-full">
            {profileSaving ? "Saving settingsâ€¦" : "Save profile settings"}
          </button>
        </form>
      )}
      <form
        onSubmit={changePassword}
        className="mt-6 space-y-5 rounded-2xl border border-[#e1e6ef] bg-white p-6 shadow-sm"
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-bank-600">
            Security
          </p>
          <h2 className="mt-2 text-2xl">Change password</h2>
          <p className="mt-2 text-xs leading-5 text-neutral-500">
            Changing your password signs this session out to protect your
            account.
          </p>
        </div>
        <Field
          label="Current password"
          type="password"
          value={currentPassword}
          onChange={setCurrentPassword}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="New password"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
          />
          <Field
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
        </div>
        <button disabled={passwordSaving} className="btn w-full">
          {passwordSaving ? "Updating passwordâ€¦" : "Change password"}
        </button>
      </form>
    </div>
  );
}

function ReadOnlyDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className="rounded-lg border border-[#e2e7f0] bg-neutral-50 px-4 py-3 text-sm font-medium">
        {value}
      </p>
    </div>
  );
}
function Review({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="mt-7 divide-y">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-6 py-3 text-sm">
          <span className="text-neutral-500">{label}</span>
          <b className="text-right capitalize">{value}</b>
        </div>
      ))}
    </div>
  );
}
function StateCard({
  icon,
  title,
  copy,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div className="mt-6 rounded-xl border bg-white p-10 text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-bank-50 text-bank-600 [&>svg]:size-8">
        {icon}
      </span>
      <h1 className="mt-5 text-3xl">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-500">
        {copy}
      </p>
    </div>
  );
}
function ErrorMessage({ text }: { text: string }) {
  return (
    <p
      role="alert"
      className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      {text}
    </p>
  );
}
function Empty({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="p-12 text-center">
      <h2 className="text-xl">{title}</h2>
      <p className="mt-2 text-sm text-neutral-500">{copy}</p>
    </div>
  );
}
function RowsLoading() {
  return (
    <div className="animate-pulse divide-y">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 p-5">
          <div className="size-11 rounded-xl bg-gray-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-gray-100" />
            <div className="h-3 w-56 rounded bg-gray-50" />
          </div>
        </div>
      ))}
    </div>
  );
}
function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount || 0,
  );
}

// Hostinger source snapshot sync.
