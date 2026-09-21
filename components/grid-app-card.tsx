import Link from "next/link";
import Image from "next/image";
import { Download, Star } from "lucide-react";
import { formatBytes, formatDownloadCount } from "@/lib/format";

export interface GridAppCardProps {
  href: string;
  name: string;
  developerName: string;
  iconUrl: string | null;
  version?: string | null;
  sizeBytes?: number | null;
  rating?: number | null;
  downloadCount?: number | null;
  kind: "apk" | "pwa";
}

export function GridAppCard({
  href,
  name,
  developerName,
  iconUrl,
  version,
  sizeBytes,
  rating,
  downloadCount,
  kind,
}: GridAppCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col p-3 rounded-2xl bg-white dark:bg-ink-700 border border-brand-100 dark:border-ink-100/10 active:scale-[0.97] transition-transform"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="relative h-14 w-14 shrink-0 rounded-xl2 overflow-hidden bg-brand-50 dark:bg-ink-900">
          {iconUrl ? (
            <Image src={iconUrl} alt={name} fill sizes="56px" className="object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-lg font-semibold text-brand-600">
              {name[0]?.toUpperCase()}
            </div>
          )}
        </div>
        {kind === "pwa" && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-grape-50 text-grape-700 dark:bg-grape-600/20 dark:text-grape-100 shrink-0">
            PWA
          </span>
        )}
      </div>

      <p className="text-sm font-semibold truncate">{name}</p>
      <p className="text-xs text-ink/50 dark:text-cream/50 truncate">{developerName}</p>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5 text-[11px] text-ink/40 dark:text-cream/40">
          {version && <span>v{version}</span>}
          {typeof sizeBytes === "number" && <span>· {formatBytes(sizeBytes)}</span>}
          {rating != null && (
            <span className="flex items-center gap-0.5">
              <Star size={9} className="fill-amber-400 text-amber-400" /> {rating.toFixed(1)}
            </span>
          )}
        </div>
        <div className="p-1.5 rounded-full bg-brand-50 dark:bg-brand-600/20 text-brand-600 dark:text-brand-100 shrink-0">
          <Download size={13} />
        </div>
      </div>
      {typeof downloadCount === "number" && (
        <span className="text-[10px] text-ink/30 dark:text-cream/30 mt-1">
          {formatDownloadCount(downloadCount)} downloads
        </span>
      )}
    </Link>
  );
      }
