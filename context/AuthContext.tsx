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
      settled = true;
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
      // 1. If OAuth code is in URL, exchange it first
      const urlCode = new URLSearchParams(window.location.search).get("code");
      if (urlCode) {
        window.history.replaceState({}, "", "/");
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(urlCode);
          if (!cancelled && !error && data.session) {
            await loadProfile(data.session.user.id);
            return;
          }
        } catch {}
      }

      // 2. Normal init via getSession() - much more reliable than relying on INITIAL_SESSION event
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        finishWithNoSession();
      }
    }

    init();

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
        console.warn("Auth init timed out");
        finishWithNoSession();
      }
    }, 8000);

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
