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
    // Tracks whether we've already settled auth so SIGNED_OUT
    // from stale token refresh doesn't kick out a freshly logged-in user
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
      if (cancelled || settled) return; // never clear a live session
      setUserState(null);
      setNeedsOnboarding(false);
      setAuthUserId(null);
      setLoading(false);
      settled = true;
    }

    // ── Step 1: If there's a ?code= in the URL this is an OAuth return.
    //    Exchange it and let SIGNED_IN event do the rest.
    const urlCode = new URLSearchParams(window.location.search).get("code");
    if (urlCode) {
      window.history.replaceState({}, "", "/");
      supabase.auth.exchangeCodeForSession(urlCode).catch(() => {
        // exchange failed — fall through to INITIAL_SESSION handler below
      });
    }

    // ── Step 2: onAuthStateChange is the single source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;

        if (event === "INITIAL_SESSION") {
          if (session?.user) {
            await loadProfile(session.user.id);
          } else if (!urlCode) {
            // No code being exchanged → truly logged out
            finishWithNoSession();
          }
          // If urlCode present, wait for SIGNED_IN from the exchange
        } else if (event === "SIGNED_IN" && session?.user) {
          await loadProfile(session.user.id);
        } else if (event === "SIGNED_OUT") {
          // Only honour SIGNED_OUT if we triggered it ourselves (via signOut())
          // spontaneous SIGNED_OUT (e.g. from token refresh race) is ignored
          // if user is already settled
          if (!settled) finishWithNoSession();
          else {
            // Check if this is real: re-fetch session
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
              settled = false;
              finishWithNoSession();
            }
          }
        }
      }
    );

    // ── Step 3: Hard timeout fallback
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
