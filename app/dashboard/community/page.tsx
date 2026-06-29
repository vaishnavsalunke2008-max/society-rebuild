"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Heart,
  MessageSquare,
  Image as ImageIcon,
  Send,
  X,
  Loader2,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { getInitials, timeAgo, uploadImage } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";
import Image from "next/image";

type Post = {
  id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  created_at: string;
  author_id: string;
  users: { full_name: string; flat_number: string } | null;
  liked?: boolean;
};

export default function CommunityPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  async function loadPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*, users(full_name, flat_number)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Posts fetch error:", error);
      toast.error("DB Error: " + error.message);
    }

    // Check liked status
    if (data && user) {
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id);
      const likedIds = new Set((likes || []).map((l) => l.post_id));
      setPosts((data as Post[]).map((p) => ({ ...p, liked: likedIds.has(p.id) })));
    } else {
      setPosts((data as Post[]) || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!content.trim() || !user) return;
    setSubmitting(true);
    try {
      let image_url: string | null = null;
      if (imageFile) {
        image_url = await uploadImage(supabase, imageFile, user.id);
      }
      const { error } = await supabase.from("posts").insert({
        author_id: user.id,
        content: content.trim(),
        image_url,
      });
      if (error) throw error;
      toast.success("Post shared!");
      setContent("");
      setImageFile(null);
      setImagePreview(null);
      setFormOpen(false);
      loadPosts();
    } catch {
      toast.error("Failed to post. Please try again.");
    }
    setSubmitting(false);
  }

  async function toggleLike(post: Post) {
    if (!user) return;
    if (post.liked) {
      await supabase
        .from("post_likes")
        .delete()
        .match({ post_id: post.id, user_id: user.id });
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

  return (
    <div className="page-enter p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10">
            <Users size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>{t("community.title")}</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("community.subtitle")}</p>
          </div>
        </div>
        <button
          id="new-post-btn"
          onClick={() => setFormOpen(!formOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold"
        >
          <Plus size={16} />
          {t("community.post")}
        </button>
      </div>

      {/* Create Post Form */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                  {getInitials(user?.full_name || "U")}
                </div>
                <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                  {user?.full_name}
                </span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 500))}
                placeholder={t("community.whats")}
                rows={3}
                className="w-full text-sm rounded-xl p-3 resize-none outline-none"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                }}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {content.length}/500
                </span>
              </div>
              {imagePreview && (
                <div className="relative w-full h-40 rounded-xl overflow-hidden">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                  >
                    <X size={14} className="text-white" />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  <ImageIcon size={18} />
                  {t("community.photo")}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !content.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {t("community.share")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} />
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
            <Users size={28} style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="font-semibold" style={{ color: "var(--text)" }}>{t("community.empty")}</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("community.emptySub")}</p>
        </div>
      )}

      {/* Posts */}
      {posts.map((post, i) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass rounded-2xl overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {getInitials(post.users?.full_name || "U")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                  {post.users?.full_name || "Unknown"}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Flat {post.users?.flat_number} · {timeAgo(post.created_at)}
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text)" }}>
              {post.content}
            </p>
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
              <Heart
                size={18}
                fill={post.liked ? "#ef4444" : "none"}
                stroke={post.liked ? "#ef4444" : "currentColor"}
              />
              {post.likes_count > 0 && <span>{post.likes_count}</span>}
            </button>
            <button
              className="flex items-center gap-1.5 text-sm font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              <MessageSquare size={18} />
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{t("community.comment")}</span>
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
