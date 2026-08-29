import { PublicHeader } from "../../components/public-header";
import { LanguageSelector } from "../../components/language-selector";
import { PublicFooter } from "../../components/public-footer";
import { AuthTransitionLink } from "../../components/auth-transition-link";
import {
  ArrowRight,
  Building2,
  ChartPie,
  Globe2,
  HandCoins,
} from "lucide-react";

export default function CorporateBankingPage() {
  const services = [
    [
      Building2,
      "Business accounts",
      "Flexible operating accounts with team access and clear controls.",
    ],
    [
      Globe2,
      "International payments",
      "Send and receive cross-border payments with transparent tracking.",
    ],
    [
      HandCoins,
      "Working capital",
      "Financing options designed around responsible business growth.",
    ],
    [
      ChartPie,
      "Cash-flow insights",
      "Reporting tools that make incoming and outgoing funds easier to understand.",
    ],
  ] as const;
  return (
    <main className="min-h-screen bg-[#f7f9fc]">
      <PublicHeader />
      <section className="bg-bank-900 px-5 py-24 text-white sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#e4b74e]">
            Corporate Banking
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-normal leading-tight sm:text-6xl">
            Financial tools that move at the speed of your business.
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-white/60">
            Manage payments, working capital, team access, and international
            growth through one secure banking relationship.
          </p>
          <AuthTransitionLink
            href="/register"
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-md bg-[#2563eb] px-6 text-sm font-bold text-[#10233f]"
          >
            Open a business account <ArrowRight size={16} />
          </AuthTransitionLink>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1100px] gap-5 px-5 py-24 sm:px-8 md:grid-cols-2">
        {services.map(([Icon, title, copy]) => (
          <article className="card rounded-lg p-8" key={title}>
            <Icon className="text-bank-600" />
            <h2 className="mt-7 text-2xl">{title}</h2>
            <p className="mt-4 text-sm leading-7 text-neutral-500">{copy}</p>
          </article>
        ))}
      </section>
      <PublicFooter />
      <LanguageSelector />
    </main>
  );
}
