import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { versionId: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Explicitly name the foreign key here (apk_versions_apk_id_fkey)
    // because apk_versions <-> apks has TWO relationships (apk_id, and
    // the reverse latest_version_id) — without naming it, PostgREST can't
    // tell which one to embed and the query silently errors out.
    const { data: version, error: versionError } = await supabase
      .from("apk_versions")
      .select("id, file_path, apk_id, apks!apk_versions_apk_id_fkey(status)")
      .eq("id", params.versionId)
      .single();

    if (versionError || !version) {
      return NextResponse.json(
        { error: `Version lookup failed: ${versionError?.message ?? "not found"}` },
        { status: 404 }
      );
    }

    const apkStatus = Array.isArray((version as any).apks)
      ? (version as any).apks[0]?.status
      : (version as any).apks?.status;

    if (apkStatus !== "approved") {
      return NextResponse.json({ error: "This app isn't available." }, { status: 404 });
    }

    const admin = createServiceRoleClient();
    const { data: signed, error } = await admin.storage
      .from("apk-files")
      .createSignedUrl((version as any).file_path, 60 * 5);

    if (error || !signed) {
      return NextResponse.json(
        { error: `Could not generate download link: ${error?.message ?? "unknown"}` },
        { status: 500 }
      );
    }

    await admin.from("downloads").insert({
      user_id: user?.id ?? null,
      apk_id: (version as any).apk_id,
      apk_version_id: params.versionId,
      status: "completed",
    });

    await admin.rpc("increment_apk_downloads", { target_apk_id: (version as any).apk_id });

    return NextResponse.json({ url: signed.signedUrl });
  } catch (err: any) {
    console.error("Download route crashed:", err);
    return NextResponse.json(
      { error: `Server error: ${err?.message ?? "unknown error"}` },
      { status: 500 }
    );
  }
}
