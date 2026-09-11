import { createClient } from "@/lib/supabase/server";
import { setApkStatus, setPwaStatus, resolveReport, postAnnouncement } from "./actions";
import { formatBytes } from "@/lib/format";

export default async function AdminPage() {
  const supabase = createClient();

  const [{ data: pendingApks }, { data: pendingPwas }, { data: reports }, { count: totalApks }, { count: totalUsers }, { count: totalDownloads }] =
    await Promise.all([
      supabase
        .from("apks")
        .select("id, name, created_at, developer:developers(name), latest_version:apk_versions!apks_latest_version_fk(version, file_size_bytes)")
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
      supabase
        .from("pwas")
        .select("id, name, website_url, created_at, developer:developers(name)")
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
      supabase
        .from("reports")
        .select("id, reason, created_at, apk:apks(name), pwa:pwas(name)")
        .eq("status", "open")
        .order("created_at", { ascending: true }),
      supabase.from("apks").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("downloads").select("id", { count: "exact", head: true }),
    ]);

  return (
    <div className="px-4 pt-6 pb-10 space-y-6">
      <h1 className="text-xl font-bold">Admin</h1>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Apps" value={totalApks ?? 0} />
        <Stat label="Users" value={totalUsers ?? 0} />
        <Stat label="Downloads" value={totalDownloads ?? 0} />
      </div>

      <section>
        <h2 className="text-sm font-semibold mb-2">Pending APKs ({pendingApks?.length ?? 0})</h2>
        <div className="space-y-2">
          {(pendingApks ?? []).map((apk: any) => {
            const dev = Array.isArray(apk.developer) ? apk.developer[0] : apk.developer;
            const version = Array.isArray(apk.latest_version) ? apk.latest_version[0] : apk.latest_version;
            return (
              <div key={apk.id} className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10">
                <p className="text-sm font-medium">{apk.name}</p>
                <p className="text-xs text-neutral-400">
                  {dev?.name} {version && `· v${version.version} · ${formatBytes(version.file_size_bytes)}`}
                </p>
                <div className="flex gap-2 mt-2">
                  <form action={setApkStatus.bind(null, apk.id, "approved")}>
                    <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-600 text-white">Approve</button>
                  </form>
                  <form action={setApkStatus.bind(null, apk.id, "rejected")}>
                    <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-600 text-white">Reject</button>
                  </form>
                </div>
              </div>
            );
          })}
          {(pendingApks ?? []).length === 0 && <p className="text-xs text-neutral-400">Nothing pending.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">Pending PWAs ({pendingPwas?.length ?? 0})</h2>
        <div className="space-y-2">
          {(pendingPwas ?? []).map((pwa: any) => {
            const dev = Array.isArray(pwa.developer) ? pwa.developer[0] : pwa.developer;
            return (
              <div key={pwa.id} className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10">
                <p className="text-sm font-medium">{pwa.name}</p>
                <p className="text-xs text-neutral-400 break-all">{dev?.name} · {pwa.website_url}</p>
                <div className="flex gap-2 mt-2">
                  <form action={setPwaStatus.bind(null, pwa.id, "approved")}>
                    <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-600 text-white">Approve</button>
                  </form>
                  <form action={setPwaStatus.bind(null, pwa.id, "rejected")}>
                    <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-600 text-white">Reject</button>
                  </form>
                </div>
              </div>
            );
          })}
          {(pendingPwas ?? []).length === 0 && <p className="text-xs text-neutral-400">Nothing pending.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">Open reports ({reports?.length ?? 0})</h2>
        <div className="space-y-2">
          {(reports ?? []).map((r: any) => {
            const apk = Array.isArray(r.apk) ? r.apk[0] : r.apk;
            const pwa = Array.isArray(r.pwa) ? r.pwa[0] : r.pwa;
            return (
              <div key={r.id} className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10">
                <p className="text-sm font-medium">{apk?.name ?? pwa?.name ?? "Unknown"}</p>
                <p className="text-xs text-neutral-400">{r.reason}</p>
                <form action={resolveReport.bind(null, r.id)} className="mt-2">
                  <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-neutral-700 text-white">Mark resolved</button>
                </form>
              </div>
            );
          })}
          {(reports ?? []).length === 0 && <p className="text-xs text-neutral-400">No open reports.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">Post announcement</h2>
        <form
          action={async (formData: FormData) => {
            "use server";
            await postAnnouncement(
              String(formData.get("title") ?? ""),
              String(formData.get("body") ?? "")
            );
          }}
          className="space-y-2"
        >
          <input
            name="title"
            required
            placeholder="Title"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm"
          />
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Message"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm"
          />
          <button className="w-full rounded-2xl bg-brand-600 text-white font-semibold py-2.5 text-sm">
            Post
          </button>
        </form>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] text-neutral-400">{label}</p>
    </div>
  );
}
