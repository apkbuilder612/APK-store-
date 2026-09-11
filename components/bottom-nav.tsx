"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Globe, User } from "lucide-react";
import clsx from "clsx";

const TABS = [
  { href: "/", label: "APK", icon: Package },
  { href: "/pwa", label: "PWA", icon: Globe },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-black/5 dark:border-white/10 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-lg">
      <div className="mx-auto max-w-lg flex items-stretch">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors"
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.4 : 1.8}
                className={clsx(
                  "transition-all duration-200",
                  active ? "text-brand-600 scale-110" : "text-neutral-400"
                )}
              />
              <span
                className={clsx(
                  "text-[11px] font-medium transition-colors",
                  active ? "text-brand-600" : "text-neutral-400"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
