import { createClient } from "@/lib/supabase";

// VAPID public key from env (for Web Push)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

/**
 * Register push notifications (supports both Native Capacitor FCM and Web Push PWA)
 */
export async function registerPushNotifications(userId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  let isNative = false;
  try {
    isNative = !!(window as any).Capacitor;
  } catch (_) {}

  // ── Case A: Native Android / iOS Push (Capacitor) ───────────────────────────
  if (isNative) {
    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");

      let perm = await PushNotifications.checkPermissions();
      if (perm.receive === "prompt") {
        perm = await PushNotifications.requestPermissions();
      }
      if (perm.receive !== "granted") {
        console.warn("Native push permission denied");
        return false;
      }

      // Add listeners for native registration events
      await PushNotifications.removeAllListeners();

      await PushNotifications.addListener("registration", async (token) => {
        console.log("FCM device token registered:", token.value);
        const supabase = createClient();
        const { error } = await supabase.from("fcm_subscriptions").upsert(
          {
            user_id: userId,
            token: token.value,
            platform: "android",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "token" }
        );
        if (error) console.error("Error upserting FCM token:", error.message);
      });

      await PushNotifications.addListener("registrationError", (err) => {
        console.error("FCM native registration error:", err);
      });

      // Register device with APNS/FCM to trigger listeners above
      await PushNotifications.register();
      return true;
    } catch (err) {
      console.error("Capacitor native push registration error:", err);
      return false;
    }
  }

  // ── Case B: Browser Web Push PWA ───────────────────────────────────────────
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("Push notifications not supported in this browser");
    return false;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn("NEXT_PUBLIC_VAPID_PUBLIC_KEY not set — push notifications disabled");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const supabase = createClient();
    const subJson = subscription.toJSON();
    await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    return true;
  } catch (err) {
    console.error("Web Push registration error:", err);
    return false;
  }
}

/**
 * Unregister push notifications
 */
export async function unregisterPushNotifications(userId: string): Promise<void> {
  if (typeof window === "undefined") return;

  let isNative = false;
  try {
    isNative = !!(window as any).Capacitor;
  } catch (_) {}

  // ── Case A: Native Android / iOS ───────────────────────────────────────────
  if (isNative) {
    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      await PushNotifications.removeAllListeners();
      
      const supabase = createClient();
      await supabase.from("fcm_subscriptions").delete().eq("user_id", userId);
    } catch (err) {
      console.error("Native push unregister error:", err);
    }
    return;
  }

  // ── Case B: Browser PWA ───────────────────────────────────────────────────
  try {
    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    if (registration) {
      const sub = await registration.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
    }

    const supabase = createClient();
    await supabase.from("push_subscriptions").delete().eq("user_id", userId);
  } catch (err) {
    console.error("Web Push unregister error:", err);
  }
}

/**
 * Check if push is supported
 */
export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;

  let isNative = false;
  try {
    isNative = !!(window as any).Capacitor;
  } catch (_) {}

  if (isNative) return true; // Capacitor supports push notifications natively on device

  return "serviceWorker" in navigator && "PushManager" in window;
}
