"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Building2, Loader2 } from "lucide-react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // Hard failsafe — never stuck more than 8 seconds
    const giveUp = setTimeout(() => {
      router.replace("/");
    }, 8000);

    if (error || !code) {
      clearTimeout(giveUp);
      router.replace("/login?error=oauth");
      return;
    }

    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code)
      .then(({ error: exchangeError }) => {
        clearTimeout(giveUp);
        if (exchangeError) {
          console.error("Exchange error:", exchangeError.message);
          // If exchange fails, try navigating to / anyway — 
          // onAuthStateChange might still pick up a valid session
          router.replace("/");
        } else {
          router.replace("/");
        }
      })
      .catch((err) => {
        clearTimeout(giveUp);
        console.error("Exchange threw:", err);
        router.replace("/");
      });

    return () => clearTimeout(giveUp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-5"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
        style={{ background: "linear-gradient(135deg, var(--primary), #4f46e5)" }}
      >
        <Building2 size={32} className="text-white" />
      </div>
      <Loader2 size={24} className="animate-spin" style={{ color: "var(--primary)" }} />
      <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
        Completing sign-in…
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--primary)" }} />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
