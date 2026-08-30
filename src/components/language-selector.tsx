"use client";

import { Check, ChevronDown, Globe2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const languages = [
  { code: "EN", locale: "en", label: "English", flag: "🇺🇸" },
  { code: "FR", locale: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ES", locale: "es", label: "Español", flag: "🇪🇸" },
] as const;

export function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<(typeof languages)[number]>(
    languages[0],
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("securepathbank-language");
    const language = languages.find((item) => item.code === saved);
    if (language) setSelected(language);
  }, []);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function choose(language: (typeof languages)[number]) {
    setSelected(language);
    document.documentElement.lang = language.locale;
    window.localStorage.setItem("securepathbank-language", language.code);
    setOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 left-4 z-40 sm:bottom-6 sm:left-6"
    >
      {open && (
        <div className="absolute bottom-[calc(100%+10px)] left-0 w-44 overflow-hidden rounded-lg border border-[#e2e7f0] bg-white py-1 shadow-[0_18px_45px_rgba(10,23,40,.18)]">
          {languages.map((language) => (
            <button
              type="button"
              key={language.code}
              onClick={() => choose(language)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs text-neutral-700 hover:bg-bank-50"
            >
              <span className="text-base">{language.flag}</span>
              <span className="flex-1">{language.label}</span>
              {selected.code === language.code && (
                <Check size={14} className="text-bank-600" />
              )}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        aria-label="Choose language"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex h-11 items-center gap-2 rounded-full border border-[#dce4df] bg-white px-3.5 text-xs font-semibold text-neutral-700 shadow-[0_8px_24px_rgba(10,23,40,.14)] hover:bg-bank-50"
      >
        <Globe2 size={16} className="text-bank-600" />
        <span className="text-sm">{selected.flag}</span>
        <span>{selected.code}</span>
        <ChevronDown
          size={14}
          className={`text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
    </div>
  );
}

// Hostinger source snapshot sync.
