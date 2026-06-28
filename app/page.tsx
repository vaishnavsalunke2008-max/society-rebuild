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
    if (needsOnboarding) router.replace("/onboarding");
    else if (user) router.replace(user.role === "admin" ? "/admin/updates" : "/dashboard/updates");
    else router.replace("/login");
  }, [loading, needsOnboarding, user, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--bg)" }}>
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30"
        style={{ background: "linear-gradient(135deg, var(--primary), #4f46e5)" }}
      >
        <Building2 size={32} className="text-white" />
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
