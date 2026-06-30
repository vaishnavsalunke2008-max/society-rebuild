"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { formatTime } from "@/lib/utils";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

function ChatDetailContent() {
  const searchParams = useSearchParams();
  const resolvedParams = { id: searchParams.get("id") || "" };
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: conv } = await supabase
        .from("conversations")
        .select("subject")
        .eq("id", resolvedParams.id)
        .single();
      if (conv) setSubject(conv.subject);

      const { data, error: selectError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", resolvedParams.id)
        .order("created_at", { ascending: true });
        
      if (selectError) {
        console.error("Select error:", selectError);
        toast.error(`DB Read Error: ${selectError.message}`);
      }
      
      setMessages((data as Message[]) || []);
      setLoading(false);
    }
    load();

    // Realtime subscription via Broadcast (bypasses complex RLS limits)
    const channel = supabase
      .channel(`chat-${resolvedParams.id}`)
      .on("broadcast", { event: "new-message" }, (payload) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === payload.payload.id)) return prev;
          return [...prev, payload.payload as Message];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [resolvedParams.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!newMsg.trim() || !user) return;
    setSending(true);
    try {
      const msgId = crypto.randomUUID();
      const msg: Message = {
        id: msgId,
        sender_id: user.id,
        content: newMsg.trim(),
        created_at: new Date().toISOString(),
      };

      // Optimistically add to UI
      setMessages((prev) => [...prev, msg]);
      setNewMsg("");

      // Insert to DB
      const { error: insertError } = await supabase.from("messages").insert({
        id: msgId,
        conversation_id: resolvedParams.id,
        sender_id: user.id,
        content: msg.content,
        created_at: msg.created_at,
      });
      if (insertError) {
        console.error("Insert error:", insertError);
        toast.error(`DB Error: ${insertError.message}`);
        return;
      }

      // Broadcast to other participant
      await supabase.channel(`chat-${resolvedParams.id}`).send({
        type: "broadcast",
        event: "new-message",
        payload: msg,
      });

      await supabase
        .from("conversations")
        .update({ last_message: msg.content, last_message_at: msg.created_at, unread_admin: 1 })
        .eq("id", resolvedParams.id);
      setNewMsg("");
    } catch {
      toast.error("Failed to send message");
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col h-screen pt-14" style={{ background: "var(--bg)" }}>
      {/* Sub-header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-themed"
        style={{ background: "var(--surface)" }}
      >
        <button onClick={() => router.back()} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5">
          <ArrowLeft size={18} style={{ color: "var(--text)" }} />
        </button>
        <div>
          <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{subject}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Admin</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--primary)" }} />
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMe
                    ? "bg-primary-500 text-white rounded-br-sm"
                    : "rounded-bl-sm"
                }`}
                style={!isMe ? { background: "var(--surface-2)", color: "var(--text)" } : {}}
              >
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? "text-white/60" : ""}`} style={!isMe ? { color: "var(--text-muted)" } : {}}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-3 border-t border-themed flex items-center gap-3 max-w-lg mx-auto"
        style={{ background: "var(--surface)", bottom: "64px" }}
      >
        <input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 text-sm rounded-xl px-4 py-2.5 outline-none"
          style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !newMsg.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-50 flex-shrink-0"
          style={{ background: "var(--primary)" }}
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function ChatDetailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-emerald-500" /></div>}>
      <ChatDetailContent />
    </Suspense>
  );
}
