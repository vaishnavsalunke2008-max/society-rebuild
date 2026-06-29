"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Building2 } from "lucide-react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      router.replace("/login?error=oauth");
      return;
    }

    if (!code) {
      router.replace("/login?error=oauth");
      return;
    }

    // Exchange code on the CLIENT — stores session in localStorage
    // which createBrowserClient always reads correctly
    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
      if (exchangeError) {
        console.error("Exchange error:", exchangeError);
        router.replace("/login?error=oauth");
      } else {
        // Small delay to ensure session is persisted before redirect
        setTimeout(() => router.replace("/"), 100);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
        style={{ background: "linear-gradient(135deg, var(--primary), #4f46e5)" }}
      >
        <Building2 size={32} className="text-white" />
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
        Signing you in…
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
          <Building2 size={32} style={{ color: "var(--primary)" }} className="animate-pulse" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
