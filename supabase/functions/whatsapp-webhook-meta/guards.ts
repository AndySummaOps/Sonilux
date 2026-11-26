// Deterministic safety checks around the model. The prompt asks Gemini to
// follow the rules, but these checks make sure a slip never reaches a customer.

import type { HandoverReason } from "./prompt.ts";

const ASKS_FOR_HUMAN =
  /\b(mens|medewerker|iemand\s+(spreken|bellen)|echte?\s+persoon|persoonlijk\s+contact|bel\s+me|bellen|terugbellen|telefonisch|rik|rick|eigenaar)\b/i;

// Checked on the customer's message, before calling the model. A price
// question is handled by the model itself (deflect + keep gathering the
// request), so it is not a trigger here.
export function detectInboundHandover(text: string): HandoverReason | null {
  if (ASKS_FOR_HUMAN.test(text)) return "klant_wil_mens";
  return null;
}

// Catches an actual price/discount commitment slipping into the model's
// reply (a real amount or an absolute promise) -- not just the topic being
// mentioned, since "dat stem ik af met Rik" must stay allowed.
const STATES_COMMITMENT =
  /(€\s?\d|\d+\s*(euro|eur)\b|\d+\s*,-|\d+\s*%|\bgratis\b|\bgegarandeerd\b)/i;

const PROMISES_AVAILABILITY =
  /\b(is|zijn|staat|staan)\s+(nog\s+)?(vrij|beschikbaar)\b|\b(wij|we)\s+(leveren|bezorgen|brengen)\b|\b(voorlopige\s+)?reservering\b|\bgereserveerd\b/i;

// Checked on the model's reply, before sending it.
export function detectOutboundViolation(reply: string): HandoverReason | null {
  if (STATES_COMMITMENT.test(reply)) return "weet_het_niet";
  if (PROMISES_AVAILABILITY.test(reply)) return "weet_het_niet";
  return null;
}

const HANDOFF = "Ik geef je bericht door aan Rik van Sonilux; hij neemt zo snel mogelijk persoonlijk contact met je op.";

export const HANDOVER_MESSAGES: Record<HandoverReason, string> = {
  klant_wil_mens: `Prima! ${HANDOFF}`,
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
