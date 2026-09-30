"use client"

import Link from "next/link"
import { ArrowUpRight, Lightbulb, Square, Box, Boxes, PartyPopper } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useCategories } from "@/lib/use-categories"

const icons: Record<string, typeof Lightbulb> = {
  "led-barren": Square,
  "led-statafels": Box,
  "led-verlichting": Lightbulb,
  "led-kubussen": Boxes,
  evenementen: PartyPopper,
}

export function Categories() {
  const { categories } = useCategories()

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent">
            Assortiment
          </p>
          <h2 className="mt-2 text-balance font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Onze productcategorieën
          </h2>
        </div>
        <Link
          href="/producten"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Bekijk alle producten
          <ArrowUpRight className="size-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, i) => {
          const Icon = icons[category.slug] ?? PartyPopper
          const featured = i === 0
          return (
            <Link
              key={category.slug}
              href={`/producten?categorie=${category.slug}`}
              className={featured ? "sm:col-span-2 lg:col-span-1 lg:row-span-2" : ""}
            >
              <Card className="group relative flex h-full min-h-44 flex-col justify-between overflow-hidden p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_40px_-12px_var(--glow-purple)]">
                <div className="absolute -right-6 -top-6 size-28 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100" />
                <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-secondary text-accent">
                  <Icon className="size-6" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-semibold text-foreground">
                    {category.name}
                  </h3>
                  <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                    {category.description}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Bekijken
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
