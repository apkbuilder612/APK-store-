"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Globe, Loader2, CheckCircle2, Image as ImageIcon } from "lucide-react";

interface Category {
  id: string;
  name: string;
}
interface DeveloperProfile {
  id: string;
  name: string;
}

export default function SubmitPwaPage() {
  const supabase = createClient();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [developers, setDevelopers] = useState<DeveloperProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [version, setVersion] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [developerId, setDeveloperId] = useState("");
  const [icon, setIcon] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
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
    setIconPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      let iconPath: string | null = null;

      if (icon) {
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

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const ext = icon.name.split(".").pop() || "png";
        const filePath = `${user.id}/uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `${supabaseUrl}/storage/v1/object/icons/${filePath}`);
          xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
          xhr.setRequestHeader("apikey", anonKey);
          xhr.setRequestHeader("Content-Type", icon.type || "image/png");
          xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject());
          xhr.onerror = () => reject();
          xhr.send(icon);
        });

        iconPath = filePath;
      }

      const res = await fetch("/api/pwa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          shortName,
          description,
          websiteUrl,
          version,
          categoryId,
          developerId,
          iconPath,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not add PWA.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setError("Network error.");
      setStatus("error");
    }
  }

  if (checking) {
    return <div className="px-4 pt-16 text-center text-neutral-400">Loading...</div>;
  }

  if (!isDeveloper) {
    return (
      <div className="px-6 pt-16 text-center">
        <Globe size={36} className="mx-auto text-neutral-400 mb-3" />
        <h1 className="text-lg font-semibold mb-1">Become a developer</h1>
        <p className="text-sm text-neutral-500 mb-5">
          Create a developer profile to publish PWAs to the store.
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
        <p className="text-sm text-neutral-500">Your PWA is now live in the store.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-10">
      <h1 className="text-xl font-bold mb-1">Add a PWA</h1>
      <p className="text-xs text-neutral-500 mb-4">
        If you don't upload an icon, we'll try to detect one automatically from the site's own manifest.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3 items-center">
          <label className="shrink-0 h-16 w-16 rounded-2xl border-2 border-dashed border-black/10 dark:border-white/15 flex items-center justify-center overflow-hidden bg-neutral-50 dark:bg-neutral-900">
            <input
              type="file"
              accept="image/*"
              className="hidden"
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
            Leave empty to auto-detect
          </div>
        </div>

        {developers.length > 1 && (
          <Select label="Publish as" value={developerId} onChange={setDeveloperId}>
            {developers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        )}

        <Field label="App name" value={name} onChange={setName} required />
        <Field label="Short name" value={shortName} onChange={setShortName} />
        <Field label="Website URL (https://...)" value={websiteUrl} onChange={setWebsiteUrl} required />
        <Field label="Version (optional)" value={version} onChange={setVersion} />

        <Select label="Category" value={categoryId} onChange={setCategoryId}>
          <option value="">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <TextArea label="Description" value={description} onChange={setDescription} />

        {error && <p className="text-sm text-rose-500">{error}</p>}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-600 text-white font-semibold py-3 disabled:opacity-70"
        >
          {status === "submitting" && <Loader2 size={18} className="animate-spin" />}
          Submit
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-neutral-500">{label}</span>
      <input
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
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
