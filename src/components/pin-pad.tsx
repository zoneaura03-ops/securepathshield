"use client";
import { Delete } from "lucide-react";
export function PINPad({
  value,
  onChange,
  max = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  max?: number;
}) {
  return (
    <div>
      <div className="mb-5 flex justify-center gap-4">
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full border-2 border-bank-600 ${value[i] ? "bg-bank-600" : ""}`}
          />
        ))}
      </div>
      <div className="mx-auto grid max-w-xs grid-cols-3 gap-x-3 gap-y-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "x"].map((n, i) =>
          n === "" ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              className="grid h-12 place-items-center rounded-full text-xl font-semibold hover:bg-bank-50"
              onClick={() =>
                n === "x"
                  ? onChange(value.slice(0, -1))
                  : value.length < max && onChange(value + String(n))
              }
            >
              {n === "x" ? <Delete /> : n}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

// Hostinger source snapshot sync.
