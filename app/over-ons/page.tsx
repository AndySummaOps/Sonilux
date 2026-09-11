import Image from "next/image"
import type { Metadata } from "next"
import { Heart, ShieldCheck, Sparkles, Handshake } from "lucide-react"
import { QuoteCtaButton } from "@/components/quote-cta-button"
import { assetPath } from "@/lib/asset-path"

export const metadata: Metadata = {
  title: "Over ons",
  description:
    "Sonilux is een Limburgs familiebedrijf met jaren ervaring in de verhuur van LED- en eventmaterialen voor particuliere en zakelijke klanten.",
}

const values = [
  {
    icon: Heart,
    title: "Familiebedrijf",
    description:
      "Sonilux is een echt Limburgs familiebedrijf. Persoonlijk contact en betrokkenheid staan bij ons voorop.",
  },
  {
    icon: Sparkles,
    title: "Jaren ervaring",
    description:
      "Met jarenlange ervaring bij feesten, festivals en evenementen weten we wat werkt en wat niet.",
  },
  {
    icon: Handshake,
    title: "Particulier & zakelijk",
    description:
      "Van een intieme communie tot grootschalige zakelijke events, waaronder samenwerkingen rond André Rieu.",
  },
  {
    icon: ShieldCheck,
    title: "Betrouwbare levering",
    description:
      "Professionele uitstraling, persoonlijke service en materiaal dat altijd op tijd en in topstaat geleverd wordt.",
  },
]

export default function OverOnsPage() {
  return (
    <div>
      <section className="border-b border-border/60 bg-radial-glow">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="flex flex-col gap-6">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent">
              Over Sonilux
            </p>
            <h1 className="text-balance font-heading text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              Een Limburgs familiebedrijf dat evenementen laat stralen
            </h1>
            <p className="text-pretty leading-relaxed text-muted-foreground sm:text-lg">
              Sonilux verhuurt al jaren met passie de juiste materialen voor
              feesten, festivals en evenementen in heel Limburg. Wat begon vanuit
              een liefde voor sfeer en techniek, is uitgegroeid tot een
              betrouwbare partner voor zowel particuliere als zakelijke klanten.
            </p>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              We geloven in persoonlijke service, korte lijnen en materiaal dat
              indruk maakt. Of het nu gaat om een bruiloft, een communie, een
              beurs of een groot festival: wij denken met je mee en zorgen dat
              alles tot in de puntjes geregeld is.
            </p>
            <div>
              <QuoteCtaButton size="lg" />
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border">
            <Image
              src={assetPath("/about.png")}
              alt="Het team van Sonilux bouwt een evenement op"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-balance font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Waar we voor staan
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {values.map((value) => (
            <div
              key={value.title}
              className="flex gap-4 rounded-xl border border-border bg-card/50 p-6"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <value.icon className="size-5" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {value.title}
                </h3>
                <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 rounded-2xl border border-border bg-card/50 p-8 sm:grid-cols-4 sm:p-12">
          {[
            { value: "10+", label: "Jaar ervaring" },
            { value: "500+", label: "Geslaagde events" },
            { value: "100%", label: "Regio Limburg" },
            { value: "1 dag", label: "Reactietijd" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-heading text-3xl font-semibold text-primary sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
