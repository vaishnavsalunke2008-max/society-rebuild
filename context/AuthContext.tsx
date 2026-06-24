"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  flat_number: string;
  role: "resident" | "admin" | "security";
  avatar_url: string | null;
};

const MOCK_PROFILE: UserProfile = {
  id: "dev-user-001",
  email: "resident@societyhub.dev",
  full_name: "Dev User",
  flat_number: "A-101",
  role: "resident",
  avatar_url: null,
};

type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
  setUser: (u: UserProfile | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: MOCK_PROFILE,
  loading: false,
  setUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(MOCK_PROFILE);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // Try to upgrade to real session if available
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (data) {
          setUser(data as UserProfile);
        }
      }
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
