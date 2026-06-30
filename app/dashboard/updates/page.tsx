"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, ChevronRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { timeAgo } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import Image from "next/image";

type Notice = {
  id: string;
  title: string;
  body: string;
  category: string;
  image_url: string | null;
  created_at: string;
  users: { full_name: string } | null;
};

const categoryConfig: Record<string, { label: string; cls: string }> = {
  urgent: { label: "Urgent", cls: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" },
  event: { label: "Event", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
  maintenance: { label: "Maintenance", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
  general: { label: "General", cls: "bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400" },
};

export default function UpdatesPage() {
  const { t } = useLanguage();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("notices")
      .select("*, users(full_name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setNotices((data as Notice[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="page-enter p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--primary-glow)" }}>
          <Bell size={20} style={{ color: "var(--primary)" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>{t("updates.title")}</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("updates.subtitle")}</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} />
        </div>
      )}

      {/* Empty State */}
      {!loading && notices.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
            <Bell size={28} style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="font-semibold" style={{ color: "var(--text)" }}>{t("updates.empty")}</p>
          <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
            {t("updates.emptySub")}
          </p>
        </div>
      )}

      {/* Notice Cards */}
      {notices.map((notice, i) => {
        const cat = categoryConfig[notice.category] || categoryConfig.general;
        return (
          <motion.div
            key={notice.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl overflow-hidden cursor-pointer"
            onClick={() => {
              setExpandedIds((prev) => {
                const next = new Set(prev);
                if (next.has(notice.id)) next.delete(notice.id);
                else next.add(notice.id);
                return next;
              });
            }}
          >
            {notice.image_url && (
              <div className="relative w-full h-40">
                <Image src={notice.image_url} alt={notice.title} fill className="object-cover" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cat.cls}`}>
                  {cat.label}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {timeAgo(notice.created_at)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-sm leading-snug mb-1" style={{ color: "var(--text)" }}>
                    {notice.title}
                  </h2>
                  <p className={expandedIds.has(notice.id) ? "text-sm whitespace-pre-wrap mt-1" : "text-sm line-clamp-2 mt-1"} style={{ color: "var(--text-muted)" }}>
                    {notice.body}
                  </p>
                  {notice.users?.full_name && (
                    <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                      — {notice.users.full_name}
                    </p>
                  )}
                </div>
                <ChevronRight 
                  size={16} 
                  style={{ color: "var(--text-muted)", transform: expandedIds.has(notice.id) ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} 
                  className="flex-shrink-0 mt-0.5" 
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
