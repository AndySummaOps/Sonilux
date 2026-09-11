import type { Metadata } from "next"
import { ProductDetail } from "@/components/product-detail"
import { fetchProducts } from "@/lib/products"

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const products = await fetchProducts()
  return products.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const products = await fetchProducts()
  const product = products.find((p) => p.slug === slug)
  if (!product) return { title: "Product niet gevonden" }
  return {
    title: product.name,
    description: product.shortDescription,
  }
}

export default async function ProductDetailPage({ params }: Params) {
  const { slug } = await params
  return <ProductDetail slug={slug} />
}
