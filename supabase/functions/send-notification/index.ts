import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Helper to base64url-encode strings
function base64url(input: Uint8Array): string {
  const binary = Array.from(input).map(b => String.fromCharCode(b)).join("");
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

// Generate Google OAuth 2.0 access token for FCM v1 using Web Crypto
async function getFcmAccessToken(serviceAccount: any): Promise<string> {
  const cleanPem = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");

  const binaryKey = Uint8Array.from(atob(cleanPem), c => c.charCodeAt(0));

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp,
    iat,
  };

  const textEncoder = new TextEncoder();
  const encodedHeader = base64url(textEncoder.encode(JSON.stringify(header)));
  const encodedPayload = base64url(textEncoder.encode(JSON.stringify(payload)));
  const signingInput = textEncoder.encode(`${encodedHeader}.${encodedPayload}`);

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    signingInput
  );

  const jwt = `${encodedHeader}.${encodedPayload}.${base64url(new Uint8Array(signature))}`;

  // Exchange JWT for access token
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google OAuth exchange failed: ${err}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Send FCM notification to a list of tokens
async function sendFcmNotification(
  accessToken: string,
  projectId: string,
  tokens: string[],
  payload: { title: string; body: string; url: string; tag: string }
) {
  const results = await Promise.all(
    tokens.map(async (token) => {
      try {
        const res = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              message: {
                token,
                notification: {
                  title: payload.title,
                  body: payload.body,
                },
                data: {
                  url: payload.url,
                  tag: payload.tag,
                },
                android: {
                  notification: {
                    click_action: "FCM_PLUGIN_ACTIVITY",
                    sound: "default",
                  },
                },
              },
            }),
          }
        );

        const text = await res.text();
        return { token, success: res.ok, status: res.status, response: text };
      } catch (e) {
        return { token, success: false, error: e.message };
      }
    })
  );

  console.log("FCM Send Results:", JSON.stringify(results, null, 2));
}

