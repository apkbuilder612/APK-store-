import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatBytes } from "@/lib/format";
import { timeAgo } from "@/lib/format";

export default async function DownloadHistoryPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: downloads } = await supabase
    .from("downloads")
    .select(
      `id, status, created_at,
       apk:apks(name),
       version:apk_versions(version, file_size_bytes)`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = downloads ?? [];

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold mb-4">Download history</h1>
      {items.length === 0 && <p className="text-sm text-neutral-400 text-center py-12">No downloads yet.</p>}
      <div className="space-y-2">
        {items.map((d: any) => {
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
              <span className="text-xs text-neutral-400 shrink-0">{d.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
