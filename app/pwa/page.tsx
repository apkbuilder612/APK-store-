import Link from "next/link";
import { AppCard } from "@/components/app-card";
import { getAllPwas } from "@/lib/data/pwas";

export const revalidate = 60;

export default async function PwaListPage() {
  const pwas: any[] = await getAllPwas();

  return (
    <div className="px-4 pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Progressive Web Apps</h1>
        <Link href="/pwa/submit" className="text-sm font-medium text-brand-600">
          + Add PWA
        </Link>
      </div>

      {pwas.length === 0 && (
        <div className="text-center py-16 text-neutral-400">
          <p className="font-medium">No PWAs yet</p>
          <Link href="/pwa/submit" className="inline-block mt-4 text-sm text-brand-600 font-medium">
            Add a PWA →
          </Link>
        </div>
      )}

      <div className="space-y-2">
        {pwas.map((pwa) => (
          <AppCard
            key={pwa.id}
            kind="pwa"
            href={`/pwa/${pwa.slug}`}
            name={pwa.name}
            developerName={pwa.developer?.name ?? pwa.developer?.[0]?.name ?? ""}
            iconUrl={pwa.icon_url}
            version={pwa.version}
            category={pwa.category?.name ?? pwa.category?.[0]?.name}
          />
        ))}
      </div>
    </div>
  );
            }
