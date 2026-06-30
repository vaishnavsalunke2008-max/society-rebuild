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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

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

    async function loadProfile(uid: string, authUser?: Session["user"]) {
      if (cancelled) return;
      setAuthUserId(uid);
      try {
        const result = await withTimeout(
          Promise.resolve(supabase.from("users").select("*").eq("id", uid).maybeSingle()),
          12000
        );

        if (cancelled) return;

        if (!result) {
          // Network timeout — don't assume anything, go to login
          setUserState(null);
          setNeedsOnboarding(false);
          setAuthUserId(null);
          return;
        }

        const { data: profile, error } = result;
        if (error) {
          console.error("Profile load error:", error);
          setUserState(null);
          setNeedsOnboarding(false);
          setAuthUserId(null);
          return;
        }

        if (profile) {
          // Fix: if avatar_url missing in DB, pull it from Google auth metadata and update
          let avatarUrl = profile.avatar_url;
          if (!avatarUrl && authUser?.user_metadata?.avatar_url) {
            avatarUrl = authUser.user_metadata.avatar_url;
            // Update DB silently
            supabase.from("users")
              .update({ avatar_url: avatarUrl })
              .eq("id", uid)
              .then(() => {});
          } else if (!avatarUrl) {
            // Fetch from supabase auth in case we didn't receive authUser
            const { data: au } = await supabase.auth.getUser();
            if (au.user?.user_metadata?.avatar_url) {
              avatarUrl = au.user.user_metadata.avatar_url;
              supabase.from("users")
                .update({ avatar_url: avatarUrl })
                .eq("id", uid)
                .then(() => {});
            }
          }

          setUserState({ ...(profile as UserProfile), avatar_url: avatarUrl });
          setNeedsOnboarding(false);
        } else {
          // Genuinely no profile row → new user needs onboarding
          setUserState(null);
          setNeedsOnboarding(true);
        }
      } catch (err) {
        console.error("Profile exception:", err);
        setUserState(null);
        setNeedsOnboarding(false);
        setAuthUserId(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function getValidSession(): Promise<Session | null> {
      // Try getSession up to 3 times with short pauses (Capacitor storage needs time on cold start)
      for (let attempt = 1; attempt <= 3; attempt++) {
        const result = await withTimeout(supabase.auth.getSession(), 7000);
        if (result?.data.session) return result.data.session;

        // Also try refreshSession which forces a token read from storage
        const refresh = await withTimeout(supabase.auth.refreshSession(), 7000);
        if (refresh?.data.session) return refresh.data.session;

        if (attempt < 3) await new Promise(r => setTimeout(r, 1500));
      }
      return null;
    }

    async function init() {
      const safetyTimer = setTimeout(() => {
        if (!cancelled) {
          console.warn("Auth init safety timeout");
          setLoading(false);
        }
      }, 30000);

      try {
        let isNative = false;
        try {
          const { Capacitor } = await import("@capacitor/core");
          isNative = Capacitor.isNativePlatform();
        } catch (e) {}

        // ── STEP 1: Try to restore existing session FIRST (before touching any URL) ──
        const session = await getValidSession();

        if (cancelled) { clearTimeout(safetyTimer); return; }

        if (session?.user) {
          // Session restored successfully — go straight to dashboard
          await loadProfile(session.user.id, session.user);
          clearTimeout(safetyTimer);
          setupDeepLinkListener(isNative);
          return;
        }

        // ── STEP 2: No session. Check if we just came back from OAuth (launch URL has code) ──
        let oauthSession: Session | null = null;
        if (isNative) {
          try {
            const { App } = await import("@capacitor/app");
            const launchResult = await withTimeout(App.getLaunchUrl(), 3000);
            const url = launchResult?.url ?? "";

            if (url.includes("code=")) {
              const code = new URL(url).searchParams.get("code");
              if (code) {
                let isStale = false;
                try {
                  const { Preferences } = await import("@capacitor/preferences");
                  const { value } = await Preferences.get({ key: "last_used_code" });
                  if (value === code) isStale = true;
                } catch (e) {}

                if (!isStale) {
                  // Mark used BEFORE the exchange attempt (no matter if it fails)
                  try {
                    const { Preferences } = await import("@capacitor/preferences");
                    await Preferences.set({ key: "last_used_code", value: code });
                  } catch (e) {}

                  const exchanged = await withTimeout(
                    supabase.auth.exchangeCodeForSession(code), 12000
                  );
                  if (exchanged?.data.session) {
                    oauthSession = exchanged.data.session;
                  } else {
                    console.error("Code exchange failed:", exchanged?.error?.message);
                  }
                }

                try {
                  const { Browser } = await import("@capacitor/browser");
                  await Browser.close();
                } catch (e) {}
              }
            }
          } catch (e) {
            console.error("Launch URL handling error:", e);
          }
        }

        if (cancelled) { clearTimeout(safetyTimer); return; }

        if (oauthSession?.user) {
          await loadProfile(oauthSession.user.id, oauthSession.user);
        } else {
          // Truly no session — show login
          setUserState(null);
          setNeedsOnboarding(false);
          setAuthUserId(null);
          setLoading(false);
        }

        setupDeepLinkListener(isNative);
      } catch (err) {
        console.error("Init exception:", err);
        if (!cancelled) {
          setUserState(null);
          setNeedsOnboarding(false);
          setAuthUserId(null);
          setLoading(false);
        }
      } finally {
        clearTimeout(safetyTimer);
      }
    }

    async function setupDeepLinkListener(isNative: boolean) {
      if (!isNative) return;
      try {
        const { App } = await import("@capacitor/app");
        capAppListener = await App.addListener("appUrlOpen", async (event) => {
          if (!event.url.includes("code=")) return;
          const code = new URL(event.url).searchParams.get("code");
          if (!code) return;

          let isStale = false;
          try {
            const { Preferences } = await import("@capacitor/preferences");
            const { value } = await Preferences.get({ key: "last_used_code" });
            if (value === code) isStale = true;
          } catch (e) {}

          if (isStale) return;

          // Check if we already have a session (appUrlOpen can fire on resume)
          const current = await withTimeout(supabase.auth.getSession(), 5000);
          if (current?.data.session?.user) {
            if (!userState) await loadProfile(current.data.session.user.id, current.data.session.user);
            return;
          }

          // Mark used and exchange
          try {
            const { Preferences } = await import("@capacitor/preferences");
            await Preferences.set({ key: "last_used_code", value: code });
          } catch (e) {}

          const exchanged = await withTimeout(supabase.auth.exchangeCodeForSession(code), 12000);
          if (exchanged?.data.session?.user) {
            await loadProfile(exchanged.data.session.user.id, exchanged.data.session.user);
          }

          try {
            const { Browser } = await import("@capacitor/browser");
            await Browser.close();
          } catch (e) {}
        });
      } catch (e) {
        console.error("Deep link listener error:", e);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;
        if (event === "SIGNED_IN" && session?.user) {
          await loadProfile(session.user.id, session.user);
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          if (!userState) await loadProfile(session.user.id, session.user);
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
