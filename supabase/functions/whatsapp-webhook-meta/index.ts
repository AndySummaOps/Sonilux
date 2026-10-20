// Meta WhatsApp Cloud API webhook -> Sonilux AI bot.
//
// Flow: Meta posts an incoming WhatsApp message here -> we look up (or
// create) the customer + conversation in Supabase -> ask Gemini to draft a
// reply using the product catalog + conversation history as context -> send
// the reply back through the Meta Cloud API -> log both messages.
//
// Required secrets (set via Supabase dashboard -> Edge Functions -> Secrets,
// or `supabase secrets set NAME=value --project-ref fbcwvwukdeqowtcuzrgn`):
//   META_VERIFY_TOKEN     a string you choose yourself, entered in the Meta App
//                         dashboard under Webhooks when you subscribe this URL
//   META_WHATSAPP_TOKEN   permanent access token for the WhatsApp Business app
//   META_PHONE_NUMBER_ID  the phone_number_id from the Meta App dashboard
//   META_APP_SECRET       (optional but recommended) App Secret, used to verify
//                         that incoming webhook calls really come from Meta
//   GEMINI_API_KEY        free API key from https://aistudio.google.com/apikey
//   GEMINI_MODEL          optional, defaults to "gemini-2.5-flash" below --
//                         override here if Google renames/retires that model
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
//
// NOTE ON PHONE NUMBER FORMAT: Meta sends numbers as digits only, no "+"
// (e.g. "31612345678"). This function normalizes to "+31612345678" style
// (leading "+") before touching the database, to match the existing
// customers/conversations schema. If your existing rows are stored without
// the "+", adjust `toE164()` below or backfill the old rows once.

import { createClient } from "npm:@supabase/supabase-js@2";

const META_VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN")!;
const META_WHATSAPP_TOKEN = Deno.env.get("META_WHATSAPP_TOKEN")!;
const META_PHONE_NUMBER_ID = Deno.env.get("META_PHONE_NUMBER_ID")!;
const META_APP_SECRET = Deno.env.get("META_APP_SECRET") ?? "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const GRAPH_VERSION = "v21.0";
const MAX_HISTORY_MESSAGES = 20;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function toE164(digitsOnly: string): string {
  return digitsOnly.startsWith("+") ? digitsOnly : `+${digitsOnly}`;
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

async function fetchActiveProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("name, short_description, price_per_day, stock_quantity, product_categories(name)")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("[whatsapp-webhook-meta] products query failed:", error);
    return [];
  }
  return data ?? [];
}

function buildSystemPrompt(products: Awaited<ReturnType<typeof fetchActiveProducts>>) {
  const catalogLines = products
    .map((p) => {
      const category = (p as any).product_categories?.name ?? "Overig";
      return `- ${p.name} (${category}): ${p.short_description ?? ""} — €${p.price_per_day}/dag, voorraad: ${p.stock_quantity}`;
    })
    .join("\n");

  return `Je bent de WhatsApp-assistent van Sonilux, een verhuurbedrijf voor LED-verlichting, statafels en eventmateriaal in Limburg, Nederland.\n\nBeschikbare producten (alleen actief/op voorraad):\n${catalogLines}\n\nRegels:\n- Antwoord kort, vriendelijk en to-the-point, in het Nederlands, passend bij WhatsApp (geen lange lappen tekst).\n- Beantwoord vragen over producten, prijzen, beschikbaarheid en het huurproces op basis van bovenstaande lijst.\n- Verzin nooit prijzen of producten die niet in de lijst staan.\n- Je maakt zelf GEEN offerte of boeking aan. Als een klant concreet iets wil huren of boeken, verwijs ze vriendelijk naar het offerteformulier op de website, of zeg dat een medewerker het verder oppakt.\n- Als je het antwoord niet zeker weet, geef dat eerlijk aan en bied aan dat een medewerker terugkomt.`;
}

async function callGemini(systemPrompt: string, history: { direction: string; content: string | null }[]) {
  const contents = history
    .filter((m) => m.content)
    .map((m) => ({
      role: m.direction === "inbound" ? "user" : "model",
      parts: [{ text: m.content as string }],
    }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        // Gemini 2.5 counts "thinking" tokens against maxOutputTokens, which
        // cut replies off mid-sentence. Short WhatsApp replies don't need it.
        generationConfig: { maxOutputTokens: 800, thinkingConfig: { thinkingBudget: 0 } },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  const text2 = json.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
  return text2.trim() || "Bedankt voor je bericht! Een medewerker neemt zo snel mogelijk contact met je op.";
}

async function sendWhatsappReply(to: string, body: string) {
  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${META_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${META_WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.replace(/^\+/, ""), // Graph API wants digits only, no "+"
        type: "text",
        text: { body },
      }),
    },
  );

  const json = await res.json();
  if (!res.ok) {
    console.error("[whatsapp-webhook-meta] Meta send failed:", json);
    throw new Error(`Meta send failed: ${JSON.stringify(json.error ?? json)}`);
  }
  return json.messages?.[0]?.id as string | undefined;
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

  const phone = toE164(message.from as string);
  const body = message.text.body as string;
  const profileName = value?.contacts?.[0]?.profile?.name as string | undefined;

  try {
    let { data: customer } = await supabase
      .from("customers")
      .select("id")
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
        .select("id")
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
    });

    // A human took over this conversation: log the message but stay quiet.
    if (conversation.status === "wacht_op_mens") {
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversation.id);
      return new Response("OK (waiting for human)", { status: 200 });
    }

    const { data: history } = await supabase
      .from("messages")
      .select("direction, content")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(MAX_HISTORY_MESSAGES);

    const orderedHistory = (history ?? []).reverse();
    const products = await fetchActiveProducts();
    const systemPrompt = buildSystemPrompt(products);
    const reply = await callGemini(systemPrompt, orderedHistory);
    const messageId = await sendWhatsappReply(phone, reply);

    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      direction: "outbound",
      sender_type: "bot",
      content: reply,
      whatsapp_message_id: messageId,
    });

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation.id);

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("[whatsapp-webhook-meta] Unhandled error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
