import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { validateApkBuffer } from "@/lib/apk-validation";
import { checkHashWithVirusTotal } from "@/lib/virustotal";

export const runtime = "nodejs";
export const maxDuration = 60;

const uploadTimestamps = new Map<string, number[]>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = (uploadTimestamps.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  timestamps.push(now);
  uploadTimestamps.set(userId, timestamps);
  return timestamps.length > RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const {
      filePath,
      iconPath,
      screenshotPaths,
      videoUrl,
      name: appName,
      shortName,
      description,
      version,
      categoryId,
      changelog,
      developerId,
      minAndroidVersion,
    } = body;

    if (!filePath || !appName || !version || !developerId) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!filePath.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: "Invalid file path." }, { status: 400 });
    }

    const admin = createServiceRoleClient();

    const { data: dev } = await admin
      .from("developers")
      .select("id, owner_id")
      .eq("id", developerId)
      .single();
    if (!dev || dev.owner_id !== user.id) {
      await admin.storage.from("apk-files").remove([filePath]);
      return NextResponse.json({ error: "You don't own this developer profile." }, { status: 403 });
    }

    const { data: fileBlob, error: downloadError } = await admin.storage
      .from("apk-files")
      .download(filePath);

    if (downloadError || !fileBlob) {
      return NextResponse.json(
        { error: `Could not read the uploaded file: ${downloadError?.message ?? "unknown"}` },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await fileBlob.arrayBuffer());
    const validation = validateApkBuffer(buffer);

    if (!validation.valid) {
      await admin.storage.from("apk-files").remove([filePath]);
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    // Malware check: look up this exact file's hash against VirusTotal.
    // If 3+ security vendors flag it as malicious, we refuse to publish it.
    const scan = await checkHashWithVirusTotal(validation.sha256);
    if (scan.status === "malicious") {
      await admin.storage.from("apk-files").remove([filePath]);
      return NextResponse.json(
        {
          error: `This file was flagged as malicious by ${scan.positives} security vendor(s) and cannot be published.`,
        },
        { status: 400 }
      );
    }

    let iconUrl: string | null = null;
    if (iconPath) {
      const { data: publicIcon } = admin.storage.from("icons").getPublicUrl(iconPath);
      iconUrl = publicIcon?.publicUrl ?? null;
    }

    const slug = String(appName).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

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
          short_name: shortName || null,
          description: description || null,
          category_id: categoryId || null,
          min_android_version: minAndroidVersion || null,
          icon_url: iconUrl,
          video_url: videoUrl || null,
          status: "approved",
        })
        .select("id")
        .single();
      if (apkError || !newApk) {
        await admin.storage.from("apk-files").remove([filePath]);
        return NextResponse.json(
          { error: `Could not create app entry: ${apkError?.message ?? "unknown"}` },
          { status: 500 }
        );
      }
      apk = newApk;
    } else {
      const updates: Record<string, any> = {};
      if (iconUrl) updates.icon_url = iconUrl;
      if (videoUrl) updates.video_url = videoUrl;
      if (Object.keys(updates).length > 0) {
        await admin.from("apks").update(updates).eq("id", apk.id);
      }
    }

    const { data: existingHash } = await admin
      .from("apk_versions")
      .select("id")
      .eq("apk_id", apk.id)
      .eq("sha256_hash", validation.sha256)
      .maybeSingle();
    if (existingHash) {
      await admin.storage.from("apk-files").remove([filePath]);
      return NextResponse.json(
        { error: "This exact file has already been uploaded for this app." },
        { status: 409 }
      );
    }

    await admin.from("apk_versions").update({ is_latest: false }).eq("apk_id", apk.id).eq("is_latest", true);

    const { data: newVersion, error: versionError } = await admin
      .from("apk_versions")
      .insert({
        apk_id: apk.id,
        version,
        file_path: filePath,
        file_size_bytes: validation.sizeBytes,
        sha256_hash: validation.sha256,
        changelog: changelog || null,
        is_latest: true,
        scan_status: scan.status,
        scan_positives: scan.positives,
        scan_total: scan.total,
        scan_checked_at: new Date().toISOString(),
        virustotal_link: scan.link,
      })
      .select("id")
      .single();

    if (versionError || !newVersion) {
      await admin.storage.from("apk-files").remove([filePath]);
      return NextResponse.json(
        {
          error: versionError?.message?.includes("duplicate")
            ? "This version number already exists for this app."
            : `Could not save version metadata: ${versionError?.message ?? "unknown"}`,
        },
        { status: 500 }
      );
    }

    await admin
      .from("apks")
      .update({ latest_version_id: newVersion.id, updated_at: new Date().toISOString() })
      .eq("id", apk.id);

    // Screenshots (optional, multiple)
    if (Array.isArray(screenshotPaths) && screenshotPaths.length > 0) {
      const rows = screenshotPaths.map((path: string, i: number) => {
        const { data: pub } = admin.storage.from("screenshots").getPublicUrl(path);
        return { apk_id: apk!.id, url: pub?.publicUrl ?? "", position: i };
      });
      await admin.from("apk_screenshots").insert(rows);
    }

    return NextResponse.json({
      success: true,
      apkId: apk.id,
      versionId: newVersion.id,
      scanStatus: scan.status,
    });
  } catch (err: any) {
    console.error("Upload route crashed:", err);
    return NextResponse.json(
      { error: `Server error: ${err?.message ?? "unknown error"}` },
      { status: 500 }
    );
  }
  }
