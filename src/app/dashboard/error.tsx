"use client";
import { AlertTriangle, RotateCcw } from "lucide-react";
export default function ErrorState({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle />
        </span>
        <h1 className="mt-5 text-3xl">We couldn’t load your account</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Your information is safe. Check your connection and try loading the
          dashboard again.
        </p>
        <button onClick={reset} className="btn mt-6">
          <RotateCcw size={16} />
          Try again
        </button>
      </div>
    </div>
  );
}
