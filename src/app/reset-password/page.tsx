"use client";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "../../components/logo";
export default function Page() {
  const params = useSearchParams(),
    router = useRouter(),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setLoading(true);
    const r = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.get("token"), password }),
      }),
      d = await r.json();
    if (!r.ok) {
      setError(d.error);
      setLoading(false);
      return;
    }
    router.push("/login?notice=password-changed");
  }
  return (
    <main className="grid min-h-screen place-items-center bg-bank-50 px-4">
      <form onSubmit={submit} className="card w-full max-w-md rounded-xl p-8">
        <Logo />
        <h1 className="mt-8 text-3xl">Choose a new password</h1>
        <p className="mt-2 text-sm text-gray-500">
          Use at least 10 characters and avoid passwords used elsewhere.
        </p>
        <label className="mt-7 block">
          <span className="label">New password</span>
          <input
            required
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
            type="password"
          />
        </label>
        <label className="mt-4 block">
          <span className="label">Confirm password</span>
          <input
            required
            minLength={10}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="field"
            type="password"
          />
        </label>
        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="btn mt-6 w-full">
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </main>
  );
}
