import Link from "next/link";
import {
  Clock3,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { publicContent } from "../lib/public-content";

const companyLinks = [
  ["About us", "/about"],
  ["Our services", "/features"],
  ["Corporate banking", "/corporate-banking"],
  ["Contact us", "/#contact"],
] as const;

const serviceLinks = [
  ["Personal banking", "/features#personal"],
  ["Business banking", "/corporate-banking"],
  ["Cards & payments", "/features#cards"],
  ["International banking", "/features#international"],
] as const;

export function PublicFooter() {
  const { footer } = publicContent;

  return (
    <footer
      id="contact"
      className="bg-[#101511] px-5 pb-8 pt-16 text-white sm:px-8 lg:pt-20"
    >
      <div className="mx-auto grid max-w-[1100px] gap-12 border-b border-white/10 pb-14 sm:grid-cols-2 lg:grid-cols-[1.35fr_.8fr_.9fr_1.25fr]">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-[#8cc39c]"
            aria-label="SecurePath Bank home"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-bank-700/70 ring-1 ring-white/10">
              <ShieldCheck size={23} />
            </span>
            <b className="text-sm tracking-[.2em]">SECUREPATH BANK</b>
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-7 text-white/50">
            {footer.description}
          </p>
          <div className="mt-6 flex gap-2">
            {[Facebook, Instagram, Linkedin].map((Icon, index) => (
              <a
                key={index}
                href="#"
                aria-label={["Facebook", "Instagram", "LinkedIn"][index]}
                className="grid size-9 place-items-center rounded-full border border-white/10 text-white/55 transition hover:border-[#8cc39c]/50 hover:text-[#8cc39c]"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>
        <FooterLinks title="Company" links={companyLinks} />
        <FooterLinks title="Services" links={serviceLinks} />
        <div>
          <h3 className="text-base font-semibold">Contact & support</h3>
          <ul className="mt-5 space-y-4 text-sm leading-6 text-white/50">
            <li className="flex gap-3">
              <MapPin className="mt-1 shrink-0 text-[#8cc39c]" size={16} />
              <span>{footer.address}</span>
            </li>
            <li>
              <a
                className="flex items-center gap-3 transition hover:text-white"
                href={`mailto:${footer.email}`}
              >
                <Mail className="shrink-0 text-[#8cc39c]" size={16} />
                {footer.email}
              </a>
            </li>

            <li className="flex items-center gap-3">
              <Clock3 className="shrink-0 text-[#8cc39c]" size={16} />
              Support available 24/7
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-[1100px] border-b border-white/10 py-6 text-[11px] leading-6 text-white/35">
        SecurePath Bank is a demonstration interface. Product availability, rates,
        deposit protection, and regulatory disclosures must be configured for
        the applicable licensed entity and jurisdiction.
      </div>
      <div className="mx-auto flex max-w-[1100px] flex-col justify-between gap-3 pt-7 text-xs text-white/40 sm:flex-row sm:items-center">
        <span>© 2026 SecurePath Bank Bank. All rights reserved.</span>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/legal" className="hover:text-white">
            Privacy
          </Link>
          <Link href="/legal" className="hover:text-white">
            Terms
          </Link>
          <Link href="/legal" className="hover:text-white">
            Security
          </Link>
          <Link href="/legal" className="hover:text-white">
            Accessibility
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <div>
      <h3 className="text-base font-semibold">{title}</h3>
      <ul className="mt-5 space-y-3 text-sm text-white/50">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="transition hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Hostinger source snapshot sync.
