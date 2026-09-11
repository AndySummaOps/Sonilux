import { supabase } from "@/lib/supabase"
import type { Product, Category } from "@/lib/data"

export type { Product, Category }

type ProductRow = {
  id: string
  slug: string
  name: string
  short_description: string | null
  description: string | null
  dimensions: string | null
  specifications: { label: string; value: string }[] | null
  image_url: string | null
  is_active: boolean
  product_categories: { slug: string } | { slug: string }[] | null
}

const PRODUCT_COLUMNS =
  "id, slug, name, short_description, description, dimensions, specifications, image_url, is_active, product_categories(slug)"

function categorySlugFromRow(row: ProductRow): string {
  const rel = row.product_categories
  if (!rel) return ""
  return Array.isArray(rel) ? (rel[0]?.slug ?? "") : rel.slug
}

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    categorySlug: categorySlugFromRow(row),
    shortDescription: row.short_description ?? "",
    description: row.description ?? "",
    available: row.is_active,
    dimensions: row.dimensions ?? "",
    specifications: row.specifications ?? [],
    image: row.image_url ?? "",
  }
}

/**
 * Alle producten, ongeacht beschikbaarheid — "beschikbaar" is puur een
 * badge op de site, geen zichtbaarheidsfilter (zie ook de RLS policy
 * "Products are publicly readable"). Prijzen worden niet getoond aan
 * klanten en zijn daarom hier niet opgenomen.
 */
export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("name")

  if (error) {
    console.error("[Sonilux] Producten ophalen mislukt:", error)
    return []
  }
  return (data as unknown as ProductRow[]).map(mapRow)
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "product"
  let candidate = base
  let suffix = 2
  for (;;) {
    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle()
    if (!data) return candidate
    candidate = `${base}-${suffix}`
    suffix += 1
  }
}

export type ProductInput = {
  name: string
  categorySlug: string
  shortDescription: string
  description: string
  dimensions: string
  available: boolean
  imageUrl: string
}

async function categoryIdBySlug(categorySlug: string): Promise<string | null> {
  const { data } = await supabase
    .from("product_categories")
    .select("id")
    .eq("slug", categorySlug)
    .maybeSingle()
  return data?.id ?? null
}

export async function createProduct(input: ProductInput): Promise<{ error?: string }> {
  const categoryId = await categoryIdBySlug(input.categorySlug)
  if (!categoryId) return { error: "Categorie niet gevonden." }

  const slug = await generateUniqueSlug(input.name)

  const { error } = await supabase.from("products").insert({
    category_id: categoryId,
    slug,
    name: input.name,
    short_description: input.shortDescription,
    description: input.description,
    dimensions: input.dimensions,
    image_url: input.imageUrl || null,
    is_active: input.available,
  })

  if (error) {
    console.error("[Sonilux] Product aanmaken mislukt:", error)
    return { error: "Opslaan is mislukt. Probeer het opnieuw." }
  }
  return {}
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<{ error?: string }> {
  const categoryId = await categoryIdBySlug(input.categorySlug)
  if (!categoryId) return { error: "Categorie niet gevonden." }

  const { error } = await supabase
    .from("products")
    .update({
      category_id: categoryId,
      name: input.name,
      short_description: input.shortDescription,
      description: input.description,
      dimensions: input.dimensions,
      image_url: input.imageUrl || null,
      is_active: input.available,
    })
    .eq("id", id)

  if (error) {
    console.error("[Sonilux] Product bijwerken mislukt:", error)
    return { error: "Opslaan is mislukt. Probeer het opnieuw." }
  }
  return {}
}

export async function deleteProduct(id: string): Promise<{ error?: string }> {
  const { error } = await supabase.from("products").delete().eq("id", id)
  if (error) {
    console.error("[Sonilux] Product verwijderen mislukt:", error)
    return { error: "Verwijderen is mislukt. Probeer het opnieuw." }
  }
  return {}
}

export async function uploadProductImage(
  file: File
): Promise<{ url?: string; error?: string }> {
  const ext = file.name.split(".").pop() || "jpg"
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) {
    console.error("[Sonilux] Foto uploaden mislukt:", error)
    return { error: "Foto uploaden is mislukt. Probeer het opnieuw." }
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path)
  return { url: data.publicUrl }
}
