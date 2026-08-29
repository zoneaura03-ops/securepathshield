"use client";

import Link from "next/link";
import { useState, type MouseEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LogoLoader } from "./logo-loader";

export function AuthTransitionLink({
  href,
  className,
  children,
  onNavigate,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function startLoading(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      return;
    event.preventDefault();
    if (loading) return;
    onNavigate?.();
    setLoading(true);
    router.push(href);
  }

  return (
    <>
      <Link
        href={href}
        prefetch
        data-transition-loader="manual"
        onClick={startLoading}
        className={className}
        aria-busy={loading}
      >
        {children}
      </Link>
      {loading && (
        <div
          className="fixed inset-0 z-[200] bg-[#10233f]/20 backdrop-blur-[1px]"
          aria-hidden="false"
        >
          <LogoLoader transparent />
        </div>
      )}
    </>
  );
}

// Hostinger source snapshot sync.
