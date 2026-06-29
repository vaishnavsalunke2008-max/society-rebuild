"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User, Hash, Mail, Camera, Save, Loader2, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getInitials } from "@/lib/utils";
import Image from "next/image";
import toast from "react-hot-toast";
import { PushToggle } from "@/components/PushToggle";

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  admin:    { label: "Admin",          color: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400" },
  resident: { label: "Resident",       color: "bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400" },
  security: { label: "Security Guard", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
};

export default function ProfilePage() {
  const { user, setUser, signOut } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [flatNumber, setFlatNumber] = useState(user?.flat_number === "—" ? "" : user?.flat_number || "");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const badge = ROLE_BADGE[user?.role || "resident"];
  const hasChanges = fullName !== user?.full_name || flatNumber !== (user?.flat_number === "—" ? "" : user?.flat_number);

  async function handleSave() {
    if (!user || !fullName.trim()) return toast.error("Name cannot be empty");
    setSaving(true);
    try {
      const updates = {
        full_name: fullName.trim(),
        flat_number: flatNumber.trim().toUpperCase() || "—",
      };
      const { error } = await supabase.from("users").update(updates).eq("id", user.id);
      if (error) throw error;
      setUser({ ...user, ...updates });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 h-14 backdrop-blur-md border-b border-themed" style={{ background: "var(--surface)" }}>
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="font-bold text-base" style={{ color: "var(--text)" }}>Profile</h1>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4 pb-10">
        {/* Avatar card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 flex flex-col items-center gap-3">
          <div className="relative">
            {user.avatar_url ? (
              <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-primary-500/30">
                <Image src={user.avatar_url} alt={user.full_name} width={96} height={96} className="object-cover w-full h-full" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-primary-500/30">
                {getInitials(user.full_name)}
              </div>
            )}
            {/* Avatar hint */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shadow-md">
              <Camera size={14} className="text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg" style={{ color: "var(--text)" }}>{user.full_name}</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{user.email || "No email linked"}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
            {badge.label}
          </span>
        </motion.div>

        {/* Edit form */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass rounded-3xl p-5 space-y-4">
          <h2 className="font-semibold text-sm" style={{ color: "var(--text)" }}>Edit Details</h2>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Full Name</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
            </div>
          </div>

          {/* Flat */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Flat Number {user.role === "security" && <span style={{ color: "var(--text-muted)" }}>(optional)</span>}
            </label>
            <div className="relative">
              <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                placeholder={user.role === "security" ? "Not applicable" : "e.g. A-101"}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Email (from Google)</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                value={user.email || "—"}
                readOnly
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none opacity-60 cursor-not-allowed"
                style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
            </div>
            <p className="text-xs px-1" style={{ color: "var(--text-muted)" }}>Change email via your Google account</p>
          </div>

          {/* Role (read-only) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Role</label>
            <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <Shield size={15} style={{ color: "var(--text-muted)" }} />
              <span className="text-sm" style={{ color: "var(--text)" }}>{badge.label}</span>
              <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>Contact admin to change</span>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-semibold text-sm disabled:opacity-40 transition-opacity"
            style={{ background: "var(--primary)" }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="glass rounded-3xl p-5 space-y-3">
          <h2 className="font-semibold text-sm" style={{ color: "var(--text)" }}>Notifications</h2>
          <PushToggle />
          <p className="text-xs px-1" style={{ color: "var(--text-muted)" }}>
            Receive alerts when notices are published or your complaint status changes.
          </p>
        </motion.div>

        {/* Sign out */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-red-500 font-semibold text-sm border transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
            style={{ border: "1px solid rgba(239,68,68,0.3)" }}
          >
            {signingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
            {signingOut ? "Signing out..." : "Sign Out"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
