"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function DownloadButton({
  versionId,
  appName,
}: {
  versionId: string;
  appName: string;
}) {
  const supabase = createClient();
  const [state, setState] = useState<"checking" | "idle" | "loading" | "done" | "already" | "error">("checking");

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setState("idle");
        return;
      }
      const { data } = await supabase
        .from("downloads")
        .select("id")
        .eq("user_id", user.id)
        .eq("apk_version_id", versionId)
        .maybeSingle();
      setState(data ? "already" : "idle");
    })();
  }, [versionId]);

  async function handleDownload() {
    setState("loading");
    try {
      const res = await fetch(`/api/download/${versionId}`);
      if (!res.ok) throw new Error("Download failed");
      const { url } = await res.json();

      const a = document.createElement("a");
      a.href = url;
      a.download = `${appName}.apk`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setState("done");
      setTimeout(() => setState("already"), 1500);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  }

  if (state === "already") {
    return (
      <button
        disabled
        className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-neutral-200 dark:bg-neutral-800 text-neutral-500 font-semibold py-3"
      >
        <CheckCircle2 size={18} />
        Downloaded
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={state === "loading" || state === "checking"}
      className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-brand-600 text-white font-semibold py-3 active:scale-[0.98] transition-transform disabled:opacity-70"
    >
      {state === "loading" && <Loader2 size={18} className="animate-spin" />}
      {state === "done" && <CheckCircle2 size={18} />}
      {(state === "idle" || state === "checking") && <Download size={18} />}
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
