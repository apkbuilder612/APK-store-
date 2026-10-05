import Link from "next/link";
import { GridAppCard } from "@/components/grid-app-card";
import { SearchBar } from "@/components/search-bar";
import { getCombinedRecent } from "@/lib/data/combined";
import { getCategories } from "@/lib/data/apks";
import { Bell, UserCircle2, Sparkles } from "lucide-react";

export const revalidate = 60;

export default async function AllPage() {
  const [items, categories] = await Promise.all([getCombinedRecent(30), getCategories()]);
  const popular = [...items].sort((a, b) => (b.downloadCount ?? 0) - (a.downloadCount ?? 0)).slice(0, 8);

  return (
    <div className="px-4 pt-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">
            APK <span className="text-brand-green">Store</span>
          </h1>
          <p className="text-[11px] text-muted">Apps · Games · More</p>
        </div>
        <div className="flex items-center gap-3">
          <Bell size={20} className="text-muted" />
          <Link href="/profile"><UserCircle2 size={26} className="text-muted" /></Link>
        </div>
      </div>

      <SearchBar />

      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 no-scrollbar">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full bg-bg-card border border-line text-muted"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <div className="rounded-2xl p-5 bg-gradient-to-br from-brand-green/20 via-bg-card to-brand-blue/20 border border-line">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white mb-2">
          <Sparkles size={11} /> Featured
        </span>
        <h2 className="text-lg font-bold leading-snug">Get the Best<br />APK Apps &amp; PWAs</h2>
        <p className="text-xs text-muted mt-1">Fast · Safe · No store needed</p>
      </div>

      {popular.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold">🔥 Popular</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {popular.map((item) => (
              <GridAppCard
                key={`pop-${item.kind}-${item.id}`}
                kind={item.kind}
                href={`/${item.kind}/${item.slug}`}
                name={item.name}
                developerName={item.developerName}
                iconUrl={item.icon_url}
                sizeBytes={item.sizeBytes}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-bold mb-2">All</h2>
        {items.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <p className="font-medium">Nothing here yet</p>
            <p className="text-sm mt-1">Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <GridAppCard
                key={`${item.kind}-${item.id}`}
                kind={item.kind}
                href={`/${item.kind}/${item.slug}`}
                name={item.name}
                developerName={item.developerName}
                iconUrl={item.icon_url}
                sizeBytes={item.sizeBytes}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
          }
