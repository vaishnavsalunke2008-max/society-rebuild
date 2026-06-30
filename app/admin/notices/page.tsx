"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Plus, X, Loader2, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { timeAgo, uploadImage } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";
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

const CATEGORIES = ["general", "urgent", "event", "maintenance"] as const;
const categoryConfig: Record<string, { label: string; cls: string }> = {
  urgent: { label: "Urgent", cls: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" },
  event: { label: "Event", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
  maintenance: { label: "Maintenance", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
  general: { label: "General", cls: "bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400" },
};

export default function AdminNoticesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [category, setCategory] = useState<string>("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function loadNotices() {
    const { data } = await supabase
      .from("notices")
      .select("*, users(full_name)")
      .order("created_at", { ascending: false });
    setNotices((data as Notice[]) || []);
    setLoading(false);
  }

  useEffect(() => { loadNotices(); }, []);

  async function handlePublish() {
    if (!title.trim() || !body.trim() || !user) return;
    setSubmitting(true);
    try {
      let image_url: string | null = null;
      if (imageFile) image_url = await uploadImage(supabase, imageFile, user.id);
      const { error } = await supabase.from("notices").insert({
        title: title.trim(), body: body.trim(), category, image_url, created_by: user.id,
      });
      if (error) throw error;
      toast.success("Notice published!");
      setTitle(""); setBody(""); setCategory("general");
      setImageFile(null); setImagePreview(null); setFormOpen(false);
      loadNotices();
    } catch { toast.error("Failed to publish"); }
    setSubmitting(false);
  }

  async function deleteNotice(id: string) {
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) { toast.error("Delete failed"); return; }
    toast.success("Notice deleted");
    setNotices((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="page-enter p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10">
            <Megaphone size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>{t("admin.notices.title")}</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("admin.notices.subtitle")}</p>
          </div>
        </div>
        <button
          onClick={() => setFormOpen(!formOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
        >
          <Plus size={16} /> {t("admin.notices.new")}
        </button>
      </div>

      <AnimatePresence>
        {formOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="glass rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>{t("admin.notices.new")}</h3>
              {/* Category Pills */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const cfg = categoryConfig[cat];
                  return (
                    <button key={cat} onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        category === cat ? cfg.cls + " border-current" : "border-themed text-themed hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                      style={category !== cat ? { border: "1px solid var(--border)" } : {}}>
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("admin.notices.title2")}
                className="w-full text-sm rounded-xl p-3 outline-none"
                style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }} />
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={t("admin.notices.body")} rows={4}
                className="w-full text-sm rounded-xl p-3 resize-none outline-none"
                style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }} />
              {imagePreview && (
                <div className="relative w-full h-32 rounded-xl overflow-hidden">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
                    <X size={12} className="text-white" />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between">
                <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                  <ImageIcon size={16} /> {t("admin.notices.image")}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />
                <button onClick={handlePublish} disabled={submitting || !title.trim() || !body.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />}
                  {t("admin.notices.publish")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} /></div>}

      {!loading && notices.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}><Megaphone size={28} style={{ color: "var(--text-muted)" }} /></div>
          <p className="font-semibold" style={{ color: "var(--text)" }}>{t("admin.notices.empty")}</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("admin.notices.emptySub")}</p>
        </div>
      )}

      {notices.map((n, i) => {
        const cat = categoryConfig[n.category] || categoryConfig.general;
        return (
          <motion.div key={n.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl overflow-hidden group cursor-pointer"
            onClick={() => {
              setExpandedIds((prev) => {
                const next = new Set(prev);
                if (next.has(n.id)) next.delete(n.id);
                else next.add(n.id);
                return next;
              });
            }}
          >
            {n.image_url && (
              <div className="relative w-full h-36">
                <Image src={n.image_url} alt={n.title} fill className="object-cover" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cat.cls}`}>{cat.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{timeAgo(n.created_at)}</span>
                  <button onClick={() => deleteNotice(n.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                    <X size={14} />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>{n.title}</h3>
              <p className={expandedIds.has(n.id) ? "text-sm whitespace-pre-wrap" : "text-sm line-clamp-3"} style={{ color: "var(--text-muted)" }}>{n.body}</p>
              {n.users?.full_name && (
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>— {n.users.full_name}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
