"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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
    let capAppListener: any = null;

    async function loadProfile(uid: string) {
      if (cancelled) return;
      try {
        setAuthUserId(uid);
        const { data: profile, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", uid)
          .maybeSingle();

        if (cancelled) return;
        if (error) {
          console.error("Profile load error:", error);
          setLoading(false);
          return;
        }
        if (profile) {
          setUserState(profile as UserProfile);
          setNeedsOnboarding(false);
        } else {
          setUserState(null);
          setNeedsOnboarding(true);
        }
      } catch (err) {
        console.error("Profile exception:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function tryExchangeCode(code: string): Promise<boolean> {
      // Mark it used immediately so a stale re-launch never tries it again
      try {
        const { Preferences } = await import("@capacitor/preferences");
        await Preferences.set({ key: "last_used_code", value: code });
      } catch (e) {}

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("Code exchange failed:", error.message);
        return false;
      }
      return true;
    }

    async function init() {
      try {
        let isNative = false;
        let launchUrl: string | null = null;

        // --- Step 1: Check if we're on native and if there's a launch URL ---
        try {
          const { Capacitor } = await import("@capacitor/core");
          if (Capacitor.isNativePlatform()) {
            isNative = true;
            const { App } = await import("@capacitor/app");
            const result = await App.getLaunchUrl();
            if (result?.url) launchUrl = result.url;
          }
        } catch (e) {}

        // --- Step 2: If there's a launch URL with a code, handle it FIRST ---
        if (launchUrl && launchUrl.includes("code=")) {
          const urlObj = new URL(launchUrl);
          const code = urlObj.searchParams.get("code");
          if (code) {
            // Check if code was already used
            let isStale = false;
            try {
              const { Preferences } = await import("@capacitor/preferences");
              const { value } = await Preferences.get({ key: "last_used_code" });
              if (value === code) isStale = true;
            } catch (e) {}

            if (!isStale) {
              // Only exchange if we don't already have a valid session
              const { data: existing } = await supabase.auth.getSession();
              if (!existing.session) {
                await tryExchangeCode(code);
              }
            }

            try {
              const { Browser } = await import("@capacitor/browser");
              await Browser.close();
            } catch (e) {}
          }
        }

        // --- Step 3: Now read the session (which will be valid if exchange worked or was already saved) ---
        if (cancelled) return;

        // On native: try to restore from refresh token if getSession returns null
        let { data: { session }, error } = await supabase.auth.getSession();

        if (!session && isNative) {
          // Supabase might need a refreshSession call to pick up the stored token
          const { data: refreshed } = await supabase.auth.refreshSession();
          if (refreshed.session) session = refreshed.session;
        }

        if (cancelled) return;
        if (error) {
          console.error("Session error:", error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setUserState(null);
          setNeedsOnboarding(false);
          setAuthUserId(null);
          setLoading(false);
        }

        // --- Step 4: Set up live deep link listener for while app is running ---
        if (isNative) {
          try {
            const { App } = await import("@capacitor/app");
            capAppListener = await App.addListener("appUrlOpen", async (event) => {
              if (!event.url.includes("code=")) return;
              const urlObj = new URL(event.url);
              const code = urlObj.searchParams.get("code");
              if (!code) return;

              let isStale = false;
              try {
                const { Preferences } = await import("@capacitor/preferences");
                const { value } = await Preferences.get({ key: "last_used_code" });
                if (value === code) isStale = true;
              } catch (e) {}

              if (!isStale) {
                const { data: current } = await supabase.auth.getSession();
                if (!current.session) {
                  const ok = await tryExchangeCode(code);
                  if (ok) {
                    const { data: { session: s } } = await supabase.auth.getSession();
                    if (s?.user) await loadProfile(s.user.id);
                  }
                } else if (current.session?.user) {
                  await loadProfile(current.session.user.id);
                }
              }

              try {
                const { Browser } = await import("@capacitor/browser");
                await Browser.close();
              } catch (e) {}
            });
          } catch (e) {}
        }

      } catch (err) {
        console.error("Init exception:", err);
        if (!cancelled) {
          setUserState(null);
          setNeedsOnboarding(false);
          setAuthUserId(null);
          setLoading(false);
        }
      }
    }

    init();

    // Listen for auth state changes (token refresh, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;
        if (event === "SIGNED_IN" && session?.user) {
          await loadProfile(session.user.id);
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          // Session refreshed successfully, make sure profile is set
          if (!userState) await loadProfile(session.user.id);
        } else if (event === "SIGNED_OUT") {
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
      if (capAppListener && typeof capAppListener.remove === "function") {
        capAppListener.remove();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    const supabase = createClient();
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
