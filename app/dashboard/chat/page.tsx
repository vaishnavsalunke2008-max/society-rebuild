"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Plus,
  ChevronRight,
  Loader2,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { getInitials, timeAgo } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

type Conversation = {
  id: string;
  subject: string;
  last_message: string | null;
  last_message_at: string;
  unread_resident: number;
  created_at: string;
};

export default function ChatPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  async function loadConversations() {
    if (!user) return;
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("resident_id", user.id)
      .order("last_message_at", { ascending: false });
    setConversations((data as Conversation[]) || []);
    setLoading(false);
  }

  useEffect(() => { loadConversations(); }, [user]);

  async function handleSubmit() {
    if (!subject.trim() || !message.trim() || !user) return;
    setSubmitting(true);
    try {
      const { data: conv, error: convErr } = await supabase
        .from("conversations")
        .insert({
          resident_id: user.id,
          subject: subject.trim(),
          last_message: message.trim(),
          last_message_at: new Date().toISOString(),
          unread_admin: 1,
          unread_resident: 0,
        })
        .select()
        .single();
      if (convErr) throw convErr;

      await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_id: user.id,
        content: message.trim(),
      });

      toast.success("Message sent!");
      setSubject(""); setMessage(""); setFormOpen(false);
      loadConversations();
    } catch {
      toast.error("Failed to send. Try again.");
    }
    setSubmitting(false);
  }

  return (
    <div className="page-enter p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--primary-glow)" }}>
            <MessageCircle size={20} style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>{t("chat.title")}</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("chat.subtitle")}</p>
          </div>
        </div>
        <button
          id="new-chat-btn"
          onClick={() => setFormOpen(!formOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: "var(--primary)" }}
        >
          <Plus size={16} />
          {t("chat.new")}
        </button>
      </div>

      {/* New Conversation Form */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>{t("chat.newConv")}</h3>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t("chat.subject")}
                className="w-full text-sm rounded-xl p-3 outline-none"
                style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("chat.message")}
                rows={4}
                className="w-full text-sm rounded-xl p-3 resize-none outline-none"
                style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
              <button
                onClick={handleSubmit}
                disabled={submitting || !subject.trim() || !message.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--primary), #4f46e5)" }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {t("chat.send")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} />
        </div>
      )}

      {!loading && conversations.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
            <MessageCircle size={28} style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="font-semibold" style={{ color: "var(--text)" }}>{t("chat.empty")}</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("chat.emptySub")}</p>
        </div>
      )}

      {conversations.map((conv, i) => (
        <motion.button
          key={conv.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => router.push(`/dashboard/chat/${conv.id}`)}
          className="w-full glass rounded-2xl p-4 flex items-center gap-3 text-left hover:scale-[0.99] transition-transform"
        >
          {/* Admin Avatar */}
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-semibold text-sm" style={{ color: "var(--primary)" }}>
                {conv.subject}
              </span>
              <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                {timeAgo(conv.last_message_at)}
              </span>
            </div>
            <p className="text-xs line-clamp-1" style={{ color: "var(--text-muted)" }}>
              {conv.last_message || "No messages yet"}
            </p>
          </div>
          {conv.unread_resident > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
              {conv.unread_resident}
            </span>
          )}
          <ChevronRight size={16} style={{ color: "var(--text-muted)" }} className="flex-shrink-0" />
        </motion.button>
      ))}
    </div>
  );
}
