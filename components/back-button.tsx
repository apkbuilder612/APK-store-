"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function BackButton({ label }: { label?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1 px-4 pt-4 pb-1 text-sm font-medium text-neutral-600 dark:text-neutral-400"
    >
      <ChevronLeft size={18} />
      {label ?? "Back"}
    </button>
  );
}
