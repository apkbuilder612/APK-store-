"use client";

import { useState } from "react";
import { Download, Loader2, CheckCircle2 } from "lucide-react";

export function DownloadButton({
  versionId,
  appName,
}: {
  versionId: string;
  appName: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleDownload() {
    setState("loading");
    try {
      const res = await fetch(`/api/download/${versionId}`);
      if (!res.ok) throw new Error("Download failed");
      const { url } = await res.json();

      // Best-effort: try to hand the APK straight to Android's package
      // installer via a same-tab navigation. Whether this actually opens the
      // installer (vs. just downloading the file) is entirely up to the
      // browser/OS — Chrome on Android will typically route a downloaded
      // .apk with the correct MIME type into the installer once the download
      // completes; there is no web API that can force this. If the OS/
      // browser doesn't support a direct hand-off, this simply becomes a
      // normal file download, which is the correct and only allowed
      // fallback — we never try to bypass Android's install permissions.
      const a = document.createElement("a");
      a.href = url;
      a.download = `${appName}.apk`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setState("done");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={state === "loading"}
      className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-brand-600 text-white font-semibold py-3 active:scale-[0.98] transition-transform disabled:opacity-70"
    >
      {state === "loading" && <Loader2 size={18} className="animate-spin" />}
      {state === "done" && <CheckCircle2 size={18} />}
      {state === "idle" && <Download size={18} />}
      {state === "error"
        ? "Try again"
        : state === "done"
        ? "Downloaded"
        : state === "loading"
        ? "Preparing..."
        : "Download APK"}
    </button>
  );
}
