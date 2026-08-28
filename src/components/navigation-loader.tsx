"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LogoLoader } from "./logo-loader";

const MINIMUM_VISIBLE_MS = 350;
const MAXIMUM_VISIBLE_MS = 3000;

export function NavigationLoader({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const startedAt = useRef(0);
  const startedPath = useRef("");
  const lastPath = useRef(pathname);
  const fallbackTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    function start(fromPath = window.location.pathname) {
      startedAt.current = Date.now();
      startedPath.current = fromPath;
      setLoading(true);
      window.clearTimeout(fallbackTimer.current);
      fallbackTimer.current = window.setTimeout(
        () => setLoading(false),
        MAXIMUM_VISIBLE_MS,
      );
    }

    function handleClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;

      const target = event.target as Element | null;
      const anchor = target?.closest("a");
      if (!anchor || anchor.dataset.transitionLoader === "manual") return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      )
        return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname.startsWith("/api/")) return;
      if (destination.href === window.location.href) return;
      // Query-only changes do not update usePathname, so starting the global
      // loader here would leave it visible until the fallback timer expires.
      if (destination.pathname === window.location.pathname) return;

      start();
    }

    document.addEventListener("click", handleClick, true);
    function handleHistoryNavigation() {
      start(lastPath.current);
    }

    window.addEventListener("popstate", handleHistoryNavigation);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handleHistoryNavigation);
      window.clearTimeout(fallbackTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!loading || pathname === startedPath.current) {
      lastPath.current = pathname;
      return;
    }
    const elapsed = Date.now() - startedAt.current;
    const timer = window.setTimeout(
      () => setLoading(false),
      Math.max(0, MINIMUM_VISIBLE_MS - elapsed),
    );
    lastPath.current = pathname;
    return () => window.clearTimeout(timer);
  }, [pathname, loading]);

  return (
    <>
      {children}
      {loading && (
        <div className="fixed inset-0 z-[200] bg-[#062b1d]/20 backdrop-blur-[1px]">
          <LogoLoader transparent />
        </div>
      )}
    </>
  );
}

// Hostinger source snapshot sync.
