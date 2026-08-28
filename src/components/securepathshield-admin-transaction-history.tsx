"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  CalendarRange,
  Check,
  History,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

type Customer = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  account_number: string;
  account_name: string;
  currency: string;
};
const railOptions = [
  ["paypal", "PayPal"],
  ["cashapp", "Cash App"],
  ["local_transfer", "Local transfer"],
  ["international_transfer", "International transfer"],
  ["internal_transfer", "Internal transfer"],
  ["btc", "BTC"],
  ["eth", "ETH"],
  ["usdt", "USDT"],
  ["card", "Card transaction"],
  ["stock_dividend", "Stock dividend"],
] as const;
const statusOptions = [
  ["processed", "Completed"],
  ["pending", "Pending"],
  ["processing", "Processing"],
  ["failed", "Failed"],
  ["declined", "Declined"],
  ["resolved", "Resolved"],
  ["refunded", "Refunded"],
] as const;

const descriptionOptions = [
  ["salary", "Salary or payroll"],
  ["merchant_purchase", "Merchant purchase"],
  ["online_purchase", "Online purchase"],
  ["bill_payment", "Bill payment"],
  ["subscription", "Subscription"],
  ["transfer", "Transfer sent/received"],
  ["refund", "Refund"],
  ["service_fee", "Service fee"],
  ["cash_withdrawal", "Cash withdrawal"],
  ["crypto_trade", "Crypto purchase/sale"],
  ["interest", "Interest"],
  ["stock_dividend", "Stock dividend income"],
  ["direct_debit", "Direct debit"],
  ["card_payment", "Card payment"],
  ["remittance", "Remittance"],
  ["account_adjustment", "Account adjustment"],
] as const;

