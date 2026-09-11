"use client"

import Image from "next/image"
import Link from "next/link"
import { Check, Plus } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useQuote } from "@/lib/quote-context"
import { toast } from "sonner"
import { assetPath } from "@/lib/asset-path"
import type { Product } from "@/lib/data"

export function ProductCard({ product }: { product: Product }) {
  const { addItem, has } = useQuote()
  const inQuote = has(product.slug)

  return (
    <Card className="group flex flex-col overflow-hidden p-0 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_40px_-12px_var(--glow-purple)]">
      <Link
        href={`/producten/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-secondary"
      >
        <Image
          src={assetPath(product.image || "/placeholder.svg")}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3">
          <Badge
            variant={product.available ? "default" : "secondary"}
            className={
              product.available
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-muted-foreground"
            }
          >
            {product.available ? "Beschikbaar" : "Niet beschikbaar"}
          </Badge>
        </div>
      </Link>

      <CardContent className="flex flex-1 flex-col gap-2 px-5 pt-5">
        <Link href={`/producten/${product.slug}`}>
          <h3 className="text-balance font-heading text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <p className="mt-auto line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {product.shortDescription}
        </p>
      </CardContent>

      <CardFooter className="flex gap-2 px-5 pb-5">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={inQuote}
          onClick={() => {
            addItem(product.slug, product.name)
            toast.success(`${product.name} toegevoegd aan offerte`)
          }}
        >
          {inQuote ? (
            <>
              <Check data-icon="inline-start" />
              Toegevoegd
            </>
          ) : (
            <>
              <Plus data-icon="inline-start" />
              Offerte
            </>
          )}
        </Button>
        <Button asChild size="sm" className="flex-1">
          <Link href={`/producten/${product.slug}`}>Bekijk</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
