"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Suggestion {
  id: string;
  name: string;
  slug: string;
}

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const supabase = createClient();

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      setRecent(stored);
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      // Partial, case-insensitive match across name / short_name / developer,
      // via ilike against apks joined with developers.
      const { data } = await supabase
        .from("apks")
        .select("id, name, slug, developer:developers(name)")
        .eq("status", "approved")
        .or(`name.ilike.%${query}%,short_name.ilike.%${query}%`)
        .limit(6);
      setSuggestions((data as any) ?? []);
    }, 250);
  }, [query]);

  function commitSearch(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recent.filter((r) => r !== trimmed)].slice(0, 10);
    setRecent(next);
    localStorage.setItem("recentSearches", JSON.stringify(next));
    setFocused(false);
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from("search_history").insert({ user_id: data.user.id, query: trimmed });
      }
    });
    startTransition(() => router.push(`/search?q=${encodeURIComponent(trimmed)}`));
  }

  function clearHistory() {
    setRecent([]);
    localStorage.removeItem("recentSearches");
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/5">
        <Search size={18} className="text-neutral-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => e.key === "Enter" && commitSearch(query)}
          placeholder="Search apps, developers..."
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-neutral-400"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Clear">
            <X size={16} className="text-neutral-400" />
          </button>
        )}
      </div>

      {focused && (
        <div className="absolute z-30 mt-2 w-full rounded-2xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 shadow-lg overflow-hidden">
          {query && suggestions.length > 0 && (
            <ul>
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    onMouseDown={() => commitSearch(s.name)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2"
                  >
                    <Search size={14} className="text-neutral-400" />
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query && suggestions.length === 0 && (
            <p className="px-4 py-3 text-sm text-neutral-400">No matches yet</p>
          )}

          {!query && recent.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-4 pt-2.5">
                <span className="text-xs text-neutral-400">Recent</span>
                <button onMouseDown={clearHistory} className="text-xs text-brand-600">
                  Clear
                </button>
              </div>
              <ul>
                {recent.map((r) => (
                  <li key={r}>
                    <button
                      onMouseDown={() => commitSearch(r)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2"
                    >
                      <Clock size={14} className="text-neutral-400" />
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
