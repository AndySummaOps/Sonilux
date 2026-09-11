"use client"

import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import Image from "next/image"
import { LogOut, Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldGroup, FieldError } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { supabase } from "@/lib/supabase"
import { deleteProduct } from "@/lib/products"
import { useProducts } from "@/lib/use-products"
import { categories, type Product } from "@/lib/data"
import { assetPath } from "@/lib/asset-path"
import { ProductForm } from "@/components/admin/product-form"
import { toast } from "sonner"

export default function AdminPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return <div className="min-h-[60vh]" />
  }

  return session ? <AdminDashboard /> : <AdminLogin />
}

function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError("Onjuist e-mailadres of wachtwoord.")
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Vul eerst je e-mailadres in.")
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) {
      toast.error("Versturen van reset-e-mail is mislukt.")
    } else {
      toast.success("Check je e-mail voor een link om je wachtwoord opnieuw in te stellen.")
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center px-4 py-14">
      <h1 className="mb-1 font-heading text-2xl font-semibold text-foreground">
        Sonilux Admin
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Log in om producten te beheren.
      </p>

      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="email">E-mailadres</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="password">Wachtwoord</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <FieldError>{error}</FieldError>}
          </Field>
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "Bezig…" : "Inloggen"}
          </Button>
          <Button
            type="button"
            variant="link"
            className="self-start px-0"
            onClick={handleForgotPassword}
          >
            Wachtwoord vergeten?
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}

function AdminDashboard() {
  const { products, loading, refetch } = useProducts()
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  function openCreate() {
    setEditingProduct(null)
    setFormOpen(true)
  }

  function openEdit(product: Product) {
    setEditingProduct(product)
    setFormOpen(true)
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`"${product.name}" verwijderen? Dit kan niet ongedaan worden gemaakt.`))
      return
    const result = await deleteProduct(product.id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Product verwijderd.")
    refetch()
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Producten
          </h1>
          <p className="text-sm text-muted-foreground">
            Beheer het assortiment dat klanten op de website zien.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
          <LogOut data-icon="inline-start" />
          Uitloggen
        </Button>
      </div>

      <Button className="mb-6" onClick={openCreate}>
        <Plus data-icon="inline-start" />
        Nieuw product
      </Button>

      {loading ? (
        <p className="text-sm text-muted-foreground">Producten laden…</p>
      ) : products.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Nog geen producten</EmptyTitle>
            <EmptyDescription>
              Klik op "Nieuw product" om je eerste product toe te voegen.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {products.map((product) => {
            const category = categories.find((c) => c.slug === product.categorySlug)
            return (
              <li
                key={product.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-3"
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {product.image && (
                    <Image
                      src={assetPath(product.image)}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{product.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {category?.name ?? "Geen categorie"}
                  </p>
                </div>
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
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={`${product.name} bewerken`}
                    onClick={() => openEdit(product)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    aria-label={`${product.name} verwijderen`}
                    onClick={() => handleDelete(product)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        onSaved={refetch}
      />
    </div>
  )
}
