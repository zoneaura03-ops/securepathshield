import Image from "next/image";
import Link from "next/link";

export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <Image
      src="/images/securepathbank-mark.png"
      alt=""
      aria-hidden
      width={427}
      height={427}
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
          src="/images/securepathbank-logo.png"
          alt="SecurePath Bank"
          width={1585}
          height={427}
          className="h-12 w-auto object-contain sm:h-14"
          priority
        />
      )}
    </Link>
  );
}