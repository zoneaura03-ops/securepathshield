"use client";

import { FormEvent, useState } from "react";
import { BellRing, Send } from "lucide-react";

export default function AdminCampaigns() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setError("");
    setStatus("");
    const response = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, actionUrl }),
    });
    const data = await response.json().catch(() => ({}));
    setSending(false);
    if (!response.ok)
      return setError(data.error || "Campaign delivery failed.");
    setStatus(
      `Campaign delivered in-app to ${data.recipientCount} active customer${data.recipientCount === 1 ? "" : "s"}. ${data.emailDeliveredCount} email${data.emailDeliveredCount === 1 ? " was" : "s were"} sent${data.emailFailedCount ? `; ${data.emailFailedCount} failed.` : "."}`,
    );
    setTitle("");
    setMessage("");
    setActionUrl("");
  }
  return (
    <div className="mx-auto max-w-3xl">
      <section className="rounded-[28px] bg-[#10233f] p-8 text-white">
        <BellRing className="text-blue-300" />
        <h1 className="mt-4 text-3xl">Campaign notifications</h1>
        <p className="mt-2 text-sm text-white/60">
          Send an in-app announcement to every active customer.
        </p>
      </section>
      <form onSubmit={submit} className="card mt-6 space-y-5 rounded-3xl p-7">
        <label className="block">
          <span className="label">Campaign title</span>
          <input
            required
            minLength={3}
            maxLength={180}
            className="field"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="label">Message</span>
          <textarea
            required
            minLength={5}
            maxLength={5000}
            className="field min-h-40"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="label">Optional dashboard link</span>
          <input
            className="field"
            placeholder="/dashboard"
            value={actionUrl}
            onChange={(event) => setActionUrl(event.target.value)}
          />
        </label>
        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {status && (
          <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
            {status}
          </p>
        )}
        <button disabled={sending} className="btn w-full">
          <Send size={16} />
          {sending ? "Sending…" : "Send campaign"}
        </button>
      </form>
    </div>
  );
}
