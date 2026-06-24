"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, ChevronRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getInitials, timeAgo } from "@/lib/utils";
import { useRouter } from "next/navigation";

type Conversation = {
  id: string;
  subject: string;
  last_message: string | null;
  last_message_at: string;
  unread_admin: number;
  resident_id: string;
  users: { full_name: string; flat_number: string } | null;
};

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("conversations")
      .select("*, users:resident_id(full_name, flat_number)")
      .order("last_message_at", { ascending: false })
      .then(({ data }) => {
        setConversations((data as Conversation[]) || []);
        setLoading(false);
      });
  }, []);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_admin || 0), 0);

  return (
    <div className="page-enter p-4 space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--primary-glow)" }}>
          <MessageCircle size={20} style={{ color: "var(--primary)" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Messages</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {totalUnread > 0 ? `${totalUnread} unread` : "Resident conversations"}
          </p>
        </div>
        {totalUnread > 0 && (
          <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-bold bg-primary-500 text-white">
            {totalUnread}
          </span>
        )}
      </div>

      {loading && <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} /></div>}

      {!loading && conversations.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
            <MessageCircle size={28} style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="font-semibold" style={{ color: "var(--text)" }}>No messages</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Resident messages will appear here</p>
        </div>
      )}

      {conversations.map((conv, i) => (
        <motion.button
          key={conv.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => router.push(`/admin/messages/${conv.id}`)}
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
    </div>
  );
}
