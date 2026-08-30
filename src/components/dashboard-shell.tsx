"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  Bell,
  Bitcoin,
  Building2,
  ChevronDown,
  ChevronRight,
  Check,
  CreditCard,
  FileText,
  Gift,
  Headphones,
  Home,
  Menu,
  Send,
  Settings,
  ShieldCheck,
  User,
  WalletCards,
  X,
} from "lucide-react";
import Logo, { BrandMark } from "./logo";
import { DashboardLiveChat } from "./dashboard-live-chat";
import { LogoutButton } from "./logout-button";
import type { AuthUser } from "../lib/auth";
import type { AccountSummary } from "../lib/banking";
import type { NotificationSummary } from "../lib/banking";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

const sections = [
  {
    label: "Menu",
    items: [
      ["Dashboard", "/dashboard", Home],
      ["Account details", "/dashboard/account", Building2],
      ["Deposits", "/dashboard/deposit", ArrowDownToLine],
      ["Local transfer", "/dashboard/transfer", Send],
      ["International transfer", "/dashboard/international", Building2],
      ["Internal transfer", "/dashboard/internal", ArrowLeftRight],
      ["Transactions", "/dashboard/activity", FileText],
      ["Account statement", "/dashboard/statement", FileText],
      ["Virtual cards", "/dashboard/cards", CreditCard],
      ["Investments", "/dashboard/investments", WalletCards],
      ["Grant applications", "/dashboard/grants", Gift],
      ["Crypto swap", "/dashboard/crypto", Bitcoin],
    ],
  },
  {
    label: "Settings",
    items: [
      ["Customer support", "/dashboard/support", Headphones],
      ["Identity verification", "/dashboard/verification", ShieldCheck],
      ["Profile settings", "/dashboard/profile", Settings],
    ],
  },
] as const;
const bottom = [
  ["Home", "/dashboard", Home],
  ["Activity", "/dashboard/activity", ArrowLeftRight],
  ["Transfer", "/dashboard/transfer", Send],
  ["Cards", "/dashboard/cards", CreditCard],
  ["Account", "/dashboard/profile", User],
] as const;

