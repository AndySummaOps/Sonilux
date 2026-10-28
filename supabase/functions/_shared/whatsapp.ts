// Sending WhatsApp messages through the Meta Cloud API. Shared by the bot
// webhook and the admin reply function.

const GRAPH_VERSION = "v21.0";

export type MetaConfig = { token: string; phoneNumberId: string };

async function postMessage(cfg: MetaConfig, payload: Record<string, unknown>) {
  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${cfg.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${cfg.token}`,
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    },
  );

  const json = await res.json();
  if (!res.ok) {
    console.error("[whatsapp] Meta send failed:", json);
    throw new Error(`Meta send failed: ${JSON.stringify(json.error ?? json)}`);
  }
  return json.messages?.[0]?.id as string | undefined;
}

// Graph API wants digits only, no "+".
function toGraphNumber(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

// Free-form text. Only delivered within 24 hours after the recipient's last
// message to this number (WhatsApp's customer service window).
export function sendText(cfg: MetaConfig, to: string, body: string) {
  return postMessage(cfg, { to: toGraphNumber(to), type: "text", text: { body } });
}

// Approved template message; works outside the 24-hour window.
export function sendTemplate(
  cfg: MetaConfig,
  to: string,
  template: { name: string; language: string; params: string[] },
) {
  return postMessage(cfg, {
    to: toGraphNumber(to),
    type: "template",
    template: {
      name: template.name,
      language: { code: template.language },
      components: [{
        type: "body",
        parameters: template.params.map((text) => ({ type: "text", text: templateParam(text) })),
      }],
    },
  });
}

// Meta rejects template parameters with newlines, tabs or more than four
// spaces in a row, and empty ones.
export function templateParam(text: string) {
  const clean = text.replace(/[\n\t]+/g, " ").replace(/ {2,}/g, " ").trim();
  return clean || "-";
}
