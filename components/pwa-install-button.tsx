"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink } from "lucide-react";

// The 'beforeinstallprompt' event only fires for the current origin, so this
// component can only offer a true install prompt when the visitor is
// browsing this PWA's own site directly (rare for a third-party listing
// page). For an entry pointing at *another* site's URL, there is no browser
// API that lets us trigger that other origin's install prompt from here —
// so we always give the honest fallback of opening the site, where the
// browser will offer its own install affordance if that site supports it.
export function PwaInstallButton({ url }: { url: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    function handler(e: any) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      onClick={handleClick}
      className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-brand-600 text-white font-semibold py-3 active:scale-[0.98] transition-transform"
    >
      {deferredPrompt ? <Download size={18} /> : <ExternalLink size={18} />}
      {deferredPrompt ? "Install" : "Open Website"}
    </button>
  );
}