serve(async (req) => {
  // CORS check
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const payload = await req.json();
    console.log("Received Webhook Payload:", JSON.stringify(payload, null, 2));

    const { table, action, record, old_record } = payload;
    if (!table || !action || !record) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase Client with service_role key to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get FCM Service Account Secrets
    const saSecret = Deno.env.get("FCM_SERVICE_ACCOUNT");
    if (!saSecret) {
      console.warn("FCM_SERVICE_ACCOUNT secret not set. Skipping notifications.");
      return new Response(JSON.stringify({ success: false, message: "FCM_SERVICE_ACCOUNT not configured" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    const serviceAccount = JSON.parse(saSecret);

    // Determine notification title, body, tag, URL, and target user IDs
    let title = "SocietyHub";
    let body = "New update available";
    let url = "/";
    let tag = "general";
    let targetUserIds: string[] = []; // empty means send to specific users, we will query them

    if (table === "notices" && action === "INSERT") {
      title = "📢 New Notice Published";
      body = record.title;
      url = "/dashboard/updates";
      tag = "notices";
      // Send to all users except the creator
      const { data: users } = await supabase.from("users").select("id").neq("id", record.created_by);
      targetUserIds = (users || []).map((u: any) => u.id);
    } 
    else if (table === "events" && action === "INSERT") {
      title = "📅 New Society Event";
      body = record.title;
      url = "/dashboard/events";
      tag = "events";
      // Send to all users except creator
      const { data: users } = await supabase.from("users").select("id").neq("id", record.created_by);
      targetUserIds = (users || []).map((u: any) => u.id);
    }
    else if (table === "posts" && action === "INSERT") {
      title = "💬 New Community Post";
      // Fetch author name
      const { data: author } = await supabase.from("users").select("full_name").eq("id", record.author_id).single();
      const authorName = author?.full_name || "Someone";
      body = `${authorName} shared a post: ${record.content.substring(0, 50)}${record.content.length > 50 ? "..." : ""}`;
      url = "/dashboard/community";
      tag = "posts";
      // Send to all users except author
      const { data: users } = await supabase.from("users").select("id").neq("id", record.author_id);
      targetUserIds = (users || []).map((u: any) => u.id);
    }
    else if (table === "comments" && action === "INSERT") {
      title = "💬 New Comment on Post";
      // Get author of comment
      const { data: author } = await supabase.from("users").select("full_name").eq("id", record.author_id).single();
      const authorName = author?.full_name || "Someone";
      body = `${authorName}: ${record.content.substring(0, 50)}${record.content.length > 50 ? "..." : ""}`;
      url = "/dashboard/community";
      tag = "comments";

      // Get post author to notify them specifically
      const { data: post } = await supabase.from("posts").select("author_id").eq("id", record.post_id).single();
      if (post && post.author_id !== record.author_id) {
        targetUserIds = [post.author_id];
      }
    }
    else if (table === "messages" && action === "INSERT") {
      title = "✉️ New Chat Message";
      // Get sender details
      const { data: sender } = await supabase.from("users").select("full_name").eq("id", record.sender_id).single();
      const senderName = sender?.full_name || "Someone";
      body = `${senderName}: ${record.content.substring(0, 50)}${record.content.length > 50 ? "..." : ""}`;
      tag = "chat";

      // Find the conversation to identify the recipient
      const { data: conv } = await supabase.from("conversations").select("resident_id").eq("id", record.conversation_id).single();
      if (conv) {
        // If sender is resident, notify admin. If sender is admin, notify resident.
        if (record.sender_id === conv.resident_id) {
          // Resident sent message. Query all admins.
          const { data: admins } = await supabase.from("users").select("id").eq("role", "admin");
          targetUserIds = (admins || []).map((a: any) => a.id);
          url = `/admin/messages/view?id=${record.conversation_id}`;
        } else {
          // Admin sent message. Notify resident.
          targetUserIds = [conv.resident_id];
          url = `/dashboard/chat/view?id=${record.conversation_id}`;
        }
      }
    }
    else if (table === "complaints") {
      if (action === "INSERT") {
        title = "⚠️ New Complaint Raised";
        body = record.title;
        tag = "complaints";
        // Notify all admins
        const { data: admins } = await supabase.from("users").select("id").eq("role", "admin");
        targetUserIds = (admins || []).map((a: any) => a.id);
        url = "/admin/updates";
      } else if (action === "UPDATE" && record.status !== old_record.status) {
        // Complaint status updated (e.g. resolved / in_progress)
        const statusMap: Record<string, string> = {
          in_progress: "In Progress ⚙️",
          resolved: "Resolved ✅",
          pending: "Pending ⏳"
        };
        title = `⚠️ Complaint Status: ${statusMap[record.status] || record.status}`;
        body = `Your complaint "${record.title}" is now marked as ${statusMap[record.status] || record.status}.`;
        url = "/dashboard/complaints";
        tag = "complaints";
        // Notify the submitting user
        targetUserIds = [record.submitted_by];
      }
    }

    if (targetUserIds.length === 0) {
      console.log("No target users to notify.");
      return new Response(JSON.stringify({ success: true, message: "No targets" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Query registered FCM subscription tokens for target users
    const { data: fcmRows } = await supabase
      .from("fcm_subscriptions")
      .select("token")
      .in("user_id", targetUserIds);

    const fcmTokens = (fcmRows || []).map((f: any) => f.token).filter(t => t);

    if (fcmTokens.length > 0) {
      console.log(`Sending FCM notifications to ${fcmTokens.length} devices...`);
      const accessToken = await getFcmAccessToken(serviceAccount);
      await sendFcmNotification(accessToken, serviceAccount.project_id, fcmTokens, {
        title,
        body,
        url,
        tag,
      });
    } else {
      console.log("No registered FCM tokens found for target users.");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
