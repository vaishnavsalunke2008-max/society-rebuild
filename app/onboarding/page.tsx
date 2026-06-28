"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, User, Hash, Lock, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const ADMIN_CODE = process.env.NEXT_PUBLIC_ADMIN_CODE || "ADMIN@2026";

const ROLES = [
  {
    value: "resident",
    label: "Resident",
    emoji: "🏠",
    desc: "I live in this society",
    flatRequired: true,
  },
  {
    value: "security",
    label: "Security Guard",
    emoji: "🛡️",
    desc: "I manage security at the gate",
    flatRequired: false,
  },
  {
    value: "admin",
    label: "Admin / Secretary",
    emoji: "👔",
    desc: "I manage the society",
    flatRequired: true,
  },
];

export default function OnboardingPage() {
  const { authUserId, setUser } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<"resident" | "admin" | "security">("resident");
  const [fullName, setFullName] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedRole = ROLES.find((r) => r.value === role)!;

  // Pre-fill name from Google account
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata;
      if (meta?.full_name) setFullName(meta.full_name);
      else if (meta?.name) setFullName(meta.name);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit() {
    if (!fullName.trim()) return toast.error("Please enter your name");
    if (selectedRole.flatRequired && !flatNumber.trim()) return toast.error("Please enter your flat number");
    if (role === "admin" && adminCode !== ADMIN_CODE) return toast.error("Invalid admin code");
    if (!authUserId) return toast.error("Auth error — please refresh");

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const profile = {
        id: authUserId,
        email: userData.user?.email ?? null,
        full_name: fullName.trim(),
        flat_number: flatNumber.trim().toUpperCase() || "—",
        role,
        avatar_url: userData.user?.user_metadata?.avatar_url ?? null,
      };

      const { error } = await supabase.from("users").upsert(profile);
      if (error) throw error;

      setUser({ ...profile, role });
      toast.success("Welcome to SocietyHub! 🎉");
      router.replace(role === "admin" ? "/admin/updates" : "/dashboard/updates");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create profile. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "var(--primary)" }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ background: "var(--primary)" }} />
      </div>

      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, var(--primary), #4f46e5)" }}>
          <Building2 size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>SocietyHub</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Smart apartment management</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="w-full max-w-sm glass rounded-3xl p-6 space-y-5">

        {/* Step header */}
        <div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--primary-glow)", color: "var(--primary)" }}>
            Step {step} of 2
          </span>
          <h2 className="text-xl font-bold mt-2" style={{ color: "var(--text)" }}>
            {step === 1 ? "Who are you?" : "Your details"}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {step === 1 ? "Select your role in the society" : "Fill in your information"}
          </p>
        </div>

        {/* Step 1: Role selection */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-2.5">
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value as typeof role)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all"
                style={{
                  background: role === r.value ? "var(--primary-glow)" : "var(--surface-2)",
                  borderColor: role === r.value ? "var(--primary)" : "transparent",
                }}
              >
                <span className="text-2xl">{r.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{r.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{r.desc}</p>
                </div>
                {role === r.value && <CheckCircle size={18} style={{ color: "var(--primary)" }} />}
              </button>
            ))}

            <button
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-semibold text-sm"
              style={{ background: "var(--primary)" }}
            >
              Continue <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {/* Step 2: Profile details */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">

            {/* Role badge */}
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
              <span className="text-xl">{selectedRole.emoji}</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{selectedRole.label}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{selectedRole.desc}</p>
              </div>
            </div>

            {/* Full Name */}
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
            </div>

            {/* Flat Number — optional for security */}
            <div className="relative">
              <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                placeholder={selectedRole.flatRequired ? "Flat number (e.g. A-101)" : "Flat number (optional)"}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
            </div>
            {!selectedRole.flatRequired && (
              <p className="text-xs px-1" style={{ color: "var(--text-muted)" }}>
                Flat number is optional for security staff
              </p>
            )}

            {/* Admin code */}
            {role === "admin" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                <input
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="Admin access code"
                  type="password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
                />
              </motion.div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={() => setStep(1)} className="px-4 py-3 rounded-xl text-sm font-medium"
                style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !fullName.trim() || (selectedRole.flatRequired && !flatNumber.trim())}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
                style={{ background: "var(--primary)" }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {submitting ? "Setting up..." : "Enter SocietyHub"}
              </button>
            </div>
          </motion.div>
        )}

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {[1, 2].map((s) => (
            <div key={s} className="rounded-full transition-all duration-300"
              style={{ width: step === s ? "20px" : "6px", height: "6px", background: step === s ? "var(--primary)" : "var(--border)" }} />
          ))}
        </div>
      </motion.div>

      <p className="text-xs mt-6" style={{ color: "var(--text-muted)" }}>
        Your data is stored securely in Supabase
      </p>
    </div>
  );
}
