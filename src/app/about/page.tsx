import { PublicHeader } from "../../components/public-header";
import { LanguageSelector } from "../../components/language-selector";
import { PublicFooter } from "../../components/public-footer";
import { AuthTransitionLink } from "../../components/auth-transition-link";
import { ArrowRight, Globe2, ShieldCheck, UsersRound } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <PublicHeader />
      <section className="bg-bank-900 px-5 py-24 text-center text-white sm:px-8 sm:py-32">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#e4b74e]">
          About SecurePath Bank
        </p>
        <h1 className="mx-auto mt-5 max-w-3xl text-5xl font-normal leading-tight sm:text-6xl">
          Banking built around confidence, access, and progress.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/60">
          SecurePath Bank combines thoughtful service with secure digital tools to help
          individuals and businesses manage money clearly wherever they are.
        </p>
      </section>
      <section className="mx-auto grid max-w-[1100px] gap-6 px-5 py-24 sm:px-8 md:grid-cols-3">
        {[
          [
            ShieldCheck,
            "Security first",
            "Protection is considered at every stage of the customer experience.",
          ],
          [
            Globe2,
            "Global outlook",
            "Banking tools designed for customers and businesses across borders.",
          ],
          [
            UsersRound,
            "Human support",
            "Clear guidance from people who understand real financial needs.",
          ],
        ].map(([Icon, title, copy]) => (
          <article className="card rounded-lg p-8" key={String(title)}>
            <Icon className="text-bank-600" />
            <h2 className="mt-7 text-2xl">{String(title)}</h2>
            <p className="mt-4 text-sm leading-7 text-neutral-500">
              {String(copy)}
            </p>
          </article>
        ))}
      </section>
      <section className="bg-[#f7f9fc] px-5 py-20 text-center">
        <h2 className="text-4xl">Ready to bank differently?</h2>
        <AuthTransitionLink href="/register" className="btn mt-7">
          Open an account <ArrowRight size={16} />
        </AuthTransitionLink>
      </section>
      <PublicFooter />
      <LanguageSelector />
    </main>
  );
}
