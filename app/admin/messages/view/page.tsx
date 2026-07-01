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

function AdminChatDetailContent() {
  const searchParams = useSearchParams();
  const resolvedParams = {
    id: searchParams.get("id") || "",
    resident_id: searchParams.get("resident_id") || "",
  };
  const { user } = useAuth();
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState("Direct Message");
  const [recipientName, setRecipientName] = useState("Member");
  const [conversationId, setConversationId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      try {
        let activeResId = resolvedParams.resident_id;

        // A. Load existing conversation ID if passed
        if (resolvedParams.id) {
          setConversationId(resolvedParams.id);
          const { data: conv } = await supabase
            .from("conversations")
            .select("subject, resident_id")
            .eq("id", resolvedParams.id)
            .single();
          if (conv) {
            setSubject(conv.subject);
            activeResId = conv.resident_id;

            // Load messages
            const { data: msgs, error: selectError } = await supabase
              .from("messages")
              .select("*")
              .eq("conversation_id", resolvedParams.id)
              .order("created_at", { ascending: true });
            
            if (selectError) throw selectError;
            setMessages((msgs as Message[]) || []);

            // Mark as read
            await supabase.from("conversations").update({ unread_admin: 0 }).eq("id", resolvedParams.id);
          }
        } 
        // B. If no ID passed but resident_id is, check if a conversation already exists
        else if (resolvedParams.resident_id) {
          const { data: existingConv } = await supabase
            .from("conversations")
            .select("id, subject")
            .eq("resident_id", resolvedParams.resident_id)
            .order("last_message_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (existingConv) {
            setConversationId(existingConv.id);
            setSubject(existingConv.subject);

            // Load messages
            const { data: msgs, error: selectError } = await supabase
              .from("messages")
              .select("*")
              .eq("conversation_id", existingConv.id)
              .order("created_at", { ascending: true });
            
            if (selectError) throw selectError;
            setMessages((msgs as Message[]) || []);

            // Mark as read
            await supabase.from("conversations").update({ unread_admin: 0 }).eq("id", existingConv.id);
          } else {
            // New conversation draft - start clean
            setConversationId(null);
            setSubject("Direct Message");
            setMessages([]);
          }
        }

        // C. Fetch recipient details
        if (activeResId) {
          const { data: resUser } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", activeResId)
            .single();
          if (resUser) {
            setRecipientName(resUser.full_name);
          }
        }
      } catch (err: any) {
        console.error("Load error:", err);
        toast.error(`Error loading chat: ${err.message || err}`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [resolvedParams.id, resolvedParams.resident_id]);

  // Reactive subscription on conversationId change
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on("broadcast", { event: "new-message" }, (payload) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === payload.payload.id)) return prev;
          return [...prev, payload.payload as Message];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage() {
    if (!newMsg.trim() || !user) return;
    setSending(true);
    try {
      const msgText = newMsg.trim();
      setNewMsg("");

      let activeConvId = conversationId;

      // ── Create Conversation Draft on first message send ─────────────────────────
      if (!activeConvId) {
        const newConvId = crypto.randomUUID();
        const { error: convErr } = await supabase.from("conversations").insert({
          id: newConvId,
          resident_id: resolvedParams.resident_id,
          subject: "Direct Message",
          last_message: msgText,
          last_message_at: new Date().toISOString(),
          unread_admin: 0,
          unread_resident: 1,
        });

        if (convErr) throw convErr;

        activeConvId = newConvId;
        setConversationId(newConvId);

        // Update URL query parameter silently so it behaves like a standard active conversation
        try {
          const newUrl = `${window.location.pathname}?id=${newConvId}&resident_id=${resolvedParams.resident_id}`;
          window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
        } catch (_) {}
      }

      const msgId = crypto.randomUUID();
      const msg: Message = {
        id: msgId,
        sender_id: user.id,
        content: msgText,
        created_at: new Date().toISOString(),
      };

      // Optimistic UI update
      setMessages((prev) => [...prev, msg]);

      // Insert message to DB
      const { error: insertError } = await supabase.from("messages").insert({
        id: msgId,
        conversation_id: activeConvId,
        sender_id: user.id,
        content: msgText,
        created_at: msg.created_at,
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        toast.error(`DB Error: ${insertError.message}`);
        return;
      }

      // Broadcast to other participant
      await supabase.channel(`chat-${activeConvId}`).send({
        type: "broadcast",
        event: "new-message",
        payload: msg,
      });

      // Update last message pointer in conversation
      await supabase.from("conversations").update({
        last_message: msgText,
        last_message_at: msg.created_at,
        unread_resident: 1,
      }).eq("id", activeConvId);

    } catch (err: any) {
      toast.error(`Failed to send message: ${err.message || err}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-screen pt-14" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-themed" style={{ background: "var(--surface)" }}>
        <button onClick={() => router.back()} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5">
          <ArrowLeft size={18} style={{ color: "var(--text)" }} />
        </button>
        <div>
          <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{recipientName}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{subject}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {loading && <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin" style={{ color: "var(--primary)" }} /></div>}
        
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>No messages here yet.</p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Send a message below to start the conversation.</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-primary-500 text-white rounded-br-sm" : "rounded-bl-sm"}`}
                style={!isMe ? { background: "var(--surface-2)", color: "var(--text)" } : {}}>
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
      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 border-t border-themed flex items-center gap-3 max-w-lg mx-auto"
        style={{ background: "var(--surface)", bottom: "64px" }}>
        <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Reply to resident..."
          className="flex-1 min-w-0 text-sm rounded-xl px-4 py-2.5 outline-none"
          style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }} />
        <button onClick={sendMessage} disabled={sending || !newMsg.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-50 flex-shrink-0"
          style={{ background: "var(--primary)" }}>
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function AdminMessageDetailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-emerald-500" /></div>}>
      <AdminChatDetailContent />
    </Suspense>
  );
}
