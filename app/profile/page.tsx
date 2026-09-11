import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Settings,
  Download,
  Search,
  Heart,
  UploadCloud,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="px-6 pt-20 text-center">
        <UserIcon size={36} className="mx-auto text-neutral-400 mb-3" />
        <h1 className="text-lg font-semibold mb-1">You're not signed in</h1>
        <p className="text-sm text-neutral-500 mb-5">Log in to save favorites and track downloads.</p>
        <div className="flex gap-2 justify-center">
          <Link href="/login" className="rounded-2xl bg-brand-600 text-white font-semibold px-5 py-2.5 text-sm">
            Log in
          </Link>
          <Link href="/signup" className="rounded-2xl border border-black/10 dark:border-white/10 font-semibold px-5 py-2.5 text-sm">
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const links = [
    { href: "/profile/downloads", label: "Download history", icon: Download },
    { href: "/profile/search-history", label: "Search history", icon: Search },
    { href: "/profile/favorites", label: "Saved / Favorite apps", icon: Heart },
    ...(profile?.is_developer ? [{ href: "/profile/uploads", label: "My uploads", icon: UploadCloud }] : []),
    { href: "/profile/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-14 w-14 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-lg font-semibold text-brand-700 dark:text-brand-300">
          {profile?.username?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="font-semibold">{profile?.username}</p>
          <p className="text-sm text-neutral-500">{profile?.email}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 overflow-hidden divide-y divide-black/5 dark:divide-white/5">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 px-4 py-3.5 text-sm">
            <Icon size={18} className="text-neutral-400" />
            {label}
          </Link>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 overflow-hidden">
        <LogoutButton />
      </div>
    </div>
  );
}
