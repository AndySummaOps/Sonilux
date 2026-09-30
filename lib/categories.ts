import { supabase } from "@/lib/supabase"
import { slugify } from "@/lib/products"
import type { Category } from "@/lib/data"

export type { Category }

type CategoryRow = {
  id: string
  slug: string
  name: string
  description: string | null
  sort_order: number
}

function mapRow(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    sortOrder: row.sort_order,
  }
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("product_categories")
    .select("id, slug, name, description, sort_order")
    .order("sort_order")
    .order("name")

  if (error) {
    console.error("[Sonilux] Categorieën ophalen mislukt:", error)
    return []
  }
  return (data as CategoryRow[]).map(mapRow)
}

async function generateUniqueCategorySlug(name: string): Promise<string> {
  const base = slugify(name) || "categorie"
  let candidate = base
  let suffix = 2
  for (;;) {
    const { data } = await supabase
      .from("product_categories")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle()
    if (!data) return candidate
    candidate = `${base}-${suffix}`
    suffix += 1
  }
}

export type CategoryInput = {
  name: string
  description: string
}

export async function createCategory(input: CategoryInput): Promise<{ error?: string }> {
  const { data: last } = await supabase
    .from("product_categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const slug = await generateUniqueCategorySlug(input.name)

  const { error } = await supabase.from("product_categories").insert({
    slug,
    name: input.name,
    description: input.description,
    sort_order: (last?.sort_order ?? 0) + 1,
  })

  if (error) {
    console.error("[Sonilux] Categorie aanmaken mislukt:", error)
    return { error: "Opslaan is mislukt. Probeer het opnieuw." }
  }
  return {}
}

/**
 * De slug blijft bij het bewerken bewust hetzelfde, zodat bestaande links
 * (bijv. /producten?categorie=led-barren) blijven werken.
 */
export async function updateCategory(
  id: string,
  input: CategoryInput
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("product_categories")
    .update({ name: input.name, description: input.description })
    .eq("id", id)

  if (error) {
    console.error("[Sonilux] Categorie bijwerken mislukt:", error)
    return { error: "Opslaan is mislukt. Probeer het opnieuw." }
  }
  return {}
}

/** Wisselt de volgorde van twee categorieën om (voor de omhoog/omlaag-knoppen). */
export async function swapCategoryOrder(a: Category, b: Category): Promise<{ error?: string }> {
  // Bij gelijke sort_order zou een wissel niets doen; geef ze dan een eigen plek.
  const orderA = a.sortOrder === b.sortOrder ? b.sortOrder + 1 : b.sortOrder
  const orderB = a.sortOrder

  const results = await Promise.all([
    supabase.from("product_categories").update({ sort_order: orderA }).eq("id", a.id),
    supabase.from("product_categories").update({ sort_order: orderB }).eq("id", b.id),
  ])
  const failed = results.find((r) => r.error)
  if (failed?.error) {
    console.error("[Sonilux] Volgorde aanpassen mislukt:", failed.error)
    return { error: "Volgorde aanpassen is mislukt. Probeer het opnieuw." }
  }
  return {}
}

/**
 * Verwijdert een categorie. Heeft de categorie nog producten, dan worden die
 * eerst verplaatst naar `moveProductsToId` (verplicht in dat geval).
 */
export async function deleteCategory(
  id: string,
  moveProductsToId?: string
): Promise<{ error?: string }> {
  if (moveProductsToId) {
    const { error: moveError } = await supabase
      .from("products")
      .update({ category_id: moveProductsToId })
      .eq("category_id", id)
    if (moveError) {
      console.error("[Sonilux] Producten verplaatsen mislukt:", moveError)
      return { error: "Producten verplaatsen is mislukt. Probeer het opnieuw." }
    }
  }

  const { error } = await supabase.from("product_categories").delete().eq("id", id)
  if (error) {
    console.error("[Sonilux] Categorie verwijderen mislukt:", error)
    return {
      error:
        error.code === "23503"
          ? "Deze categorie bevat nog producten. Verplaats die eerst naar een andere categorie."
          : "Verwijderen is mislukt. Probeer het opnieuw.",
    }
  }
  return {}
}
