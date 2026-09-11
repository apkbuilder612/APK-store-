import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { validatePwaUrl } from "@/lib/pwa-validation";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const { name, shortName, description, websiteUrl, version, categoryId, developerId } = body;

  if (!name || !websiteUrl || !developerId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const validation = validatePwaUrl(websiteUrl);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  const { data: dev } = await admin
    .from("developers")
    .select("id, owner_id")
    .eq("id", developerId)
    .single();
  if (!dev || dev.owner_id !== user.id) {
    return NextResponse.json({ error: "You don't own this developer profile." }, { status: 403 });
  }

  const slug = String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const { data: pwa, error } = await admin
    .from("pwas")
    .insert({
      developer_id: developerId,
      slug,
      name,
      short_name: shortName || null,
      description: description || null,
      website_url: validation.normalized,
      version: version || null,
      category_id: categoryId || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message.includes("duplicate") ? "You already have a PWA with this name." : "Could not save PWA." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, pwaId: pwa.id });
}
