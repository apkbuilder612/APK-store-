import { SearchBar } from "@/components/search-bar";
import { AppCard } from "@/components/app-card";
import { searchApks } from "@/lib/data/apks";
import { formatBytes } from "@/lib/format";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q?.trim() ?? "";
  const results = query ? await searchApks(query) : [];

  return (
    <div className="px-4 pt-4 space-y-4">
      <SearchBar initialQuery={query} />

      {query && (
        <p className="text-sm text-neutral-500">
          {results.length} result{results.length === 1 ? "" : "s"} for "{query}"
        </p>
      )}

      {query && results.length === 0 && (
        <div className="text-center py-16 text-neutral-400">
          <p className="font-medium">No results</p>
          <p className="text-sm mt-1">Try a different name or developer.</p>
        </div>
      )}

      <div className="space-y-2">
        {(results as any[]).map((apk) => (
          <AppCard
            key={apk.id}
            kind="apk"
            href={`/apk/${apk.slug}`}
            name={apk.name}
            developerName={apk.developer?.name ?? apk.developer?.[0]?.name ?? ""}
            iconUrl={apk.icon_url}
            version={apk.latest_version?.version ?? apk.latest_version?.[0]?.version}
            sizeBytes={
              apk.latest_version?.file_size_bytes ?? apk.latest_version?.[0]?.file_size_bytes
            }
            category={apk.category?.name ?? apk.category?.[0]?.name}
            downloadCount={apk.download_count}
          />
        ))}
      </div>
    </div>
  );
}
