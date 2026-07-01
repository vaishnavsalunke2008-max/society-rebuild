"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";

export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string;
  flat_number: string;
  role: "resident" | "admin" | "security";
  avatar_url: string | null;
};

type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
  needsOnboarding: boolean;
  authUserId: string | null;
  setUser: (u: UserProfile | null) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, needsOnboarding: false, authUserId: null,
  setUser: () => {}, signOut: async () => {},
});

// Used only for stale OAuth code detection
async function getLastCode(): Promise<string | null> {
  try { const { Preferences } = await import("@capacitor/preferences"); const { value } = await Preferences.get({ key: "sh_lc" }); return value; } catch { return null; }
}
async function setLastCode(code: string) {
  try { const { Preferences } = await import("@capacitor/preferences"); await Preferences.set({ key: "sh_lc", value: code }); } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userState, setUserState]     = useState<UserProfile | null>(null);
  const [loading, setLoading]         = useState(true);
  const [needsOnboarding, setNeeds]   = useState(false);
  const [authUserId, setAuthUserId]   = useState<string | null>(null);
  const initDone                      = useRef(false);

  function setUser(u: UserProfile | null) { setUserState(u); if (u) setNeeds(false); }

  useEffect(() => {
    const supabase = createClient();
    let cancelled  = false;
    let capListener: any = null;

    // ── Load profile from DB with retries (handles cold-start network delays) ──
    async function loadProfile(uid: string) {
      if (cancelled) return;
      setAuthUserId(uid);

      for (let attempt = 1; attempt <= 5; attempt++) {
        if (cancelled) return;
        try {
          const { data, error } = await supabase
            .from("users").select("*").eq("id", uid).maybeSingle();

          if (error) {
            if (attempt < 5) { await new Promise(r => setTimeout(r, 2000 * attempt)); continue; }
            // After 5 failures — stop loading, keep authUserId so layout doesn't redirect to login
            break;
          }

          if (data) {
            // Fix avatar from Google OAuth metadata if missing
            let avatarUrl = data.avatar_url;
            if (!avatarUrl) {
              try {
                const { data: au } = await supabase.auth.getUser();
                const m = au.user?.user_metadata;
                avatarUrl = m?.avatar_url ?? m?.picture ?? null;
                if (avatarUrl) supabase.from("users").update({ avatar_url: avatarUrl }).eq("id", uid).then(() => {});
              } catch (_) {}
            }
            setUserState({ ...(data as UserProfile), avatar_url: avatarUrl });
            setNeeds(false);
          } else {
            setUserState(null);
            setNeeds(true); // Genuine new user — no DB row yet
          }
          break;
        } catch (e) {
          if (attempt < 5) await new Promise(r => setTimeout(r, 2000 * attempt));
        }
      }

      if (!cancelled) setLoading(false);
    }

    // ── Register deep-link listener immediately so OAuth never gets stuck ──────
    async function setupListener() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
        const { App } = await import("@capacitor/app");
        if (capListener) return;
        capListener = await App.addListener("appUrlOpen", async (e) => {
          if (!e.url.includes("code=")) return;
          const code = new URL(e.url).searchParams.get("code");
          if (!code || (await getLastCode()) === code) return;
          await setLastCode(code);

          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data.session?.user) await loadProfile(data.session.user.id);

          try { const { Browser } = await import("@capacitor/browser"); await Browser.close(); } catch (_) {}
        });
      } catch (e) { console.error("listener:", e); }
    }
    setupListener(); // Fire immediately — don't await

    // ── Main init ─────────────────────────────────────────────────────────────
    async function init() {
      const safety = setTimeout(() => {
        if (!cancelled && !initDone.current) { setLoading(false); initDone.current = true; }
      }, 25000);

      try {
        // getSession() reads the session from Capacitor Preferences via our storage adapter.
        // This is instant (no network) if the token is not expired.
        // If token is expired, Supabase auto-refreshes it (needs network — may take a moment).
        const { data: { session } } = await supabase.auth.getSession();

        if (cancelled) { clearTimeout(safety); return; }

        if (session?.user) {
          await loadProfile(session.user.id);
          initDone.current = true;
          clearTimeout(safety);
          return;
        }

        // No session — check if app was launched via OAuth callback
        let isNative = false;
        try { const { Capacitor } = await import("@capacitor/core"); isNative = Capacitor.isNativePlatform(); } catch (_) {}

        if (isNative) {
          try {
            const { App } = await import("@capacitor/app");
            const launch = await App.getLaunchUrl();
            if (launch?.url?.includes("code=")) {
              const code = new URL(launch.url).searchParams.get("code");
              if (code && (await getLastCode()) !== code) {
                await setLastCode(code);
                const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                if (!error && data.session?.user) {
                  await loadProfile(data.session.user.id);
                  initDone.current = true;
                  clearTimeout(safety);
                  try { const { Browser } = await import("@capacitor/browser"); await Browser.close(); } catch (_) {}
                  return;
                }
              }
            }
          } catch (_) {}
        }

        // Truly no session — show login
        if (!cancelled) {
          setUserState(null); setNeeds(false); setAuthUserId(null); setLoading(false);
        }
      } catch (err) {
        console.error("init:", err);
        if (!cancelled) { setUserState(null); setNeeds(false); setAuthUserId(null); setLoading(false); }
      } finally {
        initDone.current = true;
        clearTimeout(safety);
      }
    }

    init();

    // ── Auth state changes ────────────────────────────────────────────────────
    // Only act on events AFTER init is done to prevent conflicts with init() logic
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled || !initDone.current) return;

      if (event === "SIGNED_IN" && session?.user) {
        await loadProfile(session.user.id);
      } else if (event === "SIGNED_OUT") {
        if (!cancelled) { setUserState(null); setNeeds(false); setAuthUserId(null); setLoading(false); }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      capListener?.remove?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await createClient().auth.signOut(); // Storage adapter auto-clears session from Preferences
    setUserState(null); setNeeds(false); setAuthUserId(null); setLoading(false);
  }

  return (
    <AuthContext.Provider value={{ user: userState, loading, needsOnboarding, authUserId, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
