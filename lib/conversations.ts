import { supabase } from "@/lib/supabase"

export type ConversationStatus = "open" | "wacht_op_klant" | "wacht_op_mens" | "gesloten"
export type QuoteStatus =
  | "nieuw"
  | "in_behandeling"
  | "offerte_verstuurd"
  | "geaccepteerd"
  | "aangepast"
  | "geweigerd"

export type Conversation = {
  id: string
  whatsappNumber: string
  status: ConversationStatus
  handoverReason: string | null
  lastMessageAt: string
  customerName: string
}

export type Message = {
  id: string
  direction: "inbound" | "outbound"
  senderType: "klant" | "bot" | "medewerker"
  content: string
  createdAt: string
}

export type QuoteRequest = {
  id: string
  status: QuoteStatus
  eventDate: string | null
  guests: number | null
  location: string | null
  eventType: string | null
  notes: string | null
  createdAt: string
}

export const CONVERSATION_STATUS_LABELS: Record<ConversationStatus, string> = {
  open: "Bot actief",
  wacht_op_klant: "Bot actief",
  wacht_op_mens: "Wacht op Rik",
  gesloten: "Gesloten",
}

export const HANDOVER_REASON_LABELS: Record<string, string> = {
  klant_wil_mens: "Klant wil iemand spreken",
  prijs_korting_garantie: "Vraag over prijs, korting of garantie",
  weet_het_niet: "Bot kon de vraag niet beantwoorden",
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  nieuw: "Nieuw",
  in_behandeling: "In behandeling",
  offerte_verstuurd: "Offerte verstuurd",
  geaccepteerd: "Geaccepteerd",
  aangepast: "Aangepast",
  geweigerd: "Geweigerd",
}

type ConversationRow = {
  id: string
  whatsapp_number: string
  status: ConversationStatus
  handover_reason: string | null
  last_message_at: string
  customers: { name: string } | { name: string }[] | null
}

/** Gesprekken die op Rik wachten eerst, daarna de meest recente. */
export async function fetchConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, whatsapp_number, status, handover_reason, last_message_at, customers(name)")
    .order("last_message_at", { ascending: false })
    .limit(200)

  if (error) {
    console.error("[conversations] fetch failed:", error)
    return []
  }

  const rows = (data ?? []) as unknown as ConversationRow[]
  const conversations = rows.map((row) => {
    const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers
    return {
      id: row.id,
      whatsappNumber: row.whatsapp_number,
      status: row.status,
      handoverReason: row.handover_reason,
      lastMessageAt: row.last_message_at,
      customerName: customer?.name ?? row.whatsapp_number,
    }
  })
  return conversations.sort(
    (a, b) => Number(b.status === "wacht_op_mens") - Number(a.status === "wacht_op_mens"),
  )
}

export async function fetchConversationDetail(
  conversationId: string,
): Promise<{ messages: Message[]; requests: QuoteRequest[] }> {
  const [messagesResult, requestsResult] = await Promise.all([
    supabase
      .from("messages")
      .select("id, direction, sender_type, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
    supabase
      .from("quote_requests")
      .select("id, status, event_date, guests, location, event_type, notes, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false }),
  ])

  return {
    messages: (messagesResult.data ?? []).map((m) => ({
      id: m.id,
      direction: m.direction,
      senderType: m.sender_type,
      content: m.content ?? "",
      createdAt: m.created_at,
    })),
    requests: (requestsResult.data ?? []).map((r) => ({
      id: r.id,
      status: r.status,
      eventDate: r.event_date,
      guests: r.guests,
      location: r.location,
      eventType: r.event_type,
      notes: r.notes,
      createdAt: r.created_at,
    })),
  }
}

export async function setConversationStatus(
  conversationId: string,
  status: ConversationStatus,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("conversations")
    .update({ status, ...(status === "open" ? { handover_reason: null } : {}) })
    .eq("id", conversationId)
  return error ? { error: "Status wijzigen is mislukt." } : {}
}

export async function setQuoteStatus(
  quoteId: string,
  status: QuoteStatus,
): Promise<{ error?: string }> {
  const { error } = await supabase.from("quote_requests").update({ status }).eq("id", quoteId)
  return error ? { error: "Status wijzigen is mislukt." } : {}
}

/** Rik antwoordt zelf; gaat via de Edge Function zodat de Meta-token geheim blijft. */
export async function sendAdminMessage(
  conversationId: string,
  text: string,
): Promise<{ error?: string }> {
  const { data, error } = await supabase.functions.invoke("admin-send-message", {
    body: { conversationId, text },
  })
  if (error) {
    const body = await (error as { context?: Response }).context?.json?.().catch(() => null)
    return { error: body?.error ?? "Versturen is mislukt." }
  }
  return data?.ok ? {} : { error: "Versturen is mislukt." }
}
