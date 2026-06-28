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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function initSession() {
      try {
        // 1. Check for existing session first
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          await loadOrOnboard(supabase, session.user.id);
        } else {
          // 2. No session — sign in anonymously (works now that it's enabled)
          const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();

          if (anonError || !anonData.session?.user) {
            console.error("Anonymous sign-in failed:", anonError);
            setLoading(false);
            return;
          }

          await loadOrOnboard(supabase, anonData.session.user.id);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        setLoading(false);
      }
    }

    async function loadOrOnboard(supabase: ReturnType<typeof createClient>, uid: string) {
      setAuthUserId(uid);

      // Check if this user has a profile yet
      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      if (error) {
        console.error("Profile fetch error:", error);
      }

      if (profile) {
        // Existing user — load their profile
        setUser(profile as UserProfile);
        setNeedsOnboarding(false);
      } else {
        // New user — they need to go through onboarding
        setNeedsOnboarding(true);
        setUser(null);
      }

      setLoading(false);
    }

    initSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile) {
          setUser(profile as UserProfile);
          setNeedsOnboarding(false);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setNeedsOnboarding(false);
        setAuthUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setNeedsOnboarding(false);
    setAuthUserId(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, needsOnboarding, authUserId, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
