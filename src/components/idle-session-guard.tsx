"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const USER_TIMEOUT_MS = 30 * 60 * 1000;
const ADMIN_TIMEOUT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "touchstart",
  "scroll",
] as const;

export function IdleSessionGuard() {
  const pathname = usePathname();

  useEffect(() => {
    const admin = pathname.startsWith("/admin") && pathname !== "/admin-login";
    const customer = pathname.startsWith("/dashboard");
    if (!admin && !customer) return;

    const timeout = admin ? ADMIN_TIMEOUT_MS : USER_TIMEOUT_MS;
    const storageKey = admin
      ? "securepathbank_admin_activity"
      : "securepathbank_user_activity";
    let loggingOut = false;
    let lastWrite = 0;

    const logout = async () => {
      if (loggingOut) return;
      loggingOut = true;
      try {
        await fetch("/api/auth/logout", { method: "POST", keepalive: true });
      } finally {
        localStorage.removeItem(storageKey);
        window.location.replace(
          admin ? "/admin-login?notice=inactive" : "/login?notice=inactive",
        );
      }
    };

    const expired = () => {
      const lastActivity = Number(
        localStorage.getItem(storageKey) || Date.now(),
      );
      if (Date.now() - lastActivity >= timeout) {
        void logout();
        return true;
      }
      return false;
    };

    const recordActivity = () => {
      if (loggingOut || Date.now() - lastWrite < 10_000) return;
      lastWrite = Date.now();
      localStorage.setItem(storageKey, String(lastWrite));
    };

    if (!localStorage.getItem(storageKey)) recordActivity();
    else if (expired()) return;

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && !expired())
        recordActivity();
    };
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, recordActivity, { passive: true }),
    );
    document.addEventListener("visibilitychange", onVisibilityChange);
    const timer = window.setInterval(expired, 15_000);

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, recordActivity),
      );
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(timer);
    };
  }, [pathname]);

  return null;
}
