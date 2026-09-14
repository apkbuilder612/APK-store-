import Image from "next/image";
import { notFound } from "next/navigation";
import { getApkBySlug } from "@/lib/data/apks";
import { formatBytes, formatDownloadCount, timeAgo } from "@/lib/format";
import { DownloadButton } from "@/components/download-button";
import { ShareButton, FavoriteButton } from "@/components/detail-actions";
import { BackButton } from "@/components/back-button";
import { ReviewSection } from "@/components/review-section";
import { ShieldCheck, Star } from "lucide-react";

export const revalidate = 60;

export default async function ApkDetailsPage({ params }: { params: { slug: string } }) {
  const apk: any = await getApkBySlug(params.slug);
  if (!apk) notFound();

  const version = Array.isArray(apk.latest_version) ? apk.latest_version[0] : apk.latest_version;
  const permissions: string[] = (version?.permissions ?? []).map((p: any) => p.permission);
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/apk/${apk.slug}`;

  return (
    <div className="pb-6">
      <BackButton label="APK" />

      <div className="px-4 pt-1 flex gap-4">
        <div className="relative h-20 w-20 shrink-0 rounded-xl2 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          {apk.icon_url ? (
            <Image src={apk.icon_url} alt={apk.name} fill sizes="80px" className="object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-2xl font-semibold text-neutral-400">
              {apk.name[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold truncate">{apk.name}</h1>
          <p className="text-sm text-neutral-500 truncate">{apk.developer?.name}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
            {apk.category?.name && <span>{apk.category.name}</span>}
            <span>· {formatDownloadCount(apk.download_count)} downloads</span>
            {apk.rating_count > 0 && (
              <span className="flex items-center gap-0.5">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                {apk.avg_rating} ({apk.rating_count})
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 flex gap-2">
        {version && <DownloadButton versionId={version.id} appName={apk.name} />}
        <ShareButton title={apk.name} url={url} />
        <FavoriteButton apkId={apk.id} />
      </div>

      {version && (
        <div className="px-4 mt-4 grid grid-cols-2 gap-3 text-sm">
          <InfoRow label="Version" value={version.version} />
          <InfoRow label="Size" value={formatBytes(version.file_size_bytes)} />
          {apk.min_android_version && (
            <InfoRow label="Requires Android" value={apk.min_android_version + "+"} />
          )}
          {apk.package_name && <InfoRow label="Package" value={apk.package_name} mono />}
          <InfoRow label="Updated" value={timeAgo(apk.updated_at)} />
          <InfoRow label="Released" value={timeAgo(apk.created_at)} />
        </div>
      )}

      {apk.screenshots?.length > 0 && (
        <div className="mt-5">
          <h2 className="px-4 text-sm font-semibold mb-2">Screenshots</h2>
          <div className="flex gap-2 overflow-x-auto px-4 no-scrollbar">
            {apk.screenshots
              .sort((a: any, b: any) => a.position - b.position)
              .map((s: any) => (
                <div key={s.id} className="relative h-64 w-36 shrink-0 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <Image src={s.url} alt="Screenshot" fill sizes="144px" className="object-cover" />
                </div>
              ))}
          </div>
        </div>
      )}

      {apk.description && (
        <div className="px-4 mt-5">
          <h2 className="text-sm font-semibold mb-1.5">About</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-line">
            {apk.description}
          </p>
        </div>
      )}

      {version?.changelog && (
        <div className="px-4 mt-5">
          <h2 className="text-sm font-semibold mb-1.5">What's new</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-line">
            {version.changelog}
          </p>
        </div>
      )}

      {permissions.length > 0 && (
        <div className="px-4 mt-5">
          <h2 className="text-sm font-semibold mb-1.5 flex items-center gap-1.5">
            <ShieldCheck size={15} /> Permissions
          </h2>
          <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
            {permissions.map((p) => (
              <li key={p}>· {p}</li>
            ))}
          </ul>
        </div>
      )}

      <ReviewSection apkId={apk.id} avgRating={apk.avg_rating} ratingCount={apk.rating_count} />
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10">
      <p className="text-[11px] text-neutral-400">{label}</p>
      <p className={`font-medium truncate ${mono ? "font-mono text-xs" : "text-sm"}`}>{value}</p>
    </div>
  );
      }
