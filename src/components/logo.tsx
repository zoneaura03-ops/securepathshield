import Image from "next/image";
import Link from "next/link";

export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <Image
      src="/images/securepathshield-premium-mark.png"
      alt=""
      aria-hidden
      width={557}
      height={557}
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
    <Link href={href} aria-label="SecurePath Shield home" className="inline-flex items-center">
      {compact ? (
        <BrandMark />
      ) : (
        <Image
          src="/images/securepathshield-premium-logo.png"
          alt="SecurePath Shield"
          width={1645}
          height={557}
          className="h-12 w-auto object-contain sm:h-14"
          priority
        />
      )}
    </Link>
  );
}