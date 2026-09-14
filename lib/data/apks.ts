import { createClient } from "@/lib/supabase/server";

const APK_SELECT = `
  id, slug, name, short_name, icon_url, download_count, created_at, updated_at, avg_rating, rating_count,
  developer:developers(name),
  category:categories(name),
  latest_version:apk_versions!apks_latest_version_fk(version, file_size_bytes)
`;

export async function getFeaturedApks(limit = 5) {
  const supabase = createClient();
  const { data } = await supabase
    .from("apks")
    .select(APK_SELECT)
    .eq("status", "approved")
    .order("download_count", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getRecentlyAddedApks(limit = 8) {
  const supabase = createClient();
  const { data } = await supabase
    .from("apks")
    .select(APK_SELECT)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getRecentlyUpdatedApks(limit = 8) {
  const supabase = createClient();
  const { data } = await supabase
    .from("apks")
    .select(APK_SELECT)
    .eq("status", "approved")
    .order("updated_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getPopularApks(limit = 8) {
  const supabase = createClient();
  const { data } = await supabase
    .from("apks")
    .select(APK_SELECT)
    .eq("status", "approved")
    .order("download_count", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getCategories() {
  const supabase = createClient();
  const { data } = await supabase.from("categories").select("id, name, slug").order("name");
  return data ?? [];
}

export async function searchApks(query: string, limit = 30) {
  const supabase = createClient();
  const { data } = await supabase
    .from("apks")
    .select(APK_SELECT)
    .eq("status", "approved")
    .or(`name.ilike.%${query}%,short_name.ilike.%${query}%`)
    .limit(limit);
  return data ?? [];
}

export async function getApkBySlug(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("apks")
    .select(`
      *,
      developer:developers(*),
      category:categories(*),
      screenshots:apk_screenshots(*),
      latest_version:apk_versions!apks_latest_version_fk(*, permissions:apk_permissions(permission))
    `)
    .eq("slug", slug)
    .eq("status", "approved")
    .single();
  return data;
}
