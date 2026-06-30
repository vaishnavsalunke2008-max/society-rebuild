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
  user: null,
  loading: true,
  needsOnboarding: false,
  authUserId: null,
  setUser: () => {},
  signOut: async () => {},
});

// Save tokens to native Preferences after every successful login
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

    // ── Load user profile from DB ─────────────────────────────────────────────
    async function loadProfile(uid: string) {
      if (cancelled) return;
      setAuthUserId(uid);
      try {
        const { data: profile, error } = await supabase
          .from("users").select("*").eq("id", uid).maybeSingle();
        if (cancelled) return;
        if (error) throw error;
        if (profile) {
          let avatarUrl = profile.avatar_url;
          if (!avatarUrl) {
            try {
              const { data: au } = await supabase.auth.getUser();
              const m = au.user?.user_metadata;
              avatarUrl = m?.avatar_url ?? m?.picture ?? null;
              if (avatarUrl)
                supabase.from("users").update({ avatar_url: avatarUrl }).eq("id", uid).then(() => {});
            } catch (_) {}
          }
          setUserState({ ...(profile as UserProfile), avatar_url: avatarUrl });
          setNeedsOnboarding(false);
        } else {
          setUserState(null);
          setNeedsOnboarding(true);
        }
      } catch (err) {
        console.error("loadProfile:", err);
        setUserState(null);
        setNeedsOnboarding(false);
        setAuthUserId(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // ── Exchange OAuth code, mark it as used ──────────────────────────────────
    async function exchangeCode(code: string): Promise<Session | null> {
      try {
        const { Preferences } = await import("@capacitor/preferences");
        const { value: last } = await Preferences.get({ key: "sh_lc" });
        if (last === code) return null; // already used
        await Preferences.set({ key: "sh_lc", value: code }); // mark used first
      } catch (_) {}
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) { console.error("exchange:", error.message); return null; }
      if (data.session) await saveTokens(data.session);
      return data.session;
    }

    // ── Deep-link handler (used by both init and live listener) ───────────────
    async function handleDeepLink(url: string) {
      if (!url.includes("code=")) return;
      const code = new URL(url).searchParams.get("code");
      if (!code) return;

      // If already logged in, just ensure profile is loaded
      const { data: cur } = await supabase.auth.getSession();
      if (cur.session?.user) {
        if (!userState) await loadProfile(cur.session.user.id);
        try { const { Browser } = await import("@capacitor/browser"); await Browser.close(); } catch (_) {}
        return;
      }

      const session = await exchangeCode(code);
      if (session?.user) await loadProfile(session.user.id);
      try { const { Browser } = await import("@capacitor/browser"); await Browser.close(); } catch (_) {}
    }

    // ── Set up native deep-link listener IMMEDIATELY ──────────────────────────
    async function setupListener() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
        const { App } = await import("@capacitor/app");
        capAppListener = await App.addListener("appUrlOpen", (e) => handleDeepLink(e.url));
      } catch (e) { console.error("listener setup:", e); }
    }
    setupListener(); // ← runs immediately, doesn't block init

    // ── Main init ─────────────────────────────────────────────────────────────
    async function init() {
      const safety = setTimeout(() => {
        if (!cancelled && !initDone.current) {
          setLoading(false);
          initDone.current = true;
        }
      }, 15000);

      try {
        let isNative = false;
        try {
          const { Capacitor } = await import("@capacitor/core");
          isNative = Capacitor.isNativePlatform();
        } catch (_) {}

        // Step 1: Try localStorage session (fast, works if localStorage survived)
        let session: Session | null = null;
        const { data: sd } = await supabase.auth.getSession();
        session = sd.session;

        // Step 2: If no session on native, restore from our Preferences backup
        if (!session && isNative) {
          try {
            const { Preferences } = await import("@capacitor/preferences");
            const { value: rt } = await Preferences.get({ key: "sh_rt" });
            const { value: at } = await Preferences.get({ key: "sh_at" });
            if (rt && at) {
              // setSession uses the refresh token if the access token is expired
              const result = await Promise.race([
                supabase.auth.setSession({ access_token: at, refresh_token: rt }),
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000)),
              ]);
              const restoredSession = result && "data" in result ? result.data.session : null;
              if (restoredSession) {
                session = restoredSession;
                await saveTokens(session); // keep Preferences up to date with refreshed tokens
              }
            }
          } catch (e) {
            console.warn("Prefs restore failed:", e);
          }
        }

        if (cancelled) { clearTimeout(safety); return; }

        if (session?.user) {
          await loadProfile(session.user.id);
          initDone.current = true;
          clearTimeout(safety);
          return;
        }

        // Step 3: No session — check launch URL for fresh OAuth code
        if (isNative) {
          try {
            const { App } = await import("@capacitor/app");
            const launch = await App.getLaunchUrl();
            if (launch?.url?.includes("code=")) {
              const fresh = await exchangeCode(new URL(launch.url).searchParams.get("code")!);
              if (fresh?.user) {
                await loadProfile(fresh.user.id);
                initDone.current = true;
                clearTimeout(safety);
                return;
              }
            }
          } catch (_) {}
        }

        // Step 4: Truly no session
        if (!cancelled) {
          setUserState(null);
          setNeedsOnboarding(false);
          setAuthUserId(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("init error:", err);
        if (!cancelled) {
          setUserState(null);
          setNeedsOnboarding(false);
          setAuthUserId(null);
          setLoading(false);
        }
      } finally {
        initDone.current = true;
        clearTimeout(safety);
      }
    }

    init();

    // ── Auth state changes ─────────────────────────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_IN" && session?.user) {
        await saveTokens(session);
        await loadProfile(session.user.id);
      } else if (event === "TOKEN_REFRESHED" && session) {
        await saveTokens(session);
      } else if (event === "SIGNED_OUT") {
        if (!initDone.current) return; // ignore during init
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
