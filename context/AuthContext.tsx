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
    let settled = false;

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
          settled = true;
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
        setLoading(false);
        settled = true;
      }
    }

    function finishWithNoSession() {
      if (cancelled || settled) return;
      setUserState(null);
      setNeedsOnboarding(false);
      setAuthUserId(null);
      setLoading(false);
      settled = true;
    }

    async function init() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Clear OAuth code from URL so refreshing the page doesn't re-trigger a used code (which logs the user out)
        if (typeof window !== "undefined" && window.location.search.includes("code=")) {
          window.history.replaceState({}, "", window.location.pathname);
        }

        if (cancelled) return;
        if (error) {
          console.error("Session error:", error);
          finishWithNoSession();
          return;
        }
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          finishWithNoSession();
        }
      } catch (err) {
        console.error("Init exception:", err);
        finishWithNoSession();
      }
    }

    init();

    // Setup deep link listener for Capacitor OAuth
    let capAppListener: any = null;
    async function setupDeepLinkListener() {
      if (typeof window !== "undefined") {
        try {
          const { Capacitor } = await import("@capacitor/core");
          if (Capacitor.isNativePlatform()) {
            const { App } = await import("@capacitor/app");

            const handleUrl = async (urlStr: string) => {
              // Handle PKCE Flow
              if (urlStr.includes("code=")) {
                const urlObj = new URL(urlStr);
                const code = urlObj.searchParams.get("code");
                if (code) {
                  let isStale = false;
                  try {
                    const { Preferences } = await import("@capacitor/preferences");
                    const { value } = await Preferences.get({ key: "last_used_code" });
                    if (value === code) isStale = true;
                  } catch (e) {}

                  if (isStale) {
                    console.log("Ignoring stale OAuth code from cached intent");
                  } else {
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) {
                      console.error("Login Error:", error.message);
                    } else {
                      try {
                        const { Preferences } = await import("@capacitor/preferences");
                        await Preferences.set({ key: "last_used_code", value: code });
                      } catch (e) {}
                      
                      const { data: { session } } = await supabase.auth.getSession();
                      if (session?.user) {
                        await loadProfile(session.user.id);
                      }
                    }
                  }
                  try {
                    const { Browser } = await import("@capacitor/browser");
                    await Browser.close();
                  } catch (e) {}
                }
              } 
              // Handle Implicit Flow
              else if (urlStr.includes("#access_token=")) {
                const hashFragment = urlStr.split("#")[1];
                const params = new URLSearchParams(hashFragment);
                const accessToken = params.get("access_token");
                const refreshToken = params.get("refresh_token");
                if (accessToken && refreshToken) {
                  const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                  });
                  if (error) alert("Login Error: " + error.message);
                  if (!error) {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) {
                      await loadProfile(session.user.id);
                    }
                  }
                  try {
                    const { Browser } = await import("@capacitor/browser");
                    await Browser.close();
                  } catch (e) {}
                }
              }
            };

            // Check if app was just cold-launched by the OAuth deep link
            const launchUrl = await App.getLaunchUrl();
            if (launchUrl?.url) {
              await handleUrl(launchUrl.url);
            }

            // Listen for deep link if app is already running
            capAppListener = await App.addListener("appUrlOpen", async (event) => {
              await handleUrl(event.url);
            });
          }
        } catch (e) {
          console.error("Capacitor appUrlOpen error:", e);
        }
      }
    }
    setupDeepLinkListener();

    // 3. Listen for live events (like user clicking sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;

        if (event === "SIGNED_IN" && session?.user) {
          await loadProfile(session.user.id);
        } else if (event === "SIGNED_OUT") {
          // Double check before kicking out (avoids token refresh bugs kicking user out)
          if (!settled) finishWithNoSession();
          else {
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
              settled = false;
              finishWithNoSession();
            }
          }
        }
      }
    );

    const fallback = setTimeout(() => {
      if (!settled && !cancelled) {
        console.warn("Auth init timed out after 15s");
        finishWithNoSession();
      }
    }, 15000);

    return () => {
      cancelled = true;
      clearTimeout(fallback);
      subscription.unsubscribe();
      if (capAppListener && typeof capAppListener.remove === 'function') {
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
