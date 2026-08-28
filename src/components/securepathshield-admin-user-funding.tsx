"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Bitcoin,
  Check,
  Coins,
  Landmark,
  Search,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";

type FundingCard = {
  id: number;
  user_id: number;
  brand: string;
  card_name: string;
  last_four: string;
  currency: string;
  balance: number;
  status: string;
};
type Customer = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  account_number: string;
  account_name: string;
  currency: string;
  available_balance: number;
  ledger_balance: number;
  btc_balance: number;
  eth_balance: number;
  usdt_balance: number;
};
const fundingOptions = [
  ["bank_deposit", "Bank deposit", "account"],
  ["wire_transfer", "Wire transfer", "account"],
  ["local_transfer", "Local transfer", "account"],
  ["international_transfer", "International transfer", "account"],
  ["internal_transfer", "Internal transfer", "account"],
  ["paypal", "PayPal", "account"],
  ["cashapp", "Cash App", "account"],
  ["skrill", "Skrill", "account"],
  ["card", "Card funding", "account"],
  ["cash_deposit", "Cash deposit", "account"],
  ["stock_dividend", "Stock dividend", "account"],
  ["btc", "BTC", "crypto"],
  ["eth", "ETH", "crypto"],
  ["usdt", "USDT", "crypto"],
] as const;

