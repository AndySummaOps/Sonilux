// Gemini call with structured (JSON) output and retries on transient errors.

import { type BotTurn, HANDOVER_REASONS, RESPONSE_SCHEMA } from "./prompt.ts";

export type HistoryMessage = { direction: string; content: string | null };

const RETRYABLE_STATUSES = new Set([429, 500, 503]);
const RETRY_DELAYS_MS = [1000, 3000];

export async function callGemini(
  opts: { apiKey: string; model: string; systemPrompt: string; history: HistoryMessage[] },
): Promise<BotTurn> {
  const contents = opts.history
    .filter((m) => m.content)
    .map((m) => ({
      role: m.direction === "inbound" ? "user" : "model",
      parts: [{ text: m.content as string }],
    }));

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: opts.systemPrompt }] },
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
      // Gemini 2.5 counts "thinking" tokens against maxOutputTokens, which
      // cut replies off mid-sentence. Short WhatsApp replies don't need it.
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent?key=${opts.apiKey}`,
      { method: "POST", headers: { "content-type": "application/json" }, body },
    );

    if (res.ok) {
      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
      return parseBotTurn(text);
    }

    const errorText = await res.text();
    if (RETRYABLE_STATUSES.has(res.status) && attempt < RETRY_DELAYS_MS.length) {
      console.warn(`[gemini] ${res.status}, retry ${attempt + 1}`);
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
      continue;
    }
    throw new Error(`Gemini API error ${res.status}: ${errorText}`);
  }
}

export function parseBotTurn(text: string): BotTurn {
  const raw = JSON.parse(text);
  const request = raw.request ?? {};
  const reason = HANDOVER_REASONS.includes(raw.handover_reason) ? raw.handover_reason : null;
  return {
    reply: typeof raw.reply === "string" ? raw.reply.trim() : "",
    handover: raw.handover === true,
    handover_reason: reason,
    request: {
      name: request.name ?? null,
      event_date: request.event_date ?? null,
      location: request.location ?? null,
      guests: Number.isInteger(request.guests) ? request.guests : null,
      event_type: request.event_type ?? null,
      products: Array.isArray(request.products) ? request.products.filter((p: unknown) => typeof p === "string") : [],
    },
    request_complete: raw.request_complete === true,
    customer_confirmed: raw.customer_confirmed === true,
  };
}
