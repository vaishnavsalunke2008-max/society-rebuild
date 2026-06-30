"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Heart, MessageSquare, Trash2, Send, ImageIcon, X, Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { getInitials, timeAgo } from "@/lib/utils";
import toast from "react-hot-toast";
import Image from "next/image";

type Post = {
  id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  created_at: string;
  author_id: string;
  users: { full_name: string; flat_number: string; role: string; avatar_url?: string | null } | null;
  liked?: boolean;
};

type Comment = {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  users: { full_name: string; avatar_url?: string | null } | null;
};

export default function AdminCommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const supabase = createClient();

  async function loadPosts() {
    const { data } = await supabase
      .from("posts")
      .select("*, users!author_id(full_name, flat_number, role, avatar_url)")
      .order("created_at", { ascending: false });

    if (data && user) {
      const { data: likes } = await supabase.from("post_likes").select("post_id").eq("user_id", user.id);
      const likedIds = new Set((likes || []).map((l) => l.post_id));
      setPosts((data as Post[]).map((p) => ({ ...p, liked: likedIds.has(p.id) })));
    } else {
      setPosts((data as Post[]) || []);
    }
    setLoading(false);
  }

  async function toggleLike(post: Post) {
    if (!user) return;
    if (post.liked) {
      await supabase.from("post_likes").delete().match({ post_id: post.id, user_id: user.id });
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, liked: !post.liked, likes_count: post.liked ? p.likes_count - 1 : p.likes_count + 1 }
          : p
      )
    );
  }

  async function loadComments(postId: string) {
    const { data } = await supabase
      .from("comments")
      .select("*, users!author_id(full_name, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (data) {
      setComments((prev) => ({ ...prev, [postId]: data as Comment[] }));
    }
  }

  function toggleComments(postId: string) {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
      if (!comments[postId]) loadComments(postId);
    }
  }

  async function handleCommentSubmit(postId: string) {
    if (!commentContent.trim() || !user) return;
    setSubmittingComment(true);
    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      author_id: user.id,
      content: commentContent.trim(),
    });
    if (!error) {
      setCommentContent("");
      await loadComments(postId);
    }
    setSubmittingComment(false);
  }

  useEffect(() => { loadPosts(); }, []);

  async function handlePost() {
    if (!content.trim() || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from("posts").insert({ author_id: user.id, content: content.trim() });
    if (error) { toast.error("Failed to post"); } else { toast.success("Posted!"); setContent(""); setFormOpen(false); loadPosts(); }
    setSubmitting(false);
  }

  async function deletePost(id: string) {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) { toast.error("Delete failed"); return; }
    toast.success("Post deleted");
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="page-enter p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10">
            <Users size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Community</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Moderate resident feed</p>
          </div>
        </div>
        <button
          onClick={() => setFormOpen(!formOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold"
        >
          <Plus size={16} /> Post
        </button>
      </div>

      <AnimatePresence>
        {formOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="glass rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="w-8 h-8 rounded-full object-cover shadow-sm" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(user?.full_name || "A")}
                  </div>
                )}
                <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{user?.full_name}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400">Admin</span>
              </div>
              <textarea value={content} onChange={(e) => setContent(e.target.value.slice(0, 500))} placeholder="Write an announcement..." rows={3}
                className="w-full text-sm rounded-xl p-3 resize-none outline-none"
                style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }} />
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{content.length}/500</span>
                <button onClick={handlePost} disabled={submitting || !content.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Share
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} /></div>}

      {!loading && posts.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}><Users size={28} style={{ color: "var(--text-muted)" }} /></div>
          <p className="font-semibold" style={{ color: "var(--text)" }}>No posts yet</p>
        </div>
      )}

      {posts.map((post, i) => (
        <motion.div key={post.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-2xl overflow-hidden group">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              {post.users?.avatar_url ? (
                <img src={post.users.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover flex-shrink-0 shadow-sm" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {getInitials(post.users?.full_name || "U")}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{post.users?.full_name || "Unknown"}</p>
                  {post.users?.role === "admin" && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400">Admin</span>
                  )}
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Flat {post.users?.flat_number} · {timeAgo(post.created_at)}</p>
              </div>
              <button onClick={() => deletePost(post.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                <Trash2 size={15} />
              </button>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{post.content}</p>
          </div>
          {post.image_url && (
            <div className="relative w-full h-48">
              <Image src={post.image_url} alt="Post" fill className="object-cover" />
            </div>
          )}
          <div className="px-4 py-3 flex items-center gap-4 border-t border-themed">
            <button
              onClick={() => toggleLike(post)}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: post.liked ? "#ef4444" : "var(--text-muted)" }}
            >
              <Heart size={16} fill={post.liked ? "#ef4444" : "none"} stroke={post.liked ? "#ef4444" : "currentColor"} /> 
              {post.likes_count > 0 && post.likes_count}
            </button>
            <button
              onClick={() => toggleComments(post.id)}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: expandedPostId === post.id ? "var(--primary)" : "var(--text-muted)" }}
            >
              <MessageSquare size={16} /> Comment
            </button>
          </div>

          <AnimatePresence>
            {expandedPostId === post.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-black/5 dark:bg-white/5"
              >
                <div className="p-4 space-y-3">
                  {/* Comment List */}
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {comments[post.id]?.length === 0 && (
                      <p className="text-xs text-center pb-2" style={{ color: "var(--text-muted)" }}>No comments yet. Be the first!</p>
                    )}
                    {comments[post.id]?.map((c) => (
                      <div key={c.id} className="flex gap-2">
                        {c.users?.avatar_url ? (
                          <img src={c.users.avatar_url} alt="Profile" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                            {getInitials(c.users?.full_name || "U")}
                          </div>
                        )}
                        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl rounded-tl-none p-2 shadow-sm text-sm" style={{ border: "1px solid var(--border)" }}>
                          <p className="font-semibold text-xs" style={{ color: "var(--text)" }}>{c.users?.full_name}</p>
                          <p style={{ color: "var(--text)" }}>{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Add Comment */}
                  <div className="flex items-center gap-2 pt-2 border-t border-themed">
                    <input
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleCommentSubmit(post.id); }}
                      placeholder="Write a comment..."
                      className="flex-1 min-w-0 text-sm rounded-full px-4 py-2 outline-none"
                      style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
                    />
                    <button
                      onClick={() => handleCommentSubmit(post.id)}
                      disabled={submittingComment || !commentContent.trim()}
                      className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                    >
                      {submittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} className="ml-0.5" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
