"use client";

import { useEffect, useState } from "react";
import { Share2, Link2, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled share sheet — fall through to copy
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleShare}
      className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10"
      aria-label="Share"
    >
      {copied ? <Link2 size={18} className="text-brand-600" /> : <Share2 size={18} />}
    </button>
  );
}

export function FavoriteButton({
  apkId,
  pwaId,
}: {
  apkId?: string;
  pwaId?: string;
}) {
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      if (!data.user) return;
      supabase
        .from("favorites")
        .select("id")
        .eq("user_id", data.user.id)
        .match(apkId ? { apk_id: apkId } : { pwa_id: pwaId })
        .maybeSingle()
        .then(({ data: fav }) => setSaved(!!fav));
    });
  }, []);

  async function toggle() {
    if (!userId) {
      window.location.href = "/login";
      return;
    }
    if (saved) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .match(apkId ? { apk_id: apkId } : { pwa_id: pwaId });
      setSaved(false);
    } else {
      await supabase.from("favorites").insert({ user_id: userId, apk_id: apkId, pwa_id: pwaId });
      setSaved(true);
    }
  }

  return (
    <button
      onClick={toggle}
      className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10"
      aria-label="Favorite"
    >
      <Heart size={18} className={saved ? "fill-rose-500 text-rose-500" : ""} />
    </button>
  );
}
