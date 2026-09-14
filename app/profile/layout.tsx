"use client";

import { usePathname } from "next/navigation";
import { BackButton } from "@/components/back-button";

// Wraps every /profile/* route. The hub page itself (/profile) is reached
// from the bottom nav, so it doesn't need a back arrow — every route
// beneath it (favorites, downloads, settings, uploads, etc.) does.
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHub = pathname === "/profile";

  return (
    <div>
      {!isHub && <BackButton label="Profile" />}
      {children}
    </div>
  );
}
