import { Wifi } from "lucide-react";
import { SiVisa } from "react-icons/si";
import { BrandMark } from "./logo";

type CardBrand = "visa" | "mastercard" | "amex" | string;

export function VirtualCardArt({
  brand,
  lastFour,
  holder = "LUME CUSTOMER",
  expiryMonth,
  expiryYear,
  compact = false,
}: {
  brand: CardBrand;
  lastFour?: string | null;
  holder?: string;
  expiryMonth?: number | null;
  expiryYear?: number | null;
  compact?: boolean;
}) {
  const visa = brand === "visa";
  const credit = brand === "amex";
  const network = visa ? "VISA" : credit ? "CREDIT CARD" : "MASTERCARD";
  const digits = lastFour || (visa ? "4826" : credit ? "8808" : "6241");
  const expiry =
    expiryMonth && expiryYear
      ? `${String(expiryMonth).padStart(2, "0")}/${String(expiryYear).slice(-2)}`
      : "--/--";
  const background = visa
    ? "linear-gradient(135deg,#b78a32 0%,#0a1728 48%,#06111f 100%)"
    : credit
      ? "linear-gradient(135deg,#161a18 0%,#080b0a 58%,#18130a 100%)"
      : "linear-gradient(135deg,#26354f 0%,#0a1728 48%,#06111f 100%)";

  return (
    <div
      className={`relative aspect-[1.586/1] w-full overflow-hidden rounded-[inherit] text-white ${credit ? "ring-1 ring-inset ring-[#d6b45f]/80" : "ring-1 ring-inset ring-white/10"}`}
      style={{ background }}
      aria-label={`SecurePath Bank ${network} ending ${digits}`}
    >
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: visa
            ? "repeating-linear-gradient(45deg,transparent 0 17px,rgba(255,255,255,.11) 18px 19px),repeating-linear-gradient(-45deg,transparent 0 17px,rgba(255,255,255,.07) 18px 19px)"
            : "repeating-linear-gradient(100deg,transparent 0 5px,rgba(255,255,255,.045) 6px 7px)",
        }}
      />
      <div className={`absolute -right-[18%] -top-[38%] size-[72%] rounded-full ${credit ? "bg-[#d6b45f]/[.07]" : "bg-white/[.045]"}`} />

      <div className={`relative flex h-full flex-col ${compact ? "p-[9%]" : "p-[8%]"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-[5%]">
            <BrandMark className={`${compact ? "size-4" : "size-[clamp(1.2rem,4vw,2rem)]"} shrink-0 [--mark-path:#f1d47b] !text-[#f1d47b]`} />
            <div>
              <p className={`${compact ? "text-[6px]" : "text-[clamp(.52rem,1.8vw,.78rem)]"} font-bold tracking-[.2em] text-[#f1d47b]`}>
                SECUREPATH BANK
              </p>

            </div>
          </div>
          <NetworkMark brand={brand} compact={compact} />
        </div>

        <div className={`flex items-center ${compact ? "mt-[13%] gap-2" : "mt-[10%] gap-[7%]"}`}>
          <span className={`relative block rounded-[18%] bg-gradient-to-br from-[#f6df93] via-[#d4ac48] to-[#9b701d] shadow-inner ${compact ? "h-4 w-5" : "h-[clamp(1.6rem,7vw,2.6rem)] w-[clamp(2rem,9vw,3.4rem)]"}`}>
            <span className="absolute inset-[25%] rounded-sm border border-black/20" />
          </span>
          <Wifi className={`rotate-90 text-white/65 ${compact ? "size-3" : "size-[clamp(1rem,4vw,1.7rem)]"}`} />
        </div>

        <div className="mt-auto">
          <p className={`${compact ? "text-[7px] tracking-[.12em]" : "text-[clamp(.66rem,2.7vw,1.08rem)] tracking-[.18em]"} whitespace-nowrap font-semibold text-white/90`}>
            •••• &nbsp;•••• &nbsp;•••• &nbsp;{digits}
          </p>
          {!compact && (
            <div className="mt-[7%] flex items-end justify-between gap-4 uppercase text-white/50">
              <div className="min-w-0">
                <span className="block text-[clamp(.3rem,1vw,.42rem)] tracking-[.12em]">Card holder</span>
                <span className="mt-0.5 block truncate text-[clamp(.44rem,1.55vw,.66rem)] font-semibold tracking-[.12em] text-white/75">
                  {holder}
                </span>
              </div>
              <div className="shrink-0 text-right">
                <span className="block text-[clamp(.3rem,1vw,.42rem)] tracking-[.12em]">Valid thru</span>
                <span className="mt-0.5 block text-[clamp(.44rem,1.55vw,.66rem)] font-semibold tracking-[.1em] text-white/75">
                  {expiry}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NetworkMark({ brand, compact }: { brand: CardBrand; compact: boolean }) {
  if (brand === "visa")
    return <SiVisa className={compact ? "text-lg" : "text-[clamp(1.7rem,7vw,3.2rem)]"} />;
  if (brand === "amex")
    return (
      <span className={`${compact ? "text-[5px]" : "text-[clamp(.42rem,1.5vw,.68rem)]"} font-bold tracking-[.12em] text-[#e4c66d]`}>
        CREDIT CARD
      </span>
    );
  return (
    <span
      className={`relative block shrink-0 ${compact ? "h-4 w-7" : "h-[clamp(1.5rem,6vw,2.7rem)] w-[clamp(2.5rem,10vw,4.6rem)]"}`}
      aria-label="Mastercard"
    >
      <span className="absolute left-0 top-0 h-full aspect-square rounded-full bg-[#eb3b2f]" />
      <span className="absolute right-0 top-0 h-full aspect-square rounded-full bg-[#e6a72b] opacity-95" />
    </span>
  );
}
export function VirtualCardBack({
  brand,
  lastFour,
  holder = "LUME CUSTOMER",
}: {
  brand: CardBrand;
  lastFour?: string | null;
  holder?: string;
}) {
  const credit = brand === "amex";
  const digits = lastFour || (brand === "visa" ? "4826" : credit ? "8808" : "6241");
  const background =
    brand === "visa"
      ? "linear-gradient(135deg,#b78a32,#06111f)"
      : credit
        ? "linear-gradient(135deg,#161a18,#080b0a 60%,#18130a)"
        : "linear-gradient(135deg,#26354f,#06111f)";
  return (
    <div
      className={`relative aspect-[1.586/1] w-full overflow-hidden rounded-[inherit] text-white ${credit ? "ring-1 ring-inset ring-[#d6b45f]/80" : "ring-1 ring-inset ring-white/10"}`}
      style={{ background }}
    >
      <div className="absolute inset-x-0 top-[17%] h-[22%] bg-[#101211]" />
      <div className="absolute inset-x-[8%] top-[48%] flex h-[17%] items-center bg-[#f0eee6] px-[4%] text-[#27312c]">
        <span className="min-w-0 flex-1 truncate text-[clamp(.42rem,1.5vw,.68rem)] font-semibold uppercase tracking-[.12em]">
          {holder}
        </span>
        <span className="ml-3 bg-white px-[4%] py-[2%] font-mono text-[clamp(.42rem,1.5vw,.7rem)] italic">
          CVV •••
        </span>
      </div>
      <div className="absolute inset-x-[8%] bottom-[10%] flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#f1d47b]">
            <BrandMark className="size-[clamp(1rem,3.5vw,1.7rem)] [--mark-path:#f1d47b] !text-[#f1d47b]" />
            <span className="text-[clamp(.48rem,1.7vw,.74rem)] font-bold tracking-[.2em]">SECUREPATH BANK</span>
          </div>
          <p className="mt-1 text-[clamp(.3rem,1vw,.43rem)] text-white/45">
            This card is issued for authorized use only. support@securepathgroups.com
          </p>
        </div>
        <span className="shrink-0 text-[clamp(.42rem,1.4vw,.64rem)] tracking-[.16em] text-white/65">
          •••• {digits}
        </span>
      </div>
    </div>
  );
}

// Hostinger source snapshot sync.
