import { createClient } from "@/lib/supabase/server";

const PWA_SELECT = `
  id, slug, name, short_name, icon_url, version, created_at, updated_at, website_url,
  developer:developers(name),
  category:categories(name)
`;

export async function getAllPwas(limit = 30) {
  const supabase = createClient();
  const { data } = await supabase
    .from("pwas")
    .select(PWA_SELECT)
    .eq("status", "approved")
    .order("updated_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getPwaBySlug(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("pwas")
    .select(`*, developer:developers(*), category:categories(*), screenshots:pwa_screenshots(*)`)
    .eq("slug", slug)
    .eq("status", "approved")
    .single();
  return data;
}
