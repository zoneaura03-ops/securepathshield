"use client";

import Link from "next/link";
import {
  Building2,
  CircleHelp,
  Home,
  Info,
  Layers3,
  LockKeyhole,
  Menu,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./logo";
import { AuthTransitionLink } from "./auth-transition-link";

const links = [
  { label: "Home", href: "/", icon: Home },
  { label: "About Us", href: "/about", icon: Info },
  { label: "Services", href: "/features", icon: Layers3 },
  { label: "Corporate Banking", href: "/corporate-banking", icon: Building2 },
  { label: "Personal Banking", href: "/features#personal", icon: UserRound },
  { label: "Contact Us", href: "/#contact", icon: CircleHelp },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 18);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b transition-all duration-300 ${
          scrolled
            ? "border-black/[0.06] bg-white/90 shadow-[0_8px_30px_rgba(17,53,36,.08)] backdrop-blur-xl"
            : "border-black/[0.045] bg-white"
        }`}
      >
        <div
          className={`mx-auto flex max-w-[1220px] items-center justify-between px-5 transition-[height] duration-300 sm:px-8 ${scrolled ? "h-[68px]" : "h-[78px]"}`}
        >
          <div className="origin-left scale-[1.08]">
            <Logo />
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            {links.slice(0, 4).map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`group relative px-3.5 py-3 text-[13px] font-medium transition-colors ${
                  pathname === link.href ||
                  (link.href === "/features" && pathname === "/features")
                    ? "text-bank-700"
                    : "text-neutral-600 hover:text-bank-700"
                }`}
              >
                {link.label}
                <span
                  className={`absolute inset-x-3.5 bottom-1 h-[2px] origin-left bg-bank-600 transition-transform duration-200 ${
                    pathname === link.href ||
                    (link.href === "/features" && pathname === "/features")
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            ))}
            <span className="mx-2 h-5 w-px bg-neutral-200" />
            <AuthTransitionLink
              href="/login"
              className="rounded px-3 py-3 text-[13px] font-medium text-neutral-600 hover:bg-bank-50 hover:text-bank-700"
            >
              <LockKeyhole className="mr-1.5 inline-block" size={13} />
              Sign In
            </AuthTransitionLink>
            <AuthTransitionLink
              href="/register"
              className="ml-1 rounded-[5px] bg-bank-600 px-5 py-3 text-[13px] font-semibold text-white shadow-[0_7px_18px_rgba(23,107,67,.18)] hover:-translate-y-0.5 hover:bg-bank-700 hover:shadow-[0_10px_24px_rgba(23,107,67,.24)]"
            >
              Open Account
            </AuthTransitionLink>
          </nav>

          <button
            aria-label="Open navigation menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-full text-black hover:bg-bank-50 hover:text-bank-700 lg:hidden"
            type="button"
          >
            <Menu size={25} strokeWidth={2} />
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 transition-visibility lg:hidden ${open ? "visible" : "invisible delay-300"}`}
        aria-hidden={!open}
      >
        <button
          className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          tabIndex={open ? 0 : -1}
        />
        <aside
          className={`absolute right-0 top-0 flex h-full w-[86%] max-w-[360px] flex-col bg-white px-6 py-6 shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between">
            <Logo />
            <button
              className="grid h-10 w-10 place-items-center"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
            >
              <X size={23} />
            </button>
          </div>
          <nav className="mt-10 flex flex-col">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.label}
                  onClick={() => setOpen(false)}
                  href={link.href}
                  className={`flex items-center gap-3 border-b border-neutral-100 py-4 text-[15px] font-medium ${pathname === link.href ? "text-bank-700" : "text-neutral-700"}`}
                >
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-md ${pathname === link.href ? "bg-bank-100 text-bank-700" : "bg-neutral-50 text-neutral-500"}`}
                  >
                    <Icon size={17} />
                  </span>
                  <span className="flex-1">{link.label}</span>
                  <span className="text-bank-600">→</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto space-y-3">
            <AuthTransitionLink
              onNavigate={() => setOpen(false)}
              href="/login"
              className="flex h-12 items-center justify-center rounded border border-bank-600 text-sm font-semibold text-bank-700"
            >
              <LockKeyhole className="mr-2" size={16} />
              Access Your Account
            </AuthTransitionLink>
            <AuthTransitionLink
              onNavigate={() => setOpen(false)}
              href="/register"
              className="btn w-full"
            >
              <UserPlus size={16} />
              Open Account
            </AuthTransitionLink>
          </div>
        </aside>
      </div>
    </>
  );
}

// Hostinger source snapshot sync.
