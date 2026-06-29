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
  const [initialized, setInitialized] = useState(false);

  // Wrapped setUser — always clears needsOnboarding when a real user is set
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
      setInitialized(true);
    }

    function finishWithNoSession() {
      if (cancelled) return;
      setUserState(null);
      setNeedsOnboarding(false);
      setAuthUserId(null);
      setLoading(false);
      setInitialized(true);
    }

    // Primary: getSession() — immediate, reliable across all Next.js versions
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (initialized || cancelled) return;
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        finishWithNoSession();
      }
    });

    // Secondary: onAuthStateChange handles sign-in/out events after init
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

    // Hard fallback — if nothing resolves in 4s, stop the spinner
    const fallback = setTimeout(() => {
      if (!initialized && !cancelled) {
        console.warn("Auth init timed out — defaulting to logged-out state");
        finishWithNoSession();
      }
    }, 4000);

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
