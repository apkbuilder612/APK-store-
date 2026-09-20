import { createClient } from "@/lib/supabase/server";

export interface CombinedItem {
  id: string;
  kind: "apk" | "pwa";
  slug: string;
  name: string;
  icon_url: string | null;
  developerName: string;
  category: string | null;
  version: string | null;
  sizeBytes: number | null;
  downloadCount: number | null;
  sortDate: string;
}

function toCombinedApk(row: any): CombinedItem {
  const dev = Array.isArray(row.developer) ? row.developer[0] : row.developer;
  const cat = Array.isArray(row.category) ? row.category[0] : row.category;
  const version = Array.isArray(row.latest_version) ? row.latest_version[0] : row.latest_version;
  return {
    id: row.id,
    kind: "apk",
    slug: row.slug,
    name: row.name,
    icon_url: row.icon_url,
    developerName: dev?.name ?? "",
    category: cat?.name ?? null,
    version: version?.version ?? null,
    sizeBytes: version?.file_size_bytes ?? null,
    downloadCount: row.download_count ?? 0,
    sortDate: row.updated_at ?? row.created_at,
  };
}

function toCombinedPwa(row: any): CombinedItem {
  const dev = Array.isArray(row.developer) ? row.developer[0] : row.developer;
  const cat = Array.isArray(row.category) ? row.category[0] : row.category;
  return {
    id: row.id,
    kind: "pwa",
    slug: row.slug,
    name: row.name,
    icon_url: row.icon_url,
    developerName: dev?.name ?? "",
    category: cat?.name ?? null,
    version: row.version ?? null,
    sizeBytes: null,
    downloadCount: null,
    sortDate: row.updated_at ?? row.created_at,
  };
}

export async function getCombinedRecent(limit = 30): Promise<CombinedItem[]> {
  const supabase = createClient();

  const [{ data: apks }, { data: pwas }] = await Promise.all([
    supabase
      .from("apks")
      .select(
        `id, slug, name, icon_url, download_count, created_at, updated_at,
         developer:developers(name), category:categories(name),
         latest_version:apk_versions!apks_latest_version_fk(version, file_size_bytes)`
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("pwas")
      .select(
        `id, slug, name, icon_url, version, created_at, updated_at,
         developer:developers(name), category:categories(name)`
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const combined = [
    ...(apks ?? []).map(toCombinedApk),
    ...(pwas ?? []).map(toCombinedPwa),
  ];

  combined.sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

  return combined.slice(0, limit);
    }
