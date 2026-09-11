import type { Metadata } from "next"
import { Phone, Mail, MapPin, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ContactForm } from "@/components/contact-form"
import { QuoteCtaButton } from "@/components/quote-cta-button"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Neem contact op met Sonilux voor de verhuur van LED- en eventmaterialen in Limburg. Bel, mail of stuur een bericht via het contactformulier.",
}

const details = [
  { icon: Phone, label: "Telefoon", value: "+31 (0)6 00 00 00 00" },
  { icon: Mail, label: "E-mail", value: "info@sonilux.nl" },
  { icon: MapPin, label: "Regio", value: "Actief in heel Limburg" },
]

const hours = [
  { day: "Maandag t/m vrijdag", time: "09:00 – 18:00" },
  { day: "Zaterdag", time: "10:00 – 16:00" },
  { day: "Zondag", time: "Op afspraak" },
]

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mb-12 max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent">
          Contact
        </p>
        <h1 className="mt-2 text-balance font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Neem contact op
        </h1>
        <p className="mt-4 text-pretty text-muted-foreground sm:text-lg">
          Vragen over onze materialen of direct een offerte nodig? We helpen je
          graag persoonlijk verder.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardContent className="flex flex-col gap-5 pt-6">
              {details.map((d) => (
                <div key={d.label} className="flex items-center gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <d.icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{d.label}</p>
                    <p className="font-medium text-foreground">{d.value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center gap-2.5">
                <Clock className="size-5 text-accent" />
                <h2 className="font-heading text-base font-semibold text-foreground">
                  Openingstijden
                </h2>
              </div>
              <ul className="flex flex-col gap-2.5 text-sm">
                {hours.map((h) => (
                  <li
                    key={h.day}
                    className="flex items-center justify-between border-b border-border/60 pb-2.5 last:border-0 last:pb-0"
                  >
                    <span className="text-muted-foreground">{h.day}</span>
                    <span className="font-medium text-foreground">{h.time}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-radial-glow">
            <CardContent className="flex flex-col gap-3 pt-6">
              <h2 className="font-heading text-base font-semibold text-foreground">
                Liever direct een offerte?
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Stel je materialen samen en ontvang vrijblijvend een voorstel.
              </p>
              <QuoteCtaButton size="lg" className="w-full" />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-6 font-heading text-xl font-semibold text-foreground">
                Stuur ons een bericht
              </h2>
              <ContactForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
