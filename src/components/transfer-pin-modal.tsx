"use client";

import { ShieldCheck, X } from "lucide-react";
import { PINPad } from "./pin-pad";

export function TransferPinModal({
  value,
  onChange,
  onClose,
  onConfirm,
}: {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#050d18]/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="transfer-pin-title">
      <div className="relative w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl sm:p-8">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200" aria-label="Close PIN entry">
          <X size={18} />
        </button>
        <span className="grid size-12 place-items-center rounded-2xl bg-gold-50 text-gold-600"><ShieldCheck size={22} /></span>
        <h2 id="transfer-pin-title" className="mt-5 text-2xl">Authorize transfer</h2>
        <p className="mt-2 pr-8 text-sm leading-6 text-neutral-500">Enter your 4-digit transaction PIN to securely authorize this transfer.</p>
        <div className="mt-7"><PINPad value={value} onChange={onChange} /></div>
        <button type="button" disabled={value.length !== 4} onClick={onConfirm} className="btn mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40">
          <ShieldCheck size={17} /> Verify PIN and continue
        </button>
      </div>
    </div>
  );
}

// Hostinger source snapshot sync.
