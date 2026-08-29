import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ChevronRight,
  CreditCard,
  Landmark,
  Plus,
  Send,
  TrendingUp,
} from "lucide-react";
import {
  SiBitcoin,
  SiCashapp,
  SiEthereum,
  SiPaypal,
  SiTether,
} from "react-icons/si";
import { currentUser } from "../../lib/auth";
import { dashboardData, money, type CardPreview } from "../../lib/banking";
import { TransactionCard } from "../../components/transaction-card";
import { BalanceOverview } from "../../components/balance-overview";
import { VirtualCardArt } from "../../components/virtual-card-art";

const transferOptions = [
  [
    Landmark,
    "Wire transfer",
    "International bank transfer",
    "international",
    "bg-slate-50 text-slate-700",
    "border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/70",
  ],
  [
    Building2,
    "Local transfer",
    "Domestic bank transfer",
    "transfer",
    "bg-neutral-700 text-white",
    "border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100",
  ],
] as const;

const walletDepositOptions = [
  [SiPaypal, "PayPal", "Deposit via PayPal", "paypal", "bg-white text-[#003087]"],
  [SkrillMark, "Skrill", "Deposit via Skrill", "skrill", "bg-[#862165] text-white"],
  [SiCashapp, "Cash App", "Deposit via Cash App", "cashapp", "bg-[#2563eb] text-white"],
] as const;

function SkrillMark({ size = 22 }: { size?: number }) {
  return (
    <span
      style={{ fontSize: Math.max(11, size * 0.56) }}
      className="font-black tracking-[-.08em]"
    >
      Skrill
    </span>
  );
}

const cryptoNetworks = [
  [SiBitcoin, "BTC Network", "Send BTC", "text-[#f7931a]"],
  [SiEthereum, "ETH Network", "Send ETH", "text-[#627eea]"],
  [SiTether, "USDT (TRC-20)", "Send USDT", "text-[#2563eb]"],
] as const;

