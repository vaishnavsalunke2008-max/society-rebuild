"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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

// ── Preferences helpers ──────────────────────────────────────────────────────
// We manually back up access_token + refresh_token to Capacitor Preferences
// so they survive Android WebView localStorage wipes between app restarts.

async function saveTokensToPrefs(session: Session) {
  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key: "sh_access_token", value: session.access_token });
    await Preferences.set({ key: "sh_refresh_token", value: session.refresh_token ?? "" });
  } catch (e) {
    console.warn("saveTokensToPrefs failed:", e);
  }
}

async function clearTokensFromPrefs() {
  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.remove({ key: "sh_access_token" });
    await Preferences.remove({ key: "sh_refresh_token" });
  } catch (e) {}
}

async function restoreSessionFromPrefs(supabase: ReturnType<typeof createClient>): Promise<Session | null> {
  try {
    const { Preferences } = await import("@capacitor/preferences");
    const { value: accessToken } = await Preferences.get({ key: "sh_access_token" });
    const { value: refreshToken } = await Preferences.get({ key: "sh_refresh_token" });
    if (!accessToken || !refreshToken) return null;

    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error || !data.session) return null;
    // Re-save the (potentially refreshed) tokens
    await saveTokensToPrefs(data.session);
    return data.session;
  } catch (e) {
    console.warn("restoreSessionFromPrefs failed:", e);
    return null;
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userState, setUserState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  function setUser(u: UserProfile | null) {
    setUserState(u);
    if (u !== null) setNeedsOnboarding(false);
  }

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let initCompleted = false;
    let capAppListener: any = null;

    async function loadProfile(uid: string) {
      if (cancelled) return;
      setAuthUserId(uid);
      try {
        const { data: profile, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", uid)
          .maybeSingle();

        if (cancelled) return;
        if (error) throw error;

        if (profile) {
          // Fix avatar: if null in DB, pull from Google OAuth metadata
          let avatarUrl = profile.avatar_url;
          if (!avatarUrl) {
            try {
              const { data: au } = await supabase.auth.getUser();
              const meta = au.user?.user_metadata;
              avatarUrl = meta?.avatar_url ?? meta?.picture ?? null;
              if (avatarUrl) {
                supabase.from("users").update({ avatar_url: avatarUrl }).eq("id", uid).then(() => {});
              }
            } catch (e) {}
          }
          setUserState({ ...(profile as UserProfile), avatar_url: avatarUrl });
          setNeedsOnboarding(false);
        } else {
          // No profile row = genuine new user
          setUserState(null);
          setNeedsOnboarding(true);
        }
      } catch (err) {
        console.error("loadProfile error:", err);
        setUserState(null);
        setNeedsOnboarding(false);
        setAuthUserId(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function init() {
      // Hard safety net
      const safetyTimer = setTimeout(() => {
        if (!cancelled && !initCompleted) {
          console.warn("Auth init safety timeout");
          setLoading(false);
          initCompleted = true;
        }
      }, 25000);

      try {
        let isNative = false;
        try {
          const { Capacitor } = await import("@capacitor/core");
          isNative = Capacitor.isNativePlatform();
        } catch (e) {}

        // ── 1. Try Supabase's own session (works if localStorage survived) ──
        let session: Session | null = null;
        const { data: sd } = await supabase.auth.getSession();
        session = sd.session;

        // ── 2. If no session and on native, restore from our Preferences backup ──
        if (!session && isNative) {
          session = await restoreSessionFromPrefs(supabase);
        }

        if (cancelled) { clearTimeout(safetyTimer); return; }

        if (session?.user) {
          await loadProfile(session.user.id);
          initCompleted = true;
          clearTimeout(safetyTimer);
          setupDeepLinkListener(isNative);
          return;
        }

        // ── 3. No session at all. Check launch URL for fresh OAuth code ──
        if (isNative) {
          try {
            const { App } = await import("@capacitor/app");
            const launch = await App.getLaunchUrl();
            if (launch?.url?.includes("code=")) {
              await handleOAuthUrl(launch.url);
              if (cancelled) { clearTimeout(safetyTimer); return; }
              const { data: after } = await supabase.auth.getSession();
              if (after.session?.user) {
                await saveTokensToPrefs(after.session);
                await loadProfile(after.session.user.id);
                initCompleted = true;
                clearTimeout(safetyTimer);
                setupDeepLinkListener(isNative);
                return;
              }
            }
          } catch (e) {}
        }

        // ── 4. Truly no session — show login ──
        if (!cancelled) {
          setUserState(null);
          setNeedsOnboarding(false);
          setAuthUserId(null);
          setLoading(false);
        }
        initCompleted = true;
        setupDeepLinkListener(isNative);

      } catch (err) {
        console.error("Init error:", err);
        if (!cancelled) {
          setUserState(null);
          setNeedsOnboarding(false);
          setAuthUserId(null);
          setLoading(false);
        }
      } finally {
        initCompleted = true;
        clearTimeout(safetyTimer);
      }
    }

    async function handleOAuthUrl(url: string) {
      if (!url.includes("code=")) return;
      const code = new URL(url).searchParams.get("code");
      if (!code) return;

      // Check if already used
      try {
        const { Preferences } = await import("@capacitor/preferences");
        const { value } = await Preferences.get({ key: "sh_last_code" });
        if (value === code) return; // stale
        // Mark used immediately before exchange
        await Preferences.set({ key: "sh_last_code", value: code });
      } catch (e) {}

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) console.error("Code exchange failed:", error.message);

      try {
        const { Browser } = await import("@capacitor/browser");
        await Browser.close();
      } catch (e) {}
    }

    async function setupDeepLinkListener(isNative: boolean) {
      if (!isNative) return;
      try {
        const { App } = await import("@capacitor/app");
        capAppListener = await App.addListener("appUrlOpen", async (event) => {
          if (!event.url.includes("code=")) return;
          const before = await supabase.auth.getSession();
          if (before.data.session?.user) {
            // Already logged in, just make sure profile is loaded
            if (!userState) await loadProfile(before.data.session.user.id);
            return;
          }
          await handleOAuthUrl(event.url);
          const after = await supabase.auth.getSession();
          if (after.data.session?.user) {
            await saveTokensToPrefs(after.data.session);
            await loadProfile(after.data.session.user.id);
          }
        });
      } catch (e) {}
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;
        if (event === "SIGNED_IN" && session?.user) {
          // Save tokens every time user signs in
          await saveTokensToPrefs(session);
          await loadProfile(session.user.id);
        } else if (event === "TOKEN_REFRESHED" && session) {
          // Keep Preferences in sync when token refreshes
          await saveTokensToPrefs(session);
        } else if (event === "SIGNED_OUT") {
          if (!initCompleted) return; // ignore during init retries
          await clearTokensFromPrefs();
          if (!cancelled) {
            setUserState(null);
            setNeedsOnboarding(false);
            setAuthUserId(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      if (capAppListener?.remove) capAppListener.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    const supabase = createClient();
    await clearTokensFromPrefs();
    await supabase.auth.signOut();
    setUserState(null);
    setNeedsOnboarding(false);
    setAuthUserId(null);
    setLoading(false);
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
