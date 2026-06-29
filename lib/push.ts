import { createClient } from "@/lib/supabase";

// VAPID public key from env
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function registerPushNotifications(userId: string): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("Push notifications not supported in this browser");
    return false;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn("NEXT_PUBLIC_VAPID_PUBLIC_KEY not set — push notifications disabled");
    return false;
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Store subscription in Supabase
    const supabase = createClient();
    const subJson = subscription.toJSON();
    await supabase.from("push_subscriptions").upsert({
      user_id: userId,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys?.p256dh,
      auth: subJson.keys?.auth,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return true;
  } catch (err) {
    console.error("Push registration error:", err);
    return false;
  }
}

export async function unregisterPushNotifications(userId: string): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    if (registration) {
      const sub = await registration.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
    }

    const supabase = createClient();
    await supabase.from("push_subscriptions").delete().eq("user_id", userId);
  } catch (err) {
    console.error("Push unregister error:", err);
  }
}

export function isPushSupported(): boolean {
  return typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window;
}
