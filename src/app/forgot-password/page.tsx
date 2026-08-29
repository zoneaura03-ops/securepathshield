"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import Logo from "../../components/logo";
export default function Page() {
  const [email, setEmail] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const r = await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }),
      d = await r.json();
    r.ok ? setMessage(d.message) : setError(d.error);
    setLoading(false);
  }
  return (
    <main className="grid min-h-screen place-items-center bg-bank-50 px-4">
      <form onSubmit={submit} className="card w-full max-w-md rounded-xl p-8">
        <Logo />
        <h1 className="mt-8 text-3xl">Reset your password</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Enter your email and we’ll send a secure, time-limited reset link.
        </p>
        {message ? (
          <div className="mt-7 rounded-lg bg-blue-50 p-4 text-sm leading-6 text-blue-800">
            {message}
          </div>
        ) : (
          <>
            <label className="mt-7 block">
              <span className="label">Email address</span>
              <input
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
                type="email"
              />
            </label>
            {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
            <button disabled={loading} className="btn mt-5 w-full">
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </>
        )}
        <Link
          href="/login"
          className="mt-6 block text-center text-sm font-semibold text-bank-700"
        >
          Return to sign in
        </Link>
      </form>
    </main>
  );
}
