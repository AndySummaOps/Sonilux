// Meta WhatsApp Cloud API webhook -> Sonilux AI bot.
//
// Flow: Meta posts an incoming WhatsApp message here -> we answer 200 right
// away and process in the background: look up (or create) the customer +
// conversation -> safety checks -> ask Gemini for a structured turn (reply,
// handover, request fields) -> send the reply (or a fixed handover message)
// through the Meta Cloud API -> log both messages.
//
// The bot decides nothing: it answers, suggests in-stock products and
// collects a request. Handover sets the conversation to "wacht_op_mens", after
// which the bot stays silent in that conversation.
//
// Required secrets (set via Supabase dashboard -> Edge Functions -> Secrets,
// or `supabase secrets set NAME=value --project-ref fbcwvwukdeqowtcuzrgn`):
//   META_VERIFY_TOKEN     a string you choose yourself, entered in the Meta App
//                         dashboard under Webhooks when you subscribe this URL
//   META_WHATSAPP_TOKEN   permanent access token for the WhatsApp Business app
//   META_PHONE_NUMBER_ID  the phone_number_id from the Meta App dashboard
//   META_APP_SECRET       (optional but recommended) App Secret, used to verify
//                         that incoming webhook calls really come from Meta
//   GEMINI_API_KEY        API key from https://aistudio.google.com/apikey
//   GEMINI_MODEL          optional, defaults to "gemini-2.5-flash" below
//   RIK_WHATSAPP_NUMBER  number that gets the notifications, e.g. "+31612345678"
//   RIK_TEMPLATE_AANVRAAG   optional, approved template name for a new request
//   RIK_TEMPLATE_OVERDRACHT optional, approved template name for a handover
//                         (see notify.ts; without them plain text is sent)
//   RIK_TEMPLATE_LANGUAGE   optional, defaults to "nl"
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
//
// NOTE ON PHONE NUMBER FORMAT: Meta sends numbers as digits only, no "+"
// (e.g. "31612345678"). This function normalizes to "+31612345678" style
// (leading "+") before touching the database, to match the existing
// customers/conversations schema.

import { createClient } from "npm:@supabase/supabase-js@2";
import { buildSystemPrompt, type BotTurn, type HandoverReason, type Product } from "./prompt.ts";
import { callGemini } from "./gemini.ts";
import { type NotifyConfig, notifyHandover, notifyRequest } from "./notify.ts";
import { sendText } from "../_shared/whatsapp.ts";
import {
  detectInboundHandover,
  detectOutboundViolation,
  ensureIntro,
  HANDOVER_MESSAGES,
  toWhatsappFormatting,
} from "./guards.ts";

const META_VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN")!;
const META_WHATSAPP_TOKEN = Deno.env.get("META_WHATSAPP_TOKEN")!;
const META_PHONE_NUMBER_ID = Deno.env.get("META_PHONE_NUMBER_ID")!;
const META_APP_SECRET = Deno.env.get("META_APP_SECRET") ?? "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";
const RIK_WHATSAPP_NUMBER = Deno.env.get("RIK_WHATSAPP_NUMBER") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MAX_HISTORY_MESSAGES = 20;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const meta = { token: META_WHATSAPP_TOKEN, phoneNumberId: META_PHONE_NUMBER_ID };
const notifyConfig: NotifyConfig = {
  ...meta,
  rikNumber: RIK_WHATSAPP_NUMBER,
  templateRequest: Deno.env.get("RIK_TEMPLATE_AANVRAAG") ?? "",
  templateHandover: Deno.env.get("RIK_TEMPLATE_OVERDRACHT") ?? "",
  templateLanguage: Deno.env.get("RIK_TEMPLATE_LANGUAGE") ?? "nl",
};

function toE164(digitsOnly: string): string {
  return digitsOnly.startsWith("+") ? digitsOnly : `+${digitsOnly}`;
}

function todayInAmsterdam(): string {
  return new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

async function verifyMetaSignature(req: Request, rawBody: string): Promise<boolean> {
  // If no App Secret is configured yet, don't block the bot -- just skip the
  // check (fine while you're getting things running with a test number).
  // Set META_APP_SECRET as soon as you go live so random POSTs can't fake
  // messages into your bot.
  if (!META_APP_SECRET) return true;

  const signatureHeader = req.headers.get("X-Hub-Signature-256");
  if (!signatureHeader) return false;
  const expectedHex = signatureHeader.replace(/^sha256=/, "");

  const keyData = new TextEncoder().encode(META_APP_SECRET);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(rawBody));
  const macHex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");

  return macHex === expectedHex;
}

