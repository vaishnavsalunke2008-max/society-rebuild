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

    async function loadProfile(uid: string) {
      if (cancelled) return;
      setAuthUserId(uid);
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", uid)
        .maybeSingle();
      if (cancelled) return;
      if (profile) {
        setUserState(profile as UserProfile);
        setNeedsOnboarding(false);
      } else {
        setUserState(null);
        setNeedsOnboarding(true);
      }
      setLoading(false);
    }

    function finishWithNoSession() {
      if (cancelled) return;
      setUserState(null);
      setNeedsOnboarding(false);
      setAuthUserId(null);
      setLoading(false);
    }

    async function init() {
      // 1. Check for OAuth code in the URL (PKCE callback lands here)
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        // Clean the URL immediately so it doesn't get re-processed
        window.history.replaceState({}, "", "/");
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!cancelled && !error && data.session) {
            await loadProfile(data.session.user.id);
          } else {
            await fallbackGetSession();
          }
        } catch {
          await fallbackGetSession();
        }
        return;
      }

      // 2. Normal session check
      await fallbackGetSession();
    }

    async function fallbackGetSession() {
      if (cancelled) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        finishWithNoSession();
      }
    }

    // Live auth events after init (sign-in / sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;
        if (event === "SIGNED_IN" && session?.user) {
          await loadProfile(session.user.id);
        } else if (event === "SIGNED_OUT") {
          finishWithNoSession();
        }
      }
    );

    // Hard fallback — never stuck more than 6 seconds
    const fallback = setTimeout(() => {
      if (!cancelled) {
        console.warn("Auth init timed out");
        finishWithNoSession();
      }
    }, 6000);

    init();

    return () => {
      cancelled = true;
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserState(null);
    setNeedsOnboarding(false);
    setAuthUserId(null);
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