export function DashboardShell({
  children,
  user,
  account,
  notificationState,
}: {
  children: React.ReactNode;
  user: AuthUser;
  account: AccountSummary;
  notificationState: {
    notifications: NotificationSummary[];
    unreadCount: number;
  };
}) {
  const path = usePathname(),
    [drawer, setDrawer] = useState(false),
    [profileOpen, setProfileOpen] = useState(false),
    [notificationOpen, setNotificationOpen] = useState(false),
    [notifications, setNotifications] = useState(
      notificationState.notifications,
    ),
    [unreadCount, setUnreadCount] = useState(notificationState.unreadCount),
    [kycVerified, setKycVerified] = useState(user.kycVerified);
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    number | null
  >(null);
  const avatarSrc = user.avatarUrl || "/images/profile-neutral.svg";
  const refreshNotifications = useCallback(async () => {
    const response = await fetch("/api/banking/notifications", {
      cache: "no-store",
    });
    if (!response.ok) return;
    const data = await response.json();
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
    if (typeof data.kycVerified === "boolean") {
      setKycVerified(data.kycVerified);
    }
  }, []);
  useEffect(() => {
    const timer = window.setInterval(refreshNotifications, 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshNotifications();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshNotifications]);
  async function setNotificationRead(id: number, read: boolean) {
    const item = notifications.find((notification) => notification.id === id);
    if (!item || Boolean(item.readAt) === read) return;
    const response = await fetch("/api/banking/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read }),
    });
    if (!response.ok) return;
    const data = await response.json();
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
  }
  async function openNotification(id: number) {
    setSelectedNotificationId(id);
    await setNotificationRead(id, true);
  }
  function notificationGroup(type: string) {
    if (
      [
        "transfer",
        "transaction",
        "deposit",
        "crypto",
        "investment",
        "card",
      ].includes(type)
    )
      return "transactions";
    if (type === "kyc") return "verification";
    return "other";
  }
  const filteredNotifications = notifications.filter((notification) => {
    if (notificationFilter === "all") return true;
    if (notificationFilter === "unread") return !notification.readAt;
    return notificationGroup(notification.type) === notificationFilter;
  });
  const selectedNotification = notifications.find(
    (notification) => notification.id === selectedNotificationId,
  );
  async function markNotificationsRead() {
    const response = await fetch("/api/banking/notifications", {
      method: "POST",
    });
    if (!response.ok) return;
    const data = await response.json();
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
  }
  const navigation = (mobile = false) => (
    <>
      {sections.map((section) => (
        <div
          key={section.label}
          className={mobile ? "mt-8 first:mt-0" : "mt-6 first:mt-0"}
        >
          <p
            className={`${mobile ? "px-2 text-xs" : "px-3 text-[10px]"} font-bold uppercase tracking-[.18em] text-neutral-400`}
          >
            {section.label}
          </p>
          <nav className="mt-2 space-y-1">
            {section.items.map(([name, href, Icon]) => {
              const active = path === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setDrawer(false)}
                  className={`flex items-center ${mobile ? "gap-4 rounded-xl px-2 py-3.5 text-[15px]" : "gap-3 rounded-lg px-3 py-2.5 text-[13px]"} font-medium transition ${active ? (mobile ? "bg-neutral-50 text-bank-800" : "bg-bank-700 text-white shadow-[0_8px_20px_rgba(214,180,95,.2)]") : "text-neutral-700 hover:bg-bank-50 hover:text-bank-800"}`}
                >
                  <span
                    className={`${mobile ? "grid size-11 place-items-center rounded-xl bg-gold-50" : ""}`}
                  >
                    <Icon size={mobile ? 20 : 17} className="text-gold-500" />
                  </span>
                  <span>{name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
      <div
        className={`${mobile ? "mt-1 px-2 [&_button]:min-h-12 [&_button]:w-full [&_button]:justify-start [&_button]:text-[15px]" : "mt-2 px-1 [&_button]:w-full [&_button]:justify-start"} text-rose-600`}
      >
        <LogoutButton />
      </div>
    </>
  );
  return (
    <div className="min-h-screen bg-[#f7f9fc] lg:grid lg:grid-cols-[270px_1fr]">
      <aside className="hidden min-h-screen border-r border-[#e2e7f0] bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="border-b border-[#edf0ee] px-6 py-5">
          <Logo href="/dashboard" sidebar />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-6">{navigation()}</div>
        <div className="border-t border-[#edf0ee] p-4">
          <div className="flex items-center gap-3 rounded-xl bg-bank-50 p-3">
            <Image
              src={avatarSrc}
              alt=""
              width={40}
              height={40}
              className="size-9 rounded-full object-cover ring-2 ring-white"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-[11px] text-neutral-500">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </aside>
      <div className="min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 border-b border-[#e2e7f0] bg-white/95 backdrop-blur">
          <div className="relative flex h-16 items-center justify-between px-4 sm:px-6 lg:h-[73px] lg:px-8">
            <button
              onClick={() => setDrawer(true)}
              aria-label="Open navigation"
              className="grid size-10 place-items-center rounded-lg hover:bg-neutral-100 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <span className="hidden size-10 lg:block" />
            <Link
              href="/dashboard"
              className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-bank-700"
            >
              <BrandMark className="h-7 w-7" />
              <span className="mt-0.5 text-[7px] font-bold tracking-[.16em]">
                SECUREPATH BANK
              </span>
            </Link>
            <div className="ml-auto flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (!notificationOpen) refreshNotifications();
                    setNotificationOpen((open) => !open);
                    setProfileOpen(false);
                  }}
                  aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                  aria-expanded={notificationOpen}
                  className="relative grid size-10 place-items-center rounded-full border border-[#e2e7f0] text-neutral-600 hover:bg-neutral-50"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span
                      title={`${unreadCount} unread notifications`}
                      className={`absolute right-0.5 top-0.5 grid h-[18px] place-items-center rounded-full bg-red-600 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white ${unreadCount > 9 ? "min-w-[22px]" : "min-w-[18px]"}`}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {notificationOpen && (
                  <div className="absolute right-0 top-[calc(100%+.65rem)] z-50 w-[min(25rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#e1e6ef] bg-white shadow-[0_20px_55px_rgba(10,23,40,.18)]">
                    <div className="border-b border-[#edf0ee] p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Notifications</p>
                          <p className="mt-0.5 text-[11px] text-neutral-500">
                            {unreadCount
                              ? `${unreadCount} unread`
                              : "You're all caught up"}
                          </p>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markNotificationsRead}
                            className="text-xs font-semibold text-bank-700"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      {!selectedNotification && (
                        <div
                          className="mt-3 flex gap-1 overflow-x-auto pb-1"
                          aria-label="Filter notifications"
                        >
                          {[
                            ["all", "All"],
                            ["unread", "Unread"],
                            ["transactions", "Transactions"],
                            ["verification", "Verifications"],
                            ["other", "Other"],
                          ].map(([value, label]) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setNotificationFilter(value)}
                              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${notificationFilter === value ? "bg-bank-700 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedNotification ? (
                      <article className="p-5">
                        <button
                          type="button"
                          onClick={() => setSelectedNotificationId(null)}
                          className="text-xs font-semibold text-bank-700"
                        >
                          ← Back to notifications
                        </button>
                        <div className="mt-5 flex items-start justify-between gap-4">
                          <div>
                            <span className="rounded-full bg-bank-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-bank-700">
                              {notificationGroup(selectedNotification.type)}
                            </span>
                            <h2 className="mt-3 text-lg font-semibold text-neutral-900">
                              {selectedNotification.title}
                            </h2>
                          </div>
                          <span className="shrink-0 text-[11px] text-neutral-400">
                            {new Intl.DateTimeFormat("en-GB", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(selectedNotification.createdAt))}
                          </span>
                        </div>
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-600">
                          {selectedNotification.body}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2">
                          {selectedNotification.actionUrl && (
                            <Link
                              href={selectedNotification.actionUrl}
                              onClick={() => setNotificationOpen(false)}
                              className="rounded-lg bg-bank-700 px-3 py-2 text-xs font-semibold text-white hover:bg-bank-800"
                            >
                              View transaction receipt
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setNotificationRead(
                                selectedNotification.id,
                                !Boolean(selectedNotification.readAt),
                              )
                            }
                            className="rounded-lg border border-[#dce4df] px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                          >
                            Mark as{" "}
                            {selectedNotification.readAt ? "unread" : "read"}
                          </button>
                        </div>
                      </article>
                    ) : (
                      <div className="max-h-96 overflow-y-auto p-2">
                        {filteredNotifications.length ? (
                          filteredNotifications.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => openNotification(item.id)}
                              className={`block w-full rounded-xl p-3 text-left transition hover:bg-neutral-50 ${item.readAt ? "" : "bg-bank-50"}`}
                            >
                              <div className="flex items-start gap-3">
                                {!item.readAt && (
                                  <span
                                    aria-label="Unread"
                                    className="mt-1.5 size-2 shrink-0 rounded-full bg-red-500"
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex justify-between gap-2">
                                    <p className="truncate text-sm font-semibold">
                                      {item.title}
                                    </p>
                                    <span className="shrink-0 text-[10px] text-neutral-400">
                                      {item.date}
                                    </span>
                                  </div>
                                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">
                                    {item.body}
                                  </p>
                                  <p className="mt-1.5 text-[10px] font-semibold capitalize text-bank-700">
                                    {notificationGroup(item.type)}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-5 py-10 text-center">
                            <Bell className="mx-auto text-gold-500" size={24} />
                            <p className="mt-3 text-sm font-semibold">
                              No matching notifications
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              Try another filter or check back later.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}{" "}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen((open) => !open);
                    setNotificationOpen(false);
                  }}
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 rounded-full p-1 hover:bg-neutral-100"
                >
                  <span className="hidden text-right sm:block">
                    <span className="block text-xs font-semibold">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="block text-[10px] text-neutral-400">
                      Personal banking
                    </span>
                  </span>
                  <span className="relative shrink-0">
                    <Image
                      src={avatarSrc}
                      alt={`${user.firstName} ${user.lastName}`}
                      width={44}
                      height={44}
                      className="size-10 rounded-full object-cover ring-2 ring-bank-50"
                    />
                    {kycVerified && (
                      <span
                        title="Identity verified"
                        aria-label="Identity verified"
                        className="absolute -bottom-0.5 -right-0.5 grid size-[18px] place-items-center rounded-full bg-gold-500 text-white ring-2 ring-white"
                      >
                        <Check size={11} strokeWidth={3.5} aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-neutral-400 transition ${profileOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {profileOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+.65rem)] z-50 w-64 overflow-hidden rounded-2xl border border-[#e1e6ef] bg-white shadow-[0_20px_55px_rgba(10,23,40,.18)]"
                  >
                    <div className="flex items-center gap-3 border-b border-[#edf0ee] p-4">
                      <Image
                        src={avatarSrc}
                        alt=""
                        width={48}
                        height={48}
                        className="size-11 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="truncate text-xs text-neutral-500">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                        href="/dashboard/profile"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-bank-50"
                      >
                        <Settings size={17} /> Profile settings
                      </Link>
                      <Link
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                        href="/dashboard/support"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-bank-50"
                      >
                        <Headphones size={17} /> Customer support
                      </Link>
                      <div className="mt-1 text-rose-600 [&_button]:w-full [&_button]:justify-start">
                        <LogoutButton />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        {drawer && (
          <>
            <button
              aria-label="Close navigation"
              onClick={() => setDrawer(false)}
              className="fixed inset-0 z-40 bg-[#071b12]/55 backdrop-blur-sm lg:hidden"
            />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-[78%] min-w-[286px] max-w-[430px] flex-col bg-white shadow-2xl lg:hidden">
              <div className="border-b border-[#e2e7f0] p-5">
                <div className="flex items-start gap-3">
                  <Image
                    src={avatarSrc}
                    alt={`${user.firstName} ${user.lastName}`}
                    width={52}
                    height={52}
                    className="size-12 shrink-0 rounded-full object-cover ring-2 ring-bank-50"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {user.email}
                    </p>
                    <span className="mt-2 inline-flex rounded bg-[#e7eeeb] px-2 py-1 text-[11px] font-semibold text-neutral-600">
                      # {account.accountNumber}
                    </span>
                    <p className="mt-2 text-xs text-neutral-500">
                      {account.type}
                    </p>
                  </div>
                  <button
                    onClick={() => setDrawer(false)}
                    aria-label="Close navigation"
                    className="grid size-9 place-items-center rounded-lg hover:bg-neutral-100"
                  >
                    <X size={19} />
                  </button>
                </div>
                <div className="mt-5 border-t border-[#edf0ee] pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-neutral-500">
                    Available balance
                  </p>
                  <p className="mt-2 text-3xl font-bold">
                    {formatMoney(account.availableBalance, account.currency)}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Link
                      href="/dashboard/deposit"
                      onClick={() => setDrawer(false)}
                      className="btn min-h-11"
                    >
                      Deposit
                    </Link>
                    <Link
                      href="/dashboard/support"
                      onClick={() => setDrawer(false)}
                      className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#d8dfeb] bg-[#f1f4f9] text-sm font-semibold"
                    >
                      Loan
                    </Link>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-6">
                {navigation(true)}
              </div>
            </aside>
          </>
        )}
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1180px] p-4 sm:p-6 lg:p-8"
        >
          {!user.kycVerified && (
            <Link
              href="/dashboard/verification"
              className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900"
            >
              <span>
                <b className="block text-sm">
                  Verify your identity to make transactions
                </b>
                <span className="mt-1 block text-xs leading-5 text-amber-800">
                  Complete identity verification before transfers, deposits,
                  card funding, investments, or crypto swaps are enabled.
                </span>
              </span>
              <ChevronRight className="shrink-0" size={18} />
            </Link>
          )}
          {children}
        </main>
        <DashboardLiveChat />
        <nav
          aria-label="Mobile navigation"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#dfe5ef] bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(10,23,40,.08)] backdrop-blur lg:hidden"
        >
          {bottom.map(([name, href, Icon]) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[68px] flex-col items-center justify-center gap-1 text-[10px] font-semibold ${active ? "text-bank-700" : "text-neutral-400"}`}
              >
                <span
                  className={`grid place-items-center rounded-xl ${name === "Transfer" ? "-mt-5 size-14 bg-bank-700 text-white shadow-[0_8px_22px_rgba(214,180,95,.3)] ring-4 ring-white" : `size-9 ${active ? "bg-gold-100 text-gold-700" : ""}`}`}
                >
                  {name === "Account" ? (
                    <Image
                      src={avatarSrc}
                      alt=""
                      width={36}
                      height={36}
                      className="size-9 rounded-xl object-cover"
                    />
                  ) : (
                    <Icon size={18} />
                  )}
                </span>
                {name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

// Hostinger source snapshot sync.
