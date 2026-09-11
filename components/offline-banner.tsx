"use client";

import { WifiOff } from "lucide-react";
import { useOnline } from "@/lib/use-online";

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-amber-500 text-amber-950 text-sm font-medium py-1.5">
      <WifiOff size={14} />
      You're offline — showing previously loaded content
    </div>
  );
}
