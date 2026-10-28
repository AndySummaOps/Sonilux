// Admin screen -> customer: Rick answers a WhatsApp conversation himself.
//
// Called from the admin screen with the logged-in user's JWT. Only accounts
// with app_metadata.role = "admin" may send. The message goes out from the
// bot number, is logged as sender_type "medewerker", and the conversation is
// set to "wacht_op_mens" so the bot stays out of it until Rick hands it back.
//
// WhatsApp only delivers free-form messages within 24 hours after the
// customer's last message; after that Meta rejects the send and we report it.
//
// Secrets: META_WHATSAPP_TOKEN, META_PHONE_NUMBER_ID (same as the bot).

import { createClient } from "npm:@supabase/supabase-js@2";
import { sendText } from "../_shared/whatsapp.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const meta = {
  token: Deno.env.get("META_WHATSAPP_TOKEN")!,
  phoneNumberId: Deno.env.get("META_PHONE_NUMBER_ID")!,
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  });
}

const WINDOW_MS = 24 * 60 * 60 * 1000;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const jwt = req.headers.get("authorization")?.replace(/^Bearer /i, "") ?? "";
  const { data: userData } = await supabase.auth.getUser(jwt);
  if (userData.user?.app_metadata?.role !== "admin") {
    return json({ error: "Geen toegang." }, 403);
  }

  let input: { conversationId?: string; text?: string };
  try {
    input = await req.json();
  } catch {
    return json({ error: "Ongeldige invoer." }, 400);
  }
  const text = input.text?.trim();
  if (!input.conversationId || !text) return json({ error: "Gesprek en bericht zijn verplicht." }, 400);

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, whatsapp_number")
    .eq("id", input.conversationId)
    .maybeSingle();
  if (!conversation) return json({ error: "Gesprek niet gevonden." }, 404);

  const { data: lastInbound } = await supabase
    .from("messages")
    .select("created_at")
    .eq("conversation_id", conversation.id)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!lastInbound || Date.now() - Date.parse(lastInbound.created_at) > WINDOW_MS) {
    return json({
      error: "De klant heeft langer dan 24 uur geleden voor het laatst iets gestuurd. WhatsApp staat dan geen vrij bericht toe; bel of mail de klant.",
    }, 409);
  }

  let messageId: string | undefined;
  try {
    messageId = await sendText(meta, conversation.whatsapp_number, text);
  } catch (err) {
    console.error("[admin-send-message] send failed:", err);
    return json({ error: "Versturen via WhatsApp is mislukt." }, 502);
  }

  const now = new Date().toISOString();
  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    direction: "outbound",
    sender_type: "medewerker",
    content: text,
    whatsapp_message_id: messageId,
  });
  await supabase
    .from("conversations")
    .update({ status: "wacht_op_mens", last_message_at: now })
    .eq("id", conversation.id);

  return json({ ok: true });
});
