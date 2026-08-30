"use client";
import { FormEvent, useEffect, useState } from "react";
import { Bot, Headset, MessageCircle, Send, UserRound } from "lucide-react";

type Conversation = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  unread_count: number;
  last_message: string;
};
type Message = {
  id: number;
  sender_role: "user" | "admin" | "bot";
  message: string;
  created_at: string;
};

export default function AdminLiveChat() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function loadList() {
    const response = await fetch("/api/admin/support-chat", {
      cache: "no-store",
    });
    const data = await response.json();
    if (response.ok) setItems(data.conversations || []);
  }
  async function loadMessages(userId: number) {
    const response = await fetch(`/api/admin/support-chat?userId=${userId}`, {
      cache: "no-store",
    });
    const data = await response.json();
    if (response.ok) setMessages(data.messages || []);
  }
  useEffect(() => {
    loadList();
    const timer = setInterval(() => {
      loadList();
      if (selected) loadMessages(selected.id);
    }, 5000);
    return () => clearInterval(timer);
  }, [selected]);
  async function send(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const response = await fetch("/api/admin/support-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selected.id, message }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error);
    setMessage("");
    await loadMessages(selected.id);
    await loadList();
  }
  return (
    <section className="mt-10">
      <div className="flex items-center gap-3">
        <MessageCircle className="text-gold-500" />
        <div>
          <h2 className="text-2xl font-bold">Live customer chat</h2>
          <p className="text-xs text-neutral-500">
            Customer, automated bot, and customer-care replies use distinct
            colors and labels.
          </p>
        </div>
      </div>
      <div className="card mt-5 grid min-h-[480px] overflow-hidden rounded-2xl md:grid-cols-[300px_1fr]">
        <aside className="border-r bg-neutral-50">
          {items.length ? (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelected(item);
                  loadMessages(item.id);
                }}
                className={`block w-full border-b p-4 text-left ${selected?.id === item.id ? "bg-bank-50" : "hover:bg-white"}`}
              >
                <div className="flex justify-between gap-2">
                  <b className="text-sm">
                    {item.first_name} {item.last_name}
                  </b>
                  {Number(item.unread_count) > 0 && (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white">
                      {item.unread_count}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-[10px] text-neutral-500">
                  {item.email}
                </p>
                <p className="mt-2 truncate text-xs text-neutral-500">
                  {item.last_message}
                </p>
              </button>
            ))
          ) : (
            <p className="p-8 text-center text-sm text-neutral-400">
              No chat conversations yet.
            </p>
          )}
        </aside>
        <div className="flex min-h-[480px] flex-col">
          {selected ? (
            <>
              <div className="border-b p-4">
                <b>
                  {selected.first_name} {selected.last_name}
                </b>
                <p className="text-xs text-neutral-500">{selected.email}</p>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 p-5">
                {messages.map((item) => {
                  const admin = item.sender_role === "admin";
                  const bot = item.sender_role === "bot";
                  const Icon = admin ? Headset : bot ? Bot : UserRound;
                  return (
                    <div
                      key={item.id}
                      className={`max-w-[85%] rounded-2xl border p-3 text-sm shadow-sm ${admin ? "ml-auto border-[#0a1728] bg-[#0a1728] text-white" : bot ? "border-violet-200 bg-violet-50 text-violet-950" : "border-sky-200 bg-sky-50 text-sky-950"}`}
                    >
                      <p
                        className={`mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest ${admin ? "text-gold-300" : bot ? "text-violet-700" : "text-sky-700"}`}
                      >
                        <Icon size={12} />
                        {admin
                          ? "Customer care"
                          : bot
                            ? "Automated assistant"
                            : "Customer message"}
                      </p>
                      <p className="whitespace-pre-wrap break-words">
                        {item.message}
                      </p>
                      <p className="mt-1 text-[9px] opacity-60">
                        {new Date(item.created_at).toLocaleString("en-GB")}
                      </p>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={send} className="flex gap-2 border-t p-4">
                <input
                  required
                  maxLength={2000}
                  className="field"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Reply as customer care..."
                />
                <button className="btn px-4">
                  <Send size={16} />
                </button>
              </form>
              {error && (
                <p className="px-4 pb-3 text-xs text-red-700">{error}</p>
              )}
            </>
          ) : (
            <div className="grid flex-1 place-items-center text-sm text-neutral-400">
              Select a customer conversation.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
