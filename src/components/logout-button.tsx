"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton({ admin = false }: { admin?: boolean }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(admin ? "/admin-login" : "/login");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="inline-flex items-center gap-2 rounded px-3 py-2 text-sm text-current opacity-70 hover:bg-black/5 hover:opacity-100"
    >
      <LogOut size={16} />
      Sign out
    </button>
  );
}

// Hostinger source snapshot sync.
