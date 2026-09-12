"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Package, Globe, Download, Trash2, Plus } from "lucide-react";
import { formatDownloadCount } from "@/lib/format";

interface ApkRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  download_count: number;
  latest_version?: { version: string } | { version: string }[] | null;
}
interface PwaRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  website_url: string;
}

export default function MyUploadsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [developerId, setDeveloperId] = useState<string | null>(null);
  const [apks, setApks] = useState<ApkRow[]>([]);
  const [pwas, setPwas] = useState<PwaRow[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: devs } = await supabase
      .from("developers")
      .select("id")
      .eq("owner_id", user.id);

    if (!devs || devs.length === 0) {
      setLoading(false);
      return;
    }
    const devIds = devs.map((d) => d.id);
    setDeveloperId(devIds[0]);

    const { data: apkData } = await supabase
      .from("apks")
      .select("id, name, slug, status, download_count, latest_version:apk_versions!apks_latest_version_fk(version)")
      .in("developer_id", devIds)
      .order("created_at", { ascending: false });
    setApks((apkData as any) ?? []);

    const { data: pwaData } = await supabase
      .from("pwas")
      .select("id, name, slug, status, website_url")
      .in("developer_id", devIds)
      .order("created_at", { ascending: false });
    setPwas((pwaData as any) ?? []);

    setLoading(false);
  }

  async function deleteApk(id: string, name: string) {
    if (!confirm(`Delete "${name}" permanently? This removes all its versions too.`)) return;
    const { error } = await supabase.from("apks").delete().eq("id", id);
    if (error) {
      alert("Could not delete: " + error.message);
      return;
    }
    setApks((prev) => prev.filter((a) => a.id !== id));
  }

  async function deletePwa(id: string, name: string) {
    if (!confirm(`Delete "${name}" permanently?`)) return;
    const { error } = await supabase.from("pwas").delete().eq("id", id);
    if (error) {
      alert("Could not delete: " + error.message);
      return;
    }
    setPwas((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return <div className="px-4 pt-16 text-center text-neutral-400">Loading...</div>;
  }

  if (!developerId) {
    return (
      <div className="px-6 pt-16 text-center">
        <Package size={32} className="mx-auto text-neutral-400 mb-3" />
        <p className="text-sm text-neutral-500">
          You haven't set up a developer profile yet.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-10 space-y-6">
      <h1 className="text-xl font-bold">My uploads</h1>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <Package size={15} /> APKs ({apks.length})
          </h2>
          <Link href="/upload" className="text-xs font-medium text-brand-600 flex items-center gap-1">
            <Plus size={13} /> New APK
          </Link>
        </div>

        {apks.length === 0 && <p className="text-xs text-neutral-400">No APKs yet.</p>}

        <div className="space-y-2">
          {apks.map((apk) => {
            const version = Array.isArray(apk.latest_version)
              ? apk.latest_version[0]?.version
              : apk.latest_version?.version;
            return (
              <div
                key={apk.id}
                className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{apk.name}</p>
                    <p className="text-xs text-neutral-400">
                      {version ? `v${version} · ` : ""}
                      <span
                        className={
                          apk.status === "approved"
                            ? "text-emerald-600"
                            : apk.status === "pending"
                            ? "text-amber-600"
                            : "text-rose-500"
                        }
                      >
                        {apk.status}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-neutral-400 shrink-0">
                    <Download size={13} />
                    {formatDownloadCount(apk.download_count)}
                  </div>
                </div>
                <div className="flex gap-2 mt-2.5">
                  <Link
                    href={`/upload?name=${encodeURIComponent(apk.name)}&developerId=${developerId}`}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-600 text-white"
                  >
                    Add new version
                  </Link>
                  <button
                    onClick={() => deleteApk(apk.id, apk.name)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-rose-200 text-rose-500 flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <Globe size={15} /> PWAs ({pwas.length})
          </h2>
          <Link href="/pwa/submit" className="text-xs font-medium text-brand-600 flex items-center gap-1">
            <Plus size={13} /> New PWA
          </Link>
        </div>

        {pwas.length === 0 && <p className="text-xs text-neutral-400">No PWAs yet.</p>}

        <div className="space-y-2">
          {pwas.map((pwa) => (
            <div
              key={pwa.id}
              className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10"
            >
              <p className="text-sm font-medium truncate">{pwa.name}</p>
              <p className="text-xs text-neutral-400 truncate">{pwa.website_url}</p>
              <div className="flex gap-2 mt-2.5">
                <Link
                  href={`/pwa/submit?name=${encodeURIComponent(pwa.name)}&developerId=${developerId}`}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-600 text-white"
                >
                  Edit
                </Link>
                <button
                  onClick={() => deletePwa(pwa.id, pwa.name)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-rose-200 text-rose-500 flex items-center gap-1"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
      }
