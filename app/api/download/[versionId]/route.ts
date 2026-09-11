import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { versionId: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Confirm the version belongs to an approved (publicly visible) apk before
  // ever touching the service-role client.
  const { data: version } = await supabase
    .from("apk_versions")
    .select("id, file_path, apk_id, apks!inner(status)")
    .eq("id", params.versionId)
    .single();

  if (!version || (version as any).apks?.status !== "approved") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const admin = createServiceRoleClient();
  const { data: signed, error } = await admin.storage
    .from("apk-files")
    .createSignedUrl((version as any).file_path, 60 * 5); // 5 minute expiry

  if (error || !signed) {
    return NextResponse.json({ error: "Could not generate download link" }, { status: 500 });
  }

  await admin.from("downloads").insert({
    user_id: user?.id ?? null,
    apk_id: (version as any).apk_id,
    apk_version_id: params.versionId,
    status: "completed",
  });

  await admin.rpc("increment_apk_downloads", { target_apk_id: (version as any).apk_id }).select();

  return NextResponse.json({ url: signed.signedUrl });
}
