"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let email = identifier;
    if (!identifier.includes("@")) {
      const { data } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", identifier)
        .maybeSingle();
      if (!data) {
        setLoading(false);
        setError("No account found with that username.");
        return;
      }
      email = data.email;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError("Incorrect email/username or password.");
      return;
    }
    const redirect = searchParams.get("redirect") || "/";
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="px-6 pt-16 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
      <p className="text-sm text-neutral-500 mb-6">Log in to your APK Store account.</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-neutral-500">Email or username</span>
          <input
            value={identifier}
            required
            onChange={(e) => setIdentifier(e.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-neutral-500">Password</span>
          <input
            type="password"
            value={password}
            required
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
        </label>

        {error && <p className="text-sm text-rose-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-600 text-white font-semibold py-3 mt-2 disabled:opacity-70"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          Log in
        </button>
      </form>

      <p className="text-sm text-neutral-500 mt-5 text-center">
        Don't have an account?{" "}
        <Link href="/signup" className="text-brand-600 font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}
