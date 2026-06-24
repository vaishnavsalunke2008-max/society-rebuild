"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Plus, MapPin, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { formatDate, formatTime } from "@/lib/utils";
import toast from "react-hot-toast";

type Event = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  created_at: string;
};

export default function AdminEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  async function loadEvents() {
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: true });
    setEvents((data as Event[]) || []);
    setLoading(false);
  }

  useEffect(() => { loadEvents(); }, []);

  async function handleCreate() {
    if (!title.trim() || !eventDate || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from("events").insert({
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      event_date: new Date(eventDate).toISOString(),
      created_by: user.id,
    });
    if (error) { toast.error("Failed to create event"); } else {
      toast.success("Event created!");
      setTitle(""); setDescription(""); setLocation(""); setEventDate("");
      setFormOpen(false); loadEvents();
    }
    setSubmitting(false);
  }

  async function deleteEvent(id: string) {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { toast.error("Delete failed"); return; }
    toast.success("Event deleted");
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="page-enter p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10">
            <CalendarDays size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Manage Events</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Create & organize events</p>
          </div>
        </div>
        <button onClick={() => setFormOpen(!formOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
          <Plus size={16} /> Add
        </button>
      </div>

      <AnimatePresence>
        {formOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="glass rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>New Event</h3>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event name"
                className="w-full text-sm rounded-xl p-3 outline-none"
                style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }} />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2}
                className="w-full text-sm rounded-xl p-3 resize-none outline-none"
                style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }} />
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (optional)"
                className="w-full text-sm rounded-xl p-3 outline-none"
                style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }} />
              <input value={eventDate} onChange={(e) => setEventDate(e.target.value)} type="datetime-local"
                className="w-full text-sm rounded-xl p-3 outline-none"
                style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }} />
              <button onClick={handleCreate} disabled={submitting || !title.trim() || !eventDate}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CalendarDays size={16} />}
                Create Event
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin" style={{ color: "var(--primary)" }} /></div>}

      {!loading && events.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-2)" }}><CalendarDays size={28} style={{ color: "var(--text-muted)" }} /></div>
          <p className="font-semibold" style={{ color: "var(--text)" }}>No events created</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Tap "+ Add" to create an event</p>
        </div>
      )}

      {events.map((event, i) => {
        const past = new Date(event.event_date) < new Date();
        return (
          <motion.div key={event.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`glass rounded-2xl p-4 group ${past ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="flex flex-col items-center min-w-[44px]">
                  <span className="text-2xl font-bold leading-none" style={{ color: "var(--primary)" }}>
                    {new Date(event.event_date).getDate()}
                  </span>
                  <span className="text-xs font-medium uppercase" style={{ color: "var(--text-muted)" }}>
                    {new Date(event.event_date).toLocaleString("en-IN", { month: "short" })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>{event.title}</h3>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${past ? "bg-slate-100 dark:bg-white/10 text-slate-500" : "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
                      {past ? "Past" : "Upcoming"}
                    </span>
                  </div>
                  {event.description && <p className="text-xs mb-1 line-clamp-1" style={{ color: "var(--text-muted)" }}>{event.description}</p>}
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>🕐 {formatDate(event.event_date)} at {formatTime(event.event_date)}</p>
                    {event.location && (
                      <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                        <MapPin size={10} /> {event.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => deleteEvent(event.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex-shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
