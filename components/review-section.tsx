"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Star, Loader2, Trash2 } from "lucide-react";
import { timeAgo } from "@/lib/format";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  reviewer?: { username: string } | { username: string }[] | null;
}

export function ReviewSection({
  apkId,
  pwaId,
  avgRating,
  ratingCount,
}: {
  apkId?: string;
  pwaId?: string;
  avgRating: number;
  ratingCount: number;
}) {
  const supabase = createClient();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [myRating, setMyRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    const { data } = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, user_id, reviewer:profiles(username)")
      .match(apkId ? { apk_id: apkId } : { pwa_id: pwaId })
      .order("created_at", { ascending: false });
    setReviews((data as any) ?? []);

    if (user) {
      const mine = (data as any[])?.find((r) => r.user_id === user.id);
      if (mine) {
        setMyRating(mine.rating);
        setComment(mine.comment ?? "");
      }
    }
    setLoading(false);
  }

  async function submitReview() {
    if (!userId) {
      window.location.href = "/login";
      return;
    }
    if (myRating === 0) return;
    setSubmitting(true);
    await supabase.from("reviews").upsert(
      {
        user_id: userId,
        apk_id: apkId ?? null,
        pwa_id: pwaId ?? null,
        rating: myRating,
        comment: comment.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: apkId ? "user_id,apk_id" : "user_id,pwa_id" }
    );
    setSubmitting(false);
    load();
  }

  async function deleteReview(id: string) {
    await supabase.from("reviews").delete().eq("id", id);
    setMyRating(0);
    setComment("");
    load();
  }

  if (loading) return null;

  return (
    <div className="px-4 mt-6">
      <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
        <Star size={15} className="fill-amber-400 text-amber-400" />
        Ratings & Reviews
        {ratingCount > 0 && (
          <span className="text-neutral-400 font-normal">
            {avgRating} · {ratingCount} review{ratingCount === 1 ? "" : "s"}
          </span>
        )}
      </h2>

      <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 mb-3">
        <p className="text-xs text-neutral-500 mb-2">
          {reviews.some((r) => r.user_id === userId) ? "Your rating" : "Rate this app"}
        </p>
        <div className="flex gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setMyRating(n)}>
              <Star
                size={26}
                className={n <= myRating ? "fill-amber-400 text-amber-400" : "text-neutral-300 dark:text-neutral-700"}
              />
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a review (optional)"
          rows={2}
          className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          onClick={submitReview}
          disabled={myRating === 0 || submitting}
          className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 text-white font-medium py-2 text-sm disabled:opacity-50"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          Submit
        </button>
      </div>

      <div className="space-y-2">
        {reviews
          .filter((r) => r.user_id !== userId)
          .map((r) => {
            const reviewer = Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer;
            return (
              <div
                key={r.id}
                className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{reviewer?.username ?? "User"}</p>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={12}
                        className={n <= r.rating ? "fill-amber-400 text-amber-400" : "text-neutral-300 dark:text-neutral-700"}
                      />
                    ))}
                  </div>
                </div>
                {r.comment && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{r.comment}</p>
                )}
                <p className="text-[11px] text-neutral-400 mt-1">{timeAgo(r.created_at)}</p>
              </div>
            );
          })}
        {reviews.filter((r) => r.user_id === userId).map((r) => (
          <div
            key={r.id}
            className="p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/40"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">You</p>
              <button onClick={() => deleteReview(r.id)}>
                <Trash2 size={13} className="text-rose-500" />
              </button>
            </div>
            {r.comment && <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{r.comment}</p>}
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-sm text-neutral-400 text-center py-4">No reviews yet — be the first.</p>
        )}
      </div>
    </div>
  );
  }
