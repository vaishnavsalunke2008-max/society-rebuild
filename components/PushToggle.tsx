"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { registerPushNotifications, unregisterPushNotifications, isPushSupported } from "@/lib/push";

export function PushToggle() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isPushSupported());
    if (isPushSupported()) {
      let isNative = false;
      try {
        isNative = !!(window as any).Capacitor;
      } catch (_) {}

      if (isNative) {
        // Native check permission
        import("@capacitor/push-notifications").then(async ({ PushNotifications }) => {
          try {
            const perm = await PushNotifications.checkPermissions();
            // Since we registers tokens when user enables push, we check if they granted permission
            setEnabled(perm.receive === "granted");
          } catch (_) {}
        });
      } else {
        // Web PWA check
        navigator.serviceWorker.getRegistration("/sw.js").then(async (reg) => {
          if (reg) {
            const sub = await reg.pushManager.getSubscription();
            setEnabled(!!sub);
          }
        });
      }
    }
  }, []);

  if (!supported) return null;

  async function toggle() {
    if (!user) return;
    setLoading(true);
    if (enabled) {
      await unregisterPushNotifications(user.id);
      setEnabled(false);
    } else {
      const ok = await registerPushNotifications(user.id);
      setEnabled(ok);
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
      <div className="flex items-center gap-3">
        {enabled ? (
          <Bell size={18} style={{ color: "var(--primary)" }} />
        ) : (
          <BellOff size={18} style={{ color: "var(--text-muted)" }} />
        )}
        <div>
          <p className="text-sm font-medium leading-none" style={{ color: "var(--text)" }}>
            Notifications
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            {enabled ? "Tap to disable" : "Get notified about notices & complaints"}
          </p>
        </div>
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        className={`relative w-11 h-6 rounded-full transition-colors duration-300 disabled:opacity-50 ${enabled ? "bg-primary-500" : "bg-slate-200 dark:bg-slate-700"}`}
      >
        {loading ? (
          <Loader2 size={12} className="absolute inset-0 m-auto animate-spin text-white" />
        ) : (
          <div
            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300"
            style={{ left: enabled ? "calc(100% - 22px)" : "2px" }}
          />
        )}
      </button>
    </div>
  );
}
