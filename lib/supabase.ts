import { createClient as _createClient, SupabaseClient } from "@supabase/supabase-js";
import { Preferences } from "@capacitor/preferences";

// Custom storage adapter that writes to both Capacitor Preferences and localStorage
const customStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key });
      if (value !== null) return value;
    } catch (e) {}
    if (typeof window !== "undefined") return window.localStorage.getItem(key);
    return null;
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await Preferences.set({ key, value });
    } catch (e) {}
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch (e) {}
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
  },
};

// Singleton — same instance everywhere so PKCE verifier & session are consistent
let _client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (!_client) {
    _client = _createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: "pkce",
          storage: customStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      }
    );
  }
  return _client;
}
