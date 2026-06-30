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

// Helper: race a promise against a timeout
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

    async function loadProfile(uid: string) {
      if (cancelled) return;
      try {
        setAuthUserId(uid);

        // Try up to 2 times with increasing timeouts (network may not be ready on cold start)
        let profile = null;
        let fetchError = null;
        for (let attempt = 1; attempt <= 2; attempt++) {
          const timeout = attempt === 1 ? 8000 : 15000;
          const result = await withTimeout(
            Promise.resolve(supabase.from("users").select("*").eq("id", uid).maybeSingle()),
            timeout
          );

          if (cancelled) return;

          if (!result) {
            // Timed out — wait a moment and retry
            console.warn(`Profile fetch attempt ${attempt} timed out, ${attempt < 2 ? "retrying..." : "giving up"}`);
            if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
            continue;
          }

          if (result.error) {
            fetchError = result.error;
            break;
          }

          profile = result.data;
          break;
        }

        if (cancelled) return;

        if (fetchError) {
          console.error("Profile load error:", fetchError);
          // Don't send to onboarding on error — go to login
          setUserState(null);
          setNeedsOnboarding(false);
          setAuthUserId(null);
          return;
        }

        if (profile) {
          setUserState(profile as UserProfile);
          setNeedsOnboarding(false);
        } else {
          // Truly no profile row — this is a real new user
          setUserState(null);
          setNeedsOnboarding(true);
        }
      } catch (err) {
        console.error("Profile exception:", err);
        // On unexpected error, go to login, not onboarding
        setUserState(null);
        setNeedsOnboarding(false);
        setAuthUserId(null);
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

      const result = await withTimeout(
        supabase.auth.exchangeCodeForSession(code),
        10000
      );
      if (!result || result.error) {
        console.error("Code exchange failed:", result?.error?.message ?? "timeout");
        return false;
      }
      return true;
    }

    async function init() {
      // Hard safety net: if init takes >20s, stop the loading spinner
      const safetyTimer = setTimeout(() => {
        if (!cancelled) {
          console.warn("Auth init safety timeout fired");
          setLoading(false);
        }
      }, 20000);

      try {
        let isNative = false;
        let launchUrl: string | null = null;

        // Step 1: Check if native and grab launch URL
        try {
          const { Capacitor } = await import("@capacitor/core");
          if (Capacitor.isNativePlatform()) {
            isNative = true;
            const { App } = await import("@capacitor/app");
            const result = await withTimeout(App.getLaunchUrl(), 3000);
            if (result?.url) launchUrl = result.url;
          }
        } catch (e) {}

        // Step 2: Handle launch URL code BEFORE checking session
        if (launchUrl && launchUrl.includes("code=")) {
          try {
            const urlObj = new URL(launchUrl);
            const code = urlObj.searchParams.get("code");
            if (code) {
              let isStale = false;
              try {
                const { Preferences } = await import("@capacitor/preferences");
                const { value } = await Preferences.get({ key: "last_used_code" });
                if (value === code) isStale = true;
              } catch (e) {}

              if (!isStale) {
                // Only exchange if we genuinely don't have a session
                const existing = await withTimeout(supabase.auth.getSession(), 5000);
                if (!existing?.data.session) {
                  await tryExchangeCode(code);
                }
              }

              try {
                const { Browser } = await import("@capacitor/browser");
                await Browser.close();
              } catch (e) {}
            }
          } catch (e) {
            console.error("Launch URL handling error:", e);
          }
        }

        if (cancelled) { clearTimeout(safetyTimer); return; }

        // Step 3: Read session — should be valid now
        let session = null;
        try {
          const result = await withTimeout(supabase.auth.getSession(), 8000);
          session = result?.data.session ?? null;
        } catch (e) {}

        // Step 4: If still no session on native, try refreshing
        if (!session && isNative) {
          try {
            const result = await withTimeout(supabase.auth.refreshSession(), 8000);
            session = result?.data.session ?? null;
          } catch (e) {}
        }

        if (cancelled) { clearTimeout(safetyTimer); return; }

        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setUserState(null);
          setNeedsOnboarding(false);
          setAuthUserId(null);
          setLoading(false);
        }

        // Step 5: Live deep link listener
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
                const current = await withTimeout(supabase.auth.getSession(), 5000);
                if (!current?.data.session) {
                  const ok = await tryExchangeCode(code);
                  if (ok) {
                    const after = await withTimeout(supabase.auth.getSession(), 5000);
                    if (after?.data.session?.user) await loadProfile(after.data.session.user.id);
                  }
                } else if (current.data.session?.user) {
                  if (!userState) await loadProfile(current.data.session.user.id);
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
      } finally {
        clearTimeout(safetyTimer);
      }
    }

    init();

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;
        if (event === "SIGNED_IN" && session?.user) {
          await loadProfile(session.user.id);
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
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
