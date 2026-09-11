"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 px-4 py-3.5 text-sm text-rose-500 w-full"
    >
      <LogOut size={18} />
      Logout
    </button>
  );
}
