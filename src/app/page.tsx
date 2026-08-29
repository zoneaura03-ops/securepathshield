import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  ChartPie,
  Check,
  CreditCard,
  Globe2,
  HandCoins,
  Headphones,
  Landmark,
  LockKeyhole,
  PiggyBank,
  Quote,
  ScanFace,
  ShieldCheck,
  Smartphone,
  UserPlus,
  WalletCards,
} from "lucide-react";
import { AuthTransitionLink } from "../components/auth-transition-link";
import { LanguageSelector } from "../components/language-selector";
import { PublicFooter } from "../components/public-footer";
import { PublicHeader } from "../components/public-header";
import { publicContent } from "../lib/public-content";

const productIcons = [Landmark, PiggyBank, CreditCard, HandCoins];
const benefitIcons = [Globe2, Smartphone, ChartPie, Headphones];
const stepIcons = [UserPlus, BadgeCheck, WalletCards];

function Heading({
  eyebrow,
  title,
  copy,
  center = false,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      <p className="text-[11px] font-bold uppercase tracking-[.2em] text-bank-600">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-[38px] font-normal leading-[1.12] tracking-[-.02em] sm:text-[48px]">
        {title}
      </h2>
      {copy && (
        <p className="mt-5 text-[15px] leading-7 text-neutral-500">{copy}</p>
      )}
    </div>
  );
}

