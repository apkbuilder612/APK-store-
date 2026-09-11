import Link from "next/link";
import Image from "next/image";
import { formatBytes } from "@/lib/format";

interface SectionItem {
  slug: string;
  name: string;
  icon_url: string | null;
  developer?: { name: string } | { name: string }[] | null;
  latest_version?: { file_size_bytes: number } | { file_size_bytes: number }[] | null;
}

function devName(d: SectionItem["developer"]) {
  if (!d) return "";
  return Array.isArray(d) ? d[0]?.name ?? "" : d.name;
}

function versionSize(v: SectionItem["latest_version"]) {
  const item = Array.isArray(v) ? v[0] : v;
  return item?.file_size_bytes;
}

export function AppSection({
  title,
  items,
  basePath,
}: {
  title: string;
  items: SectionItem[];
  basePath: "apk" | "pwa";
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="px-1 mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
        {title}
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/${basePath}/${item.slug}`}
            className="shrink-0 w-28 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
          >
            <div className="relative h-16 w-16 rounded-xl2 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
              {item.icon_url ? (
                <Image src={item.icon_url} alt={item.name} fill sizes="64px" className="object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-lg font-semibold text-neutral-400">
                  {item.name[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <p className="text-xs font-medium text-center truncate w-full">{item.name}</p>
            <p className="text-[10px] text-neutral-400 truncate w-full text-center">
              {devName(item.developer)}
              {versionSize(item.latest_version) ? ` · ${formatBytes(versionSize(item.latest_version)!)}` : ""}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
