"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ProductCard } from "@/components/product-card"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { useCategories } from "@/lib/use-categories"
import { useProducts } from "@/lib/use-products"

export function ProductGrid() {
  const searchParams = useSearchParams()
  const initial = searchParams.get("categorie") ?? "all"
  const [active, setActive] = useState(initial)
  const { products, loading } = useProducts()
  const { categories } = useCategories()

  const filtered = useMemo(() => {
    if (active === "all") return products
    return products.filter((p) => p.categorySlug === active)
  }, [active, products])

  return (
    <div className="flex flex-col gap-8">
      <div className="overflow-x-auto pb-1">
        <ToggleGroup
          variant="outline"
          value={[active]}
          onValueChange={(value) => {
            const next = value[0] ?? "all"
            setActive(next)
          }}
          className="w-max"
        >
          <ToggleGroupItem value="all">Alle producten</ToggleGroupItem>
          {categories.map((c) => (
            <ToggleGroupItem key={c.slug} value={c.slug}>
              {c.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <p className="text-sm text-muted-foreground">
        {loading
          ? "Producten laden…"
          : `${filtered.length} ${filtered.length === 1 ? "product" : "producten"} gevonden`}
      </p>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : !loading ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Geen producten gevonden</EmptyTitle>
            <EmptyDescription>
              Er zijn momenteel geen producten in deze categorie.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
    </div>
  )
}
