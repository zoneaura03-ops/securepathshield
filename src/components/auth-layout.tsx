import Image from "next/image";
import { Fingerprint, LockKeyhole } from "lucide-react";
import { BrowserBackButton } from "./browser-back-button";

export function AuthLayout({
  children,
  register = false,
}: {
  children: React.ReactNode;
  register?: boolean;
}) {
  return (
    <main className="relative isolate min-h-screen overflow-x-hidden bg-[#0a1728]">
      <Image
        src="/images/securepathbank-auth-towers-v2.png"
        alt="Modern financial district skyscrapers"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-40 object-cover object-center"
      />

      <div className="absolute inset-0 -z-20 bg-[linear-gradient(115deg,rgba(7,17,32,.92),rgba(10,23,40,.78))]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-[#06111f]/70 to-transparent" />

      <div className="relative mx-auto min-h-screen w-full max-w-[1380px] px-4 sm:px-8 lg:px-12">
        {register && (
          <BrowserBackButton className="absolute left-4 top-4 z-20 sm:hidden" />
        )}
        <div className="absolute inset-x-4 top-6 flex items-center justify-center gap-5 text-center text-white/70 sm:inset-x-8 sm:justify-between sm:text-left lg:inset-x-12">
          <div className="hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[.16em] sm:flex">
            <Fingerprint size={17} className="text-gold-300" />
            Bank-grade protection
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/60">
            <LockKeyhole size={14} className="text-gold-300" />
            256-bit encrypted session
          </div>
        </div>

        <section className="flex min-h-screen items-center justify-center py-20 sm:py-24">
          <div className="w-full">{children}</div>
        </section>

        <p className="absolute inset-x-4 bottom-6 text-center text-[11px] text-white/45">
          Secure Path Bank &middot; Secure digital banking &middot; Privacy protected
        </p>
      </div>
    </main>
  );
}

// Hostinger source snapshot sync.
