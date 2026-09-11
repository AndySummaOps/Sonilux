"use client"

import { useEffect, useState, useCallback } from "react"
import { fetchProducts } from "@/lib/products"
import type { Product } from "@/lib/data"

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    const result = await fetchProducts()
    setProducts(result)
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { products, loading, refetch }
}
