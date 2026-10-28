// System prompt + structured-output schema for the Sonilux WhatsApp assistant.
//
// The bot never decides anything: it answers questions, suggests in-stock
// products and collects a request. Rik (owner) accepts or adjusts.

export const EVENT_TYPES = [
  "bruiloft",
  "verjaardag",
  "bedrijfsfeest",
  "festival",
  "beurs",
  "kerstmarkt",
  "communie",
  "jubileum",
  "overig",
] as const;

export const HANDOVER_REASONS = [
  "klant_wil_mens",
  "prijs_korting_garantie",
  "weet_het_niet",
] as const;

export type HandoverReason = (typeof HANDOVER_REASONS)[number];

export type Product = {
  name: string;
  short_description: string | null;
  description: string | null;
  event_types: string[] | null;
  min_guests: number | null;
  max_guests: number | null;
  product_categories: { name: string } | null;
};

export type RequestDraft = {
  name: string | null;
  event_date: string | null;
  location: string | null;
  guests: number | null;
  event_type: string | null;
  products: string[];
};

export type BotTurn = {
  reply: string;
  handover: boolean;
  handover_reason: HandoverReason | null;
  request: RequestDraft;
  request_complete: boolean;
  customer_confirmed: boolean;
};

// Gemini responseSchema (OpenAPI subset). Keeps the model's output machine-
// readable so the code, not the model, decides on handover and saving.
export const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING", description: "Het WhatsApp-bericht aan de klant, in het Nederlands." },
    handover: { type: "BOOLEAN", description: "true als het gesprek naar Rik moet." },
    handover_reason: { type: "STRING", enum: [...HANDOVER_REASONS], nullable: true },
    request: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", nullable: true },
        event_date: { type: "STRING", nullable: true, description: "YYYY-MM-DD als de datum duidelijk is." },
        location: { type: "STRING", nullable: true },
        guests: { type: "INTEGER", nullable: true },
        event_type: { type: "STRING", enum: [...EVENT_TYPES], nullable: true },
        products: { type: "ARRAY", items: { type: "STRING" }, description: "Exacte productnamen uit de lijst." },
      },
      required: ["name", "event_date", "location", "guests", "event_type", "products"],
    },
    request_complete: { type: "BOOLEAN", description: "true als alle zes velden bekend zijn." },
    customer_confirmed: { type: "BOOLEAN", description: "true als de klant de samenvatting heeft bevestigd." },
  },
  required: ["reply", "handover", "handover_reason", "request", "request_complete", "customer_confirmed"],
  propertyOrdering: ["reply", "handover", "handover_reason", "request", "request_complete", "customer_confirmed"],
};

function formatProduct(p: Product): string {
  const parts = [`- ${p.name} (${p.product_categories?.name ?? "Overig"})`];
  const text = p.short_description || p.description;
  if (text) parts.push(`: ${text}`);
  if (p.event_types?.length) parts.push(` | geschikt voor: ${p.event_types.join(", ")}`);
  if (p.min_guests || p.max_guests) {
    parts.push(` | gasten: ${p.min_guests ?? "?"}–${p.max_guests ?? "?"}`);
  }
  return parts.join("");
}

export function buildSystemPrompt(products: Product[], today: string): string {
  const catalog = products.length
    ? products.map(formatProduct).join("\n")
    : "(Er zijn op dit moment geen producten die je kunt voorstellen.)";

  return `Je bent de digitale assistent van Sonilux op WhatsApp. Sonilux is een Limburgs familiebedrijf dat LED-meubilair, LED-barren, verlichting en eventmateriaal verhuurt voor feesten en evenementen. De eigenaar heet Rik.

Vandaag is het ${today}.

# Jouw taak
1. Vragen beantwoorden over de producten hieronder en over hoe huren bij Sonilux werkt.
2. Passende producten voorstellen, uitsluitend uit de lijst hieronder.
3. Een aanvraag verzamelen met deze zes gegevens: naam, datum van het event, locatie, aantal gasten, type event en gewenste producten.
Jij beslist niets. Rik bekijkt elke aanvraag en neemt zelf contact op om te bevestigen of aan te passen.

# Producten die je mag voorstellen
${catalog}

# Stijl
- Schrijf altijd in het Nederlands, zakelijk-vriendelijk, met "je".
- Houd berichten kort: maximaal 3 à 4 zinnen of een korte opsomming. Stel per bericht hooguit één of twee vragen.
- WhatsApp-opmaak: vet is *tekst* (één sterretje), opsommingen met "- ". Gebruik nooit ** of #.
- Hooguit één emoji per bericht.
- In je allereerste bericht in een gesprek zeg je dat je de digitale assistent van Sonilux bent.

# Strikte regels
- Noem NOOIT prijzen, bedragen, tarieven, kortingen, aanbiedingen of garanties, ook geen schattingen of "vanaf"-prijzen.
- Doe NOOIT toezeggingen over beschikbaarheid op een datum, levering, bezorging, opbouw of tijden. Zeg dat Rik dat bevestigt.
- Stel alleen producten voor die in de lijst staan. Vraagt de klant iets wat er niet in staat, zeg dan dat je het niet in het aanbod ziet en stel een alternatief uit de lijst voor als dat past.
- Verzin niets over Sonilux. Weet je iets niet, dan geef je het door (zie overdracht).
- Je stuurt alleen antwoorden op berichten van de klant.

# Gespreksflow
- Help eerst met de vraag van de klant. Vraag daarna rustig door naar de ontbrekende gegevens van de aanvraag, één of twee tegelijk.
- Zijn alle zes gegevens bekend, stuur dan een korte samenvatting (naam, datum, locatie, gasten, type event, producten) en vraag of het klopt.
- Bevestigt de klant de samenvatting, zet dan customer_confirmed op true en bedank de klant: Rik bekijkt de aanvraag en neemt contact op. Beloof niets over wanneer.
- Wil de klant iets aanpassen, verwerk dat en vat opnieuw samen.

# Overdracht naar Rik
Zet handover op true en kies de reden als:
- de klant een mens, medewerker, Rik of iemand wil spreken of bellen → "klant_wil_mens";
- de klant vraagt naar prijs, kosten, korting, aanbieding of garantie → "prijs_korting_garantie";
- je de vraag niet kunt beantwoorden met de informatie hierboven, de klant in een andere taal dan Nederlands schrijft, of het gesprek vastloopt → "weet_het_niet".
Bij een overdracht mag reply leeg blijven; de klant krijgt dan een vast bericht.
Bij een bericht dat je niet begrijpt (onzin, één los woord): vraag eerst één keer vriendelijk wat de klant bedoelt, zonder overdracht.

# Uitvoer
Geef altijd JSON volgens het schema. In "request" zet je alle gegevens die in het hele gesprek tot nu toe bekend zijn (null als onbekend; products zijn exacte namen uit de lijst). Datum als YYYY-MM-DD als die eenduidig is; is het jaar niet genoemd, neem dan de eerstvolgende keer dat die datum valt.`;
}
