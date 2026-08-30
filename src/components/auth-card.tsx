"use client";

import {
  FormEvent,
  type ChangeEventHandler,
  type ReactNode,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Eye,
  EyeOff,
  Globe2,
  Lock,
  Mail,
  Phone,
  UserRound,
  WalletCards,
} from "lucide-react";
import { BrandMark } from "./logo";
import { LogoLoader } from "./logo-loader";
import { AuthTransitionLink } from "./auth-transition-link";
import { countries, countryName } from "../lib/countries";

function Field({
  label,
  icon,
  type = "text",
  placeholder,
  autoComplete,
  value,
  onChange,
}: {
  label: string;
  icon: ReactNode;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center border-r border-[#e2e7f0] text-neutral-400">
          {icon}
        </span>
        <input
          required
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className="field !pl-[58px]"
        />
      </span>
    </label>
  );
}

function Select({
  label,
  icon,
  children,
  value,
  onChange,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
  value?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center border-r border-[#e2e7f0] text-neutral-400">
          {icon}
        </span>
        <select
          required
          value={value}
          onChange={onChange}
          className="field !pl-[58px]"
        >
          <option value="">Select an option</option>
          {children}
        </select>
      </span>
    </label>
  );
}

function Frame({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`mx-auto w-full ${wide ? "max-w-xl" : "max-w-md"}`}>
      <div className="rounded-lg border border-white/70 bg-white p-7 shadow-[0_24px_70px_rgba(0,20,12,.3)] sm:p-9">
        <div className="mb-7 flex justify-center border-b border-[#e2e7f0] pb-6">
          <AuthTransitionLink
            href="/"
            className="inline-flex items-center gap-2 text-bank-700"
          >
            <BrandMark />
            <span className="text-xs font-bold tracking-[.22em]">SECUREPATH BANK</span>
          </AuthTransitionLink>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AuthCard({
  register = false,
  notice,
}: {
  register?: boolean;
  notice?: string;
}) {
  return register ? <Registration /> : <Login notice={notice} />;
}

function Login({ notice }: { notice?: string }) {
  const router = useRouter(),
    [loading, setLoading] = useState(false),
    [show, setShow] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [website, setWebsite] = useState(""),
    [remember, setRemember] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember, website }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to sign in.");
      const requestedDestination = sessionStorage.getItem(
        "securepathbank_login_destination",
      );
      const safeDestination =
        requestedDestination?.startsWith("/dashboard/") && data.role !== "admin"
          ? requestedDestination
          : data.role === "admin"
            ? "/admin"
            : "/dashboard";
      sessionStorage.setItem("securepathbank_login_destination", safeDestination);
      router.push("/pin");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
      setLoading(false);
    }
  }
  return (
    <>
      <Frame>
        <p className="text-[11px] font-bold uppercase tracking-[.18em] text-bank-600">
          Secure sign in
        </p>
        <h1 className="mt-2 text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          Enter your details to access your SecurePath Bank account.
        </p>
        <form onSubmit={submit} className="mt-7 space-y-5">
          <label className="absolute -left-[10000px]" aria-hidden><span>Website</span><input tabIndex={-1} autoComplete="off" value={website} onChange={event=>setWebsite(event.target.value)} /></label>
          <Field
            label="Email address"
            icon={<Mail size={16} />}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label>
            <span className="label">Password</span>
            <span className="relative block">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center border-r border-[#e2e7f0] text-neutral-400">
                <Lock size={16} />
              </span>
              <input
                required
                minLength={8}
                type={show ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Your password"
                className="field !px-[58px]"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-neutral-400"
              >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
          <div className="flex items-center justify-between gap-3 text-xs">
            <label className="flex items-center gap-2 text-neutral-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="accent-bank-600"
              />
              Stay signed in
            </label>
            <Link href="/forgot-password" className="font-medium text-bank-700">
              Forgot password?
            </Link>
          </div>
          {notice && (
            <p
              role="status"
              className="rounded-md border border-gold-300 bg-gold-50 p-3 text-sm text-gold-700"
            >
              {notice}
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <button disabled={loading} className="btn w-full">
            {loading ? "Signing in…" : "Sign In to Account"}
            <ArrowRight size={16} />
          </button>
        </form>
        <p className="mt-6 flex items-center justify-center gap-1 text-center text-xs text-neutral-500">
          <span>New to SecurePath Bank?</span>
          <AuthTransitionLink
            href="/register"
            className="font-semibold text-bank-700"
          >
            Open an account
          </AuthTransitionLink>
        </p>
      </Frame>
      {loading && (
        <div className="fixed inset-0 z-[100] bg-[#0a1728]/20 backdrop-blur-[1px]">
          <LogoLoader transparent />
        </div>
      )}
    </>
  );
}

const steps = ["Identity", "Contact", "Account", "Security"];

function passwordChecks(password: string) {
  return [
    { label: "10 or more characters", met: password.length >= 10 },
    { label: "An uppercase letter", met: /[A-Z]/.test(password) },
    { label: "A lowercase letter", met: /[a-z]/.test(password) },
    { label: "A number", met: /\d/.test(password) },
    { label: "A symbol", met: /[^A-Za-z0-9]/.test(password) },
  ];
}

function Registration() {
  const router = useRouter(),
    [step, setStep] = useState(0),
    [loading, setLoading] = useState(false),
    [transitioning, setTransitioning] = useState(false),
    [show, setShow] = useState(false),
    [residenceCountry, setResidenceCountry] = useState(""),
    [phone, setPhone] = useState(""),
    [email, setEmail] = useState(""),
    [firstName, setFirstName] = useState(""),
    [lastName, setLastName] = useState(""),
    [dateOfBirth, setDateOfBirth] = useState(""),
    [accountType, setAccountType] = useState("Checking Account"),
    [password, setPassword] = useState(""),
    [passwordConfirmation, setPasswordConfirmation] = useState(""),
    [pin, setPin] = useState(""),
    [pinConfirmation, setPinConfirmation] = useState(""),
    [error, setError] = useState("");
  const checks = passwordChecks(password);
  const passwordScore = checks.filter((check) => check.met).length;
  const passwordStrong = passwordScore === checks.length;
  async function proceed(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    if (password !== passwordConfirmation) {
      setError("The passwords do not match.");
      return;
    }
    if (!passwordStrong) {
      setError("Create a strong password that meets every requirement.");
      return;
    }
    if (pin !== pinConfirmation) {
      setError("The transaction PINs do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          dateOfBirth,
          email,
          phone,
          country: countryName(residenceCountry),
          accountType,
          password,
          pin,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to send the verification code.");
      }
      sessionStorage.setItem("securepathbank_verification_email", email);
      setTransitioning(true);
      router.push(`/verify?email=${encodeURIComponent(email)}`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to send the verification code.",
      );
      setLoading(false);
    }
  }
  return (
    <>
      <Frame wide>
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-bank-600">
              Open an account
            </p>
            <h1 className="mt-2 text-3xl">{steps[step]}</h1>
            <p className="mt-2 text-sm text-neutral-500">
              Step {step + 1} of {steps.length}
            </p>
          </div>
          <span className="rounded-full bg-bank-50 px-3 py-1.5 text-xs font-semibold text-bank-700">
            {Math.round(((step + 1) / steps.length) * 100)}%
          </span>
        </div>
        <div className="mt-6 flex gap-2">
          {steps.map((x, i) => (
            <div key={x} className="flex-1">
              <div
                className={`h-1 rounded-full ${i <= step ? "bg-bank-600" : "bg-neutral-200"}`}
              />
              <p className="mt-2 hidden text-[10px] text-neutral-400 sm:block">
                {x}
              </p>
            </div>
          ))}
        </div>
        <form onSubmit={proceed} className="mt-7 space-y-5">
          {step === 0 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="First name"
                icon={<UserRound size={16} />}
                autoComplete="given-name"
                placeholder="First name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
              <Field
                label="Last name"
                icon={<UserRound size={16} />}
                autoComplete="family-name"
                placeholder="Last name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
              <div className="sm:col-span-2">
                <Field
                  label="Date of birth"
                  icon={<CalendarDays size={16} />}
                  type="date"
                  autoComplete="bday"
                  value={dateOfBirth}
                  onChange={(event) => setDateOfBirth(event.target.value)}
                />
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-5">
              <Field
                label="Email address"
                icon={<Mail size={16} />}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Select
                  label="Country of residence"
                  icon={<Globe2 size={16} />}
                  value={residenceCountry}
                  onChange={(event) => setResidenceCountry(event.target.value)}
                >
                  {countries.map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </Select>
                <Field
                  label="Phone number"
                  icon={<Phone size={16} />}
                  type="tel"
                  autoComplete="tel"
                  placeholder="International number, e.g. +65…"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value.replace(/[^0-9+ ()-]/g, ""))
                  }
                />
              </div>
              <p className="text-[11px] text-neutral-400">
                Enter the complete phone number with its international dialing
                code.
              </p>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-5">
              <Select
                label="Preferred account"
                icon={<WalletCards size={16} />}
                value={accountType}
                onChange={(event) => setAccountType(event.target.value)}
              >
                <option>Checking Account</option>
                <option>Savings Account</option>
                <option>Current Account</option>
                <option>Joint Account</option>
                <option>Business Account</option>
              </Select>
              <div className="rounded-md bg-bank-50 p-4 text-xs leading-6 text-bank-900">
                You can add or change account products after identity
                verification.
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-5">
              <label>
                <span className="label">Create password</span>
                <span className="relative block">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center border-r border-[#e2e7f0] text-neutral-400">
                    <Lock size={16} />
                  </span>
                  <input
                    required
                    minLength={10}
                    type={show ? "text" : "password"}
                    placeholder="At least 10 characters"
                    className="field !px-[58px]"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center text-neutral-400"
                  >
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>
              <div aria-live="polite" className="rounded-md border border-[#e2e7f0] bg-neutral-50 p-4">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Password strength</span>
                  <span className={passwordStrong ? "text-gold-700" : passwordScore >= 3 ? "text-amber-700" : "text-red-700"}>
                    {passwordStrong ? "Strong" : passwordScore >= 3 ? "Medium" : "Weak"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-5 gap-1" aria-hidden="true">
                  {checks.map((_, index) => (
                    <span key={index} className={`h-1.5 rounded-full ${index < passwordScore ? (passwordStrong ? "bg-gold-500" : passwordScore >= 3 ? "bg-amber-500" : "bg-red-500") : "bg-neutral-200"}`} />
                  ))}
                </div>
                <ul className="mt-3 grid gap-1 text-[11px] text-neutral-500 sm:grid-cols-2">
                  {checks.map((check) => (
                    <li key={check.label} className={check.met ? "text-gold-700" : undefined}>
                      {check.met ? "?" : "?"} {check.label}
                    </li>
                  ))}
                </ul>
              </div>

              <Field
                label="Confirm password"
                icon={<Lock size={16} />}
                type={show ? "text" : "password"}
                placeholder="Repeat password"
                value={passwordConfirmation}
                onChange={(event) =>
                  setPasswordConfirmation(event.target.value)
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="4-digit transaction PIN"
                  icon={<Lock size={16} />}
                  type="password"
                  placeholder="••••"
                  value={pin}
                  onChange={(event) =>
                    setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                />
                <Field
                  label="Confirm PIN"
                  icon={<Lock size={16} />}
                  type="password"
                  placeholder="••••"
                  value={pinConfirmation}
                  onChange={(event) =>
                    setPinConfirmation(
                      event.target.value.replace(/\D/g, "").slice(0, 4),
                    )
                  }
                />
              </div>
              <label className="flex items-start gap-3 rounded-md border border-[#e2e7f0] bg-neutral-50 p-4 text-xs leading-5 text-neutral-600">
                <input
                  required
                  type="checkbox"
                  className="mt-0.5 accent-bank-600"
                />
                <span>
                  I am at least 18 and agree to the Terms, Privacy Policy, and
                  identity verification checks.
                </span>
              </label>
            </div>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#d8dfeb] px-5 text-sm font-semibold"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
            <button disabled={loading} className="btn flex-1">
              {loading
                ? "Creating account…"
                : step === 3
                  ? "Create Secure Account"
                  : "Continue"}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
        <p className="mt-6 flex items-center justify-center gap-1 text-center text-xs text-neutral-500">
          <span>Already enrolled?</span>
          <AuthTransitionLink
            href="/login"
            className="font-semibold text-bank-700"
          >
            Sign in
          </AuthTransitionLink>
        </p>
      </Frame>
      {transitioning && (
        <div className="fixed inset-0 z-[100] bg-[#0a1728]/20 backdrop-blur-[1px]">
          <LogoLoader transparent />
        </div>
      )}
    </>
  );
}

// Hostinger source snapshot sync.
