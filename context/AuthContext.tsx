"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Session } from "@supabase/supabase-js";
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

// ── Capacitor Preferences helpers ─────────────────────────────────────────────
async function prefsSet(key: string, value: string) {
  try { const { Preferences } = await import("@capacitor/preferences"); await Preferences.set({ key, value }); } catch (_) {}
}
async function prefsGet(key: string): Promise<string | null> {
  try { const { Preferences } = await import("@capacitor/preferences"); const { value } = await Preferences.get({ key }); return value; } catch (_) { return null; }
}
async function prefsRemove(key: string) {
  try { const { Preferences } = await import("@capacitor/preferences"); await Preferences.remove({ key }); } catch (_) {}
}

async function saveSession(session: Session) {
  await prefsSet("sh_rt", session.refresh_token ?? "");
  await prefsSet("sh_at", session.access_token);
}
async function clearSession() {
  await prefsRemove("sh_rt");
  await prefsRemove("sh_at");
  await prefsRemove("sh_profile");
}

// Save entire profile to Preferences so it loads instantly on next startup
async function cacheProfile(profile: UserProfile) {
  await prefsSet("sh_profile", JSON.stringify(profile));
}
async function getCachedProfile(): Promise<UserProfile | null> {
  const raw = await prefsGet("sh_profile");
  if (!raw) return null;
  try { return JSON.parse(raw) as UserProfile; } catch { return null; }
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userState, setUserState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const initDone = useRef(false);

  function setUser(u: UserProfile | null) {
    setUserState(u);
    if (u !== null) setNeedsOnboarding(false);
  }

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let capAppListener: any = null;

    // ── Fetch profile from DB and cache it ────────────────────────────────────
    async function fetchAndCacheProfile(uid: string): Promise<UserProfile | null> {
      try {
        const { data: profile, error } = await supabase
          .from("users").select("*").eq("id", uid).maybeSingle();
        if (error || !profile) return null;

        let avatarUrl = profile.avatar_url;
        if (!avatarUrl) {
          try {
            const { data: au } = await supabase.auth.getUser();
            const m = au.user?.user_metadata;
            avatarUrl = m?.avatar_url ?? m?.picture ?? null;
            if (avatarUrl) supabase.from("users").update({ avatar_url: avatarUrl }).eq("id", uid).then(() => {});
          } catch (_) {}
        }
        const p = { ...(profile as UserProfile), avatar_url: avatarUrl };
        await cacheProfile(p); // Save to Preferences for next cold start
        return p;
      } catch (_) { return null; }
    }

    // ── Main startup flow ─────────────────────────────────────────────────────
    async function init() {
      const safety = setTimeout(() => {
        if (!cancelled && !initDone.current) { setLoading(false); initDone.current = true; }
      }, 20000);

      try {
        // ── STEP 1: Try to show cached profile INSTANTLY (no network) ──────
        const cachedProfile = await getCachedProfile();
        const cachedAt = await prefsGet("sh_at");
        const cachedRt = await prefsGet("sh_rt");

        if (cachedProfile && cachedRt) {
          // Restore session from Preferences tokens
          if (cachedAt && cachedRt) {
            try {
              await Promise.race([
                supabase.auth.setSession({ access_token: cachedAt, refresh_token: cachedRt }),
                new Promise<void>(r => setTimeout(r, 8000)),
              ]);
            } catch (_) {}
          }

          // CRITICAL: Call getUser() to force any pending token refresh to complete.
          // Without this, page queries queue behind an in-progress refresh and hang forever.
          let sessionVerified = false;
          try {
            const userResult = await Promise.race([
              supabase.auth.getUser(),
              new Promise<null>(r => setTimeout(() => r(null), 8000)),
            ]);
            sessionVerified = !!(userResult && "data" in userResult && userResult.data.user);
          } catch (_) {}

          if (cancelled) { clearTimeout(safety); return; }

          if (!sessionVerified) {
            // Session couldn't be verified (refresh token expired or no network)
            // Clear stale cache and show login
            await clearSession();
            setUserState(null); setNeedsOnboarding(false);
            setAuthUserId(null); setLoading(false);
            initDone.current = true;
            clearTimeout(safety);
            setupListener();
            return;
          }

          // Session verified and fully ready — show dashboard
          setUserState(cachedProfile);
          setAuthUserId(cachedProfile.id);
          setNeedsOnboarding(false);
          setLoading(false);
          initDone.current = true;
          clearTimeout(safety);

          // Silently refresh profile from DB in background
          setTimeout(async () => {
            if (cancelled) return;
            const fresh = await fetchAndCacheProfile(cachedProfile.id);
            if (fresh && !cancelled) {
              setUserState(fresh);
              setAuthUserId(fresh.id);
            }
          }, 500);

          setupListener();
          return;
        }

        // ── STEP 3: No cache. Check localStorage session (fresh install) ──
        let session: Session | null = null;
        const { data: sd } = await supabase.auth.getSession();
        session = sd.session;

        // ── STEP 4: Try Preferences tokens if localStorage is empty ────────
        if (!session && cachedRt && cachedAt) {
          try {
            const result = await Promise.race([
              supabase.auth.setSession({ access_token: cachedAt, refresh_token: cachedRt }),
              new Promise<null>(r => setTimeout(() => r(null), 10000)),
            ]);
            if (result && "data" in result) session = result.data?.session ?? null;
            if (session) await saveSession(session);
          } catch (_) {}
        }

        if (cancelled) { clearTimeout(safety); return; }

        if (session?.user) {
          setAuthUserId(session.user.id);
          const profile = await fetchAndCacheProfile(session.user.id);
          if (cancelled) { clearTimeout(safety); return; }
          if (profile) {
            setUserState(profile);
            setNeedsOnboarding(false);
          } else {
            setNeedsOnboarding(true); // new user, no profile yet
          }
          setLoading(false);
          initDone.current = true;
          clearTimeout(safety);
          setupListener();
          return;
        }

        // ── STEP 5: Check launch URL for OAuth code ─────────────────────────
        let isNative = false;
        try { const { Capacitor } = await import("@capacitor/core"); isNative = Capacitor.isNativePlatform(); } catch (_) {}

        if (isNative) {
          try {
            const { App } = await import("@capacitor/app");
            const launch = await App.getLaunchUrl();
            if (launch?.url?.includes("code=")) {
              const code = new URL(launch.url).searchParams.get("code");
              if (code) {
                const lastCode = await prefsGet("sh_lc");
                if (lastCode !== code) {
                  await prefsSet("sh_lc", code);
                  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                  if (!error && data.session) {
                    await saveSession(data.session);
                    const profile = await fetchAndCacheProfile(data.session.user.id);
                    if (!cancelled && profile) {
                      setUserState(profile);
                      setAuthUserId(data.session.user.id);
                      setNeedsOnboarding(false);
                      setLoading(false);
                      initDone.current = true;
                      clearTimeout(safety);
                      setupListener();
                      return;
                    }
                  }
                }
                try { const { Browser } = await import("@capacitor/browser"); await Browser.close(); } catch (_) {}
              }
            }
          } catch (_) {}
        }

        // ── STEP 6: Truly no session ─────────────────────────────────────────
        if (!cancelled) {
          setUserState(null); setNeedsOnboarding(false);
          setAuthUserId(null); setLoading(false);
        }
        setupListener();

      } catch (err) {
        console.error("init error:", err);
        if (!cancelled) { setUserState(null); setNeedsOnboarding(false); setAuthUserId(null); setLoading(false); }
        setupListener();
      } finally {
        initDone.current = true;
        clearTimeout(safety);
      }
    }

    // ── Deep link listener for live OAuth callbacks ───────────────────────────
    function setupListener() {
      (async () => {
        try {
          const { Capacitor } = await import("@capacitor/core");
          if (!Capacitor.isNativePlatform()) return;
          const { App } = await import("@capacitor/app");
          if (capAppListener) return; // already set up
          capAppListener = await App.addListener("appUrlOpen", async (e) => {
            if (!e.url.includes("code=")) return;
            const code = new URL(e.url).searchParams.get("code");
            if (!code) return;
            const lastCode = await prefsGet("sh_lc");
            if (lastCode === code) return;
            await prefsSet("sh_lc", code);

            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error && data.session) {
              await saveSession(data.session);
              const profile = await fetchAndCacheProfile(data.session.user.id);
              if (profile && !cancelled) {
                setUserState(profile);
                setAuthUserId(data.session.user.id);
                setNeedsOnboarding(false);
                setLoading(false);
              }
            }
            try { const { Browser } = await import("@capacitor/browser"); await Browser.close(); } catch (_) {}
          });
        } catch (_) {}
      })();
    }

    // Set up listener immediately (so fresh login never gets stuck)
    setupListener();
    init();

    // ── Auth state changes ────────────────────────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_IN" && session?.user) {
        await saveSession(session);
        const profile = await fetchAndCacheProfile(session.user.id);
        if (profile && !cancelled) {
          setUserState(profile); setAuthUserId(session.user.id); setNeedsOnboarding(false); setLoading(false);
        } else if (!cancelled) {
          setAuthUserId(session.user.id); setNeedsOnboarding(true); setLoading(false);
        }
      } else if (event === "TOKEN_REFRESHED" && session) {
        await saveSession(session);
      } else if (event === "SIGNED_OUT") {
        if (!initDone.current) return;
        await clearSession();
        if (!cancelled) { setUserState(null); setNeedsOnboarding(false); setAuthUserId(null); setLoading(false); }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      capAppListener?.remove?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await clearSession();
    await createClient().auth.signOut();
    setUserState(null); setNeedsOnboarding(false); setAuthUserId(null); setLoading(false);
  }

  return (
    <AuthContext.Provider value={{ user: userState, loading, needsOnboarding, authUserId, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
