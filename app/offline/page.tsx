import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center px-6 pt-32">
      <WifiOff size={40} className="text-neutral-400" />
      <h1 className="text-lg font-semibold">You're offline</h1>
      <p className="text-sm text-neutral-500 max-w-xs">
        This page isn't available offline. Previously viewed apps, your favorites,
        and search history still work without a connection.
      </p>
    </div>
  );
}
