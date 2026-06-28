"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Building2 } from "lucide-react";

export default function RootPage() {
  const { user, loading, needsOnboarding } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (needsOnboarding) {
      router.replace("/onboarding");
    } else if (user) {
      router.replace(user.role === "admin" ? "/admin/updates" : "/dashboard/updates");
    }
  }, [loading, needsOnboarding, user, router]);

  // Show a splash screen while resolving
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--bg)" }}>
      <div className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30 animate-pulse">
        <Building2 size={32} className="text-white" />
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>SocietyHub</p>
    </div>
  );
}