async function fetchSuggestableProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("name, short_description, description, event_types, min_guests, max_guests, product_categories(name)")
    .eq("is_active", true)
    .eq("in_stock", true)
    .order("name");

  if (error) {
    console.error("[whatsapp-webhook-meta] products query failed:", error);
    return [];
  }
  return (data ?? []) as unknown as Product[];
}

type ConversationContext = { conversationId: string; customerId: string; customerName: string; phone: string };

async function onHandover(ctx: ConversationContext, reason: HandoverReason, detail: string, lastMessage: string) {
  console.log(`[whatsapp-webhook-meta] handover ${ctx.conversationId}: ${reason} (${detail})`);
  await supabase
    .from("conversations")
    .update({ handover_reason: reason, handover_at: new Date().toISOString() })
    .eq("id", ctx.conversationId);
  await notifyHandover(notifyConfig, ctx.customerName, ctx.phone, reason, lastMessage);
}

function isIsoDate(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function requestFingerprint(r: { event_date: string | null; guests: number | null; location: string | null; event_type: string | null; notes: string | null }) {
  return JSON.stringify([r.event_date, r.guests, r.location, r.event_type, r.notes]);
}

// The model keeps customer_confirmed true on later turns ("bedankt!"), so the
// same request must not be saved or sent to Rik twice. A changed request
// updates the still-unhandled one; once Rik has picked it up, a new one is made.
async function onRequestConfirmed(ctx: ConversationContext, turn: BotTurn) {
  const request = turn.request;
  const productList = request.products.join(", ");
  const row = {
    customer_id: ctx.customerId,
    conversation_id: ctx.conversationId,
    source: "whatsapp",
    event_date: isIsoDate(request.event_date) ? request.event_date : null,
    guests: request.guests,
    location: request.location,
    event_type: request.event_type,
    notes: [
      productList ? `Gewenste producten: ${productList}` : null,
      request.event_date && !isIsoDate(request.event_date) ? `Datum (zoals genoemd): ${request.event_date}` : null,
    ].filter(Boolean).join("\n") || null,
  };

  const { data: latest } = await supabase
    .from("quote_requests")
    .select("id, status, event_date, guests, location, event_type, notes")
    .eq("conversation_id", ctx.conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest && requestFingerprint(latest) === requestFingerprint(row)) return;

  let requestId: string;
  if (latest && latest.status === "nieuw") {
    const { error } = await supabase.from("quote_requests").update(row).eq("id", latest.id);
    if (error) throw error;
    requestId = latest.id;
    await supabase.from("quote_request_items").delete().eq("quote_request_id", requestId);
  } else {
    const { data, error } = await supabase
      .from("quote_requests")
      .insert({ ...row, status: "nieuw" })
      .select("id")
      .single();
    if (error) throw error;
    requestId = data.id;
  }

  if (request.products.length) {
    const { data: products } = await supabase.from("products").select("id, name").in("name", request.products);
    if (products?.length) {
      await supabase
        .from("quote_request_items")
        .insert(products.map((p) => ({ quote_request_id: requestId, product_id: p.id, quantity: 1 })));
    }
  }

  // The customer's WhatsApp profile name is a guess; the name they typed wins.
  if (request.name && ctx.customerName !== request.name) {
    await supabase.from("customers").update({ name: request.name }).eq("id", ctx.customerId);
  }

  console.log(`[whatsapp-webhook-meta] request saved ${requestId} for ${ctx.conversationId}`);
  await notifyRequest(notifyConfig, ctx.phone, request);
}

type InboundMessage = { id: string; phone: string; body: string; profileName?: string };

async function handleInboundMessage(msg: InboundMessage) {
  const { phone, body, profileName } = msg;

  // Rik's own number gets the notifications; never treat him as a customer.
  if (RIK_WHATSAPP_NUMBER && phone === RIK_WHATSAPP_NUMBER) {
    console.log("[whatsapp-webhook-meta] message from Rik's number, ignored");
    return;
  }

  // Meta retries webhooks it considers failed; never answer the same message twice.
  const { data: duplicate } = await supabase
    .from("messages")
    .select("id")
    .eq("whatsapp_message_id", msg.id)
    .limit(1)
    .maybeSingle();
  if (duplicate) {
    console.log(`[whatsapp-webhook-meta] duplicate ${msg.id}, skipped`);
    return;
  }

  let { data: customer } = await supabase
    .from("customers")
    .select("id, name")
    .or(`whatsapp_number.eq.${phone},phone.eq.${phone}`)
    .limit(1)
    .maybeSingle();

  if (!customer) {
    const { data: newCustomer, error } = await supabase
      .from("customers")
      .insert({
        name: profileName || phone,
        phone,
        whatsapp_number: phone,
        source: "whatsapp",
      })
      .select("id, name")
      .single();
    if (error) throw error;
    customer = newCustomer;
  }

  let { data: conversation } = await supabase
    .from("conversations")
    .select("id, status")
    .eq("whatsapp_number", phone)
    .neq("status", "gesloten")
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!conversation) {
    const { data: newConversation, error } = await supabase
      .from("conversations")
      .insert({ customer_id: customer.id, whatsapp_number: phone, status: "open" })
      .select("id, status")
      .single();
    if (error) throw error;
    conversation = newConversation;
  }

  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    direction: "inbound",
    sender_type: "klant",
    content: body,
    whatsapp_message_id: msg.id,
  });

  // A human took over this conversation: log the message but stay quiet.
  if (conversation.status === "wacht_op_mens") {
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation.id);
    return;
  }

  const { data: history } = await supabase
    .from("messages")
    .select("direction, sender_type, content")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: false })
    .limit(MAX_HISTORY_MESSAGES);

  const orderedHistory = (history ?? []).reverse();
  const isFirstReply = !orderedHistory.some((m) => m.direction === "outbound");

  let handoverReason: HandoverReason | null = detectInboundHandover(body);
  let handoverDetail = "trefwoord in klantbericht";
  let turn: BotTurn | null = null;

  if (!handoverReason) {
    try {
      const products = await fetchSuggestableProducts();
      turn = await callGemini({
        apiKey: GEMINI_API_KEY,
        model: GEMINI_MODEL,
        systemPrompt: buildSystemPrompt(products, todayInAmsterdam()),
        history: orderedHistory,
      });
      if (turn.handover) {
        handoverReason = turn.handover_reason ?? "weet_het_niet";
        handoverDetail = "besloten door model";
      } else if (!turn.reply) {
        handoverReason = "weet_het_niet";
        handoverDetail = "leeg antwoord van model";
      } else {
        const violation = detectOutboundViolation(turn.reply);
        if (violation) {
          handoverReason = violation;
          handoverDetail = `geblokkeerd antwoord: ${turn.reply}`;
        }
      }
    } catch (err) {
      // Never leave a customer without an answer: hand over to Rik instead.
      console.error("[whatsapp-webhook-meta] Gemini failed:", err);
      handoverReason = "weet_het_niet";
      handoverDetail = `technische fout: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  const reply = handoverReason
    ? HANDOVER_MESSAGES[handoverReason]
    : ensureIntro(toWhatsappFormatting(turn!.reply), isFirstReply);

  const messageId = await sendText(meta, phone, reply);

  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    direction: "outbound",
    sender_type: "bot",
    content: reply,
    whatsapp_message_id: messageId,
  });

  await supabase
    .from("conversations")
    .update({
      last_message_at: new Date().toISOString(),
      ...(handoverReason ? { status: "wacht_op_mens" } : {}),
    })
    .eq("id", conversation.id);

  const ctx: ConversationContext = {
    conversationId: conversation.id,
    customerId: customer.id,
    customerName: customer.name,
    phone,
  };
  if (handoverReason) {
    await onHandover(ctx, handoverReason, handoverDetail, body);
  } else if (turn?.request_complete && turn.customer_confirmed) {
    await onRequestConfirmed(ctx, turn);
  }
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // Meta's one-time webhook verification handshake.
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === META_VERIFY_TOKEN && challenge) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();

  const validSignature = await verifyMetaSignature(req, rawBody);
  if (!validSignature) {
    console.error("[whatsapp-webhook-meta] Invalid Meta signature");
    return new Response("Invalid signature", { status: 403 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  // Always answer 200 quickly to anything that isn't an inbound text message
  // (delivery/read statuses, non-text messages, etc.) so Meta doesn't retry
  // or eventually disable the webhook.
  const value = payload?.entry?.[0]?.changes?.[0]?.value;
  const message = value?.messages?.[0];

  if (!message) {
    return new Response("OK (no message)", { status: 200 });
  }

  if (message.type !== "text" || !message.text?.body) {
    return new Response("OK (unsupported message type)", { status: 200 });
  }

  const inbound: InboundMessage = {
    id: message.id as string,
    phone: toE164(message.from as string),
    body: message.text.body as string,
    profileName: value?.contacts?.[0]?.profile?.name as string | undefined,
  };

  // Gemini can take a while; answer Meta now so it doesn't retry, and finish
  // the work in the background.
  const work = handleInboundMessage(inbound).catch((err) =>
    console.error("[whatsapp-webhook-meta] Unhandled error:", err)
  );
  // deno-lint-ignore no-explicit-any
  (globalThis as any).EdgeRuntime?.waitUntil(work);

  return new Response("OK", { status: 200 });
});
