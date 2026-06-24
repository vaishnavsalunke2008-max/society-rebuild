"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Bell,
  Users,
  AlertCircle,
  CalendarDays,
  MessageCircle,
  Megaphone,
  Building2,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  ChevronRight,
  LogOut,
  Send,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getInitials } from "@/lib/utils";

// ── Navigation config ─────────────────────────────────────────
const residentTabs = [
  { label: "Updates", icon: Bell, href: "/dashboard/updates" },
  { label: "Community", icon: Users, href: "/dashboard/community" },
  { label: "Complaints", icon: AlertCircle, href: "/dashboard/complaints" },
  { label: "Events", icon: CalendarDays, href: "/dashboard/events" },
  { label: "Chat", icon: MessageCircle, href: "/dashboard/chat" },
];

const adminTabs = [
  { label: "Complaints", icon: AlertCircle, href: "/admin/updates" },
  { label: "Community", icon: Users, href: "/admin/community" },
  { label: "Notices", icon: Megaphone, href: "/admin/notices" },
  { label: "Events", icon: CalendarDays, href: "/admin/events" },
  { label: "Messages", icon: MessageCircle, href: "/admin/messages" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "mr", label: "मराठी" },
  { code: "te", label: "తెలుగు" },
  { code: "ta", label: "தமிழ்" },
];

// ── Avatar component ──────────────────────────────────────────
function Avatar({
  name,
  size = 32,
  gradient = "from-primary-500 to-primary-700",
}: {
  name: string;
  size?: number;
  gradient?: string;
}) {
  return (
    <div
      className={`bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {getInitials(name)}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────
function Sidebar({
  open,
  onClose,
  role,
}: {
  open: boolean;
  onClose: () => void;
  role: string;
}) {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-72 z-50 flex flex-col"
            style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-themed">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                  <Building2 size={16} className="text-white" />
                </div>
                <span className="font-bold text-lg" style={{ color: "var(--text)" }}>
                  SocietyHub
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X size={18} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Dark/Light Toggle */}
              <div
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "var(--surface-2)" }}
              >
                <div className="flex items-center gap-3">
                  {theme === "dark" ? (
                    <Moon size={18} style={{ color: "var(--primary)" }} />
                  ) : (
                    <Sun size={18} style={{ color: "var(--primary)" }} />
                  )}
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {theme === "dark" ? "Dark Mode" : "Light Mode"}
                  </span>
                </div>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                    theme === "dark" ? "bg-primary-500" : "bg-slate-200"
                  }`}
                >
                  <motion.div
                    layout
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
                    animate={{ left: theme === "dark" ? "calc(100% - 22px)" : "2px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Language Selector */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ background: "var(--surface-2)" }}
              >
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="w-full flex items-center justify-between p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🌐</span>
                    <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {LANGUAGES.find((l) => l.code === selectedLang)?.label || "English"}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    style={{ color: "var(--text-muted)" }}
                    className={`transition-transform ${langOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-themed"
                    >
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setSelectedLang(lang.code);
                            setLangOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          style={{
                            color: selectedLang === lang.code ? "var(--primary)" : "var(--text)",
                            fontWeight: selectedLang === lang.code ? "600" : "400",
                          }}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Send Feedback */}
              <button
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ background: "var(--surface-2)" }}
              >
                <Send size={18} style={{ color: "var(--primary)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  Send Feedback
                </span>
              </button>

              {/* Role info */}
              <div
                className="p-3 rounded-xl"
                style={{ background: "var(--primary-glow)", border: "1px solid var(--primary)" }}
              >
                <p className="text-xs font-medium" style={{ color: "var(--primary)" }}>
                  Signed in as{" "}
                  <span className="capitalize">{role}</span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Switch role in AuthContext.tsx
                </p>
              </div>
            </div>

            {/* Bottom: User Profile Card */}
            <div className="p-4 border-t border-themed">
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "var(--surface-2)" }}
              >
                <Avatar name={user?.full_name || "User"} size={40} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                    {user?.full_name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Flat {user?.flat_number}
                  </p>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Top Header ────────────────────────────────────────────────
function TopHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();
  const [dropOpen, setDropOpen] = useState(false);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-30 h-14 flex items-center px-4 backdrop-blur-md border-b border-themed"
      style={{ background: "rgba(var(--surface), 0.95)" }}
    >
      {/* Hamburger */}
      <button
        id="sidebar-toggle"
        onClick={onMenuClick}
        className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors mr-3"
      >
        <Menu size={20} style={{ color: "var(--text)" }} />
      </button>

      {/* Logo */}
      <div className="flex-1 flex items-center justify-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
          <Building2 size={14} className="text-white" />
        </div>
        <span className="font-bold text-base" style={{ color: "var(--text)" }}>
          SocietyHub
        </span>
      </div>

      {/* Avatar Dropdown */}
      <div className="relative">
        <button
          id="avatar-btn"
          onClick={() => setDropOpen(!dropOpen)}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-semibold"
        >
          {getInitials(user?.full_name || "U")}
        </button>
        <AnimatePresence>
          {dropOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-56 rounded-2xl shadow-xl z-20 overflow-hidden glass"
              >
                <div className="p-4 border-b border-themed">
                  <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                    {user?.full_name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {user?.email}
                  </p>
                  <span
                    className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                    style={{
                      background: "var(--primary-glow)",
                      color: "var(--primary)",
                    }}
                  >
                    {user?.role}
                  </span>
                </div>
                <button
                  className="w-full flex items-center gap-3 p-3 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  <User size={16} />
                  Profile
                </button>
                <button
                  className="w-full flex items-center gap-3 p-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

// ── Bottom Nav ────────────────────────────────────────────────
function BottomNav({ tabs }: { tabs: typeof residentTabs }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === pathname) return true;
    if (pathname.startsWith(href + "/")) return true;
    return false;
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 h-16 flex items-center justify-around px-2 backdrop-blur-md border-t border-themed bottom-nav-safe"
      style={{ background: "rgba(var(--surface), 0.97)" }}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            id={`nav-${tab.label.toLowerCase()}`}
            className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors"
          >
            {active && (
              <motion.div
                layoutId="nav-active"
                className="absolute inset-0 rounded-xl bg-primary-500/10"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <tab.icon
              size={22}
              className={active ? "text-primary-500 dark:text-primary-400" : "text-slate-400 dark:text-slate-500"}
            />
            <span
              className={`text-[10px] font-medium relative z-10 ${
                active
                  ? "text-primary-500 dark:text-primary-400"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// ── AppShell ──────────────────────────────────────────────────
export function AppShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: "resident" | "admin";
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const tabs = role === "admin" ? adminTabs : residentTabs;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <TopHeader onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={role}
      />
      <main className="pt-14 pb-20 max-w-lg mx-auto min-h-screen">
        {children}
      </main>
      <BottomNav tabs={tabs} />
    </div>
  );
}