export default function AdminUserFunding() {
  const [users, setUsers] = useState<Customer[] | null>(null);
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState<FundingCard[]>([]);
  const [cardId, setCardId] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [fundingType, setFundingType] = useState("bank_deposit");
  const [amount, setAmount] = useState("");
  const [externalReference, setExternalReference] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadUsers(search = "") {
    setUsers(null);
    setError("");
    const response = await fetch(
      `/api/admin/user-funding?q=${encodeURIComponent(search)}`,
    );
    const data = await response.json();
    if (response.ok) {
      setUsers(data.users);
      setCards(data.cards || []);
    } else setError(data.error);
  }
  useEffect(() => {
    loadUsers();
  }, []);

  async function fund(event: FormEvent) {
    event.preventDefault();
    if (!selected) return setError("Select a customer first.");
    setSaving(true);
    setError("");
    setSuccess("");
    const response = await fetch("/api/admin/user-funding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selected.id,
        fundingType,
        cardId: cardId ? Number(cardId) : null,
        amount: Number(amount.replace(/,/g, "")),
        externalReference,
        reason,
      }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setError(data.error);
    const label =
      fundingOptions.find(([value]) => value === fundingType)?.[1] ||
      fundingType;
    setSuccess(
      `${label} funding completed for ${selected.email}. Reference ${data.reference}.`,
    );
    setAmount("");
    setExternalReference("");
    setReason("");
    await loadUsers(query);
  }

  const crypto = ["btc", "eth", "usdt"].includes(fundingType);
  const numericAmount = Number(amount.replace(/,/g, ""));
  const selectedLabel =
    fundingOptions.find(([value]) => value === fundingType)?.[1] || "Funding";

  return (
    <div className="mx-auto max-w-[1400px]">
      <section className="relative overflow-hidden rounded-[28px] bg-[#09251b] p-7 text-white shadow-[0_22px_65px_rgba(7,36,25,.17)] sm:p-9">
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-emerald-300">
            <Coins size={15} /> Treasury operations
          </p>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
            Fund customer accounts
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">
            Credit live account or crypto balances through supported funding
            rails. Every funding action creates a customer notification and
            administrator audit record.
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
          <div className="mt-4 max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {users === null ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-xl bg-neutral-50"
                />
              ))
            ) : users.length ? (
              users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    setSelected(user);
                    setCardId(
                      String(
                        cards.find((card) => card.user_id === user.id)?.id ||
                          "",
                      ),
                    );
                  }}
                  className={`w-full rounded-xl border p-4 text-left transition ${selected?.id === user.id ? "border-bank-500 bg-bank-50 ring-2 ring-bank-100" : "border-[#e5ebe7] hover:bg-neutral-50"}`}
                >
                  <div className="flex items-center gap-3">
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
                      <span className="block truncate text-[11px] text-neutral-400">
                        {user.email}
                      </span>
                    </span>
                    {selected?.id === user.id && (
                      <Check size={17} className="text-bank-700" />
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                    <span className="rounded-lg bg-white p-2 text-neutral-500">
                      Account{" "}
                      <b className="block mt-1 text-neutral-800">
                        {money(user.available_balance, user.currency)}
                      </b>
                    </span>
                    <span className="rounded-lg bg-white p-2 text-neutral-500">
                      Crypto{" "}
                      <b className="block mt-1 text-neutral-800">
                        {user.btc_balance} BTC · {user.eth_balance} ETH ·{" "}
                        {user.usdt_balance} USDT
                      </b>
                    </span>
                  </div>
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
          onSubmit={fund}
          className="rounded-3xl border border-[#dfe7e2] bg-white p-6 shadow-[0_12px_35px_rgba(21,57,41,.05)] sm:p-7"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-bank-50 text-bank-700">
              {crypto ? <Bitcoin size={20} /> : <WalletCards size={20} />}
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Step two
              </p>
              <h2 className="text-xl">Configure live funding</h2>
            </div>
          </div>
          {selected && (
            <div className="mt-5 rounded-2xl bg-[#f4f8f5] p-4">
              <p className="text-xs font-semibold text-bank-800">
                Funding {selected.first_name} {selected.last_name}
              </p>
              <p className="mt-1 text-[11px] text-neutral-500">
                {selected.account_name} · {selected.currency} · ••••{" "}
                {String(selected.account_number).slice(-4)}
              </p>
            </div>
          )}
          <fieldset className="mt-6">
            <legend className="label">Funding type</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {fundingOptions.map(([value, label, kind]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold ${fundingType === value ? "border-bank-400 bg-bank-50 text-bank-800" : "border-[#e3e9e5] text-neutral-500"}`}
                >
                  <input
                    type="radio"
                    name="fundingType"
                    value={value}
                    checked={fundingType === value}
                    onChange={() => setFundingType(value)}
                    className="accent-bank-700"
                  />
                  {label}
                  {kind === "crypto" && (
                    <span className="ml-auto rounded bg-orange-50 px-1.5 py-0.5 text-[8px] text-orange-700">
                      CRYPTO
                    </span>
                  )}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label>
              <span className="label">
                Amount{" "}
                {crypto
                  ? `(${fundingType.toUpperCase()})`
                  : selected
                    ? `(${selected.currency})`
                    : ""}
              </span>
              <input
                required
                className="field"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(event) =>
                  setAmount(sanitizeAmount(event.target.value, crypto))
                }
                placeholder={crypto ? "0.00000000" : "0.00"}
              />
              <span className="mt-2 block text-xs font-semibold text-bank-700">
                {Number.isFinite(numericAmount) && numericAmount > 0
                  ? crypto
                    ? `${numericAmount.toLocaleString("en-US", { maximumFractionDigits: fundingType === "usdt" ? 2 : 8 })} ${fundingType.toUpperCase()}`
                    : money(numericAmount, selected?.currency || "USD")
                  : "Enter the amount to credit"}
              </span>
            </label>
            {fundingType === "card" && (
              <label>
                <span className="label">Approved card</span>
                <select
                  required
                  className="field"
                  value={cardId}
                  onChange={(event) => setCardId(event.target.value)}
                >
                  <option value="">Select card</option>
                  {cards
                    .filter((card) => card.user_id === selected?.id)
                    .map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.card_name} · •••• {card.last_four} ·{" "}
                        {money(card.balance, card.currency)}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <label>
              <span className="label">External reference (optional)</span>
              <input
                className="field"
                maxLength={80}
                value={externalReference}
                onChange={(event) => setExternalReference(event.target.value)}
                placeholder="Bank or provider reference"
              />
            </label>
          </div>
          <label className="mt-5 block">
            <span className="label">Funding reason</span>
            <textarea
              required
              minLength={5}
              maxLength={255}
              className="field min-h-28 resize-y"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain and authorize this funding action"
            />
          </label>
          <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
            <ShieldCheck size={18} className="mt-0.5 shrink-0" />
            <p>
              {crypto
                ? `${selectedLabel} will be credited to the customer’s actual crypto wallet.`
                : fundingType === "card"
                  ? "The amount will be credited directly to the selected active card balance."
                  : `${selectedLabel} will immediately increase both the available and ledger account balances.`}{" "}
              This action is permanent and audited.
            </p>
          </div>
          <button
            disabled={
              saving ||
              !selected ||
              !amount ||
              reason.trim().length < 5 ||
              (fundingType === "card" && !cardId)
            }
            className="btn mt-6 w-full rounded-xl"
          >
            <Landmark size={17} />
            {saving ? "Funding account…" : `Fund with ${selectedLabel}`}
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
                <p className="font-semibold">Funding completed</p>
                <p className="mt-1 break-words text-xs leading-5 text-emerald-700">
                  {success}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSuccess("")}
                className="text-xs font-bold"
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
function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    Number(amount || 0),
  );
}

function sanitizeAmount(value: string, crypto: boolean) {
  const cleaned = value.replace(/,/g, "").replace(/[^0-9.]/g, "");
  const [whole = "", ...fractionParts] = cleaned.split(".");
  const fraction = fractionParts.join("").slice(0, crypto ? 8 : 2);
  const normalizedWhole = whole.replace(/^0+(?=\d)/, "");
  return fractionParts.length
    ? `${normalizedWhole || "0"}.${fraction}`
    : normalizedWhole;
}

// Hostinger source snapshot sync.
