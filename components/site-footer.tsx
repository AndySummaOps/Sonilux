"use client"

import Link from "next/link"
import { MapPin, Phone, Mail } from "lucide-react"
import { Logo } from "@/components/logo"
import { useCategories } from "@/lib/use-categories"

export function SiteFooter() {
  const { categories } = useCategories()

  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="flex flex-col gap-4">
          <Logo size="footer" />
          <p className="max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
            Limburgs familiebedrijf in verhuur van LED- en eventmaterialen voor
            feesten, festivals en zakelijke evenementen.
          </p>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold text-foreground">Producten</h2>
          <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/producten?categorie=${c.slug}`}
                  className="transition-colors hover:text-foreground"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold text-foreground">Navigatie</h2>
          <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
            <li>
              <Link href="/over-ons" className="transition-colors hover:text-foreground">
                Over ons
              </Link>
            </li>
            <li>
              <Link href="/offerte" className="transition-colors hover:text-foreground">
                Offerte aanvragen
              </Link>
            </li>
            <li>
              <Link href="/faq" className="transition-colors hover:text-foreground">
                Veelgestelde vragen
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition-colors hover:text-foreground">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold text-foreground">Contact</h2>
          <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2.5">
              <Phone className="size-4 text-accent" />
              <span>+31 (0)6 00 00 00 00</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="size-4 text-accent" />
              <span>info@sonilux.nl</span>
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin className="size-4 text-accent" />
              <span>Regio Limburg</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Sonilux. Alle rechten voorbehouden.</p>
          <p>Materiaalverhuur voor feesten &amp; evenementen in Limburg.</p>
        </div>
      </div>
    </footer>
  )
}
