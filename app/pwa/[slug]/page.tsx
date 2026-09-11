import Image from "next/image";
import { notFound } from "next/navigation";
import { getPwaBySlug } from "@/lib/data/pwas";
import { timeAgo } from "@/lib/format";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { ShareButton, FavoriteButton } from "@/components/detail-actions";

export const revalidate = 60;

export default async function PwaDetailsPage({ params }: { params: { slug: string } }) {
  const pwa: any = await getPwaBySlug(params.slug);
  if (!pwa) notFound();

  return (
    <div className="pb-6">
      <div className="px-4 pt-5 flex gap-4">
        <div className="relative h-20 w-20 shrink-0 rounded-xl2 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          {pwa.icon_url ? (
            <Image src={pwa.icon_url} alt={pwa.name} fill sizes="80px" className="object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-2xl font-semibold text-neutral-400">
              {pwa.name[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-lg font-bold truncate">{pwa.name}</h1>
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
              PWA
            </span>
          </div>
          <p className="text-sm text-neutral-500 truncate">{pwa.developer?.name}</p>
          <p className="text-xs text-neutral-400 mt-1">{pwa.category?.name}</p>
        </div>
      </div>

      <div className="px-4 mt-4 flex gap-2">
        <PwaInstallButton url={pwa.website_url} />
        <ShareButton title={pwa.name} url={pwa.website_url} />
        <FavoriteButton pwaId={pwa.id} />
      </div>

      <div className="px-4 mt-4 grid grid-cols-2 gap-3 text-sm">
        {pwa.version && (
          <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10">
            <p className="text-[11px] text-neutral-400">Version</p>
            <p className="font-medium text-sm">{pwa.version}</p>
          </div>
        )}
        <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10">
          <p className="text-[11px] text-neutral-400">Updated</p>
          <p className="font-medium text-sm">{timeAgo(pwa.updated_at)}</p>
        </div>
      </div>

      {pwa.screenshots?.length > 0 && (
        <div className="mt-5">
          <h2 className="px-4 text-sm font-semibold mb-2">Screenshots</h2>
          <div className="flex gap-2 overflow-x-auto px-4 no-scrollbar">
            {pwa.screenshots
              .sort((a: any, b: any) => a.position - b.position)
              .map((s: any) => (
                <div
                  key={s.id}
                  className="relative h-64 w-36 shrink-0 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800"
                >
                  <Image src={s.url} alt="Screenshot" fill sizes="144px" className="object-cover" />
                </div>
              ))}
          </div>
        </div>
      )}

      {pwa.description && (
        <div className="px-4 mt-5">
          <h2 className="text-sm font-semibold mb-1.5">About</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-line">
            {pwa.description}
          </p>
        </div>
      )}

      <div className="px-4 mt-5">
        <a
          href={pwa.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-brand-600 break-all"
        >
          {pwa.website_url}
        </a>
      </div>
    </div>
  );
}
