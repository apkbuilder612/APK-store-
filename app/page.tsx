import { GridAppCard } from "@/components/grid-app-card";
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
        <div className="text-center py-16 text-ink/40 dark:text-cream/40">
          <p className="font-medium">Nothing here yet</p>
          <p className="text-sm mt-1">Check back soon.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <GridAppCard
            key={`${item.kind}-${item.id}`}
            kind={item.kind}
            href={`/${item.kind}/${item.slug}`}
            name={item.name}
            developerName={item.developerName}
            iconUrl={item.icon_url}
            version={item.version}
            sizeBytes={item.sizeBytes ?? undefined}
            downloadCount={item.downloadCount ?? undefined}
          />
        ))}
      </div>
    </div>
  );
}
