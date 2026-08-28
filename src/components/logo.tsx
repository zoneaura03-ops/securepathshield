import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <ShieldCheck
      aria-hidden
      className={`${className} fill-bank-100 text-bank-700`}
    />
  );
}

export default function Logo({
  compact = false,
  href = "/",
}: {
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-bank-700">
      <BrandMark />
      {!compact && (
        <span className="text-xs font-bold tracking-[.22em]">SECUREPATH SHIELD</span>
      )}
    </Link>
  );
}

// Hostinger source snapshot sync.
