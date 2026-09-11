"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [intervalDays, setIntervalDays] = useState(5);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("notifications_enabled, update_check_interval_days")
        .eq("id", user.id)
        .single();
      if (data) {
        setNotificationsEnabled(data.notifications_enabled);
        setIntervalDays(data.update_check_interval_days);
      }
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({
          notifications_enabled: notificationsEnabled,
          update_check_interval_days: intervalDays,
        })
        .eq("id", user.id);
    }
    setSaving(false);
  }

  if (loading) return <div className="px-4 pt-16 text-center text-neutral-400">Loading...</div>;

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold mb-5">Settings</h1>

      <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 divide-y divide-black/5 dark:divide-white/5">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <p className="text-sm font-medium">Update notifications</p>
            <p className="text-xs text-neutral-400">Get notified when favorited apps update</p>
          </div>
          <button
            onClick={() => setNotificationsEnabled((v) => !v)}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              notificationsEnabled ? "bg-brand-600" : "bg-neutral-300 dark:bg-neutral-700"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                notificationsEnabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="px-4 py-3.5">
          <p className="text-sm font-medium mb-2">Check frequency</p>
          <div className="flex gap-2">
            {[1, 5, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setIntervalDays(d)}
                className={`flex-1 text-xs font-medium py-2 rounded-xl border ${
                  intervalDays === d
                    ? "bg-brand-600 text-white border-brand-600"
                    : "border-black/10 dark:border-white/10"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-600 text-white font-semibold py-3 disabled:opacity-70"
      >
        {saving && <Loader2 size={16} className="animate-spin" />}
        Save
      </button>
    </div>
  );
}
