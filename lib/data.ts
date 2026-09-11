export type Category = {
  slug: string
  name: string
  description: string
}

export type Faq = {
  question: string
  answer: string
}

export type Product = {
  id: string
  slug: string
  name: string
  categorySlug: string
  shortDescription: string
  description: string
  available: boolean
  dimensions: string
  specifications: { label: string; value: string }[]
  image: string
}

export const categories: Category[] = [
  {
    slug: "led-barren",
    name: "LED Barren",
    description:
      "Strakke, oplichtende bars en toogelementen die elk feest of event direct cachet geven.",
  },
  {
    slug: "led-statafels",
    name: "LED Statafels",
    description:
      "Sfeervolle, kleurveranderende statafels voor recepties, beurzen en netwerkmomenten.",
  },
  {
    slug: "led-verlichting",
    name: "LED Verlichting",
    description:
      "Professionele lichtoplossingen om je locatie of podium volledig tot leven te brengen.",
  },
  {
    slug: "led-kubussen",
    name: "LED Kubussen",
    description:
      "Veelzijdige, draadloze kubussen als zitelement, tafel of decoratief accent.",
  },
  {
    slug: "evenementen",
    name: "Evenementen",
    description:
      "Aanvullende materialen voor festivals, bruiloften en grote evenementen.",
  },
]

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug)
}

export const faqs: Faq[] = [
  {
    question: "Hoe vraag ik een offerte aan?",
    answer:
      "Voeg producten toe via de productpagina's en ga naar 'Offerte aanvragen'. Vul je gegevens en eventdetails in; wij nemen daarna persoonlijk contact met je op met een passend voorstel.",
  },
  {
    question: "Is de offerte vrijblijvend?",
    answer:
      "Ja. Je ontvangt een vrijblijvende offerte op maat. Pas na jouw akkoord plannen we de levering en eventuele op- of afbouw in.",
  },
  {
    question: "Leveren jullie ook buiten Limburg?",
    answer:
      "Sonilux is geworteld in Limburg en werkt voornamelijk in de regio. Voor events buiten Limburg kijken we graag mee naar de mogelijkheden en transportkosten.",
  },
  {
    question: "Kunnen jullie helpen met opbouw en afbouw?",
    answer:
      "Ja, afhankelijk van het materiaal en de locatie kunnen we opbouw en afbouw verzorgen. Geef dit door bij je offerteaanvraag, dan stemmen we het vooraf af.",
  },
  {
    question: "Hoe ver van tevoren moet ik reserveren?",
    answer:
      "Hoe eerder, hoe beter — zeker in het hoogseizoen rond feesten en festivals. Neem gerust contact op als je datum dichtbij is; soms is er nog materiaal beschikbaar.",
  },
  {
    question: "Wat als materiaal niet beschikbaar is?",
    answer:
      "Op de website zie je per product of het beschikbaar is. Is iets niet op voorraad? Vraag een offerte aan; vaak kunnen we een alternatief voorstellen of de beschikbaarheid op jouw datum checken.",
  },
  {
    question: "Werken jullie voor particulieren én bedrijven?",
    answer:
      "Ja. Van communies en verjaardagen tot festivals, beurzen en zakelijke events — we leveren voor particuliere en zakelijke klanten.",
  },
  {
    question: "Hoe werkt betaling?",
    answer:
      "De betalingsvoorwaarden bespreken we in de offerte. Meestal vragen we een bevestiging en betaling volgens afspraak vóór of rond de leverdatum.",
  },
]
