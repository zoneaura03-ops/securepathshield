"use client";
import Image from "next/image";
import { FormEvent, use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ImageUp, Search, ShieldAlert, X } from "lucide-react";
import AdminTransactionHistoryGenerator from "../../../components/securepathbank-admin-transaction-history";
import AdminUserFunding from "../../../components/securepathbank-admin-user-funding";
import AdminCreateUser from "../../../components/securepathbank-admin-create-user";
import AdminSupport from "../../../components/securepathbank-admin-support";
import AdminTransferQueue from "../../../components/securepathbank-admin-transfer-queue";
import AdminProfileSettings from "../../../components/admin-profile-settings";
import AdminLiveChat from "../../../components/admin-live-chat";
import AdminPasswordSettings from "../../../components/admin-password-settings";
import AdminWalletDepositSettings from "../../../components/admin-wallet-deposit-settings";
import AdminCampaigns from "../../../components/admin-campaigns";
type Row = Record<string, string | number | null>;
export default function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const searchParams = useSearchParams();
  const section = use(params).section,
    [rows, setRows] = useState<Row[] | null>(null),
    [error, setError] = useState(""),
    [query, setQuery] = useState(searchParams.get("q") || ""),
    [userFilter, setUserFilter] = useState("all"),
    [amounts, setAmounts] = useState<Record<string, string>>({}),
    [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  async function load(q = "", filter = userFilter) {
    setRows(null);
    const resource = section === "transactions" ? "transfers" : section;
    const r = await fetch(
        `/api/admin/${resource}?q=${encodeURIComponent(q)}&filter=${encodeURIComponent(filter)}`,
      ),
      d = await r.json();
    r.ok ? setRows(d.rows) : setError(d.error);
  }
  useEffect(() => {
    if (!["settings", "crypto-balances", "transactions"].includes(section))
      load(searchParams.get("q") || "", "all");
  }, [section]);
  async function act(row: Row, action: string) {
    const resource = section === "transactions" ? "transfers" : section;
    const r = await fetch(`/api/admin/${resource}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          action,
          amount: amounts[String(row.id)],
          feedback: feedbacks[String(row.id)],
        }),
      }),
      d = await r.json();
    if (!r.ok) {
      setError(d.error);
      return;
    }
    load(query);
  }
  if (section === "settings")
    return (
      <div className="space-y-12">
        <AdminProfileSettings />
        <AdminPasswordSettings />
      </div>
    );
  if (section === "deposit-wallets")
    return (
      <div className="space-y-12">
        <DepositWalletSettings />
        <AdminWalletDepositSettings />
      </div>
    );
  if (section === "history-generator")
    return <AdminTransactionHistoryGenerator />;
  if (section === "campaigns") return <AdminCampaigns />;
  if (section === "user-funding") return <AdminUserFunding />;
  if (section === "crypto-balances") return <CryptoBalanceManager />;
  if (section === "support")
    return (
      <>
        <AdminSupport />
        <AdminLiveChat />
      </>
    );
  if (section === "transactions") return <AdminTransferQueue />;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-bank-600">
        Administration
      </p>
      <h1 className="mt-2 text-4xl capitalize">
        {section === "transactions" ? "Transfer approvals" : section}
      </h1>
      {section === "users" && <AdminCreateUser onCreated={() => load(query)} />}
      {section === "users" && (
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            load(query, userFilter);
          }}
          className="mt-6 grid max-w-3xl gap-2 sm:grid-cols-[1fr_220px_auto]"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="field"
            placeholder="Search name or email"
          />
          <select
            value={userFilter}
            onChange={(event) => {
              setUserFilter(event.target.value);
              load(query, event.target.value);
            }}
            className="field"
          >
            <option value="all">All customers</option>
            <option value="active">Active customers</option>
            <option value="with_account">With account number</option>
            <option value="unverified">Identity unverified</option>
            <option value="archived">Archived unverified</option>
          </select>
          <button className="btn">
            <Search size={16} />
            Search
          </button>
        </form>
      )}
      {error && (
        <p className="mt-5 rounded bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="card mt-6 overflow-hidden rounded-xl">
        {rows === null ? (
          <div className="animate-pulse space-y-px">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-neutral-50" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldAlert className="mx-auto text-gold-500" />
            <h2 className="mt-4 text-xl">Queue is clear</h2>
            <p className="mt-2 text-sm text-neutral-500">
              There are no records requiring attention.
            </p>
          </div>
        ) : (
          rows.map((row) => (
            <div
              className="flex flex-col gap-4 border-b p-5 last:border-0 lg:flex-row lg:items-center lg:justify-between"
              key={String(row.id)}
            >
              <div className="min-w-0">
                <p className="font-semibold">
                  {String(row.email || row.reference || row.action || "Record")}
                </p>
                <p className="mt-1 break-words text-xs text-neutral-500">
                  {summary(row, section)}
                </p>
                {section === "users" && (
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase">
                    <span
                      className={`rounded-full px-2.5 py-1 ${row.status === "active" ? "bg-gold-50 text-[#0a1728]" : "bg-neutral-100 text-neutral-600"}`}
                    >
                      {String(row.status)}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 ${row.kyc_verified ? "bg-gold-50 text-[#0a1728]" : "bg-amber-50 text-amber-700"}`}
                    >
                      {row.kyc_verified
                        ? "Identity verified"
                        : "Identity unverified"}
                    </span>
                    {row.account_number && (
                      <span className="rounded-full bg-bank-50 px-2.5 py-1 text-bank-700">
                        Account {String(row.account_number)}
                      </span>
                    )}
                  </div>
                )}
                {section === "transactions" && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded bg-amber-50 px-2 py-1 text-amber-800">
                      Stage: {String(row.verification_stage || "not started")}
                    </span>
                    <span className="rounded bg-gold-50 px-2 py-1 text-[#0a1728]">
                      Compliance: {String(row.clearance_code || "—")}
                    </span>
                    <span className="rounded bg-violet-50 px-2 py-1 text-violet-800">
                      Tax: {String(row.tax_code || "—")}
                    </span>
                    <span className="rounded bg-gold-50 px-2 py-1 text-[#0a1728]">
                      COT: {String(row.cot_code || "—")}
                    </span>
                  </div>
                )}
                {section === "grants" && (
                  <div className="mt-3 space-y-3">
                    <div className="grid gap-3 text-xs lg:grid-cols-2">
                      <div className="rounded-lg bg-neutral-50 p-3">
                        <span className="font-bold text-neutral-700">
                          Purpose and impact
                        </span>
                        <p className="mt-1 whitespace-pre-wrap leading-5 text-neutral-500">
                          {String(row.purpose || "Not provided")}
                        </p>
                      </div>
                      <div className="rounded-lg bg-neutral-50 p-3">
                        <span className="font-bold text-neutral-700">
                          Planned use of funds
                        </span>
                        <p className="mt-1 whitespace-pre-wrap leading-5 text-neutral-500">
                          {String(row.use_of_funds || "Not provided")}
                        </p>
                      </div>
                    </div>
                    {row.documents && (
                      <div className="flex flex-wrap gap-2">
                        {String(row.documents)
                          .split(";;")
                          .map((document) => {
                            const [id, name] = document.split("|");
                            return (
                              <a
                                key={id}
                                href={`/api/banking/grants/documents/${id}`}
                                className="rounded-lg border border-bank-200 bg-bank-50 px-3 py-2 text-xs font-bold text-bank-700"
                              >
                                {name}
                              </a>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
                {section === "deposits" &&
                  ["paypal", "cashapp", "skrill"].includes(
                    String(row.method),
                  ) && (
                    <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                      <p className="rounded-lg bg-neutral-50 p-3">
                        <b>Sender:</b>{" "}
                        {String(row.sender_identifier || "Not provided")}
                      </p>
                      <p className="rounded-lg bg-neutral-50 p-3">
                        <b>Provider transaction ID:</b>{" "}
                        {String(row.external_reference || "Not provided")}
                      </p>
                      {row.note && (
                        <p className="rounded-lg bg-neutral-50 p-3 sm:col-span-2">
                          <b>Note:</b> {String(row.note)}
                        </p>
                      )}
                      {row.receipt_storage_name && (
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href={`/api/admin/deposits/${row.id}/receipt`}
                          className="rounded-lg border border-bank-200 bg-bank-50 p-3 font-bold text-bank-700"
                        >
                          View payment receipt
                        </a>
                      )}
                    </div>
                  )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {section === "users" && row.kyc_verified && (
                  <button
                    type="button"
                    onClick={() =>
                      window.confirm(
                        "Revoke identity verification and allow this customer to reapply?",
                      ) && act(row, "revoke_identity")
                    }
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-700"
                  >
                    <X size={16} />
                    Revoke verification
                  </button>
                )}
                {section === "users" && !row.kyc_verified && (
                  <button
                    type="button"
                    onClick={() => act(row, "verify_identity")}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-gold-300 bg-gold-50 px-4 text-sm font-bold text-[#0a1728]"
                  >
                    <ShieldAlert size={16} />
                    Manually verify
                  </button>
                )}
                {section === "users" &&
                  !row.kyc_verified &&
                  userFilter !== "archived" && (
                    <button
                      type="button"
                      onClick={() => act(row, "archive_unverified")}
                      className="inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-bold text-neutral-600"
                    >
                      Clear from workspace
                    </button>
                  )}
                {section === "users" && userFilter === "archived" && (
                  <button
                    type="button"
                    onClick={() => act(row, "restore_archived")}
                    className="inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-bold text-bank-700"
                  >
                    Restore customer
                  </button>
                )}
                {section === "deposits" && (
                  <input
                    aria-label={`Confirmed ${String(row.method || row.currency || "asset").toUpperCase()} amount`}
                    className="field !w-32"
                    type="number"
                    min="0"
                    step={
                      ["btc", "eth"].includes(String(row.method).toLowerCase())
                        ? "0.00000001"
                        : "0.01"
                    }
                    placeholder={`${String(row.method || row.currency || "Asset").toUpperCase()} amount`}
                    value={
                      ["paypal", "cashapp", "skrill"].includes(
                        String(row.method),
                      )
                        ? String(row.amount || "")
                        : amounts[String(row.id)] || ""
                    }
                    readOnly={["paypal", "cashapp", "skrill"].includes(
                      String(row.method),
                    )}
                    onChange={(e) =>
                      setAmounts({
                        ...amounts,
                        [String(row.id)]: e.target.value,
                      })
                    }
                  />
                )}{" "}
                {section === "grants" && (
                  <textarea
                    aria-label="Decision feedback"
                    className="field min-h-20 !w-full lg:!w-72"
                    placeholder="Feedback or decline reason"
                    value={feedbacks[String(row.id)] || ""}
                    onChange={(event) =>
                      setFeedbacks({
                        ...feedbacks,
                        [String(row.id)]: event.target.value,
                      })
                    }
                  />
                )}
                {section === "cards" && row.status === "pending" && (
                  <>
                    <button
                      onClick={() => act(row, "decline")}
                      className="inline-flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold"
                    >
                      <X size={15} /> Decline
                    </button>
                    <button onClick={() => act(row, "approve")} className="btn">
                      <Check size={15} /> Approve
                    </button>
                  </>
                )}
                {section === "cards" &&
                  ["active", "frozen"].includes(String(row.status)) && (
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Revoke this card? Any remaining card balance will be returned to the customer's account.",
                          )
                        )
                          act(row, "revoke");
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-700"
                    >
                      <X size={15} /> Revoke card
                    </button>
                  )}
                {section === "cards" && row.status === "revoked" && (
                  <span className="rounded-full bg-red-50 px-3 py-2 text-xs font-bold uppercase text-red-700">
                    Revoked
                  </span>
                )}
                {section === "users" ? (
                  <button
                    onClick={() =>
                      act(row, row.status === "frozen" ? "unfreeze" : "freeze")
                    }
                    className={
                      row.status === "frozen"
                        ? "btn"
                        : "rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-700"
                    }
                  >
                    {row.status === "frozen" ? "Unfreeze" : "Freeze"}
                  </button>
                ) : (
                  section !== "audit" &&
                  section !== "cards" && (
                    <>
                      <button
                        onClick={() => act(row, "decline")}
                        className="inline-flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold"
                      >
                        <X size={15} />
                        Decline
                      </button>
                      <button
                        onClick={() => act(row, "approve")}
                        className="btn"
                      >
                        <Check size={15} />
                        {section === "deposits" ? "Confirm" : "Approve"}
                      </button>
                    </>
                  )
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
function summary(row: Row, section: string) {
  if (section === "grants")
    return `${row.project_title || row.legal_name} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${row.applicant_type} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${row.category || "General"} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${row.country || ""} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${row.currency || "USD"} ${Number(row.amount || 0).toLocaleString("en-US")} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${row.beneficiaries || 0} beneficiaries ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${row.timeline_months || 0} months`;
  if (section === "deposits")
    return `${String(row.method || "deposit").toUpperCase()} Ã‚Â· ${row.network || "Network unavailable"} Ã‚Â· ${row.reference} Ã‚Â· ${row.status}`;
  if (section === "cards") {
    const applicant = `${row.first_name || ""} ${row.last_name || ""}`.trim();
    const brand =
      row.brand === "amex" ? "Credit Card" : String(row.brand || "Card");
    return `${row.card_name || brand} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${brand.toUpperCase()} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${applicant || row.email} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Applied ${row.created_at}`;
  }
  if (section === "users")
    return `${row.first_name || ""} ${row.last_name || ""} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${row.status} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${row.role} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Account: ${row.account_number || "Not assigned"} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${row.account_type || ""} ${row.currency || ""}`;
  if (section === "audit")
    return `${row.action} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${row.entity_type} #${row.entity_id || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${row.created_at}`;
  return `${row.status} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${row.currency || ""} ${row.amount || ""} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${row.created_at}`;
}

type WalletSetting = {
  asset: "btc" | "eth" | "usdt";
  network: string;
  address: string;
  imageUrl: string | null;
  active: boolean;
  updatedAt: string | null;
};
function DepositWalletSettings() {
  const [settings, setSettings] = useState<WalletSetting[] | null>(null);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");
  async function loadSettings() {
    const response = await fetch("/api/admin/deposit-wallets");
    const result = await response.json();
    if (response.ok) setSettings(result.settings);
    else setSettingsError(result.error);
  }
  useEffect(() => {
    loadSettings();
  }, []);
  function change(asset: string, patch: Partial<WalletSetting>) {
    setSettings(
      (current) =>
        current?.map((item) =>
          item.asset === asset ? { ...item, ...patch } : item,
        ) || null,
    );
  }
  async function save(item: WalletSetting) {
    setSaving(item.asset);
    setMessage("");
    setSettingsError("");
    const form = new FormData();
    form.set("asset", item.asset);
    form.set("network", item.network);
    form.set("address", item.address);
    form.set("active", String(item.active));
    if (files[item.asset]) form.set("image", files[item.asset] as File);
    const response = await fetch("/api/admin/deposit-wallets", {
      method: "POST",
      body: form,
    });
    const result = await response.json();
    setSaving("");
    if (!response.ok) {
      setSettingsError(result.error);
      return;
    }
    setFiles((current) => ({ ...current, [item.asset]: null }));
    setMessage(`${item.asset.toUpperCase()} deposit wallet updated.`);
    await loadSettings();
  }
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-bank-600">
        Administration
      </p>
      <h1 className="mt-2 text-4xl">Deposit wallets</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
        Control the address customers receive when they generate a crypto
        deposit request. The typed address remains copyable; the optional
        screenshot replaces the generated QR display.
      </p>
      {message && (
        <p className="mt-5 rounded-xl bg-gold-50 p-4 text-sm text-[#0a1728]">
          {message}
        </p>
      )}
      {settingsError && (
        <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {settingsError}
        </p>
      )}
      <div className="mt-7 grid gap-6 xl:grid-cols-3">
        {settings === null
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-96 animate-pulse rounded-2xl bg-white"
              />
            ))
          : settings.map((item) => (
              <section
                key={item.asset}
                className="overflow-hidden rounded-2xl border border-[#dfe5ef] bg-white shadow-sm"
              >
                <div className="flex items-center justify-between border-b bg-neutral-50 px-5 py-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                      Deposit asset
                    </p>
                    <h2 className="mt-1 text-xl font-bold uppercase">
                      {item.asset}
                    </h2>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={item.active}
                      onChange={(event) =>
                        change(item.asset, { active: event.target.checked })
                      }
                      className="accent-bank-700"
                    />
                    Active
                  </label>
                </div>
                <div className="space-y-4 p-5">
                  <label>
                    <span className="label">Network</span>
                    <input
                      className="field"
                      value={item.network}
                      onChange={(event) =>
                        change(item.asset, { network: event.target.value })
                      }
                      placeholder="e.g. TRON TRC20"
                    />
                  </label>
                  <label>
                    <span className="label">Wallet address</span>
                    <textarea
                      className="field min-h-24 resize-y font-mono text-xs"
                      value={item.address}
                      onChange={(event) =>
                        change(item.asset, { address: event.target.value })
                      }
                      placeholder="Paste the receiving wallet address"
                    />
                  </label>
                  <div>
                    <span className="label">
                      Customer QR/address screenshot
                    </span>
                    {item.imageUrl && !files[item.asset] && (
                      <div className="mb-3 overflow-hidden rounded-xl border bg-neutral-50 p-2">
                        <Image
                          src={item.imageUrl}
                          alt={`${item.asset.toUpperCase()} deposit wallet`}
                          width={500}
                          height={300}
                          className="h-40 w-full object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                    <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-bank-300 bg-bank-50 px-4 text-sm font-bold text-bank-700">
                      <ImageUp size={17} />
                      {files[item.asset]?.name ||
                        (item.imageUrl
                          ? "Replace screenshot"
                          : "Upload screenshot")}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={(event) =>
                          setFiles({
                            ...files,
                            [item.asset]: event.target.files?.[0] || null,
                          })
                        }
                      />
                    </label>
                    <p className="mt-2 text-[10px] leading-4 text-neutral-400">
                      JPEG, PNG, or WebP up to 5 MB. Make sure it matches the
                      address above.
                    </p>
                  </div>
                  <button
                    onClick={() => save(item)}
                    disabled={
                      saving === item.asset ||
                      !item.address.trim() ||
                      !item.network.trim()
                    }
                    className="btn w-full justify-center disabled:opacity-50"
                  >
                    {saving === item.asset
                      ? "SavingÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦"
                      : `Save ${item.asset.toUpperCase()} wallet`}
                  </button>
                  {item.updatedAt && (
                    <p className="text-center text-[10px] text-neutral-400">
                      Last updated{" "}
                      {new Date(item.updatedAt).toLocaleString("en-GB")}
                    </p>
                  )}
                </div>
              </section>
            ))}
      </div>
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        <b>Important:</b> Verify the network, text address, and screenshot
        together before activating a wallet. Sending assets over the wrong
        network can permanently lose customer funds.
      </div>
    </div>
  );
}

type CryptoCustomer = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  btc_balance: number;
  eth_balance: number;
  usdt_balance: number;
};
function CryptoBalanceManager() {
  const [users, setUsers] = useState<CryptoCustomer[] | null>(null);
  const [search, setSearch] = useState("");
  const [assetFilter, setAssetFilter] = useState("ALL");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [selected, setSelected] = useState<CryptoCustomer | null>(null);
  const [asset, setAsset] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [creditError, setCreditError] = useState("");
  const [success, setSuccess] = useState("");
  async function loadUsers(
    q = search,
    selectedAsset = assetFilter,
    selectedBalance = balanceFilter,
  ) {
    setUsers(null);
    const response = await fetch(
      `/api/admin/crypto-balances?q=${encodeURIComponent(q)}&asset=${encodeURIComponent(selectedAsset)}&balance=${encodeURIComponent(selectedBalance)}`,
    );
    const result = await response.json();
    if (response.ok) setUsers(result.users);
    else setCreditError(result.error);
  }
  useEffect(() => {
    loadUsers("");
  }, []);
  async function credit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setCreditError("");
    setSuccess("");
    const response = await fetch("/api/admin/crypto-balances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selected.id,
        asset,
        amount: Number(amount),
        reason,
      }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setCreditError(result.error);
      return;
    }
    setSuccess(
      `${amount} ${asset} credited to ${selected.email}. Reference ${result.reference}.`,
    );
    setAmount("");
    setReason("");
    setSelected(null);
    await loadUsers();
  }
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-bank-600">
        Administration
      </p>
      <h1 className="mt-2 text-4xl">Crypto balances</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
        Search for a customer and manually credit BTC, ETH, or USDT. Every
        credit requires a reason, creates an audit record, and notifies the
        customer.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          loadUsers(search);
        }}
        className="mt-6 grid max-w-4xl gap-2 sm:grid-cols-[1fr_150px_180px_auto]"
      >
        <input
          className="field"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search customer name or email"
        />
        <select
          className="field"
          value={assetFilter}
          onChange={(event) => {
            setAssetFilter(event.target.value);
            loadUsers(search, event.target.value, balanceFilter);
          }}
        >
          <option value="ALL">All assets</option>
          <option>BTC</option>
          <option>ETH</option>
          <option>USDT</option>
        </select>
        <select
          className="field"
          value={balanceFilter}
          onChange={(event) => {
            setBalanceFilter(event.target.value);
            loadUsers(search, assetFilter, event.target.value);
          }}
        >
          <option value="all">Any balance</option>
          <option value="positive">Positive balance</option>
          <option value="zero">Zero balance</option>
        </select>
        <button className="btn">
          <Search size={16} />
          Filter
        </button>
      </form>
      {creditError && (
        <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {creditError}
        </p>
      )}
      {success && (
        <p className="mt-5 rounded-xl bg-gold-50 p-4 text-sm text-[#0a1728]">
          {success}
        </p>
      )}
      <div className="mt-6 overflow-hidden rounded-2xl border bg-white">
        {users === null ? (
          <div className="h-64 animate-pulse bg-neutral-50" />
        ) : users.length ? (
          users.map((user) => (
            <article
              key={user.id}
              className="flex flex-col gap-4 border-b p-5 last:border-0 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <b>
                  {user.first_name} {user.last_name}
                </b>
                <p className="mt-1 text-xs text-neutral-500">
                  {user.email} Â· {user.status}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold">
                  <span className="rounded bg-orange-50 px-2 py-1 text-orange-700">
                    {formatAdminCrypto(user.btc_balance, "BTC")}
                  </span>
                  <span className="rounded bg-indigo-50 px-2 py-1 text-indigo-700">
                    {formatAdminCrypto(user.eth_balance, "ETH")}
                  </span>
                  <span className="rounded bg-gold-50 px-2 py-1 text-[#0a1728]">
                    {formatAdminCrypto(user.usdt_balance, "USDT")}
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled={user.status !== "active"}
                onClick={() => {
                  setSelected(user);
                  setCreditError("");
                  setSuccess("");
                }}
                className="btn disabled:opacity-40"
              >
                Credit crypto
              </button>
            </article>
          ))
        ) : (
          <div className="p-12 text-center text-sm text-neutral-500">
            No customers found.
          </div>
        )}
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <form
            onSubmit={credit}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-bank-600">
              Manual credit
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              {selected.first_name} {selected.last_name}
            </h2>
            <p className="mt-1 text-xs text-neutral-500">{selected.email}</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label>
                <span className="label">Crypto asset</span>
                <select
                  className="field"
                  value={asset}
                  onChange={(event) => setAsset(event.target.value)}
                >
                  <option>BTC</option>
                  <option>ETH</option>
                  <option>USDT</option>
                </select>
              </label>
              <label>
                <span className="label">Credit amount</span>
                <input
                  required
                  type="number"
                  min="0"
                  step={asset === "USDT" ? "0.01" : "0.00000001"}
                  className="field"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder={`Amount in ${asset}`}
                />
              </label>
            </div>
            <label className="mt-5 block">
              <span className="label">Reason for credit</span>
              <textarea
                required
                minLength={5}
                maxLength={255}
                className="field min-h-24"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explain why this manual credit is being made"
              />
            </label>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelected(null)}
                disabled={saving}
                className="rounded-xl border px-4 py-3 text-sm font-bold"
              >
                Cancel
              </button>
              <button disabled={saving} className="btn justify-center">
                {saving ? "Creditingâ€¦" : `Credit ${asset}`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
function formatAdminCrypto(amount: number, asset: string) {
  return `${Number(amount || 0).toLocaleString("en-US", { maximumFractionDigits: asset === "USDT" ? 2 : 8 })} ${asset}`;
}
