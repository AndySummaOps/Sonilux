import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacyverklaring",
  description:
    "Hoe Sonilux omgaat met je gegevens via de website, het offerteformulier en de WhatsApp-assistent.",
}

const sections = [
  {
    title: "Wie zijn wij",
    body: [
      "Sonilux is een Limburgs familiebedrijf dat LED- en eventmaterialen verhuurt. Wij zijn verantwoordelijk voor de verwerking van de persoonsgegevens die op deze pagina worden beschreven. Je bereikt ons via info@sonilux.nl.",
    ],
  },
  {
    title: "Welke gegevens we verwerken",
    body: [
      "Via het contact- en offerteformulier: je naam, e-mailadres, telefoonnummer, de datum en het aantal gasten van je evenement, de gewenste producten en je bericht.",
      "Via WhatsApp: je telefoonnummer, je WhatsApp-profielnaam, de berichten die je ons stuurt en de gegevens die je deelt voor een aanvraag, zoals je naam, de datum, locatie en het type van je evenement, het aantal gasten en de gewenste producten.",
    ],
  },
  {
    title: "De WhatsApp-assistent",
    body: [
      "Berichten aan ons WhatsApp-nummer worden eerst beantwoord door een digitale assistent. Die beantwoordt vragen over ons aanbod, stelt passende producten voor en verzamelt je aanvraag. De assistent neemt zelf geen beslissingen: Rik van Sonilux bekijkt elke aanvraag en neemt persoonlijk contact met je op. Wil je liever direct iemand spreken, zeg het dan; het gesprek gaat dan naar Rik.",
      "Om je berichten te beantwoorden wordt de tekst van het gesprek verwerkt door een AI-dienst van Google (Gemini). Prijzen, kortingen en toezeggingen over beschikbaarheid komen altijd van Rik zelf, nooit van de assistent.",
    ],
  },
  {
    title: "Waarvoor we je gegevens gebruiken",
    body: [
      "Alleen om je vragen te beantwoorden, je aanvraag of offerte te behandelen en contact met je op te nemen over je evenement. We gebruiken je gegevens niet voor reclame en verkopen ze niet aan anderen. We sturen je via WhatsApp alleen berichten als antwoord op jouw berichten.",
    ],
  },
  {
    title: "Met wie we gegevens delen",
    body: [
      "We gebruiken een aantal diensten om dit mogelijk te maken: Meta (WhatsApp) voor het versturen en ontvangen van berichten, Google (Gemini) voor de digitale assistent en Supabase voor het veilig opslaan van aanvragen en gesprekken. Deze partijen verwerken je gegevens alleen in onze opdracht.",
    ],
  },
  {
    title: "Hoe lang we gegevens bewaren",
    body: [
      "We bewaren je gegevens niet langer dan nodig is om je aanvraag af te handelen en aan onze wettelijke verplichtingen te voldoen, zoals de fiscale bewaarplicht voor facturen.",
    ],
  },
  {
    title: "Jouw rechten",
    body: [
      "Je mag altijd vragen welke gegevens we van je hebben, ze laten aanpassen of laten verwijderen. Stuur daarvoor een e-mail naar info@sonilux.nl. Ben je het niet eens met hoe we met je gegevens omgaan, dan kun je een klacht indienen bij de Autoriteit Persoonsgegevens.",
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent">Privacy</p>
      <h1 className="mt-4 text-balance font-heading text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
        Privacyverklaring
      </h1>
      <p className="mt-6 text-pretty leading-relaxed text-muted-foreground">
        Hier lees je welke gegevens Sonilux verwerkt als je de website, het
        offerteformulier of onze WhatsApp-assistent gebruikt, en wat we ermee doen.
      </p>

      <div className="mt-12 flex flex-col gap-10">
        {sections.map((section) => (
          <section key={section.title} className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-semibold text-foreground">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="text-pretty leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
