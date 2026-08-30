export type TransactionDisplayStatus =
  | "Processed"
  | "Pending"
  | "Processing"
  | "Declined"
  | "Failed"
  | "Resolved"
  | "Refunded";

export function StatusBadge({ status }: { status: TransactionDisplayStatus }) {
  const styles =
    status === "Processed" || status === "Resolved"
      ? "bg-gold-50 text-gold-700"
      : status === "Refunded"
        ? "bg-violet-50 text-violet-700"
        : status === "Declined" || status === "Failed"
          ? "bg-red-50 text-red-700"
          : status === "Processing"
            ? "bg-gold-50 text-gold-700"
            : "bg-amber-50 text-amber-700";
  return <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${styles}`}>{status}</span>;
}

// Hostinger source snapshot sync.
