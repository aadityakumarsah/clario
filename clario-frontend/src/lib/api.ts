import { supabase } from "@/lib/supabase";

const BASE = import.meta.env.VITE_BACKEND_BASE_URL as string;

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token ?? ""}`,
  };
}

// ── Settings ──────────────────────────────────────────────────────────────────

export interface SettingsData {
  user_id: string;
  name: string;
  email: string;
  daily_reminder: boolean;
  streak_notifications: boolean;
  weekly_digest: boolean;
  reminder_time: string;
  updated_at: string;
}

export interface SettingsUpdate {
  name?: string;
  daily_reminder?: boolean;
  streak_notifications?: boolean;
  weekly_digest?: boolean;
  reminder_time?: string;
}

export async function getSettings(): Promise<SettingsData> {
  const res = await fetch(`${BASE}/settings`, { headers: await authHeaders() });
  const json = await res.json();
  if (!json.success) throw new Error(json.message ?? "Failed to load settings");
  return json.data as SettingsData;
}

export async function patchSettings(updates: SettingsUpdate): Promise<SettingsData> {
  const res = await fetch(`${BASE}/settings`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(updates),
  });
  const json = await res.json();
  if (!json.success) {
    const firstError = json.errors?.[0];
    throw new Error(firstError?.detail ?? json.message ?? "Failed to save settings");
  }
  return json.data as SettingsData;
}
