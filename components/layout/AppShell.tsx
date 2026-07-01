"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Bell, Users, AlertCircle, CalendarDays, MessageCircle,
  Megaphone, Building2, Menu, X, Sun, Moon,
  ChevronDown, ChevronRight, LogOut, Send, User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getInitials } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/translations";
import { PushToggle } from "@/components/PushToggle";

// ── Navigation config ─────────────────────────────────────────
const residentTabKeys = [
  { key: "nav.updates",    icon: Bell,          href: "/dashboard/updates" },
  { key: "nav.community",  icon: Users,         href: "/dashboard/community" },
  { key: "nav.complaints", icon: AlertCircle,   href: "/dashboard/complaints" },
  { key: "nav.events",     icon: CalendarDays,  href: "/dashboard/events" },
  { key: "nav.chat",       icon: MessageCircle, href: "/dashboard/chat" },
];

const adminTabKeys = [
  { key: "nav.complaints", icon: AlertCircle,   href: "/admin/updates" },
  { key: "nav.community",  icon: Users,         href: "/admin/community" },
  { key: "nav.notices",    icon: Megaphone,     href: "/admin/notices" },
  { key: "nav.events",     icon: CalendarDays,  href: "/admin/events" },
  { key: "nav.messages",   icon: MessageCircle, href: "/admin/messages" },
];

const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English",  native: "English" },
  { code: "hi", label: "Hindi",    native: "हिंदी" },
  { code: "mr", label: "Marathi",  native: "मराठी" },
  { code: "te", label: "Telugu",   native: "తెలుగు" },
  { code: "ta", label: "Tamil",    native: "தமிழ்" },
];

// ── Sidebar ───────────────────────────────────────────────────
function Sidebar({ open, onClose, role }: { open: boolean; onClose: () => void; role: string }) {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
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
                <span className="font-bold text-lg" style={{ color: "var(--text)" }}>SocietyHub</span>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <X size={18} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Dark/Light Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
                <div className="flex items-center gap-3">
                  {theme === "dark" ? <Moon size={18} style={{ color: "var(--primary)" }} /> : <Sun size={18} style={{ color: "var(--primary)" }} />}
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {theme === "dark" ? t("sidebar.darkMode") : t("sidebar.lightMode")}
                  </span>
                </div>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${theme === "dark" ? "bg-primary-500" : "bg-slate-200"}`}
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
              <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface-2)" }}>
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="w-full flex items-center justify-between p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🌐</span>
                    <div className="text-left">
                      <p className="text-sm font-medium leading-none" style={{ color: "var(--text)" }}>
                        {LANGUAGES.find((l) => l.code === lang)?.native || "English"}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {t("sidebar.language")}
                      </p>
                    </div>
                  </div>
                  <ChevronDown size={16} style={{ color: "var(--text-muted)" }}
                    className={`transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-themed"
                    >
                      {LANGUAGES.map((language) => (
                        <button
                          key={language.code}
                          onClick={() => { setLang(language.code); setLangOpen(false); }}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          <div className="text-left">
                            <p className="text-sm" style={{ color: lang === language.code ? "var(--primary)" : "var(--text)", fontWeight: lang === language.code ? "600" : "400" }}>
                              {language.native}
                            </p>
                            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{language.label}</p>
                          </div>
                          {lang === language.code && (
                            <div className="w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Push Notifications */}
              <PushToggle />



              {/* Role info */}
              <div className="p-3 rounded-xl" style={{ background: "var(--primary-glow)", border: "1px solid var(--primary)" }}>
                <p className="text-xs font-medium" style={{ color: "var(--primary)" }}>
                  {t("sidebar.signedAs")} <span className="capitalize">{t(`common.${role}`)}</span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{t("sidebar.switchRole")}</p>
              </div>
            </div>

            {/* Bottom: User Profile Card */}
            <div className="p-4 border-t border-themed">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover shadow-sm flex-shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {getInitials(user?.full_name || "U")}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{user?.full_name}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("common.flat")} {user?.flat_number}</p>
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
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [dropOpen, setDropOpen] = useState(false);
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-14 flex items-center px-4 backdrop-blur-md border-b border-themed" style={{ background: "var(--surface)" }}>
      <button id="sidebar-toggle" onClick={onMenuClick} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors mr-3">
        <Menu size={20} style={{ color: "var(--text)" }} />
      </button>
      <div className="flex-1 flex items-center justify-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
          <Building2 size={14} className="text-white" />
        </div>
        <span className="font-bold text-base" style={{ color: "var(--text)" }}>SocietyHub</span>
      </div>
      <div className="relative">
        <button id="avatar-btn" onClick={() => setDropOpen(!dropOpen)}
          className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-semibold">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            getInitials(user?.full_name || "U")
          )}
        </button>
        <AnimatePresence>
          {dropOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-56 rounded-2xl shadow-xl z-20 overflow-hidden glass"
              >
                <div className="p-4 border-b border-themed">
                  <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{user?.full_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: "var(--primary-glow)", color: "var(--primary)" }}>
                    {t(`common.${user?.role || "resident"}`)}
                  </span>
                </div>
                <button onClick={() => { setDropOpen(false); router.push("/profile"); }} className="w-full flex items-center gap-3 p-3 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: "var(--text-muted)" }}>
                  <User size={16} />{t("avatar.profile")}
                </button>
                <button onClick={async () => { await signOut(); router.replace("/onboarding"); }} className="w-full flex items-center gap-3 p-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                  <LogOut size={16} />{t("avatar.signOut")}
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
function BottomNav({ tabs }: { tabs: typeof residentTabKeys }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 flex items-center justify-between px-1 backdrop-blur-md border-t border-themed bottom-nav-safe"
      style={{ background: "var(--surface)" }}>
      {tabs.map((tab) => {
        const active = isActive(tab.href);
        const label = t(tab.key);
        return (
          <Link key={tab.href} href={tab.href} id={`nav-${tab.key.split(".")[1]}`}
            className="relative flex flex-col items-center justify-center flex-1 h-full min-w-0 gap-1 rounded-xl transition-colors">
            {active && (
              <motion.div layoutId="nav-active" className="absolute inset-1 rounded-xl bg-primary-500/10"
                transition={{ type: "spring", stiffness: 400, damping: 30 }} />
            )}
            <tab.icon size={22} className={active ? "text-primary-500 dark:text-primary-400" : "text-slate-400 dark:text-slate-500"} />
            <span className={`text-[10px] font-medium relative z-10 w-full text-center truncate px-1 ${active ? "text-primary-500 dark:text-primary-400" : "text-slate-400 dark:text-slate-500"}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// ── AppShell ──────────────────────────────────────────────────
export function AppShell({ children, role }: { children: React.ReactNode; role: "resident" | "admin" }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const tabs = role === "admin" ? adminTabKeys : residentTabKeys;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <TopHeader onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} role={role} />
      <main className="pt-14 pb-20 max-w-lg mx-auto min-h-screen">{children}</main>
      <BottomNav tabs={tabs} />
    </div>
  );
}
