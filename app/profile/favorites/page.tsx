import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppCard } from "@/components/app-card";

export default async function FavoritesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: favorites } = await supabase
    .from("favorites")
    .select(
      `id,
       apk:apks(slug, name, icon_url, developer:developers(name)),
       pwa:pwas(slug, name, icon_url, developer:developers(name))`
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items = favorites ?? [];

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold mb-4">Saved apps</h1>
      {items.length === 0 && <p className="text-sm text-neutral-400 text-center py-12">Nothing saved yet.</p>}
      <div className="space-y-2">
        {items.map((f: any) => {
          const apk = Array.isArray(f.apk) ? f.apk[0] : f.apk;
          const pwa = Array.isArray(f.pwa) ? f.pwa[0] : f.pwa;
          const target = apk ?? pwa;
          if (!target) return null;
          const dev = Array.isArray(target.developer) ? target.developer[0] : target.developer;
          return (
            <AppCard
              key={f.id}
              kind={apk ? "apk" : "pwa"}
              href={`/${apk ? "apk" : "pwa"}/${target.slug}`}
              name={target.name}
              developerName={dev?.name ?? ""}
              iconUrl={target.icon_url}
            />
          );
        })}
      </div>
    </div>
  );
}
