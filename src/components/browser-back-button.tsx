"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BrowserBackButton({ className = "" }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Go back to the previous page"
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-[#10233f]/55 px-3 text-sm font-semibold text-white shadow-lg backdrop-blur-md hover:bg-[#10233f]/75 sm:px-4 ${className}`}
    >
      <ArrowLeft size={18} aria-hidden="true" />
      <span className="hidden sm:inline">Back</span>
    </button>
  );
}

// Hostinger source snapshot sync.