export default function Home() {
  const { hero, proof, products, benefits, steps, security, testimonials } =
    publicContent;
  return (
    <main id="main-content" className="bg-white">
      <PublicHeader />
      <section className="relative isolate min-h-[700px] overflow-hidden text-white lg:min-h-[calc(100svh-78px)]">
        <Image
          src="/images/securepathbank-corporate-hero.webp"
          alt="SecurePath Bank banking professional"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-30 object-cover object-[68%_center] lg:object-center"
        />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(5,38,25,.97),rgba(10,67,43,.88)_44%,rgba(5,38,25,.35))]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#082f20]/70 via-transparent to-transparent" />
        <div className="mx-auto flex min-h-[700px] max-w-[1180px] items-center px-5 py-16 sm:px-8 lg:min-h-[calc(100svh-78px)]">
          <div className="max-w-[650px] text-center lg:text-left">
            <p className="inline-flex rounded-full border border-[#efc55d]/35 bg-black/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#efc55d]">
              🏆 {hero.eyebrow}
            </p>
            <h1 className="mt-7 text-[44px] font-normal leading-[1.07] tracking-[-.035em] sm:text-[62px] lg:text-[68px]">
              {hero.title}
            </h1>
            <p className="mt-6 max-w-[580px] text-[15px] leading-7 text-white/75 sm:text-base">
              {hero.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <AuthTransitionLink
                href="/register"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-[#2563eb] px-7 text-sm font-bold text-[#10233f]"
              >
                {hero.primaryAction}
                <ArrowRight size={16} />
              </AuthTransitionLink>
              <AuthTransitionLink
                href="/login"
                className="inline-flex min-h-14 items-center justify-center rounded-md border border-white/45 bg-white/[.06] px-7 text-sm font-semibold"
              >
                {hero.secondaryAction}
              </AuthTransitionLink>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-3 border-t border-white/20 pt-6 text-[10px] text-white/65">
              {hero.assurances.map((x, i) => (
                <span
                  className="flex items-center justify-center gap-2 lg:justify-start"
                  key={x}
                >
                  {i === 0 ? (
                    <ShieldCheck size={14} />
                  ) : i === 1 ? (
                    <LockKeyhole size={14} />
                  ) : (
                    <Headphones size={14} />
                  )}{" "}
                  {x}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b" aria-label="Trust and social proof">
        <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-px bg-[#e2e7f0] sm:grid-cols-3 lg:grid-cols-5">
          {proof.map(([mark, copy], i) => (
            <div
              key={mark}
              className={`flex min-h-24 flex-col items-center justify-center bg-white px-3 text-center ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}
            >
              <b className="text-sm tracking-[.1em] text-bank-700">{mark}</b>
              <span className="mt-2 text-[9px] uppercase tracking-[.1em] text-neutral-400">
                {copy}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section
        id="features"
        className="bg-[#f7f9fc] px-5 py-24 sm:px-8 sm:py-28"
      >
        <div className="mx-auto max-w-[1100px]">
          <Heading
            center
            eyebrow="Accounts and services"
            title="Banking for real life and real business."
            copy="Four essential products, one secure relationship."
          />
          <div className="mt-12 grid overflow-hidden rounded-lg border border-[#e2e7f0] bg-white lg:grid-cols-2">
            <div className="relative min-h-[360px] lg:min-h-full">
              <Image
                src="/images/securepathbank-business-banking.webp"
                alt="Business owner using SecurePath Bank digital banking"
                fill
                sizes="(min-width:1024px) 50vw,100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bank-900/65 via-transparent to-transparent" />
              <p className="absolute bottom-6 left-6 max-w-xs font-serif text-3xl text-white">
                Your ambitions deserve a bank that keeps up.
              </p>
            </div>
            <div className="grid sm:grid-cols-2">
              {products.slice(0, 4).map(([title, benefit, copy], i) => {
                const Icon = productIcons[i];
                return (
                  <article
                    className="border-b border-[#e2e7f0] p-6 odd:sm:border-r"
                    key={title}
                  >
                    <Icon className="text-bank-600" size={22} />
                    <h3 className="mt-5 text-xl">{title}</h3>
                    <p className="mt-2 text-xs font-semibold text-bank-600">
                      {benefit}
                    </p>
                    <p className="mt-3 text-xs leading-5 text-neutral-500">
                      {copy}
                    </p>
                    <AuthTransitionLink
                      href="/register"
                      className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-bank-700"
                    >
                      Open account <ArrowRight size={13} />
                    </AuthTransitionLink>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1100px]">
          <Heading
            center
            eyebrow="Why SecurePath Bank"
            title="Everything important, nothing complicated."
            copy="Useful tools supported by real people and protection that works quietly in the background."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.slice(0, 4).map(([title, copy], i) => {
              const Icon = benefitIcons[i];
              return (
                <article
                  className="rounded-lg border border-[#e2e7f0] p-6"
                  key={title}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-md bg-bank-50 text-bank-600">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-6 font-sans text-sm font-semibold">
                    {title}
                  </h3>
                  <p className="mt-3 text-xs leading-6 text-neutral-500">
                    {copy}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-bank-900 px-5 py-24 text-white sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-[1100px] gap-14 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#e4b74e]">
              How it works
            </p>
            <h2 className="mt-4 text-[40px] font-normal leading-[1.12] sm:text-[48px]">
              Open, verify, and bank with confidence.
            </h2>
            <ol className="mt-9 space-y-7">
              {steps.map(([title, copy], i) => {
                const Icon = stepIcons[i];
                return (
                  <li className="flex gap-4" key={title}>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-bank-700">
                      <Icon size={18} />
                    </span>
                    <div>
                      <h3 className="font-sans font-semibold">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-white/55">
                        {copy}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <AuthTransitionLink
              href="/register"
              className="mt-9 inline-flex min-h-12 items-center gap-2 rounded-md bg-[#2563eb] px-6 text-sm font-bold text-[#10233f]"
            >
              Get started <ArrowRight size={15} />
            </AuthTransitionLink>
          </div>
          <div className="rounded-[24px] bg-white/10 p-4">
            <div className="rounded-xl bg-white p-5 text-[#10233f]">
              <div className="flex justify-between border-b pb-4">
                <div>
                  <p className="text-xs text-neutral-400">Available balance</p>
                  <p className="mt-1 font-serif text-3xl">£9,844.65</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-bank-50 text-bank-600">
                  <ScanFace size={20} />
                </span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {["Transfer", "Deposit", "Cards"].map((x) => (
                  <div
                    className="rounded-md bg-[#f7f9fc] p-4 text-center text-xs font-semibold"
                    key={x}
                  >
                    {x}
                  </div>
                ))}
              </div>
              {["Salary payment", "Online transfer", "Savings goal"].map(
                (x, i) => (
                  <div
                    className="mt-3 flex justify-between rounded-md border border-[#e2e7f0] p-3 text-xs"
                    key={x}
                  >
                    <span>{x}</span>
                    <b className={i === 1 ? "text-rose-600" : "text-bank-600"}>
                      {i === 1 ? "−£100.00" : "+£" + [2500, 0, 300][i] + ".00"}
                    </b>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-[1100px] gap-14 lg:grid-cols-2 lg:items-center">
          <div className="relative min-h-[420px] overflow-hidden rounded-lg">
            <Image
              src="/images/securepathbank-secure-mobile.webp"
              alt="Secure mobile banking authentication"
              fill
              sizes="(min-width:1024px) 50vw,100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-bank-900/20 to-transparent" />
          </div>
          <div>
            <Heading
              eyebrow="Security and customer trust"
              title="Protection you can see. Privacy you can control."
              copy="Secure access, active monitoring, and clear privacy controls help protect every interaction."
            />
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {security.slice(0, 4).map(([title, copy]) => (
                <div className="flex gap-3" key={title}>
                  <Check className="mt-0.5 shrink-0 text-bank-600" size={17} />
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                      {copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <figure className="mt-8 rounded-lg bg-bank-50 p-6">
              <Quote className="text-bank-300" size={23} />
              <blockquote className="mt-4 text-sm leading-7 text-neutral-600">
                {testimonials[0][0]}
              </blockquote>
              <figcaption className="mt-4 text-xs font-semibold text-bank-700">
                {testimonials[0][1]} · {testimonials[0][2]}
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f9fc] px-5 py-20 text-center sm:px-8">
        <Heading
          center
          eyebrow="Start today"
          title="Secure banking, built around you."
          copy="Open an account in minutes and take control of your financial future."
        />
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <AuthTransitionLink href="/register" className="btn min-w-48">
            Open an Account
          </AuthTransitionLink>
          <AuthTransitionLink
            href="/login"
            className="inline-flex min-h-12 min-w-48 items-center justify-center rounded-md border border-bank-600 px-5 text-sm font-semibold text-bank-700"
          >
            Access Your Account
          </AuthTransitionLink>
        </div>
      </section>

      <PublicFooter />
      <LanguageSelector />
    </main>
  );
}
