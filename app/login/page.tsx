"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const supabase = createClient();

  async function signInWithGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });
    if (error) {
      console.error("OAuth error:", error);
      setLoading(false);
    }
    // No need to set loading false on success — page will redirect
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "var(--bg)" }}
    >
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--primary)" }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "var(--primary)" }}
        />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-3 mb-10"
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
          style={{ background: "linear-gradient(135deg, var(--primary), #4f46e5)" }}
        >
          <Building2 size={38} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
            SocietyHub
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Smart apartment management
          </p>
        </div>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-sm glass rounded-3xl p-7 space-y-6"
      >
        <div className="text-center">
          <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            Welcome back
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Sign in to your society account
          </p>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-xl text-sm text-center"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
          >
            Sign-in failed. Please try again.
          </motion.div>
        )}

        {/* Google Button */}
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:scale-100"
          style={{
            background: "var(--surface-2)",
            color: "var(--text)",
            border: "1px solid var(--border)",
          }}
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--primary)" }} />
          ) : (
            /* Google logo SVG */
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          First time? You&apos;ll set up your flat details after signing in.
        </p>
      </motion.div>

      {/* Features preview */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 flex items-center gap-6"
      >
        {["📢 Notices", "🏘️ Community", "💬 Chat"].map((f) => (
          <span key={f} className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {f}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
