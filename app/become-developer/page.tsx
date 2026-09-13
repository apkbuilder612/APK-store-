"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UploadCloud, Loader2, CheckCircle2 } from "lucide-react";

// This page is intentionally not linked from anywhere in the app's nav,
// home page, or profile screens. Only someone who has this exact URL can
// reach it. It's the only place a normal account can become a developer.
export default function BecomeDeveloperPage() {
  const supabase = createClient();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    check();
  }, []);

  async function check() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setSignedIn(!!user);
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_developer")
        .eq("id", user.id)
        .single();
      setIsDeveloper(!!profile?.is_developer);
    }
    setChecking(false);
  }

  async function becomeDeveloper() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const devName = prompt("Developer / company / group name:");
    if (!devName) return;
    setCreating(true);
    const slug = devName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { error: devError } = await supabase
      .from("developers")
      .insert({ owner_id: user.id, name: devName, slug });
    if (devError) {
      alert(devError.message);
      setCreating(false);
      return;
    }
    await supabase.from("profiles").update({ is_developer: true }).eq("id", user.id);
    setIsDeveloper(true);
    setCreating(false);
  }

  if (checking) {
    return <div className="px-4 pt-16 text-center text-neutral-400">Loading...</div>;
  }

  if (!signedIn) {
    return (
      <div className="px-6 pt-16 text-center">
        <UploadCloud size={36} className="mx-auto text-neutral-400 mb-3" />
        <h1 className="text-lg font-semibold mb-1">Developer access</h1>
        <p className="text-sm text-neutral-500 mb-6">
          Sign up or log in to create a developer account.
        </p>
        <div className="flex gap-2 justify-center">
          <Link
            href="/signup?redirect=/become-developer"
            className="rounded-2xl bg-brand-600 text-white font-semibold px-5 py-2.5 text-sm"
          >
            Create account
          </Link>
          <Link
            href="/login?redirect=/become-developer"
            className="rounded-2xl border border-black/10 dark:border-white/10 font-semibold px-5 py-2.5 text-sm"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (isDeveloper) {
    return (
      <div className="px-6 pt-16 text-center">
        <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-3" />
        <h1 className="text-lg font-semibold mb-1">You're already a developer</h1>
        <p className="text-sm text-neutral-500 mb-6">
          You have upload access on this account.
        </p>
        <Link
          href="/profile/uploads"
          className="rounded-2xl bg-brand-600 text-white font-semibold px-5 py-2.5 text-sm"
        >
          Go to My uploads
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 pt-16 text-center">
      <UploadCloud size={36} className="mx-auto text-neutral-400 mb-3" />
      <h1 className="text-lg font-semibold mb-1">Become a developer</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Create a developer profile to publish apps to the store.
      </p>
      <button
        onClick={becomeDeveloper}
        disabled={creating}
        className="rounded-2xl bg-brand-600 text-white font-semibold px-5 py-3 disabled:opacity-70 inline-flex items-center gap-2"
      >
        {creating && <Loader2 size={16} className="animate-spin" />}
        Set up developer profile
      </button>
    </div>
  );
          }
