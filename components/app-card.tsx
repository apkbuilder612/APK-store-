import Link from "next/link";
import Image from "next/image";
import { Download, Star } from "lucide-react";
import { formatBytes, formatDownloadCount } from "@/lib/format";

export interface AppCardProps {
  href: string;
  name: string;
  developerName: string;
  iconUrl: string | null;
  version?: string | null;
  sizeBytes?: number | null;
  category?: string | null;
  rating?: number | null;
  downloadCount?: number;
  kind: "apk" | "pwa";
}

export function AppCard({
  href,
  name,
  developerName,
  iconUrl,
  version,
  sizeBytes,
  category,
  rating,
  downloadCount,
  kind,
}: AppCardProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/5 active:scale-[0.98] transition-transform"
    >
      <div className="relative h-14 w-14 shrink-0 rounded-xl2 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {iconUrl ? (
          <Image src={iconUrl} alt={name} fill sizes="56px" className="object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-lg font-semibold text-neutral-400">
            {name[0]?.toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="font-medium truncate">{name}</p>
          {kind === "pwa" && (
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
              PWA
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500 truncate">{developerName}</p>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-400">
          {category && <span>{category}</span>}
          {version && <span>· v{version}</span>}
          {typeof sizeBytes === "number" && <span>· {formatBytes(sizeBytes)}</span>}
          {rating != null && (
            <span className="flex items-center gap-0.5">
              <Star size={10} className="fill-amber-400 text-amber-400" /> {rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1">
        <div className="p-2 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600">
          <Download size={16} />
        </div>
        {typeof downloadCount === "number" && (
          <span className="text-[10px] text-neutral-400">{formatDownloadCount(downloadCount)}</span>
        )}
      </div>
    </Link>
  );
}

export function AppCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/5">
      <div className="skeleton h-14 w-14 rounded-xl2" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-2/3" />
        <div className="skeleton h-2.5 w-1/3" />
        <div className="skeleton h-2.5 w-1/2" />
      </div>
    </div>
  );
}
