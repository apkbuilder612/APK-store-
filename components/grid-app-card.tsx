import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { formatBytes } from "@/lib/format";

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

export function GridAppCard({ href, name, developerName, iconUrl, sizeBytes, rating, kind }: GridAppCardProps) {
  return (
    <Link href={href} className="flex flex-col rounded-2xl bg-bg-card border border-line p-3 active:scale-[0.97] transition-transform">
      <div className="relative h-16 w-16 rounded-xl2 overflow-hidden bg-bg-soft mb-2">
        {iconUrl ? (
          <Image src={iconUrl} alt={name} fill sizes="64px" className="object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-lg font-semibold text-brand-green">
            {name[0]?.toUpperCase()}
          </div>
        )}
      </div>
      <p className="text-sm font-semibold truncate">{name}</p>
      <p className="text-xs text-muted truncate">{developerName}</p>
      <div className="flex items-center justify-between mt-2">
        {rating != null && rating > 0 ? (
          <span className="flex items-center gap-0.5 text-xs text-muted">
            <Star size={11} className="fill-amber-400 text-amber-400" /> {rating.toFixed(1)}
          </span>
        ) : (
          <span className="text-xs text-muted">{sizeBytes ? formatBytes(sizeBytes) : ""}</span>
        )}
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            kind === "apk" ? "bg-brand-green/15 text-brand-green" : "bg-brand-blue/15 text-blue-400"
          }`}
        >
          {kind === "apk" ? "APK" : "PWA"}
        </span>
      </div>
    </Link>
  );
}
