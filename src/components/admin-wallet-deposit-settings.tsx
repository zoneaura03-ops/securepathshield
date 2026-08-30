"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Copy, ImageUp, Save } from "lucide-react";

type Setting = {
  provider: "paypal" | "cashapp" | "skrill";
  accountName: string;
  identifier: string;
  instructions: string;
  qrImageUrl: string | null;
  active: boolean;
  updatedAt: string | null;
};
const names = { paypal: "PayPal", cashapp: "Cash App", skrill: "Skrill" };

export default function AdminWalletDepositSettings() {
  const [settings, setSettings] = useState<Setting[] | null>(null);
  const [saving, setSaving] = useState("");
  const [qrFiles, setQrFiles] = useState<Record<string, File | null>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function load() {
    const response = await fetch("/api/admin/wallet-deposit-settings");
    const result = await response.json();
    response.ok ? setSettings(result.settings) : setError(result.error);
  }
  useEffect(() => { load(); }, []);
  function change(provider: string, patch: Partial<Setting>) {
    setSettings((current) => current?.map((item) => item.provider === provider ? { ...item, ...patch } : item) || null);
  }
  async function save(item: Setting) {
    setSaving(item.provider); setMessage(""); setError("");
    const form = new FormData();
    form.set("provider", item.provider);
    form.set("accountName", item.accountName);
    form.set("identifier", item.identifier);
    form.set("instructions", item.instructions);
    form.set("active", String(item.active));
    if (qrFiles[item.provider]) form.set("qrImage", qrFiles[item.provider] as File);
    const response = await fetch("/api/admin/wallet-deposit-settings", {
      method: "POST",
      body: form,
    });
    const result = await response.json();
    setSaving("");
    if (!response.ok) return setError(result.error);
    setQrFiles((current)=>({...current,[item.provider]:null}));
    setMessage(`${names[item.provider]} receiving details updated.`);
    await load();
  }
  return <section>
    <div className="flex items-center gap-3"><Copy className="text-bank-700" /><div><h2 className="text-2xl font-bold">Wallet payment details</h2><p className="mt-1 text-sm text-neutral-500">Configure the details customers copy before uploading payment receipts.</p></div></div>
    {message && <p className="mt-5 rounded-xl bg-gold-50 p-4 text-sm text-gold-700">{message}</p>}
    {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <div className="mt-6 grid gap-6 xl:grid-cols-3">
      {settings === null ? Array.from({length:3}).map((_,i)=><div key={i} className="h-96 animate-pulse rounded-2xl bg-white" />) : settings.map((item)=>
        <article key={item.provider} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><h3 className="text-xl font-bold">{names[item.provider]}</h3><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" className="accent-bank-700" checked={item.active} onChange={(e)=>change(item.provider,{active:e.target.checked})}/>Active</label></div>
          <div className="mt-5 space-y-4">
            <label><span className="label">Recipient/account name</span><input className="field" value={item.accountName} onChange={(e)=>change(item.provider,{accountName:e.target.value})} /></label>
            <label><span className="label">{item.provider === "cashapp" ? "Receiving cashtag" : "Receiving email"}</span><input className="field" value={item.identifier} onChange={(e)=>change(item.provider,{identifier:e.target.value})} placeholder={item.provider === "cashapp" ? "$Cashtag" : "payments@example.com"} /></label>
            <label><span className="label">Payment instructions</span><textarea className="field min-h-28 resize-y" maxLength={1000} value={item.instructions} onChange={(e)=>change(item.provider,{instructions:e.target.value})} placeholder="Add any reference or payment instructions customers must follow." /></label>
            <div><span className="label">Payment QR code (optional)</span>{item.qrImageUrl && !qrFiles[item.provider] && <div className="mb-3 rounded-xl border bg-neutral-50 p-3"><Image src={item.qrImageUrl} alt={`${names[item.provider]} payment QR code`} width={320} height={320} className="mx-auto size-40 object-contain" unoptimized /></div>}<label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-bank-300 bg-bank-50 px-3 text-xs font-bold text-bank-700"><ImageUp size={16}/>{qrFiles[item.provider]?.name || (item.qrImageUrl ? "Replace QR code" : "Upload QR code")}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e)=>setQrFiles({...qrFiles,[item.provider]:e.target.files?.[0] || null})}/></label><p className="mt-2 text-[10px] text-neutral-400">JPEG, PNG, or WebP; maximum 5 MB.</p></div>
            <button type="button" onClick={()=>save(item)} disabled={saving===item.provider} className="btn w-full justify-center"><Save size={16}/>{saving===item.provider ? "Saving..." : `Save ${names[item.provider]}`}</button>
          </div>
        </article>)}
    </div>
  </section>;
}

// Hostinger source snapshot sync.
