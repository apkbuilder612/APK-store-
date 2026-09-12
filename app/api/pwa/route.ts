import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { validatePwaUrl } from "@/lib/pwa-validation";

export const maxDuration = 30;

// Best-effort: look for <link rel="manifest"> on the site's homepage, fetch
// that manifest, pick its largest icon, download it, and re-host it in our
// own "icons" bucket. Every step is wrapped so a failure anywhere just
// means "no auto icon" rather than failing the whole submission.
async function tryAutoDetectIcon(
  websiteUrl: string,
  admin: ReturnType<typeof createServiceRoleClient>
): Promise<string | null> {
  try {
    const homeRes = await fetch(websiteUrl, { signal: AbortSignal.timeout(8000) });
    if (!homeRes.ok) return null;
    const html = await homeRes.text();

    const manifestMatch = html.match(
      /<link[^>]+rel=["']manifest["'][^>]+href=["']([^"']+)["']/i
    );
    const manifestHref = manifestMatch?.[1] ?? "/manifest.json";
    const manifestUrl = new URL(manifestHref, websiteUrl).toString();

    const manifestRes = await fetch(manifestUrl, { signal: AbortSignal.timeout(8000) });
    if (!manifestRes.ok) return null;
    const manifest = await manifestRes.json();

    const icons: Array<{ src: string; sizes?: string }> = manifest?.icons ?? [];
    if (!Array.isArray(icons) || icons.length === 0) return null;

    const withSize = icons.map((icon) => {
      const size = icon.sizes ? parseInt(icon.sizes.split("x")[0], 10) || 0 : 0;
      return { ...icon, size };
    });
    withSize.sort((a, b) => b.size - a.size);
    const best = withSize[0];
    if (!best?.src) return null;

    const iconUrl = new URL(best.src, manifestUrl).toString();
    const iconRes = await fetch(iconUrl, { signal: AbortSignal.timeout(8000) });
    if (!iconRes.ok) return null;

    const contentType = iconRes.headers.get("content-type") || "image/png";
    const buffer = Buffer.from(await iconRes.arrayBuffer());
    if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) return null;

    const ext = contentType.includes("png") ? "png" : contentType.includes("svg") ? "svg" : "img";
    const path = `auto-detected/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from("icons")
      .upload(path, buffer, { contentType });
    if (uploadError) return null;

    const { data: publicUrl } = admin.storage.from("icons").getPublicUrl(path);
    return publicUrl?.publicUrl ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json();
  const { name, shortName, description, websiteUrl, version, categoryId, developerId, iconPath } = body;

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

  // Icon priority: manually uploaded > auto-detected from manifest > none.
  let iconUrl: string | null = null;
  if (iconPath) {
    const { data: publicIcon } = admin.storage.from("icons").getPublicUrl(iconPath);
    iconUrl = publicIcon?.publicUrl ?? null;
  } else {
    iconUrl = await tryAutoDetectIcon(validation.normalized!, admin);
  }

  const slug = String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const { data: existing } = await admin
    .from("pwas")
    .select("id")
    .eq("developer_id", developerId)
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await admin
      .from("pwas")
      .update({
        name,
        short_name: shortName || null,
        description: description || null,
        website_url: validation.normalized,
        version: version || null,
        category_id: categoryId || null,
        ...(iconUrl ? { icon_url: iconUrl } : {}),
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) {
      return NextResponse.json({ error: "Could not update PWA." }, { status: 500 });
    }
    return NextResponse.json({ success: true, pwaId: existing.id, iconDetected: !!iconUrl });
  }

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
      icon_url: iconUrl,
      status: "approved",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message.includes("duplicate") ? "You already have a PWA with this name." : "Could not save PWA." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, pwaId: pwa.id, iconDetected: !!iconUrl });
      }
