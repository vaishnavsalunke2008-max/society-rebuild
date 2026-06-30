import { createClient as _createClient, SupabaseClient } from "@supabase/supabase-js";

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
        },
      }
    );
  }
  return _client;
}
