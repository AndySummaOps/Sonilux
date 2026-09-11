"use client"

import { useProducts } from "@/lib/use-products"
import { ProductCard } from "@/components/product-card"

export function FeaturedProducts() {
  const { products } = useProducts()
  const featured = products.filter((p) => p.available).slice(0, 6)

  if (featured.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent">
          Uitgelicht
        </p>
        <h2 className="mt-2 text-balance font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Populaire verhuurmaterialen
        </h2>
        <p className="mt-3 text-pretty text-muted-foreground">
          Een greep uit ons assortiment. Voeg producten toe aan je offerte en
          wij nemen snel contact met je op.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
