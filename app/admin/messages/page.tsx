"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ChevronRight, Loader2, Users, Search, X, ArrowLeft, Send } from "lucide-react";
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

  // Members Modal States
  const [membersOpen, setMembersOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Start Chat Dialog States
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [existingChats, setExistingChats] = useState<Conversation[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [submittingChat, setSubmittingChat] = useState(false);

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

  // Fetch members when modal is opened
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
    if (membersOpen) {
      loadMembers();
    }
  }, [membersOpen]);

  // Clicked on a member to start/continue conversation
  async function handleSelectMember(member: Member) {
    setSelectedMember(member);
    setNewSubject("");
    setNewMessage("");
    // Find if any conversations exist with this resident
    try {
      const { data } = await supabase
        .from("conversations")
        .select("*, users:resident_id(full_name, flat_number)")
        .eq("resident_id", member.id)
        .order("last_message_at", { ascending: false });
      setExistingChats(data || []);
    } catch (_) {}
  }

  // Create new conversation
  async function handleStartChat() {
    if (!selectedMember || !newSubject.trim() || !newMessage.trim() || !user) return;
    setSubmittingChat(true);
    try {
      // 1. Create conversation record
      const { data: conv, error: convErr } = await supabase
        .from("conversations")
        .insert({
          resident_id: selectedMember.id,
          subject: newSubject.trim(),
          last_message: newMessage.trim(),
          last_message_at: new Date().toISOString(),
          unread_admin: 0,
          unread_resident: 1, // Notify resident
        })
        .select()
        .single();

      if (convErr) throw convErr;

      // 2. Insert message record
      const { error: msgErr } = await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (msgErr) throw msgErr;

      toast.success("Chat started successfully!");
      setMembersOpen(false);
      setSelectedMember(null);
      router.push(`/admin/messages/view?id=${conv.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to start chat thread");
    } finally {
      setSubmittingChat(false);
    }
  }

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_admin || 0), 0);

  // Filter members by search input (matching name or flat number)
  const filteredMembers = members.filter((m) =>
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.flat_number && m.flat_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="page-enter p-4 space-y-4">
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
          onClick={() => setMembersOpen(true)}
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

      {/* ── All Members & New Chat Dialog Overlay ─────────────────────────────────────── */}
      <AnimatePresence>
        {membersOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setMembersOpen(false); setSelectedMember(null); }}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center"
            />
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="fixed inset-x-4 top-16 bottom-16 md:max-w-md md:mx-auto glass rounded-3xl z-50 overflow-hidden flex flex-col shadow-2xl"
              style={{ background: "var(--surface)" }}
            >
              {/* Modal View 1: Members List */}
              {!selectedMember ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-themed flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base" style={{ color: "var(--text)" }}>Society Members</h3>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Select a resident or guard to message</p>
                    </div>
                    <button
                      onClick={() => setMembersOpen(false)}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <X size={18} style={{ color: "var(--text-muted)" }} />
                    </button>
                  </div>

                  {/* Search bar */}
                  <div className="px-4 py-3 border-b border-themed">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or flat..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
                      />
                    </div>
                  </div>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loadingMembers && (
                      <div className="flex justify-center py-8">
                        <Loader2 size={24} className="animate-spin text-primary" style={{ color: "var(--primary)" }} />
                      </div>
                    )}

                    {!loadingMembers && filteredMembers.length === 0 && (
                      <p className="text-center text-xs py-8" style={{ color: "var(--text-muted)" }}>No members found</p>
                    )}

                    {!loadingMembers && filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleSelectMember(member)}
                        className="w-full p-3 rounded-2xl flex items-center gap-3 text-left hover:scale-[0.99] transition-all"
                        style={{ background: "var(--surface-2)" }}
                      >
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.full_name}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
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
                  </div>
                </>
              ) : (
                /* Modal View 2: Existing Chats / Start New Chat Form */
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Sub-Header */}
                  <div className="p-4 border-b border-themed flex items-center gap-3">
                    <button
                      onClick={() => setSelectedMember(null)}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <ArrowLeft size={18} style={{ color: "var(--text)" }} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate" style={{ color: "var(--text)" }}>Chat with {selectedMember.full_name}</h3>
                      <p className="text-[11px] capitalize" style={{ color: "var(--text-muted)" }}>
                        {selectedMember.role === "resident" ? `Resident · Flat ${selectedMember.flat_number}` : `Security Guard`}
                      </p>
                    </div>
                  </div>

                  {/* Body Container */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Existing chats */}
                    {existingChats.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                          Active Chats with {selectedMember.full_name}
                        </h4>
                        <div className="space-y-1.5">
                          {existingChats.map((chat) => (
                            <button
                              key={chat.id}
                              onClick={() => {
                                setMembersOpen(false);
                                router.push(`/admin/messages/view?id=${chat.id}`);
                              }}
                              className="w-full p-2.5 rounded-xl border border-themed text-left text-xs flex items-center justify-between hover:scale-[0.99] transition-transform"
                              style={{ background: "var(--surface)" }}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold" style={{ color: "var(--text)" }}>{chat.subject}</p>
                                <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{chat.last_message}</p>
                              </div>
                              <span className="text-[10px] ml-2 flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                                {timeAgo(chat.last_message_at)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New Chat Form */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        Start a New Conversation
                      </h4>
                      <div className="space-y-2">
                        <input
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                          placeholder="Conversation Subject (e.g. Maintenance Invoice)"
                          className="w-full text-xs rounded-xl p-3 outline-none"
                          style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
                        />
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type initial message..."
                          rows={4}
                          className="w-full text-xs rounded-xl p-3 resize-none outline-none"
                          style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
                        />
                      </div>

                      <button
                        onClick={handleStartChat}
                        disabled={submittingChat || !newSubject.trim() || !newMessage.trim()}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-xs disabled:opacity-40 transition-opacity"
                        style={{ background: "var(--primary)" }}
                      >
                        {submittingChat ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        Start Chat
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
