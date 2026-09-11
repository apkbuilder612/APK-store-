import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { validateApkBuffer } from "@/lib/apk-validation";

// Simple in-memory rate limit per user (best-effort; for real multi-instance
// rate limiting move this to a Postgres table or Redis).
const uploadTimestamps = new Map<string, number[]>();
const RATE_LIMIT = 5; // uploads
const RATE_WINDOW_MS = 60 * 60 * 1000; // per hour

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = (uploadTimestamps.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  timestamps.push(now);
  uploadTimestamps.set(userId, timestamps);
  return timestamps.length > RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_developer")
    .eq("id", user.id)
    .single();

  if (!profile?.is_developer) {
    return NextResponse.json(
      { error: "Only developer accounts can upload apps." },
      { status: 403 }
    );
  }

  if (isRateLimited(user.id)) {
    return NextResponse.json({ error: "Upload limit reached. Try again later." }, { status: 429 });
  }

  const form = await request.formData();
  const file = form.get("apk") as File | null;
  const appName = form.get("name") as string | null;
  const shortName = form.get("shortName") as string | null;
  const description = form.get("description") as string | null;
  const version = form.get("version") as string | null;
  const categoryId = form.get("categoryId") as string | null;
  const changelog = form.get("changelog") as string | null;
  const developerId = form.get("developerId") as string | null;
  const minAndroidVersion = form.get("minAndroidVersion") as string | null;

  if (!file || !appName || !version || !developerId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".apk")) {
    return NextResponse.json({ error: "File must have a .apk extension." }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  // Ownership check: the developer profile must belong to this user.
  const { data: dev } = await admin
    .from("developers")
    .select("id, owner_id")
    .eq("id", developerId)
    .single();
  if (!dev || dev.owner_id !== user.id) {
    return NextResponse.json({ error: "You don't own this developer profile." }, { status: 403 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = validateApkBuffer(buffer);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }

  // Find or create the apk row (by developer + slug derived from name)
  const slug = appName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  let { data: apk } = await admin
    .from("apks")
    .select("id")
    .eq("developer_id", developerId)
    .eq("slug", slug)
    .maybeSingle();

  if (!apk) {
    const { data: newApk, error: apkError } = await admin
      .from("apks")
      .insert({
        developer_id: developerId,
        slug,
        name: appName,
        short_name: shortName,
        description,
        category_id: categoryId || null,
        min_android_version: minAndroidVersion || null,
        status: "pending", // goes through admin approval
      })
      .select("id")
      .single();
    if (apkError || !newApk) {
      return NextResponse.json({ error: "Could not create app entry." }, { status: 500 });
    }
    apk = newApk;
  }

  // Duplicate check: same apk + same hash already uploaded
  const { data: existingHash } = await admin
    .from("apk_versions")
    .select("id")
    .eq("apk_id", apk.id)
    .eq("sha256_hash", validation.sha256)
    .maybeSingle();
  if (existingHash) {
    return NextResponse.json(
      { error: "This exact file has already been uploaded for this app." },
      { status: 409 }
    );
  }

  const filePath = `${user.id}/${apk.id}/${version}-${validation.sha256.slice(0, 12)}.apk`;
  const { error: uploadError } = await admin.storage
    .from("apk-files")
    .upload(filePath, buffer, { contentType: "application/vnd.android.package-archive" });

  if (uploadError) {
    return NextResponse.json({ error: "File upload failed." }, { status: 500 });
  }

  // Unset the current "latest" version for this apk FIRST — a partial unique
  // index enforces only one is_latest=true row per apk, so the old flag must
  // clear before the new row can be inserted with is_latest=true.
  await admin.from("apk_versions").update({ is_latest: false }).eq("apk_id", apk.id).eq("is_latest", true);

  const { data: newVersion, error: versionError } = await admin
    .from("apk_versions")
    .insert({
      apk_id: apk.id,
      version,
      file_path: filePath,
      file_size_bytes: validation.sizeBytes,
      sha256_hash: validation.sha256,
      changelog,
      is_latest: true,
    })
    .select("id")
    .single();

  if (versionError || !newVersion) {
    await admin.storage.from("apk-files").remove([filePath]);
    return NextResponse.json(
      {
        error: versionError?.message?.includes("duplicate")
          ? "This version number already exists for this app."
          : "Could not save version metadata.",
      },
      { status: 500 }
    );
  }

  await admin
    .from("apks")
    .update({ latest_version_id: newVersion.id, updated_at: new Date().toISOString() })
    .eq("id", apk.id);

  return NextResponse.json({ success: true, apkId: apk.id, versionId: newVersion.id });
}
