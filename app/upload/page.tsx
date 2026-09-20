"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UploadCloud, Loader2, CheckCircle2, Image as ImageIcon, X } from "lucide-react";
import { formatBytes } from "@/lib/format";

interface Category {
  id: string;
  name: string;
}
interface DeveloperProfile {
  id: string;
  name: string;
}

export default function UploadPage() {
  return (
    <Suspense fallback={null}>
      <UploadPageInner />
    </Suspense>
  );
}

function UploadPageInner() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillName = searchParams.get("name");
  const prefillDeveloperId = searchParams.get("developerId");
  const isNewVersionMode = !!prefillName;

  const [checking, setChecking] = useState(true);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [developers, setDevelopers] = useState<DeveloperProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [icon, setIcon] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [developerId, setDeveloperId] = useState("");
  const [minAndroid, setMinAndroid] = useState("");

  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"icon" | "screenshots" | "upload" | "process">("upload");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_developer")
        .eq("id", user.id)
        .single();
      setIsDeveloper(!!profile?.is_developer);

      const { data: devs } = await supabase
        .from("developers")
        .select("id, name")
        .eq("owner_id", user.id);
      setDevelopers(devs ?? []);

      if (prefillDeveloperId) {
        setDeveloperId(prefillDeveloperId);
      } else if (devs && devs.length > 0) {
        setDeveloperId(devs[0].id);
      }

      if (prefillName) setName(prefillName);

      const { data: cats } = await supabase.from("categories").select("id, name").order("name");
      setCategories(cats ?? []);

      setChecking(false);
    })();
  }, []);

  function handleIconChange(f: File | null) {
    setIcon(f);
    setIconPreview(f ? URL.createObjectURL(f) : null);
  }

  function handleScreenshotsChange(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).slice(0, 8); // cap at 8 screenshots
    setScreenshots(arr);
    setScreenshotPreviews(arr.map((f) => URL.createObjectURL(f)));
  }

  function removeScreenshot(index: number) {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
    setScreenshotPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadToStorage(
    theFile: File,
    bucket: string,
    userId: string,
    accessToken: string,
    onProgress?: (pct: number) => void
  ): Promise<string> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const ext = theFile.name.split(".").pop() || "png";
    const path = `${userId}/uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${supabaseUrl}/storage/v1/object/${bucket}/${path}`);
      xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      xhr.setRequestHeader("apikey", anonKey);
      xhr.setRequestHeader("Content-Type", theFile.type || "application/octet-stream");
      if (onProgress) {
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) onProgress(Math.round((ev.loaded / ev.total) * 100));
        };
      }
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Could not upload to ${bucket}.`)));
      xhr.onerror = () => reject(new Error("Network error during upload."));
      xhr.send(theFile);
    });

    return path;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose an APK file.");
      return;
    }
    setStatus("submitting");
    setProgress(1);
    setError(null);
    setWarning(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!session || !user) {
        setError("Please sign in again.");
        setStatus("error");
        return;
      }

      let iconPath: string | null = null;
      if (icon) {
        setPhase("icon");
        iconPath = await uploadToStorage(icon, "icons", user.id, session.access_token, (pct) =>
          setProgress(Math.round(pct * 0.1))
        );
      }

      const screenshotPaths: string[] = [];
      if (screenshots.length > 0) {
        setPhase("screenshots");
        for (let i = 0; i < screenshots.length; i++) {
          const path = await uploadToStorage(screenshots[i], "screenshots", user.id, session.access_token);
          screenshotPaths.push(path);
          setProgress(10 + Math.round(((i + 1) / screenshots.length) * 15));
        }
      }

      setPhase("upload");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const filePath = `${user.id}/uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.apk`;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${supabaseUrl}/storage/v1/object/apk-files/${filePath}`);
        xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
        xhr.setRequestHeader("apikey", anonKey);
        xhr.setRequestHeader("Content-Type", "application/vnd.android.package-archive");
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const base = 25;
            const span = 65;
            setProgress(base + Math.round((ev.loaded / ev.total) * span));
          }
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Could not upload APK file.")));
        xhr.onerror = () => reject(new Error("Network error during file upload."));
        xhr.send(file);
      });

      setPhase("process");
      setProgress(92);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath,
          iconPath,
          screenshotPaths,
          videoUrl: videoUrl.trim() || null,
          name,
          shortName,
          description,
          version,
          changelog,
          categoryId,
          developerId,
          minAndroidVersion: minAndroid,
        }),
      });

      const json = await res.json();
      setProgress(100);

      if (!res.ok) {
        setError(json.error ?? "Upload failed.");
        setStatus("error");
        return;
      }

      if (json.scanStatus === "suspicious") {
        setWarning("This file was flagged by some security vendors as suspicious. It's published, but review it carefully.");
      } else if (json.scanStatus === "error") {
        setWarning("Malware scan could not run (scanner unavailable). The app was published without a scan result.");
      }

      setStatus("done");
    } catch (err: any) {
      setError(err?.message ?? "Upload failed.");
      setStatus("error");
    }
  }

  if (checking) {
    return <div className="px-4 pt-16 text-center text-neutral-400">Loading...</div>;
  }

  if (!isDeveloper) {
    return (
      <div className="px-6 pt-16 text-center">
        <UploadCloud size={36} className="mx-auto text-neutral-400 mb-3" />
        <h1 className="text-lg font-semibold mb-1">Not available</h1>
        <p className="text-sm text-neutral-500">This account doesn't have upload access.</p>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="px-6 pt-16 text-center">
        <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-3" />
        <h1 className="text-lg font-semibold mb-1">
          {isNewVersionMode ? "Version published" : "Published"}
        </h1>
        <p className="text-sm text-neutral-500 mb-2">Your app is now live in the store.</p>
        {warning && (
          <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 inline-block">
            {warning}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-10">
      <h1 className="text-xl font-bold mb-1">
        {isNewVersionMode ? `Update ${prefillName}` : "Upload APK"}
      </h1>
      {!isNewVersionMode && (
        <p className="text-xs text-neutral-500 mb-4">
          To update an existing app later, use the exact same App name and a higher version number.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3 items-center">
          <label className="shrink-0 h-16 w-16 rounded-2xl border-2 border-dashed border-black/10 dark:border-white/15 flex items-center justify-center overflow-hidden bg-neutral-50 dark:bg-neutral-900">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={status === "submitting"}
              onChange={(e) => handleIconChange(e.target.files?.[0] ?? null)}
            />
            {iconPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={iconPreview} alt="Icon preview" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon size={22} className="text-neutral-400" />
            )}
          </label>
          <div className="text-xs text-neutral-500">
            App icon {isNewVersionMode ? "(optional — leave empty to keep current)" : "(optional)"}
          </div>
        </div>

        <label className="block rounded-2xl border-2 border-dashed border-black/10 dark:border-white/15 p-5 text-center">
          <input
            type="file"
            accept=".apk"
            className="hidden"
            disabled={status === "submitting"}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <UploadCloud size={26} className="mx-auto text-neutral-400 mb-2" />
          {file ? (
            <p className="text-sm font-medium">
              {file.name} · {formatBytes(file.size)}
            </p>
          ) : (
            <p className="text-sm text-neutral-500">Tap to choose an .apk file</p>
          )}
        </label>

        {!isNewVersionMode && (
          <div>
            <span className="text-xs font-medium text-neutral-500">Screenshots (optional, up to 8)</span>
            <label className="mt-1 block rounded-2xl border-2 border-dashed border-black/10 dark:border-white/15 p-4 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={status === "submitting"}
                onChange={(e) => handleScreenshotsChange(e.target.files)}
              />
              <ImageIcon size={20} className="mx-auto text-neutral-400 mb-1" />
              <p className="text-xs text-neutral-500">Tap to choose screenshots</p>
            </label>
            {screenshotPreviews.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                {screenshotPreviews.map((src, i) => (
                  <div key={i} className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(i)}
                      className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isNewVersionMode && (
          <Field
            label="Video preview URL (optional — YouTube or .mp4 link)"
            value={videoUrl}
            onChange={setVideoUrl}
            disabled={status === "submitting"}
          />
        )}

        {developers.length > 1 && !isNewVersionMode && (
          <Select label="Publish as" value={developerId} onChange={setDeveloperId}>
            {developers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        )}

        <Field
          label="App name"
          value={name}
          onChange={setName}
          required
          disabled={status === "submitting" || isNewVersionMode}
        />
        {!isNewVersionMode && (
          <Field label="Short name" value={shortName} onChange={setShortName} disabled={status === "submitting"} />
        )}
        <Field label="Version (e.g. 1.0.0)" value={version} onChange={setVersion} required disabled={status === "submitting"} />
        {!isNewVersionMode && (
          <Field label="Minimum Android version" value={minAndroid} onChange={setMinAndroid} disabled={status === "submitting"} />
        )}

        {!isNewVersionMode && (
          <Select label="Category" value={categoryId} onChange={setCategoryId}>
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}

        {!isNewVersionMode && (
          <TextArea label="Description" value={description} onChange={setDescription} />
        )}
        <TextArea label="Changelog" value={changelog} onChange={setChangelog} />

        {error && <p className="text-sm text-rose-500">{error}</p>}

        {status === "submitting" && (
          <div className="space-y-1.5">
            <div className="h-2.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-600 transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-neutral-500 text-center">
              {phase === "icon"
                ? `Uploading icon... ${progress}%`
                : phase === "screenshots"
                ? `Uploading screenshots... ${progress}%`
                : phase === "upload"
                ? `Uploading APK... ${progress}%`
                : `Scanning & processing... ${progress}%`}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-600 text-white font-semibold py-3 disabled:opacity-70"
        >
          {status === "submitting" && <Loader2 size={18} className="animate-spin" />}
          {status === "submitting" ? `${progress}%` : isNewVersionMode ? "Publish version" : "Submit"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-neutral-500">{label}</span>
      <input
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-neutral-500">{label}</span>
      <textarea
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-neutral-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
      >
        {children}
      </select>
    </label>
  );
                                             }
