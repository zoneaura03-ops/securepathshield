import { BrandMark } from "./logo";

export function LogoLoader({
  fullScreen = true,
  transparent = false,
}: {
  fullScreen?: boolean;
  transparent?: boolean;
}) {
  return (
    <div
      className={`grid place-items-center ${transparent ? "bg-transparent" : "bg-[#f7f9f7]"} ${fullScreen ? "min-h-screen" : "min-h-[55vh]"}`}
      role="status"
      aria-live="polite"
      aria-label="Loading SecurePath Shield"
    >
      <div className="relative grid h-20 w-20 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full border border-bank-600/20" />
        <span className="absolute inset-2 animate-pulse rounded-full bg-bank-50" />
        <BrandMark className="relative h-10 w-10" />
      </div>
      <span className="sr-only">Loading SecurePath Shield</span>
    </div>
  );
}

// Hostinger source snapshot sync.
