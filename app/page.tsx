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

  return (
    <div className="px-4 pt-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">APK Store</h1>
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

      <AppSection title="Featured" items={featured as any} basePath="apk" />
      <AppSection title="Recently added" items={recentlyAdded as any} basePath="apk" />
      <AppSection title="Recently updated" items={recentlyUpdated as any} basePath="apk" />
      <AppSection title="Popular" items={popular as any} basePath="apk" />
    </div>
  );
}
