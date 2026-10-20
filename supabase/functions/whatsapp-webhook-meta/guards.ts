// Deterministic safety checks around the model. The prompt asks Gemini to
// follow the rules, but these checks make sure a slip never reaches a customer.

import type { HandoverReason } from "./prompt.ts";

const ASKS_FOR_HUMAN =
  /\b(mens|medewerker|iemand\s+(spreken|bellen)|echte?\s+persoon|persoonlijk\s+contact|bel\s+me|bellen|terugbellen|telefonisch|rick|eigenaar)\b/i;

const ASKS_ABOUT_PRICE =
  /(€|\b(prijs|prijzen|prijsje|kost|kosten|kostte|tarief|tarieven|korting|kortingen|aanbieding|actie\s*prijs|garantie|garanties|goedkoop|goedkoper|euro|betalen|borg|budget)\b)/i;

// Checked on the customer's message, before calling the model.
export function detectInboundHandover(text: string): HandoverReason | null {
  if (ASKS_FOR_HUMAN.test(text)) return "klant_wil_mens";
  if (ASKS_ABOUT_PRICE.test(text)) return "prijs_korting_garantie";
  return null;
}

const MENTIONS_MONEY =
  /(€|\beur\b|\beuro|\d+\s*,-|\b(korting|kortingen|garantie|gegarandeerd|gratis|aanbieding|prijs|prijzen|tarief|kost|kosten)\b)/i;

const PROMISES_AVAILABILITY =
  /\b(is|zijn|staat|staan)\s+(nog\s+)?(vrij|beschikbaar)\b|\b(wij|we)\s+(leveren|bezorgen|brengen)\b|\b(voorlopige\s+)?reservering\b|\bgereserveerd\b/i;

// Checked on the model's reply, before sending it.
export function detectOutboundViolation(reply: string): HandoverReason | null {
  if (MENTIONS_MONEY.test(reply)) return "prijs_korting_garantie";
  if (PROMISES_AVAILABILITY.test(reply)) return "weet_het_niet";
  return null;
}

const HANDOFF = "Ik geef je bericht door aan Rick van Sonilux; hij neemt zo snel mogelijk persoonlijk contact met je op.";

export const HANDOVER_MESSAGES: Record<HandoverReason, string> = {
  klant_wil_mens: `Prima! ${HANDOFF}`,
  prijs_korting_garantie:
    `Over prijzen, kortingen en garanties kan ik als digitale assistent helaas niets zeggen. ${HANDOFF}`,
  weet_het_niet: `Daar kan ik je als digitale assistent helaas niet goed mee helpen. ${HANDOFF}`,
};

// Gemini tends to write Markdown; WhatsApp uses *bold* and plain "- " lists.
export function toWhatsappFormatting(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/__(.+?)__/g, "_$1_")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[*•]\s+/gm, "- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function ensureIntro(reply: string, isFirstReply: boolean): string {
  if (!isFirstReply || /digitale assistent/i.test(reply)) return reply;
  return `Hoi! Ik ben de digitale assistent van Sonilux. ${reply}`;
}
