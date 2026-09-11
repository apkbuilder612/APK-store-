import Link from "next/link";
import { PackageSearch } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center px-6 pt-32 min-h-dvh">
      <PackageSearch size={36} className="text-neutral-400" />
      <h1 className="text-lg font-semibold">Not found</h1>
      <p className="text-sm text-neutral-500 max-w-xs">
        This app or page doesn't exist, or may have been removed.
      </p>
      <Link href="/" className="mt-2 rounded-2xl bg-brand-600 text-white font-semibold px-5 py-2.5 text-sm">
        Back to store
      </Link>
    </div>
  );
}
