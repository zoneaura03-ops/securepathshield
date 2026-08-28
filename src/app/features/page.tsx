import {
  ArrowRight,
  Building2,
  ChartPie,
  CreditCard,
  Globe2,
  HandCoins,
  Headphones,
  Landmark,
  LockKeyhole,
  PiggyBank,
  Smartphone,
  UserRound,
} from "lucide-react";
import { AuthTransitionLink } from "../../components/auth-transition-link";
import { LanguageSelector } from "../../components/language-selector";
import { PublicFooter } from "../../components/public-footer";
import { PublicHeader } from "../../components/public-header";
import { publicContent } from "../../lib/public-content";

const productIcons = [
  Landmark,
  PiggyBank,
  CreditCard,
  HandCoins,
  Building2,
  ChartPie,
];
const benefitIcons = [Smartphone, Globe2, Headphones, LockKeyhole];

export default function FeaturesPage() {
  const { products, benefits, features } = publicContent;
  return (
    <main className="min-h-screen bg-[#f7f9fc]">
      <PublicHeader />
      <section className="relative overflow-hidden bg-bank-900 px-5 py-24 text-center text-white sm:px-8 sm:py-32">
        <div className="absolute -right-24 -top-32 size-[430px] rounded-full bg-bank-600/20 blur-3xl" />
        <div className="relative mx-auto max-w-[1100px]">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#e4b74e]">
            Our services
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl text-5xl font-normal leading-[1.08] sm:text-6xl">
            Banking solutions for every ambition.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
            From everyday spending to business growth, SecurePath Shield brings secure
            accounts, cards, transfers, lending, and investment tools together
            in one clear experience.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <AuthTransitionLink href="/register" className="btn min-w-48">
              Open an account <ArrowRight size={16} />
            </AuthTransitionLink>
            <AuthTransitionLink
              href="/login"
              className="inline-flex min-h-12 min-w-48 items-center justify-center rounded-md border border-white/30 px-5 text-sm font-semibold hover:bg-white/10"
            >
              Access your account
            </AuthTransitionLink>
          </div>
        </div>
      </section>
      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-bank-600">
            Everything in one place
          </p>
          <h2 className="mt-4 max-w-2xl text-4xl leading-tight text-[#152219] sm:text-5xl">
            Choose the account that fits your next move.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-500">
            Straightforward products, useful digital tools, and support that
            stays close when you need it.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map(([title, benefit, copy], index) => {
              const Icon = productIcons[index];
              const id =
                index === 2
                  ? "cards"
                  : index === 4
                    ? "corporate"
                    : index === 0
                      ? "personal"
                      : undefined;
              return (
                <article
                  id={id}
                  key={title}
                  className="group rounded-xl border border-black/[.06] bg-white p-7 shadow-[0_12px_35px_rgba(17,45,28,.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(17,45,28,.11)]"
                >
                  <div className="grid size-12 place-items-center rounded-xl bg-bank-50 text-bank-700">
                    <Icon size={22} />
                  </div>
                  <p className="mt-7 text-[11px] font-bold uppercase tracking-[.16em] text-bank-600">
                    {benefit}
                  </p>
                  <h3 className="mt-2 text-2xl text-[#17233f]">{title}</h3>
                  <p className="mt-4 text-sm leading-7 text-neutral-500">
                    {copy}
                  </p>
                  <AuthTransitionLink
                    href="/register"
                    className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-bank-700"
                  >
                    Explore account{" "}
                    <ArrowRight
                      size={15}
                      className="transition group-hover:translate-x-1"
                    />
                  </AuthTransitionLink>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section
        id="international"
        className="bg-bank-900 px-5 py-20 text-white sm:px-8 sm:py-24"
      >
        <div className="mx-auto max-w-[1100px]">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#e4b74e]">
                Made for modern banking
              </p>
              <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">
                Helpful technology. Human support.
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-white/60">
              Bank locally or across borders with tools designed to stay simple,
              responsive, and secure on every device.
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.slice(0, 4).map(([title, copy], index) => {
              const Icon = benefitIcons[index];
              return (
                <article key={title} className="bg-bank-900 p-7">
                  <Icon className="text-[#e4b74e]" size={24} />
                  <h3 className="mt-5 text-xl">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/55">{copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1100px] text-center">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-bank-600">
            Designed around you
          </p>
          <h2 className="mt-4 text-4xl text-[#152219] sm:text-5xl">
            Personal clarity. Business capability.
          </h2>
          <div className="mt-12 grid gap-6 text-left md:grid-cols-2">
            {features.items.map((item, index) => {
              const Icon = index === 0 ? Building2 : UserRound;
              return (
                <article
                  key={item.title}
                  className="rounded-xl bg-white p-8 shadow-[0_14px_45px_rgba(17,45,28,.08)] sm:p-10"
                >
                  <Icon className="text-bank-600" size={30} />
                  <h3 className="mt-7 text-3xl">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-neutral-500">
                    {item.description}
                  </p>
                  <AuthTransitionLink
                    href={index === 0 ? "/corporate-banking" : "/register"}
                    className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-bank-700"
                  >
                    Learn more <ArrowRight size={15} />
                  </AuthTransitionLink>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="bg-[#e9f1eb] px-5 py-20 text-center sm:px-8">
        <h2 className="mx-auto max-w-2xl text-4xl text-[#152219] sm:text-5xl">
          Ready for banking that keeps up?
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-neutral-600">
          Create your SecurePath Shield profile and start building toward what matters
          next.
        </p>
        <AuthTransitionLink href="/register" className="btn mt-8">
          Get started today <ArrowRight size={16} />
        </AuthTransitionLink>
      </section>
      <PublicFooter />
      <LanguageSelector />
    </main>
  );
}
