"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UploadCloud, Loader2, CheckCircle2, Image as ImageIcon } from "lucide-react";
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
  const supabase = createClient();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [developers, setDevelopers] = useState<DeveloperProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [icon, setIcon] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
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
  const [phase, setPhase] = useState<"icon" | "upload" | "process">("upload");
  const [error, setError] = useState<string | null>(null);

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
      if (devs && devs.length > 0) setDeveloperId(devs[0].id);

      const { data: cats } = await supabase.from("categories").select("id, name").order("name");
      setCategories(cats ?? []);

      setChecking(false);
    })();
  }, []);

  async function becomeDeveloper() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const devName = prompt("Developer / company / group name:");
    if (!devName) return;
    const slug = devName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data: dev, error: devError } = await supabase
      .from("developers")
      .insert({ owner_id: user.id, name: devName, slug })
      .select("id, name")
      .single();
    if (devError) {
      alert(devError.message);
      return;
    }
    await supabase.from("profiles").update({ is_developer: true }).eq("id", user.id);
    setIsDeveloper(true);
    setDevelopers((d) => [...d, dev]);
    setDeveloperId(dev.id);
  }

  function handleIconChange(f: File | null) {
    setIcon(f);
    if (f) {
      setIconPreview(URL.createObjectURL(f));
    } else {
      setIconPreview(null);
    }
  }

  // Shared helper: uploads any file straight to a Supabase Storage bucket
  // from the browser (bypasses Vercel's function body-size limit) with
  // upload-progress reporting.
  function uploadDirectToStorage(
    theFile: File,
    bucket: string,
    userId: string,
    accessToken: string,
    contentType: string,
    onProgress: (pct: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const ext = theFile.name.split(".").pop() || "bin";
      const filePath = `${userId}/uploads/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`);
      xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      xhr.setRequestHeader("apikey", anonKey);
      xhr.setRequestHeader("Content-Type", contentType);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(filePath);
        } else {
          reject(new Error(`Could not upload to ${bucket}.`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload."));
      xhr.send(theFile);
    });
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
        iconPath = await uploadDirectToStorage(
          icon,
          "icons",
          user.id,
          session.access_token,
          icon.type || "image/png",
          (pct) => setProgress(Math.round(pct * 0.15)) // icon = first 15%
        );
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

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const base = icon ? 15 : 0;
            const span = icon ? 70 : 85;
            setProgress(base + Math.round((event.loaded / event.total) * span));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error("Could not upload APK file."));
        };
        xhr.onerror = () => reject(new Error("Network error during file upload."));
        xhr.send(file);
      });

      setPhase("process");
      setProgress(90);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath,
          iconPath,
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
        <h1 className="text-lg font-semibold mb-1">Become a developer</h1>
        <p className="text-sm text-neutral-500 mb-5">
          Create a developer profile to publish APKs to the store.
        </p>
        <button
          onClick={becomeDeveloper}
          className="rounded-2xl bg-brand-600 text-white font-semibold px-5 py-3"
        >
          Set up developer profile
        </button>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="px-6 pt-16 text-center">
        <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-3" />
        <h1 className="text-lg font-semibold mb-1">Published</h1>
        <p className="text-sm text-neutral-500">
          Your app is now live in the store.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-10">
      <h1 className="text-xl font-bold mb-1">Upload APK</h1>
      <p className="text-xs text-neutral-500 mb-4">
        To update an existing app later, use the exact same App name and a higher version number.
      </p>
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
            App icon (optional)
            <br />
            Square image works best
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

        {developers.length > 1 && (
          <Select label="Publish as" value={developerId} onChange={setDeveloperId}>
            {developers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        )}

        <Field label="App name" value={name} onChange={setName} required disabled={status === "submitting"} />
        <Field label="Short name" value={shortName} onChange={setShortName} disabled={status === "submitting"} />
        <Field label="Version (e.g. 1.0.0)" value={version} onChange={setVersion} required disabled={status === "submitting"} />
        <Field label="Minimum Android version" value={minAndroid} onChange={setMinAndroid} disabled={status === "submitting"} />

        <Select label="Category" value={categoryId} onChange={setCategoryId}>
          <option value="">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <TextArea label="Description" value={description} onChange={setDescription} />
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
              {phase === "icon" ? `Uploading icon... ${progress}%` : phase === "upload" ? `Uploading APK... ${progress}%` : `Processing... ${progress}%`}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-600 text-white font-semibold py-3 disabled:opacity-70"
        >
          {status === "submitting" && <Loader2 size={18} className="animate-spin" />}
          {status === "submitting" ? `${progress}%` : "Submit"}
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
