import Image from "next/image";
import Link from "next/link";

export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <Image
      src="/images/securepathbank-mark-v2.png"
      alt=""
      aria-hidden
      width={395}
      height={395}
      className={`${className} object-contain`}
      priority
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
    <Link href={href} aria-label="SecurePath Bank home" className="inline-flex items-center">
      {compact ? (
        <BrandMark />
      ) : (
        <Image
          src="/images/securepathbank-logo-v2.png"
          alt="SecurePath Bank"
          width={2015}
          height={395}
          className="h-12 w-auto object-contain sm:h-14"
          priority
        />
      )}
    </Link>
  );
}