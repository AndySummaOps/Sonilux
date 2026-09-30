"use client"

import { useEffect, useState, useCallback } from "react"
import { fetchCategories } from "@/lib/categories"
import type { Category } from "@/lib/data"

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    const result = await fetchCategories()
    setCategories(result)
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { categories, loading, refetch }
}
