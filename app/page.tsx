import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { AppSection } from "@/components/app-section";
import { createClient } from "@/lib/supabase/server";
import {
  getFeaturedApks,
  getRecentlyAddedApks,
  getRecentlyUpdatedApks,
  getPopularApks,
  getCategories,
} from "@/lib/data/apks";

export const revalidate = 60;

async function getIsDeveloper() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_developer")
    .eq("id", user.id)
    .single();
  return !!profile?.is_developer;
}

export default async function HomePage() {
  // All data fetches run in parallel now instead of one-after-another —
  // this alone can cut page load time roughly in half on a cold start.
  const [isDeveloper, featured, recentlyAdded, recentlyUpdated, popular, categories] =
    await Promise.all([
      getIsDeveloper(),
      getFeaturedApks(),
      getRecentlyAddedApks(),
      getRecentlyUpdatedApks(),
      getPopularApks(),
      getCategories(),
    ]);

  const hasAnything =
    featured.length + recentlyAdded.length + recentlyUpdated.length + popular.length > 0;

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
        {isDeveloper && (
          <Link href="/upload" className="text-sm font-medium text-brand-600">
            + Upload
          </Link>
        )}
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
          {isDeveloper ? (
            <>
              <p className="text-sm mt-1">Be the first developer to publish one.</p>
              <Link href="/upload" className="inline-block mt-4 text-sm text-brand-600 font-medium">
                Upload an APK →
              </Link>
            </>
          ) : (
            <p className="text-sm mt-1">Check back soon.</p>
          )}
        </div>
      )}

      <AppSection title="Featured" items={featuredDeduped as any} basePath="apk" />
      <AppSection title="Recently added" items={recentlyAddedDeduped as any} basePath="apk" />
      <AppSection title="Recently updated" items={recentlyUpdatedDeduped as any} basePath="apk" />
      <AppSection title="Popular" items={popularDeduped as any} basePath="apk" />
    </div>
  );
      }
