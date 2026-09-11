"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center px-6 pt-32 min-h-dvh">
      <AlertTriangle size={36} className="text-amber-500" />
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="text-sm text-neutral-500 max-w-xs">Please try again.</p>
      <button onClick={reset} className="mt-2 rounded-2xl bg-brand-600 text-white font-semibold px-5 py-2.5 text-sm">
        Try again
      </button>
    </div>
  );
}
