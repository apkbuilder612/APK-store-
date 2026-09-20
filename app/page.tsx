import { AppCard } from "@/components/app-card";
import { SearchBar } from "@/components/search-bar";
import { getCombinedRecent } from "@/lib/data/combined";

export const revalidate = 60;

export default async function AllPage() {
  const items = await getCombinedRecent(30);

  return (
    <div className="px-4 pt-4 space-y-4">
      <h1 className="text-xl font-bold">All</h1>

      <SearchBar />

      {items.length === 0 && (
        <div className="text-center py-16 text-neutral-400">
          <p className="font-medium">Nothing here yet</p>
          <p className="text-sm mt-1">Check back soon.</p>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <AppCard
            key={`${item.kind}-${item.id}`}
            kind={item.kind}
            href={`/${item.kind}/${item.slug}`}
            name={item.name}
            developerName={item.developerName}
            iconUrl={item.icon_url}
            version={item.version}
            sizeBytes={item.sizeBytes ?? undefined}
            category={item.category ?? undefined}
            downloadCount={item.downloadCount ?? undefined}
          />
        ))}
      </div>
    </div>
  );
}
