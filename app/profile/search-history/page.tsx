"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { X, Search } from "lucide-react";

interface HistoryItem {
  id: string;
  query: string;
  created_at: string;
}

export default function SearchHistoryPage() {
  const supabase = createClient();
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
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
        .from("search_history")
        .select("id, query, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setItems(data ?? []);
      setLoading(false);
    })();
  }, []);

  async function deleteOne(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("search_history").delete().eq("id", id);
  }

  async function clearAll() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setItems([]);
    await supabase.from("search_history").delete().eq("user_id", user.id);
  }

  if (loading) return <div className="px-4 pt-16 text-center text-neutral-400">Loading...</div>;

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Search history</h1>
        {items.length > 0 && (
          <button onClick={clearAll} className="text-sm text-brand-600 font-medium">
            Clear all
          </button>
        )}
      </div>
      {items.length === 0 && <p className="text-sm text-neutral-400 text-center py-12">No searches yet.</p>}
      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10"
          >
            <div className="flex items-center gap-2 text-sm min-w-0">
              <Search size={14} className="text-neutral-400 shrink-0" />
              <span className="truncate">{item.query}</span>
            </div>
            <button onClick={() => deleteOne(item.id)} aria-label="Delete">
              <X size={16} className="text-neutral-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
