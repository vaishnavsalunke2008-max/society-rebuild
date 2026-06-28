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

  // Wrapped setUser — always clears needsOnboarding when a real user is set
  function setUser(u: UserProfile | null) {
    setUserState(u);
    if (u !== null) setNeedsOnboarding(false);
  }

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile(uid: string) {
      setAuthUserId(uid);
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      if (profile) {
        setUserState(profile as UserProfile);
        setNeedsOnboarding(false);
      } else {
        setUserState(null);
        setNeedsOnboarding(true);
      }
      setLoading(false);
    }

    // Use onAuthStateChange with INITIAL_SESSION — more reliable than getSession()
    // Supabase fires INITIAL_SESSION on mount with the current session or null
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "INITIAL_SESSION") {
          if (session?.user) {
            await loadProfile(session.user.id);
          } else {
            setLoading(false);
          }
        } else if (event === "SIGNED_IN" && session?.user) {
          await loadProfile(session.user.id);
        } else if (event === "SIGNED_OUT") {
          setUserState(null);
          setNeedsOnboarding(false);
          setAuthUserId(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
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
