"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, needsOnboarding } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (needsOnboarding) router.replace("/onboarding");
    else if (user?.role === "admin") router.replace("/admin/updates");
  }, [loading, needsOnboarding, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} />
      </div>
    );
  }

  if (!user) return null;

  return <AppShell role="resident">{children}</AppShell>;
}
