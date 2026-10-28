// WhatsApp notifications to Rik (new request / handover), sent from the bot
// number to Rik's own number.
//
// Rik usually hasn't messaged the bot number in the last 24 hours, so a
// plain text message would not be delivered. When a template name is
// configured, the approved template is used; otherwise plain text (fine for
// testing right after you've sent the bot a message yourself).
//
// Templates (category Utility, language Dutch), created in WhatsApp Manager:
//
//   sonilux_nieuwe_aanvraag
//     Nieuwe aanvraag via de WhatsApp-assistent.
//
//     Naam: {{1}}
//     Telefoon: {{2}}
//     Datum: {{3}}
//     Locatie: {{4}}
//     Gasten: {{5}}
//     Type event: {{6}}
//     Producten: {{7}}
//
//     Bekijk de aanvraag in het admin-scherm.
//
//   sonilux_overdracht
//     Een klant wil contact via de WhatsApp-assistent.
//
//     Klant: {{1}}
//     Telefoon: {{2}}
//     Reden: {{3}}
//     Laatste bericht: {{4}}
//
//     De assistent reageert niet meer in dit gesprek. Antwoord via het admin-scherm.

import { type MetaConfig, sendTemplate, sendText } from "../_shared/whatsapp.ts";
import type { HandoverReason, RequestDraft } from "./prompt.ts";

export type NotifyConfig = MetaConfig & {
  rikNumber: string;
  templateRequest: string;
  templateHandover: string;
  templateLanguage: string;
};

export const HANDOVER_REASON_LABELS: Record<HandoverReason, string> = {
  klant_wil_mens: "klant wil iemand spreken",
  prijs_korting_garantie: "vraag over prijs, korting of garantie",
  weet_het_niet: "assistent kon de vraag niet beantwoorden",
};

function formatDate(isoDate: string | null) {
  if (!isoDate) return "-";
  const date = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(date);
}

export function requestParams(phone: string, request: RequestDraft): string[] {
  return [
    request.name ?? "-",
    phone,
    formatDate(request.event_date),
    request.location ?? "-",
    request.guests ? String(request.guests) : "-",
    request.event_type ?? "-",
    request.products.length ? request.products.join(", ") : "-",
  ];
}

export function handoverParams(
  customerName: string,
  phone: string,
  reason: HandoverReason,
  lastMessage: string,
): string[] {
  const shortMessage = lastMessage.length > 300 ? `${lastMessage.slice(0, 297)}...` : lastMessage;
  return [customerName, phone, HANDOVER_REASON_LABELS[reason], shortMessage];
}

export function requestText(params: string[]) {
  const [name, phone, date, location, guests, eventType, products] = params;
  return [
    "*Nieuwe aanvraag via de WhatsApp-assistent*",
    "",
    `Naam: ${name}`,
    `Telefoon: ${phone}`,
    `Datum: ${date}`,
    `Locatie: ${location}`,
    `Gasten: ${guests}`,
    `Type event: ${eventType}`,
    `Producten: ${products}`,
    "",
    "Bekijk de aanvraag in het admin-scherm.",
  ].join("\n");
}

export function handoverText(params: string[]) {
  const [name, phone, reason, lastMessage] = params;
  return [
    "*Een klant wil contact via de WhatsApp-assistent*",
    "",
    `Klant: ${name}`,
    `Telefoon: ${phone}`,
    `Reden: ${reason}`,
    `Laatste bericht: ${lastMessage}`,
    "",
    "De assistent reageert niet meer in dit gesprek. Antwoord via het admin-scherm.",
  ].join("\n");
}

async function notify(cfg: NotifyConfig, templateName: string, params: string[], text: string) {
  if (!cfg.rikNumber) {
    console.warn("[notify] RIK_WHATSAPP_NUMBER not set, notification skipped");
    return;
  }
  if (templateName) {
    await sendTemplate(cfg, cfg.rikNumber, { name: templateName, language: cfg.templateLanguage, params });
  } else {
    await sendText(cfg, cfg.rikNumber, text);
  }
}

export function notifyRequest(cfg: NotifyConfig, phone: string, request: RequestDraft) {
  const params = requestParams(phone, request);
  return notify(cfg, cfg.templateRequest, params, requestText(params));
}

export function notifyHandover(
  cfg: NotifyConfig,
  customerName: string,
  phone: string,
  reason: HandoverReason,
  lastMessage: string,
) {
  const params = handoverParams(customerName, phone, reason, lastMessage);
  return notify(cfg, cfg.templateHandover, params, handoverText(params));
}
