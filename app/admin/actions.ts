"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Admin access required.");

  return user;
}

export async function setApkStatus(apkId: string, status: "approved" | "rejected" | "removed") {
  await requireAdmin();
  const admin = createServiceRoleClient();
  await admin.from("apks").update({ status }).eq("id", apkId);
  revalidatePath("/admin");
}

export async function setPwaStatus(pwaId: string, status: "approved" | "rejected" | "removed") {
  await requireAdmin();
  const admin = createServiceRoleClient();
  await admin.from("pwas").update({ status }).eq("id", pwaId);
  revalidatePath("/admin");
}

export async function deleteApk(apkId: string) {
  await requireAdmin();
  const admin = createServiceRoleClient();
  await admin.from("apks").delete().eq("id", apkId);
  revalidatePath("/admin");
}

export async function resolveReport(reportId: string) {
  await requireAdmin();
  const admin = createServiceRoleClient();
  await admin.from("reports").update({ status: "resolved" }).eq("id", reportId);
  revalidatePath("/admin");
}

export async function postAnnouncement(title: string, body: string) {
  const user = await requireAdmin();
  const admin = createServiceRoleClient();
  await admin.from("announcements").insert({ title, body, created_by: user.id });
  revalidatePath("/admin");
}
