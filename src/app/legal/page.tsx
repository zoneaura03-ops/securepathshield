import { PublicHeader } from "../../components/public-header";
import { PublicFooter } from "../../components/public-footer";
const sections = [
  [
    "Demonstration notice",
    "SecurePath Shield is currently a demonstration banking interface. It is not represented as a licensed bank, deposit-taking institution, broker, or money transmitter. Do not send real funds to demonstration wallet addresses.",
  ],
  [
    "Privacy",
    "Production deployment must publish the identity of its data controller, lawful processing purposes, retention periods, customer rights, subprocessors, international-transfer safeguards, and a working privacy contact.",
  ],
  [
    "Deposit protection and regulation",
    "No FDIC, NCUA, FSCS, or other deposit-insurance coverage should be claimed unless the operating legal entity has confirmed eligibility and supplied the exact required disclosure.",
  ],
  [
    "Electronic communications",
    "Customers must consent to electronic statements and notices before paper delivery is replaced. Material terms, fees, exchange rates, and transfer timing must be disclosed before authorization.",
  ],
  [
    "Complaints and accessibility",
    "A production operator must provide an accessible complaints process, escalation timelines, alternative document formats, and jurisdiction-appropriate ombudsman or regulator information.",
  ],
];
export default function Page() {
  return (
    <main id="main-content">
      <PublicHeader />
      <section className="bg-bank-900 px-5 py-20 text-white sm:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#dda936]">
            Legal and regulatory
          </p>
          <h1 className="mt-4 text-5xl">Clear disclosures build trust.</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60">
            These interim disclosures deliberately avoid unsupported regulatory
            or deposit-insurance claims.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl space-y-5 px-5 py-16 sm:px-8">
        {sections.map(([title, copy]) => (
          <article key={title} className="rounded-xl border bg-white p-6">
            <h2 className="text-2xl">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-neutral-600">{copy}</p>
          </article>
        ))}
      </section>
      <PublicFooter />
    </main>
  );
}
