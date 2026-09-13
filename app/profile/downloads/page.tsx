"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatBytes, timeAgo } from "@/lib/format";
import { Trash2 } from "lucide-react";

interface DownloadRow {
  id: string;
  status: string;
  created_at: string;
  apk: { name: string } | { name: string }[] | null;
  version: { version: string; file_size_bytes: number } | { version: string; file_size_bytes: number }[] | null;
}

export default function DownloadHistoryPage() {
  const supabase = createClient();
  const router = useRouter();
  const [items, setItems] = useState<DownloadRow[]>([]);
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
        .from("downloads")
        .select(
          `id, status, created_at,
           apk:apks(name),
           version:apk_versions(version, file_size_bytes)`
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setItems((data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  async function removeDownload(id: string) {
    setItems((prev) => prev.filter((d) => d.id !== id));
    await supabase.from("downloads").delete().eq("id", id);
  }

  if (loading) {
    return <div className="px-4 pt-16 text-center text-neutral-400">Loading...</div>;
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold mb-4">Download history</h1>
      {items.length === 0 && (
        <p className="text-sm text-neutral-400 text-center py-12">No downloads yet.</p>
      )}
      <div className="space-y-2">
        {items.map((d) => {
          const apk = Array.isArray(d.apk) ? d.apk[0] : d.apk;
          const version = Array.isArray(d.version) ? d.version[0] : d.version;
          return (
            <div
              key={d.id}
              className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{apk?.name ?? "Unknown app"}</p>
                <p className="text-xs text-neutral-400">
                  {version?.version ? `v${version.version} · ` : ""}
                  {version?.file_size_bytes ? formatBytes(version.file_size_bytes) + " · " : ""}
                  {timeAgo(d.created_at)}
                </p>
              </div>
              <button
                onClick={() => removeDownload(d.id)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-rose-200 text-rose-500 flex items-center gap-1 shrink-0"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
