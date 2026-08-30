"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  Activity,
  BellRing,
  Bitcoin,
  CircleDollarSign,
  ChevronRight,
  ChevronDown,
  CreditCard,
  FileCheck2,
  Gift,
  History,
  LayoutDashboard,
  Landmark,
  Search,
  Settings,
  ShieldCheck,
  Headphones,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Logo from "./logo";
import { LogoutButton } from "./logout-button";
import type { AuthUser } from "../lib/auth";

type AdminLink = [string, string, LucideIcon];
type AdminGroup = { label: string; links: AdminLink[] };

const groups: AdminGroup[] = [
  {
    label: "Command center",
    links: [
      ["Overview", "/admin", LayoutDashboard],
      ["Customers", "/admin/users", Users],
      ["User funding", "/admin/user-funding", CircleDollarSign],
    ],
  },
  {
    label: "Operations",
    links: [
      ["Identity verification", "/admin/verification", ShieldCheck],
      ["Transactions", "/admin/transactions", Activity],
      ["History generator", "/admin/history-generator", History],
      ["Deposits", "/admin/deposits", Landmark],
      ["Crypto balances", "/admin/crypto-balances", Bitcoin],
      ["Card approvals", "/admin/cards", CreditCard],
      ["Grant reviews", "/admin/grants", Gift],
      ["Customer support", "/admin/support", Headphones],
      ["Campaigns", "/admin/campaigns", BellRing],
    ],
  },
  {
    label: "Governance",
    links: [
      ["Audit history", "/admin/audit", FileCheck2],
      ["Deposit wallets", "/admin/deposit-wallets", Landmark],
      ["Settings", "/admin/settings", Settings],
    ],
  },
];

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: AuthUser;
}) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  const [notifications, setNotifications] = useState<
    Array<Record<string, string | number | null>>
  >([]);
  const initials =
    `${user.firstName[0] || "A"}${user.lastName[0] || ""}`.toUpperCase();
  const active = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);
  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const value = adminSearch.trim();
    if (!value) return;
    window.location.assign(`/admin/users?q=${encodeURIComponent(value)}`);
  }
  async function toggleNotifications() {
    const next = !notificationOpen;
    setNotificationOpen(next);
    setSearchOpen(false);
    setProfileOpen(false);
    if (next && notifications.length === 0) {
      const response = await fetch("/api/admin/audit");
      const result = await response.json();
      if (response.ok) setNotifications((result.rows || []).slice(0, 6));
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] lg:grid lg:grid-cols-[284px_minmax(0,1fr)]">
      <aside className="hidden h-screen flex-col overflow-hidden border-r border-white/10 bg-[#06111f] text-white lg:sticky lg:top-0 lg:flex">
        <div className="border-b border-white/10 px-7 py-6">
          <div className="inline-flex rounded-xl bg-white px-3 py-2">
            <Logo href="/admin" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-blue-200/55">
            <span className="size-1.5 rounded-full bg-blue-400 shadow-[0_0_12px_#34d399]" />{" "}
            Operations console
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5">
          {groups.map((group) => (
            <div key={group.label} className="mb-7">
              <p className="px-3 text-[9px] font-bold uppercase tracking-[.2em] text-white/30">
                {group.label}
              </p>
              <nav className="mt-2 space-y-1">
                {group.links.map(([label, href, Icon]) => (
                  <Link
                    key={href}
                    href={href}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition ${active(href) ? "bg-gradient-to-r from-blue-500/25 to-blue-400/10 text-white shadow-[inset_3px_0_0_#34d399]" : "text-white/60 hover:bg-white/[.06] hover:text-white"}`}
                  >
                    <Icon
                      size={17}
                      className={
                        active(href)
                          ? "text-blue-300"
                          : "text-white/40 group-hover:text-white/70"
                      }
                    />
                    <span className="flex-1">{label}</span>
                    {active(href) && (
                      <ChevronRight size={14} className="text-blue-300" />
                    )}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[.06] p-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-300 to-blue-600 text-xs font-bold text-[#062016] ring-2 ring-white/10">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-[10px] text-white/40">
                System administrator
              </p>
            </div>
          </div>
          <div className="text-rose-300 [&_button]:w-full [&_button]:justify-start">
            <LogoutButton admin />
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-[#dfe5ef] bg-white/90 backdrop-blur-xl">
          <div className="flex h-[72px] items-center gap-4 px-4 sm:px-7 lg:px-9">
            <div className="lg:hidden">
              <Logo href="/admin" compact />
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="text-xs font-semibold text-neutral-900">
                SecurePath Bank Administration
              </p>
              <p className="mt-0.5 text-[10px] text-neutral-400">
                Secure operations and approvals
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(!searchOpen);
                    setNotificationOpen(false);
                    setProfileOpen(false);
                  }}
                  aria-label="Search customers"
                  className="grid size-10 place-items-center rounded-full border border-[#dfe5ef] bg-white text-neutral-500 hover:border-bank-200 hover:text-bank-700"
                >
                  <Search size={17} />
                </button>
                {searchOpen && (
                  <form
                    onSubmit={submitSearch}
                    className="absolute right-0 top-12 z-50 w-80 rounded-2xl border bg-white p-4 shadow-xl"
                  >
                    <p className="text-xs font-bold uppercase tracking-widest text-bank-600">
                      Customer search
                    </p>
                    <div className="mt-3 flex gap-2">
                      <input
                        autoFocus
                        value={adminSearch}
                        onChange={(event) => setAdminSearch(event.target.value)}
                        className="field"
                        placeholder="Name, email or account"
                      />
                      <button className="btn px-4">
                        <Search size={16} />
                      </button>
                    </div>
                  </form>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={toggleNotifications}
                  aria-label="Review notifications"
                  className="relative grid size-10 place-items-center rounded-full border border-[#dfe5ef] bg-white text-neutral-500 hover:border-bank-200 hover:text-bank-700"
                >
                  <BellRing size={17} />
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
                </button>
                {notificationOpen && (
                  <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b p-4">
                      <b>Admin notifications</b>
                      <Link
                        href="/admin/audit"
                        className="text-xs font-bold text-bank-700"
                      >
                        View all
                      </Link>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length ? (
                        notifications.map((item) => (
                          <div
                            key={String(item.id)}
                            className="border-b p-4 last:border-0"
                          >
                            <p className="text-sm font-semibold">
                              {String(
                                item.action || "Administrative activity",
                              ).replaceAll(".", " ")}
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              {String(item.actor_email || "System")} ·{" "}
                              {String(item.created_at || "")}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="p-6 text-center text-sm text-neutral-500">
                          No recent notifications.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(!profileOpen);
                    setSearchOpen(false);
                    setNotificationOpen(false);
                  }}
                  className="ml-1 flex items-center gap-2 rounded-full border border-[#dfe5ef] bg-white py-1 pl-1 pr-3"
                >
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="size-8 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="grid size-8 place-items-center rounded-full bg-bank-700 text-[10px] font-bold text-white">
                      {initials}
                    </span>
                  )}
                  <span className="hidden text-xs font-semibold sm:block">
                    {user.firstName}
                  </span>
                  <ChevronDown size={13} className="text-neutral-400" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-12 z-50 w-60 rounded-2xl border bg-white p-2 shadow-xl">
                    <div className="border-b px-3 py-3">
                      <p className="font-semibold">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="mt-1 truncate text-xs text-neutral-500">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/admin/settings"
                      className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                    >
                      <Settings size={17} />
                      Admin profile settings
                    </Link>
                    <div className="rounded-xl px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                      <LogoutButton admin />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t border-[#eef2f7] px-4 py-2 lg:hidden">
            {groups
              .flatMap((group) => group.links)
              .map(([label, href, Icon]) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${active(href) ? "bg-bank-700 text-white" : "bg-neutral-100 text-neutral-600"}`}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              ))}
          </nav>
        </header>
        <main className="min-w-0 p-4 sm:p-7 lg:p-9">{children}</main>
      </div>
    </div>
  );
}

// Hostinger source snapshot sync.
