"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Users, CheckCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { formatDate, formatTime } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import toast from "react-hot-toast";
import Image from "next/image";

type Event = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  image_url: string | null;
  created_at: string;
  rsvp_count?: number;
  rsvped?: boolean;
};

export default function EventsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  async function loadEvents() {
    const { data: evts } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    if (!evts) { setLoading(false); return; }

    // Get RSVP counts + user RSVPs
    const { data: rsvps } = await supabase.from("event_rsvps").select("event_id, user_id");
    const { data: myRsvps } = user
      ? await supabase.from("event_rsvps").select("event_id").eq("user_id", user.id)
      : { data: [] };

    const mySet = new Set((myRsvps || []).map((r) => r.event_id));
    const countMap: Record<string, number> = {};
    (rsvps || []).forEach((r) => { countMap[r.event_id] = (countMap[r.event_id] || 0) + 1; });

    setEvents(
      evts.map((e) => ({
        ...e,
        rsvp_count: countMap[e.id] || 0,
        rsvped: mySet.has(e.id),
      }))
    );
    setLoading(false);
  }

  useEffect(() => { loadEvents(); }, []);

  async function toggleRsvp(event: Event) {
    if (!user) return;
    if (event.rsvped) {
      await supabase.from("event_rsvps").delete().match({ event_id: event.id, user_id: user.id });
      toast.success("RSVP removed");
    } else {
      await supabase.from("event_rsvps").insert({ event_id: event.id, user_id: user.id });
      toast.success("You're going!");
    }
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? { ...e, rsvped: !event.rsvped, rsvp_count: event.rsvped ? (e.rsvp_count || 1) - 1 : (e.rsvp_count || 0) + 1 }
          : e
      )
    );
  }

  const isPast = (dateStr: string) => new Date(dateStr) < new Date();

  return (
    <div className="page-enter p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10">
          <CalendarDays size={20} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>{t("events.title")}</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("events.subtitle")}</p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} />
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
            <CalendarDays size={28} style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="font-semibold" style={{ color: "var(--text)" }}>{t("events.empty")}</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("events.emptySub")}</p>
        </div>
      )}

      {events.map((event, i) => {
        const past = isPast(event.event_date);
        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass rounded-2xl overflow-hidden ${past ? "opacity-60" : ""}`}
          >
            {event.image_url && (
              <div className="relative w-full h-40">
                <Image src={event.image_url} alt={event.title} fill className="object-cover" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start gap-4">
                {/* Large Date */}
                <div className="flex flex-col items-center min-w-[52px]">
                  <span className="text-3xl font-bold leading-none" style={{ color: "var(--primary)" }}>
                    {new Date(event.event_date).getDate()}
                  </span>
                  <span className="text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>
                    {new Date(event.event_date).toLocaleString("en-IN", { month: "short" })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        past
                          ? "bg-slate-100 dark:bg-white/10 text-slate-500"
                          : "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      {past ? t("events.past") : t("events.upcoming")}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm leading-snug" style={{ color: "var(--text)" }}>
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                      {event.description}
                    </p>
                  )}
                  <div className="flex flex-col gap-1 mt-2">
                    {event.location && (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        <MapPin size={12} />
                        {event.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      <CalendarDays size={12} />
                      {formatDate(event.event_date)} at {formatTime(event.event_date)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      <Users size={12} />
                      {event.rsvp_count} {t("events.attending")}
                    </div>
                  </div>
                </div>
              </div>

              {!past && (
                <button
                  onClick={() => toggleRsvp(event)}
                  className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    event.rsvped
                      ? "bg-emerald-500 text-white"
                      : "border-themed text-themed hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                  style={!event.rsvped ? { border: "1px solid var(--border)" } : {}}
                >
                  {event.rsvped ? (<>{t("events.going")}</>) : t("events.rsvp")}
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
