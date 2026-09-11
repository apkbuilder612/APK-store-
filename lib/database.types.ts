// Hand-maintained types matching the Supabase schema (see migrations).
// Regenerate with `supabase gen types typescript` once the CLI is linked
// on your machine for full type safety.

export type AppStatus = "pending" | "approved" | "rejected" | "removed";
export type UserRole = "user" | "developer" | "admin";

export interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  is_developer: boolean;
  notifications_enabled: boolean;
  update_check_interval_days: number;
  created_at: string;
  updated_at: string;
}

export interface Developer {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  website: string | null;
  total_downloads: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Apk {
  id: string;
  developer_id: string;
  slug: string;
  name: string;
  short_name: string | null;
  description: string | null;
  package_name: string | null;
  category_id: string | null;
  icon_url: string | null;
  latest_version_id: string | null;
  min_android_version: string | null;
  target_android_version: string | null;
  download_count: number;
  status: AppStatus;
  created_at: string;
  updated_at: string;
  developer?: Developer;
  category?: Category;
  latest_version?: ApkVersion;
  screenshots?: ApkScreenshot[];
}

export interface ApkVersion {
  id: string;
  apk_id: string;
  version: string;
  file_path: string;
  file_size_bytes: number;
  sha256_hash: string;
  changelog: string | null;
  is_latest: boolean;
  created_at: string;
  permissions?: string[];
}

export interface ApkScreenshot {
  id: string;
  apk_id: string;
  url: string;
  position: number;
}

export interface Pwa {
  id: string;
  developer_id: string;
  slug: string;
  name: string;
  short_name: string | null;
  description: string | null;
  website_url: string;
  icon_url: string | null;
  version: string | null;
  category_id: string | null;
  status: AppStatus;
  created_at: string;
  updated_at: string;
  developer?: Developer;
  category?: Category;
}

// Minimal placeholder so @supabase/ssr generics compile; replace with the
// CLI-generated Database type when available.
export type Database = any;