export default async function Page() {
  const user = await currentUser();
  if (!user) return null;
  const { account, transactions, cards } = await dashboardData(user.id);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome back, {user.firstName}
        </h1>
        <p className="mt-2 text-sm text-neutral-500 sm:text-base">
          Here&apos;s an overview of your account activity.
        </p>
      </section>

      <BalanceOverview
        balance={money(account.availableBalance, account.currency)}
        accountType={account.type}
        maskedAccount={`******${account.accountNumber.slice(6)}`}
      />

      <section>
        <SectionHeading title="Send money" href="/dashboard/transfer" />
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {transferOptions.map(([Icon, title, copy, route, tone, tileTone]) => (
            <Link
              key={route}
              href={`/dashboard/${route}`}
              className={`group rounded-2xl border p-4 shadow-[0_8px_24px_rgba(16,35,63,.05)] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(16,35,63,.1)] sm:p-5 ${tileTone}`}
            >
              <span
                className={`grid size-12 place-items-center rounded-xl border border-[#dfe5ef] shadow-sm ${tone}`}
              >
                <Icon size={22} />
              </span>
              <h2 className="mt-4 text-sm font-bold sm:text-base">{title}</h2>
              <p className="mt-1 text-[11px] leading-5 text-neutral-500 sm:text-xs">
                {copy}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading title="Deposit with wallets" href="/dashboard/deposit" />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {walletDepositOptions.map(([Icon, title, copy, provider, tone]) => (
            <Link
              key={provider}
              href={`/dashboard/wallet-payment?provider=${provider}`}
              className="group rounded-2xl border border-[#e1e6ef] bg-white p-4 shadow-[0_8px_24px_rgba(16,35,63,.05)] transition hover:-translate-y-0.5 hover:border-bank-200 hover:shadow-[0_12px_30px_rgba(16,35,63,.1)] sm:p-5"
            >
              <span className={`grid size-12 place-items-center rounded-xl border border-[#dfe5ef] shadow-sm ${tone}`}>
                <Icon size={22} />
              </span>
              <h2 className="mt-4 text-sm font-bold sm:text-base">{title}</h2>
              <p className="mt-1 text-[11px] leading-5 text-neutral-500 sm:text-xs">{copy}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading title="Crypto networks" href="/dashboard/crypto" />
        <div className="mt-4 grid grid-cols-3 gap-3">
          {cryptoNetworks.map(([Icon, title, action, tone]) => (
            <Link
              key={title}
              href="/dashboard/deposit"
              className="min-w-0 rounded-2xl border border-[#e1e6ef] bg-white p-3 shadow-[0_8px_24px_rgba(16,35,63,.045)] sm:p-4"
            >
              <span className={`text-xl ${tone}`}>
                <Icon />
              </span>
              <span className="mt-3 block truncate text-[10px] font-semibold text-neutral-500 sm:text-xs">
                {title}
              </span>
              <span className="mt-2 flex items-center justify-between gap-1 text-[10px] text-neutral-500 sm:text-xs">
                <span className="truncate">{action}</span>
                <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading title="Your cards" href="/dashboard/cards" />
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {cards.length ? (
            cards.map((card) => (
              <DashboardCard
                key={card.id}
                card={card}
                holder={`${user.firstName} ${user.lastName}`}
              />
            ))
          ) : (
            <Link
              href="/dashboard/cards"
              className="flex items-center gap-4 rounded-2xl border border-dashed border-bank-200 bg-bank-50/50 p-5 text-bank-800 lg:col-span-2"
            >
              <span className="grid size-12 place-items-center rounded-xl bg-white shadow-sm">
                <CreditCard size={21} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  Create your first virtual card
                </span>
                <span className="mt-1 block text-xs text-neutral-500">
                  Apply securely and manage funding from your account.
                </span>
              </span>
              <ChevronRight size={18} />
            </Link>
          )}
        </div>
      </section>

      <section>
        <SectionHeading
          title="Recent transactions"
          href="/dashboard/activity"
        />
        <div className="mt-4 space-y-3">
          {transactions.length ? (
            transactions
              .slice(0, 5)
              .map((item) => <TransactionCard key={item.id} item={item} />)
          ) : (
            <div className="rounded-2xl border border-[#e2e7f0] bg-white px-6 py-12 text-center shadow-sm">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-bank-50 text-bank-600">
                <TrendingUp size={21} />
              </span>
              <h3 className="mt-4 font-semibold">No transactions yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-neutral-500">
                Your deposits, transfers, and card activity will appear here.
              </p>
              <Link href="/dashboard/deposit" className="btn mt-5">
                <Plus size={17} /> Make a deposit
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-bold uppercase tracking-[.14em] text-neutral-600 sm:text-base">
        {title}
      </h2>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-xs font-semibold text-bank-700"
      >
        View all <ArrowRight size={15} />
      </Link>
    </div>
  );
}

function DashboardCard({
  card,
  holder,
}: {
  card: CardPreview;
  holder: string;
}) {
  const active = card.status === "active";
  const pending = card.status === "pending";
  const statusLabel =
    active ? "Active" : pending ? "Pending" : card.status === "declined" ? "Declined" : "Frozen";
  const statusTone = active
    ? "bg-blue-50 text-blue-700"
    : pending
      ? "bg-amber-50 text-amber-700"
      : card.status === "declined"
        ? "bg-red-50 text-red-700"
        : "bg-sky-50 text-sky-700";

  return (
    <Link
      href="/dashboard/cards"
      aria-label={`Open ${card.name}`}
      className="group flex min-w-0 items-center gap-4 rounded-2xl border border-[#e1e6ef] bg-white p-4 shadow-[0_7px_22px_rgba(16,35,63,.06)] transition hover:border-bank-200 hover:shadow-[0_12px_30px_rgba(16,35,63,.1)] sm:p-5"
    >
      <span className="block h-[76px] w-[116px] shrink-0 overflow-hidden rounded-xl shadow-md">
        <VirtualCardArt
          brand={card.brand}
          lastFour={card.lastFour}
          holder={holder}
          compact
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-bold text-[#111827] sm:text-base">
            {card.name}
          </span>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold ${statusTone}`}>
            {statusLabel}
          </span>
        </span>
        <span className="mt-1.5 block truncate text-xs text-neutral-500 sm:text-sm">
          {holder}
        </span>
      </span>

      <span className="hidden shrink-0 text-right sm:block">
        <span className="block text-[10px] text-neutral-400">
          {active ? "Balance" : "Status"}
        </span>
        <span className={`mt-1 block font-bold ${active ? "text-lg text-[#111827]" : pending ? "text-amber-700" : "text-sky-700"}`}>
          {active ? money(card.balance, card.currency) : statusLabel}
        </span>
      </span>
      <ChevronRight size={20} className="shrink-0 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-bank-700" />
    </Link>
  );
}