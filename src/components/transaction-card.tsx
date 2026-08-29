import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { StatusBadge } from "./status-badge";
import Link from "next/link";
import type { TransactionSummary } from "../lib/banking";

export function TransactionCard({ item }: { item: TransactionSummary }) {
  const credit = item.amount > 0;
  return (
    <Link
      href={`/dashboard/receipt?reference=${encodeURIComponent(item.id)}`}
      className="flex items-center gap-3 rounded-2xl border border-[#e1e6ef] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(16,35,63,.045)] hover:border-bank-200 hover:bg-bank-50/30 sm:px-5"
    >
      <span
        className={`grid size-11 shrink-0 place-items-center rounded-xl ${credit ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"}`}
      >
        {credit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold sm:text-base">
          {item.name}
        </p>
        <p className="mt-1 truncate text-[11px] text-gray-400">
          {item.date} · {item.id}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={`text-sm font-bold ${credit ? "text-blue-600" : "text-gray-800"}`}
        >
          {credit ? "+" : ""}
          {item.amount.toLocaleString("en-US", {
            style: "currency",
            currency: item.currency,
          })}
        </p>
        <div className="mt-1">
          <StatusBadge status={item.status} />
        </div>
      </div>
    </Link>
  );
}

// Hostinger source snapshot sync.
