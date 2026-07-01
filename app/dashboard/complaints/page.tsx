"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Plus,
  CheckCircle,
  Clock,
  ImageIcon,
  X,
  Loader2,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { statusColor, timeAgo, uploadImage } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";
import Image from "next/image";

type Complaint = {
  id: string;
  category: string;
  title: string;
  description: string;
  image_url: string | null;
  status: "pending" | "in_progress" | "resolved";
  created_at: string;
};

const CATEGORIES = [
  "Plumbing", "Electrical", "Lift", "Parking",
  "Security", "Cleanliness", "Noise", "Other",
];

export default function ComplaintsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function loadComplaints() {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("complaints")
        .select("*")
        .eq("submitted_by", user.id)
        .order("created_at", { ascending: false });
      setComplaints((data as Complaint[]) || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadComplaints(); }, [user]);

  async function handleSubmit() {
    if (!category || !title.trim() || !description.trim() || !user) return;
    setSubmitting(true);
    try {
      let image_url: string | null = null;
      if (imageFile) image_url = await uploadImage(supabase, imageFile, user.id);
      const { error } = await supabase.from("complaints").insert({
        submitted_by: user.id,
        category,
        title: title.trim(),
        description: description.trim(),
        image_url,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Complaint submitted!");
      setCategory(""); setTitle(""); setDescription("");
      setImageFile(null); setImagePreview(null); setFormOpen(false);
      loadComplaints();
    } catch {
      toast.error("Failed to submit. Try again.");
    }
    setSubmitting(false);
  }

  const StatusIcon = ({ status }: { status: string }) =>
    status === "resolved" ? (
      <CheckCircle size={14} />
    ) : status === "in_progress" ? (
      <Clock size={14} />
    ) : (
      <AlertCircle size={14} />
    );

  return (
    <div className="page-enter p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10">
            <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>{t("complaints.title")}</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("complaints.subtitle")}</p>
          </div>
        </div>
        <button
          id="raise-complaint-btn"
          onClick={() => setFormOpen(!formOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 text-white text-sm font-semibold"
        >
          <Plus size={16} />
          {t("complaints.raise")}
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-2xl p-4 space-y-4">
              <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>{t("complaints.new")}</h3>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      category === cat
                        ? "bg-red-500 text-white border-red-500"
                        : "border-themed text-themed hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("complaints.title2")}
                className="w-full text-sm rounded-xl p-3 outline-none"
                style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("complaints.desc")}
                rows={3}
                className="w-full text-sm rounded-xl p-3 resize-none outline-none"
                style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
              />

              {imagePreview && (
                <div className="relative w-full h-32 rounded-xl overflow-hidden">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  <ImageIcon size={16} /> Photo
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
                  }} />
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !category || !title.trim() || !description.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {t("complaints.submit")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} />
        </div>
      )}

      {!loading && complaints.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
            <AlertCircle size={28} style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="font-semibold" style={{ color: "var(--text)" }}>{t("complaints.empty")}</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("complaints.emptySub")}</p>
        </div>
      )}

      {complaints.map((c, i) => {
        const sc = statusColor(c.status);
        return (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl overflow-hidden"
          >
            {c.image_url && (
              <div className="relative w-full h-36">
                <Image src={c.image_url} alt={c.title} fill className="object-cover" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                  {c.category}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{timeAgo(c.created_at)}</span>
              </div>
              <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>{c.title}</h3>
              <p className="text-sm line-clamp-2 mb-3" style={{ color: "var(--text-muted)" }}>{c.description}</p>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.text} ${sc.bg} ${sc.border}`}>
                <StatusIcon status={c.status} />
                {c.status === "in_progress" ? "In Progress" : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
