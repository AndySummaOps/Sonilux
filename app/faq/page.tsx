import type { Metadata } from "next"
import Link from "next/link"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { QuoteCtaButton } from "@/components/quote-cta-button"
import { faqs } from "@/lib/data"

export const metadata: Metadata = {
  title: "Veelgestelde vragen (FAQ)",
  description:
    "Antwoorden op veelgestelde vragen over het aanvragen van een offerte, beschikbaarheid, levering en samenwerking met Sonilux verhuur in Limburg.",
}

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <div className="mb-12 text-center">
        <p className="mb-3 text-sm font-medium tracking-widest text-primary uppercase">
          FAQ
        </p>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-5xl">
          Veelgestelde vragen
        </h1>
        <p className="mt-4 text-pretty text-muted-foreground">
          Niet gevonden wat je zoekt? Neem gerust contact met ons op, we helpen
          je graag verder.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`item-${i}`}
            className="rounded-xl border border-border/60 bg-card/40 px-5 mb-3 last:mb-0"
          >
            <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-pretty leading-relaxed text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-12 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-8 text-center">
        <h2 className="text-xl font-semibold">Nog vragen?</h2>
        <p className="mx-auto mt-2 max-w-md text-pretty text-muted-foreground">
          Ons team staat klaar om je te helpen bij het samenstellen van de
          perfecte verhuurmaterialen voor jouw evenement.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <QuoteCtaButton size="lg" />
          <Button asChild size="lg" variant="outline">
            <Link href="/contact">Contact opnemen</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
