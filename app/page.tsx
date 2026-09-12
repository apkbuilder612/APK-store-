import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { AppSection } from "@/components/app-section";
import {
  getFeaturedApks,
  getRecentlyAddedApks,
  getRecentlyUpdatedApks,
  getPopularApks,
  getCategories,
} from "@/lib/data/apks";

export const revalidate = 60;

export default async function HomePage() {
  const [featured, recentlyAdded, recentlyUpdated, popular, categories] = await Promise.all([
    getFeaturedApks(),
    getRecentlyAddedApks(),
    getRecentlyUpdatedApks(),
    getPopularApks(),
    getCategories(),
  ]);

  const hasAnything =
    featured.length + recentlyAdded.length + recentlyUpdated.length + popular.length > 0;

  // Same app can qualify for more than one section (e.g. the only app in
  // the store is trivially "featured", "recently added" and "recently
  // updated" at once). Show each app only once, in its highest-priority
  // section, like a real store would.
  const seen = new Set<string>();
  function dedupe(items: any[]) {
    return items.filter((item: any) => {
      if (seen.has(item.slug)) return false;
      seen.add(item.slug);
      return true;
    });
  }

  const featuredDeduped = dedupe(featured as any[]);
  const recentlyAddedDeduped = dedupe(recentlyAdded as any[]);
  const recentlyUpdatedDeduped = dedupe(recentlyUpdated as any[]);
  const popularDeduped = dedupe(popular as any[]);

  return (
    <div className="px-4 pt-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">APK Store</h1>
        <Link href="/upload" className="text-sm font-medium text-brand-600">
          + Upload
        </Link>
      </div>

      <SearchBar />

      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 no-scrollbar">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {!hasAnything && (
        <div className="text-center py-16 text-neutral-400">
          <p className="font-medium">No apps yet</p>
          <p className="text-sm mt-1">Be the first developer to publish one.</p>
          <Link href="/upload" className="inline-block mt-4 text-sm text-brand-600 font-medium">
            Upload an APK →
          </Link>
        </div>
      )}

      <AppSection title="Featured" items={featuredDeduped as any} basePath="apk" />
      <AppSection title="Recently added" items={recentlyAddedDeduped as any} basePath="apk" />
      <AppSection title="Recently updated" items={recentlyUpdatedDeduped as any} basePath="apk" />
      <AppSection title="Popular" items={popularDeduped as any} basePath="apk" />
    </div>
  );
}
