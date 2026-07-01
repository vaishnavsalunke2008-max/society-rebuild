import { createClient as _createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * Async storage adapter: saves to Capacitor Preferences (persists on Android across
 * WebView restarts) AND localStorage (fast in-memory fallback).
 * On read, Preferences is tried first; falls back to localStorage.
 */
const authStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const { Preferences } = await import("@capacitor/preferences");
      const { value } = await Preferences.get({ key });
      if (value != null) return value;
    } catch (_) {}
    try { return window.localStorage.getItem(key); } catch (_) { return null; }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.set({ key, value });
    } catch (_) {}
    try { window.localStorage.setItem(key, value); } catch (_) {}
  },
  async removeItem(key: string): Promise<void> {
    try {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.remove({ key });
    } catch (_) {}
    try { window.localStorage.removeItem(key); } catch (_) {}
  },
};

export function createClient(): SupabaseClient {
  if (!_client) {
    _client = _createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: "pkce",
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          storage: authStorage, // Supabase saves/reads session via Preferences automatically
        },
      }
    );
  }
  return _client;
}
