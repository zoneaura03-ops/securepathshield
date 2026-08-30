import Link from "next/link";

export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <path
        d="M11 11.5 23.5 14 32 10l8.5 4L53 11.5v18.2C53 43.5 45.4 53.2 32 59 18.6 53.2 11 43.5 11 29.7V11.5Z"
        stroke="var(--logo-gold, #d6b45f)"
        strokeWidth="4.2"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 42.5c7.5-7.8 15.3-13 23.4-15.6-6 4.8-10.8 10.8-14.5 18-2.7-1.1-5.7-1.9-8.9-2.4Z"
        fill="var(--logo-gold, #d6b45f)"
      />
      <path
        d="M23.8 50.2c5-10.7 11.9-18.7 20.8-24.1-6.3 7.2-10.9 16.4-13.8 27.7-2.5-1-4.8-2.2-7-3.6Z"
        fill="var(--logo-gold, #d6b45f)"
      />
      <path
        d="M32.9 55.2c2.1-12.1 6.7-21.9 13.9-29.6l-1.2 8.1 4.2-13.4-13.6 4.1 7.2-.5c-7.7 7.2-12 17-12.8 29.6.7.6 1.5 1.2 2.3 1.7Z"
        fill="var(--logo-gold, #d6b45f)"
      />
    </svg>
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
    <Link
      href={href}
      aria-label="Secure Path Bank home"
      className="inline-flex shrink-0 items-center gap-3"
    >
      <BrandMark className={compact ? "h-10 w-10" : "h-11 w-11 sm:h-12 sm:w-12"} />
      {!compact && (
        <span className="whitespace-nowrap text-[14px] font-semibold uppercase tracking-[.13em] text-[#0a1728] sm:text-[16px]">
          Secure Path <span className="text-[#b78a32]">Bank</span>
        </span>
      )}
    </Link>
  );
}