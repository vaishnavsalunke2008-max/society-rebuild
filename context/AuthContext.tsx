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

async function saveTokens(session: Session) {
  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key: "sh_rt", value: session.refresh_token ?? "" });
    await Preferences.set({ key: "sh_at", value: session.access_token });
  } catch (_) {}
}

async function clearTokens() {
  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.remove({ key: "sh_rt" });
    await Preferences.remove({ key: "sh_at" });
  } catch (_) {}
}

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

    // ── Profile fetch with automatic retry (handles cold-start network delays) ──
    async function loadProfile(uid: string) {
      if (cancelled) return;
      setAuthUserId(uid);

      const MAX_ATTEMPTS = 5;
      const RETRY_DELAY_MS = 2000;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        if (cancelled) return;
        try {
          const { data: profile, error } = await supabase
            .from("users").select("*").eq("id", uid).maybeSingle();

          if (cancelled) return;
          if (error) {
            console.warn(`loadProfile attempt ${attempt} error:`, error.message);
            if (attempt < MAX_ATTEMPTS) {
              await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
              continue;
            }
            // All attempts failed — stop loading, keep authUserId so layout doesn't redirect to login
            // User will see blank screen; safety timer will stop loading
            setUserState(null);
            setNeedsOnboarding(false);
            break;
          }

          if (profile) {
            let avatarUrl = profile.avatar_url;
            if (!avatarUrl) {
              try {
                const { data: au } = await supabase.auth.getUser();
                const m = au.user?.user_metadata;
                avatarUrl = m?.avatar_url ?? m?.picture ?? null;
                if (avatarUrl) supabase.from("users").update({ avatar_url: avatarUrl }).eq("id", uid).then(() => {});
              } catch (_) {}
            }
            setUserState({ ...(profile as UserProfile), avatar_url: avatarUrl });
            setNeedsOnboarding(false);
          } else {
            setUserState(null);
            setNeedsOnboarding(true); // Genuine new user
          }
          break; // success
        } catch (e) {
          console.warn(`loadProfile attempt ${attempt} exception:`, e);
          if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        }
      }

      if (!cancelled) setLoading(false);
    }

    // ── Exchange OAuth code (marks it used before attempting to prevent stale reuse) ──
    async function exchangeCode(code: string): Promise<Session | null> {
      try {
        const { Preferences } = await import("@capacitor/preferences");
        const { value: last } = await Preferences.get({ key: "sh_lc" });
        if (last === code) return null;
        await Preferences.set({ key: "sh_lc", value: code });
      } catch (_) {}
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) { console.error("Code exchange error:", error.message); return null; }
      if (data.session) await saveTokens(data.session);
      return data.session;
    }

    // ── Handle OAuth deep-link URL ─────────────────────────────────────────────
    async function handleDeepLink(url: string) {
      if (!url.includes("code=")) return;
      const code = new URL(url).searchParams.get("code");
      if (!code) return;
      const { data: cur } = await supabase.auth.getSession();
      if (cur.session?.user) {
        try { const { Browser } = await import("@capacitor/browser"); await Browser.close(); } catch (_) {}
        if (!userState) await loadProfile(cur.session.user.id);
        return;
      }
      const session = await exchangeCode(code);
      if (session?.user) await loadProfile(session.user.id);
      try { const { Browser } = await import("@capacitor/browser"); await Browser.close(); } catch (_) {}
    }

    // ── Register deep-link listener IMMEDIATELY so fresh logins never get stuck ──
    async function setupListener() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
        const { App } = await import("@capacitor/app");
        capAppListener = await App.addListener("appUrlOpen", e => handleDeepLink(e.url));
      } catch (e) { console.error("listener:", e); }
    }
    setupListener(); // fire and forget — doesn't block init

    // ── Main init ─────────────────────────────────────────────────────────────
    async function init() {
      const safety = setTimeout(() => {
        if (!cancelled && !initDone.current) { setLoading(false); initDone.current = true; }
      }, 30000);

      try {
        let isNative = false;
        try {
          const { Capacitor } = await import("@capacitor/core");
          isNative = Capacitor.isNativePlatform();
        } catch (_) {}

        // Give Android network stack 800ms to initialize on cold start
        if (isNative) await new Promise(r => setTimeout(r, 800));
        if (cancelled) { clearTimeout(safety); return; }

        // ── 1. Try localStorage session (fastest path) ──────────────────────
        let session: Session | null = null;
        const { data: sd } = await supabase.auth.getSession();
        session = sd.session;

        // ── 2. No localStorage session — try Preferences backup ─────────────
        if (!session && isNative) {
          try {
            const { Preferences } = await import("@capacitor/preferences");
            const { value: rt } = await Preferences.get({ key: "sh_rt" });
            const { value: at } = await Preferences.get({ key: "sh_at" });
            if (rt && at) {
              console.log("Restoring session from Preferences...");
              const result = await Promise.race([
                supabase.auth.setSession({ access_token: at, refresh_token: rt }),
                new Promise<null>(r => setTimeout(() => r(null), 12000)),
              ]);
              const restored = result && "data" in result ? result.data?.session : null;
              if (restored) {
                session = restored;
                await saveTokens(session);
                console.log("Session restored from Preferences ✓");
              } else {
                console.warn("Preferences restore failed or timed out");
              }
            }
          } catch (e) { console.warn("Prefs read error:", e); }
        }

        if (cancelled) { clearTimeout(safety); return; }

        // ── 3. Have session → load profile (with retries) ───────────────────
        if (session?.user) {
          await loadProfile(session.user.id);
          initDone.current = true;
          clearTimeout(safety);
          return;
        }

        // ── 4. No session — check launch URL for fresh OAuth code ────────────
        if (isNative) {
          try {
            const { App } = await import("@capacitor/app");
            const launch = await App.getLaunchUrl();
            if (launch?.url?.includes("code=")) {
              const code = new URL(launch.url).searchParams.get("code");
              if (code) {
                const fresh = await exchangeCode(code);
                if (fresh?.user) {
                  await loadProfile(fresh.user.id);
                  initDone.current = true;
                  clearTimeout(safety);
                  return;
                }
              }
            }
          } catch (_) {}
        }

        // ── 5. Truly no session → show login ────────────────────────────────
        if (!cancelled) {
          setUserState(null); setNeedsOnboarding(false);
          setAuthUserId(null); setLoading(false);
        }
      } catch (err) {
        console.error("init error:", err);
        if (!cancelled) {
          setUserState(null); setNeedsOnboarding(false);
          setAuthUserId(null); setLoading(false);
        }
      } finally {
        initDone.current = true;
        clearTimeout(safety);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_IN" && session?.user) {
        await saveTokens(session);
        await loadProfile(session.user.id);
      } else if (event === "TOKEN_REFRESHED" && session) {
        await saveTokens(session);
      } else if (event === "SIGNED_OUT") {
        if (!initDone.current) return;
        await clearTokens();
        if (!cancelled) {
          setUserState(null); setNeedsOnboarding(false);
          setAuthUserId(null); setLoading(false);
        }
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
    await clearTokens();
    await createClient().auth.signOut();
    setUserState(null); setNeedsOnboarding(false);
    setAuthUserId(null); setLoading(false);
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
