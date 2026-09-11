"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Bell, BellOff } from "lucide-react";
import { timeAgo } from "@/lib/format";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  type: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

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
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setItems(data ?? []);
      setLoading(false);

      const unreadIds = (data ?? []).filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length > 0) {
        await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
      }
    })();
  }, []);

  if (loading) return <div className="px-4 pt-16 text-center text-neutral-400">Loading...</div>;

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold mb-4">Notifications</h1>
      {items.length === 0 && (
        <div className="text-center py-16 text-neutral-400">
          <BellOff size={30} className="mx-auto mb-2" />
          <p className="text-sm">No notifications yet.</p>
        </div>
      )}
      <div className="space-y-2">
        {items.map((n) => (
          <div
            key={n.id}
            className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10"
          >
            <div className="flex items-start gap-2">
              <Bell size={15} className="text-brand-600 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{n.title}</p>
                {n.body && <p className="text-xs text-neutral-500 mt-0.5">{n.body}</p>}
                <p className="text-[11px] text-neutral-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
