"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { statusColor, timeAgo } from "@/lib/utils";
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
  users: { full_name: string; flat_number: string } | null;
};

const FILTERS = ["all", "pending", "in_progress", "resolved"] as const;
type Filter = (typeof FILTERS)[number];

export default function AdminUpdatesPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const supabase = createClient();

  async function loadComplaints() {
    const { data } = await supabase
      .from("complaints")
      .select("*, users(full_name, flat_number)")
      .order("created_at", { ascending: false });
    setComplaints((data as Complaint[]) || []);
    setLoading(false);
  }

  useEffect(() => { loadComplaints(); }, []);

  async function updateStatus(id: string, status: "in_progress" | "resolved") {
    const { error } = await supabase.from("complaints").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Marked as ${status === "in_progress" ? "In Progress" : "Resolved"}`);
    setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }

  const filtered = filter === "all" ? complaints : complaints.filter((c) => c.status === filter);
  const counts = {
    pending: complaints.filter((c) => c.status === "pending").length,
    in_progress: complaints.filter((c) => c.status === "in_progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  };

  return (
    <div className="page-enter p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Complaint Management</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Review and resolve issues</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending", count: counts.pending, color: "red" },
          { label: "In Progress", count: counts.in_progress, color: "amber" },
          { label: "Resolved", count: counts.resolved, color: "emerald" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass rounded-xl p-3 text-center"
          >
            <p className={`text-2xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
              {stat.count}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f ? "bg-primary-500 text-white" : "border-themed text-themed hover:bg-black/5 dark:hover:bg-white/5"
            }`}
            style={filter !== f ? { border: "1px solid var(--border)" } : {}}
          >
            {f === "all" ? "All" : f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
            <AlertCircle size={28} style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="font-semibold" style={{ color: "var(--text)" }}>No complaints</p>
        </div>
      )}

      {filtered.map((c, i) => {
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
              <h3 className="font-semibold text-sm mb-0.5" style={{ color: "var(--text)" }}>{c.title}</h3>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                {c.users?.full_name} · Flat {c.users?.flat_number}
              </p>
              <p className="text-sm line-clamp-2 mb-3" style={{ color: "var(--text-muted)" }}>{c.description}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.text} ${sc.bg} ${sc.border}`}>
                  {c.status === "in_progress" ? "In Progress" : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                </span>
                {c.status === "pending" && (
                  <button
                    onClick={() => updateStatus(c.id, "in_progress")}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 hover:opacity-80 transition-opacity"
                  >
                    → In Progress
                  </button>
                )}
                {c.status !== "resolved" && (
                  <button
                    onClick={() => updateStatus(c.id, "resolved")}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 hover:opacity-80 transition-opacity"
                  >
                    ✓ Resolved
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
