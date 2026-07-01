"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ChevronRight, Loader2, Users, Search, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getInitials, timeAgo } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

type Conversation = {
  id: string;
  subject: string;
  last_message: string | null;
  last_message_at: string;
  unread_admin: number;
  resident_id: string;
  users: { full_name: string; flat_number: string } | null;
};

type Member = {
  id: string;
  full_name: string;
  flat_number: string;
  role: "resident" | "security";
  avatar_url: string | null;
};

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = createClient();

  // Navigation View: "list" (active chats) or "members" (select member)
  const [view, setView] = useState<"list" | "members">("list");
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  async function loadConversations() {
    try {
      const { data } = await supabase
        .from("conversations")
        .select("*, users:resident_id(full_name, flat_number)")
        .order("last_message_at", { ascending: false });
      setConversations((data as Conversation[]) || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadConversations(); }, []);

  // Fetch members list when switching to members view
  async function loadMembers() {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, flat_number, role, avatar_url")
        .neq("role", "admin")
        .order("full_name", { ascending: true });
      if (error) throw error;
      setMembers((data as Member[]) || []);
    } catch (_) {
      toast.error("Failed to load members list");
    } finally {
      setLoadingMembers(false);
    }
  }

  useEffect(() => {
    if (view === "members") {
      loadMembers();
    }
  }, [view]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_admin || 0), 0);

  // Filter members based on search
  const filteredMembers = members.filter((m) =>
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.flat_number && m.flat_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="page-enter p-4 space-y-4">
      <AnimatePresence mode="wait">
        {/* ── View 1: Active Conversations List ────────────────────────────────────────── */}
        {view === "list" && (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--primary-glow)" }}>
                  <MessageCircle size={20} style={{ color: "var(--primary)" }} />
                </div>
                <div>
                  <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>{t("admin.messages.title")}</h1>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {totalUnread > 0 ? `${totalUnread} ${t("admin.messages.unread")}` : t("admin.messages.subtitle")}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setView("members")}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold shadow-sm hover:opacity-95 transition-opacity flex-shrink-0"
                style={{ background: "linear-gradient(135deg, var(--primary), #4f46e5)" }}
              >
                <Users size={14} />
                All Members
              </button>
            </div>

            {loading && <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} /></div>}

            {!loading && conversations.length === 0 && (
              <div className="flex flex-col items-center py-16 gap-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
                  <MessageCircle size={28} style={{ color: "var(--text-muted)" }} />
                </div>
                <p className="font-semibold" style={{ color: "var(--text)" }}>{t("admin.messages.empty")}</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("admin.messages.emptySub")}</p>
              </div>
            )}

            {conversations.map((conv, i) => (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => router.push(`/admin/messages/view?id=${conv.id}`)}
                className="w-full glass rounded-2xl p-4 flex items-center gap-3 text-left hover:scale-[0.99] transition-transform"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {getInitials(conv.users?.full_name || "R")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                      {conv.users?.full_name || "Resident"}
                    </p>
                    <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                      {timeAgo(conv.last_message_at)}
                    </span>
                  </div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: "var(--primary)" }}>
                    {conv.subject}
                  </p>
                  <p className="text-xs line-clamp-1" style={{ color: "var(--text-muted)" }}>
                    {conv.last_message || "No messages"}
                  </p>
                  {conv.users?.flat_number && (
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Flat {conv.users.flat_number}
                    </p>
                  )}
                </div>
                {conv.unread_admin > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {conv.unread_admin}
                  </span>
                )}
                <ChevronRight size={16} style={{ color: "var(--text-muted)" }} className="flex-shrink-0" />
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* ── View 2: All Members List Section ─────────────────────────────────────────── */}
        {view === "members" && (
          <motion.div
            key="members-view"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            {/* Header */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setView("list")}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
              >
                <ArrowLeft size={18} style={{ color: "var(--text)" }} />
              </button>
              <div>
                <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Select Member</h1>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Choose a resident or guard to start chat</p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or flat..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
            </div>

            {loadingMembers && (
              <div className="flex justify-center py-12">
                <Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} />
              </div>
            )}

            {!loadingMembers && filteredMembers.length === 0 && (
              <div className="flex flex-col items-center py-16 gap-3">
                <p className="font-medium text-sm" style={{ color: "var(--text-muted)" }}>No members found</p>
              </div>
            )}

            {!loadingMembers && filteredMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => router.push(`/admin/messages/view?resident_id=${member.id}`)}
                className="w-full glass rounded-2xl p-4 flex items-center gap-3 text-left hover:scale-[0.99] transition-transform"
              >
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.full_name}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {getInitials(member.full_name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>{member.full_name}</p>
                  <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
                    {member.role === "resident" ? `Resident · Flat ${member.flat_number}` : `Security Guard`}
                  </p>
                </div>
                <ChevronRight size={16} style={{ color: "var(--text-muted)" }} className="flex-shrink-0" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