export default function AdminTransactionHistoryGenerator() {
  const today = new Date().toISOString().slice(0, 10);
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const [users, setUsers] = useState<Customer[] | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [rails, setRails] = useState<string[]>(
    railOptions.map(([value]) => value),
  );
  const [direction, setDirection] = useState("mixed");
  const [statuses, setStatuses] = useState<string[]>(
    statusOptions.map(([value]) => value),
  );
  const [descriptionTypes, setDescriptionTypes] = useState<string[]>(
    descriptionOptions.map(([value]) => value),
  );
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(today);
  const [fromTime, setFromTime] = useState("00:00");
  const [toTime, setToTime] = useState("23:59");
  const [count, setCount] = useState("20");
  const [minimum, setMinimum] = useState("10");
  const [maximum, setMaximum] = useState("2500");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadUsers(search = "") {
    setUsers(null);
    setError("");
    const response = await fetch(
      `/api/admin/transaction-history?q=${encodeURIComponent(search)}`,
    );
    const data = await response.json();
    if (response.ok) setUsers(data.users);
    else setError(data.error);
  }
  useEffect(() => {
    loadUsers();
  }, []);
  function toggleRail(rail: string) {
    setRails((current) =>
      current.includes(rail)
        ? current.filter((item) => item !== rail)
        : [...current, rail],
    );
  }
  function toggleStatus(status: string) {
    setStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
    );
  }
  function toggleDescription(descriptionType: string) {
    setDescriptionTypes((current) =>
      current.includes(descriptionType)
        ? current.filter((item) => item !== descriptionType)
        : [...current, descriptionType],
    );
  }
  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!selected) return setError("Select a customer first.");
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/transaction-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selected.id,
          rails,
          statuses,
          descriptionTypes,
          direction,
          from,
          to,
          fromTime,
          toTime,
          count: Number(count),
          minimum: Number(minimum),
          maximum: Number(maximum),
          description,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        return setError(
          data.error || `History generation failed (HTTP ${response.status}).`,
        );
      setSuccess(
        `${data.count} audited historical transactions were generated for ${selected.email}. ${data.notificationCount} notifications were created. ${data.emailDelivered ? "A PDF was emailed to the customer for download." : "The PDF email could not be delivered; check SMTP settings."} Live balance was not changed.`,
      );
    } catch {
      setError(
        "The history request could not reach the server. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <section className="relative overflow-hidden rounded-[28px] bg-[#09251b] p-7 text-white shadow-[0_22px_65px_rgba(7,36,25,.17)] sm:p-9">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-emerald-300">
            <Sparkles size={14} /> Account history tools
          </p>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
            Transaction history generator
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">
            Create audited debit and credit history across supported payment
            rails for a selected period. Generated history does not alter the
            customer’s live available or ledger balance.
          </p>
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="mt-7 grid gap-6 xl:grid-cols-[.72fr_1.28fr]">
        <section className="rounded-3xl border border-[#dfe7e2] bg-white p-6 shadow-[0_12px_35px_rgba(21,57,41,.05)]">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-bank-50 text-bank-700">
              <UserRound size={20} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Step one
              </p>
              <h2 className="text-xl">Choose customer</h2>
            </div>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              loadUsers(query);
            }}
            className="mt-5 flex gap-2"
          >
            <input
              className="field"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or email"
            />
            <button className="btn !px-4" aria-label="Search customers">
              <Search size={17} />
            </button>
          </form>
          <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {users === null ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-xl bg-neutral-50"
                />
              ))
            ) : users.length ? (
              users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelected(user)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${selected?.id === user.id ? "border-bank-500 bg-bank-50 ring-2 ring-bank-100" : "border-[#e5ebe7] hover:bg-neutral-50"}`}
                >
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold ${selected?.id === user.id ? "bg-bank-700 text-white" : "bg-neutral-100 text-neutral-600"}`}
                  >
                    {user.first_name[0]}
                    {user.last_name[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-sm">
                      {user.first_name} {user.last_name}
                    </b>
                    <span className="mt-0.5 block truncate text-[11px] text-neutral-400">
                      {user.email}
                    </span>
                    <span className="mt-1 block text-[10px] text-neutral-500">
                      •••• {String(user.account_number).slice(-4)} ·{" "}
                      {user.currency}
                    </span>
                  </span>
                  {selected?.id === user.id && (
                    <Check size={17} className="text-bank-700" />
                  )}
                </button>
              ))
            ) : (
              <p className="rounded-xl bg-neutral-50 p-8 text-center text-sm text-neutral-500">
                No customers found.
              </p>
            )}
          </div>
        </section>

        <form
          onSubmit={generate}
          className="rounded-3xl border border-[#dfe7e2] bg-white p-6 shadow-[0_12px_35px_rgba(21,57,41,.05)] sm:p-7"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-bank-50 text-bank-700">
              <History size={20} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Step two
              </p>
              <h2 className="text-xl">Configure history</h2>
            </div>
          </div>
          {selected && (
            <div className="mt-5 rounded-2xl bg-[#f4f8f5] p-4">
              <p className="text-xs font-semibold text-bank-800">
                Generating for {selected.first_name} {selected.last_name}
              </p>
              <p className="mt-1 text-[11px] text-neutral-500">
                {selected.account_name} · {selected.currency} · ••••{" "}
                {String(selected.account_number).slice(-4)}
              </p>
            </div>
          )}

          <fieldset className="mt-6">
            <legend className="label">Transaction rails</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {railOptions.map(([value, label]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold ${rails.includes(value) ? "border-bank-300 bg-bank-50 text-bank-800" : "border-[#e3e9e5] text-neutral-500"}`}
                >
                  <input
                    type="checkbox"
                    checked={rails.includes(value)}
                    onChange={() => toggleRail(value)}
                    className="accent-bank-700"
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="mt-2 flex gap-3 text-[11px]">
              <button
                type="button"
                onClick={() => setRails(railOptions.map(([value]) => value))}
                className="font-semibold text-bank-700"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setRails([])}
                className="font-semibold text-neutral-400"
              >
                Clear
              </button>
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="label">Transaction statuses</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {statusOptions.map(([value, label]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold ${statuses.includes(value) ? "border-bank-300 bg-bank-50 text-bank-800" : "border-[#e3e9e5] text-neutral-500"}`}
                >
                  <input
                    type="checkbox"
                    checked={statuses.includes(value)}
                    onChange={() => toggleStatus(value)}
                    className="accent-bank-700"
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="mt-2 flex gap-3 text-[11px]">
              <button
                type="button"
                onClick={() =>
                  setStatuses(statusOptions.map(([value]) => value))
                }
                className="font-semibold text-bank-700"
              >
                All statuses
              </button>
              <button
                type="button"
                onClick={() => setStatuses([])}
                className="font-semibold text-neutral-400"
              >
                Clear
              </button>
            </div>
          </fieldset>
          <fieldset className="mt-6">
            <legend className="label">Historical descriptions</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {descriptionOptions.map(([value, label]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold ${descriptionTypes.includes(value) ? "border-bank-300 bg-bank-50 text-bank-800" : "border-[#e3e9e5] text-neutral-500"}`}
                >
                  <input
                    type="checkbox"
                    checked={descriptionTypes.includes(value)}
                    onChange={() => toggleDescription(value)}
                    className="accent-bank-700"
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="mt-2 flex gap-3 text-[11px]">
              <button
                type="button"
                onClick={() =>
                  setDescriptionTypes(
                    descriptionOptions.map(([value]) => value),
                  )
                }
                className="font-semibold text-bank-700"
              >
                All descriptions
              </button>
              <button
                type="button"
                onClick={() => setDescriptionTypes([])}
                className="font-semibold text-neutral-400"
              >
                Clear
              </button>
            </div>
          </fieldset>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label>
              <span className="label">Direction</span>
              <select
                className="field"
                value={direction}
                onChange={(event) => setDirection(event.target.value)}
              >
                <option value="mixed">Mixed debit and credit</option>
                <option value="debit">Debit only</option>
                <option value="credit">Credit only</option>
              </select>
            </label>
            <label>
              <span className="label">Number of entries</span>
              <input
                required
                className="field"
                type="number"
                min="1"
                max="200"
                value={count}
                onChange={(event) => setCount(event.target.value)}
              />
            </label>
            <label>
              <span className="label">From date</span>
              <input
                required
                className="field"
                type="date"
                max={to}
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </label>
            <label>
              <span className="label">To date</span>
              <input
                required
                className="field"
                type="date"
                min={from}
                max={today}
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </label>
            <label>
              <span className="label">From time (24-hour)</span>
              <input
                required
                className="field"
                type="time"
                step="60"
                value={fromTime}
                onChange={(event) => setFromTime(event.target.value)}
              />
            </label>
            <label>
              <span className="label">To time (24-hour)</span>
              <input
                required
                className="field"
                type="time"
                step="60"
                value={toTime}
                onChange={(event) => setToTime(event.target.value)}
              />
            </label>
            <label>
              <span className="label">Minimum amount</span>
              <input
                required
                className="field"
                type="number"
                min="0.01"
                step="0.01"
                value={minimum}
                onChange={(event) => setMinimum(event.target.value)}
              />
            </label>
            <label>
              <span className="label">Maximum amount</span>
              <input
                required
                className="field"
                type="number"
                min={minimum || "0.01"}
                step="0.01"
                value={maximum}
                onChange={(event) => setMaximum(event.target.value)}
              />
            </label>
          </div>
          <label className="mt-5 block">
            <span className="label">Optional reference text</span>
            <input
              className="field"
              maxLength={100}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Appended to each generated description"
            />
          </label>

          <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
            <ShieldCheck size={18} className="mt-0.5 shrink-0" />
            <p>
              Every generated entry is marked as administrator-generated in
              metadata and recorded in the audit history. This tool changes
              history only, not live balances.
            </p>
          </div>
          <button
            disabled={
              saving ||
              !selected ||
              !rails.length ||
              !statuses.length ||
              !descriptionTypes.length
            }
            className="btn mt-6 w-full rounded-xl"
          >
            <CalendarRange size={17} />
            {saving
              ? "Generating history…"
              : `Generate ${count || 0} transaction${count === "1" ? "" : "s"}`}
          </button>
          {success && (
            <div
              role="status"
              className="mt-3 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
            >
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
                <Check size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">History generated successfully</p>
                <p className="mt-1 break-words text-xs leading-5 text-emerald-700">
                  {success}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSuccess("")}
                className="text-xs font-bold text-emerald-700"
                aria-label="Dismiss confirmation"
              >
                ×
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// Hostinger source snapshot sync.
