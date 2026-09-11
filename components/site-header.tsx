"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet"
import { Logo } from "@/components/logo"
import { QuoteCtaButton } from "@/components/quote-cta-button"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Home" },
  { href: "/producten", label: "Producten" },
  { href: "/over-ons", label: "Over ons" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.75rem] w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Hoofdmenu">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <QuoteCtaButton className="hidden sm:inline-flex" size="header" />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" className="md:hidden" aria-label="Menu openen">
                  <Menu />
                </Button>
              }
            />
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigatiemenu</SheetTitle>
              <div className="flex h-[4.75rem] items-center border-b border-border px-6">
                <Logo />
              </div>
              <nav className="flex flex-col gap-1 p-4" aria-label="Mobiel menu">
                {links.map((link) => (
                  <SheetClose
                    key={link.href}
                    render={
                      <Link
                        href={link.href}
                        className="rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    }
                  />
                ))}
                <QuoteCtaButton
                  size="lg"
                  className="mt-4 w-full"
                  onClick={() => setOpen(false)}
                />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
