"use client"

import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldError,
  FieldDescription,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import type { Category, Product } from "@/lib/data"
import {
  createCategory,
  updateCategory,
  deleteCategory,
  swapCategoryOrder,
} from "@/lib/categories"
import { toast } from "sonner"

type Props = {
  categories: Category[]
  products: Product[]
  loading: boolean
  onChanged: () => void
}

function productCountLabel(count: number) {
  return count === 1 ? "1 product" : `${count} producten`
}

export function CategoryManager({ categories, products, loading, onChanged }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [moving, setMoving] = useState(false)

  function productsIn(category: Category) {
    return products.filter((p) => p.categorySlug === category.slug)
  }

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(category: Category) {
    setEditing(category)
    setFormOpen(true)
  }

  async function move(index: number, direction: -1 | 1) {
    const a = categories[index]
    const b = categories[index + direction]
    if (!a || !b || moving) return
    setMoving(true)
    const result = await swapCategoryOrder(a, b)
    setMoving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    onChanged()
  }

  return (
    <div>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Categorieën zijn de groepen waarin je producten op de website staan, zoals
        "LED Barren". De volgorde hieronder is ook de volgorde op de website. Gebruik
        de knoppen <strong className="text-foreground">Omhoog</strong> en{" "}
        <strong className="text-foreground">Omlaag</strong> om die te veranderen.
      </p>

      <Button size="lg" className="mb-6" onClick={openCreate}>
        <Plus data-icon="inline-start" />
        Nieuwe categorie
      </Button>

      {loading ? (
        <p className="text-sm text-muted-foreground">Categorieën laden…</p>
      ) : categories.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Nog geen categorieën</EmptyTitle>
            <EmptyDescription>
              Klik op "Nieuwe categorie" om je eerste categorie toe te voegen.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ol className="flex flex-col gap-3">
          {categories.map((category, index) => {
            const count = productsIn(category).length
            const isFirst = index === 0
            const isLast = index === categories.length - 1
            return (
              <li
                key={category.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground"
                    aria-label={`Positie ${index + 1}`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{category.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {productCountLabel(count)}
                    </p>
                    {category.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={isFirst || moving}
                    onClick={() => move(index, -1)}
                    aria-label={`${category.name} omhoog verplaatsen`}
                  >
                    <ArrowUp data-icon="inline-start" />
                    Omhoog
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isLast || moving}
                    onClick={() => move(index, 1)}
                    aria-label={`${category.name} omlaag verplaatsen`}
                  >
                    <ArrowDown data-icon="inline-start" />
                    Omlaag
                  </Button>
                  <Button variant="outline" onClick={() => openEdit(category)}>
                    <Pencil data-icon="inline-start" />
                    Bewerken
                  </Button>
                  <Button variant="destructive" onClick={() => setDeleting(category)}>
                    <Trash2 data-icon="inline-start" />
                    Verwijderen
                  </Button>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
        onSaved={onChanged}
      />

      <DeleteCategorySheet
        category={deleting}
        onClose={() => setDeleting(null)}
        categories={categories}
        productsInCategory={deleting ? productsIn(deleting) : []}
        onDeleted={onChanged}
      />
    </div>
  )
}

function CategoryForm({
  open,
  onOpenChange,
  category,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  onSaved: () => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(category?.name ?? "")
    setDescription(category?.description ?? "")
    setError("")
  }, [open, category])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim()) {
      setError("Vul een naam in.")
      return
    }
    setSaving(true)
    const input = { name: name.trim(), description: description.trim() }
    const result = category
      ? await updateCategory(category.id, input)
      : await createCategory(input)
    setSaving(false)

    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(category ? "Categorie bijgewerkt." : "Categorie toegevoegd.")
    onSaved()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{category ? "Categorie bewerken" : "Nieuwe categorie"}</SheetTitle>
          <SheetDescription>
            {category
              ? "Pas de naam of omschrijving aan. Producten in deze categorie blijven gewoon staan."
              : "Geef de categorie een naam. Daarna kun je producten aan deze categorie koppelen."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-4 pb-4">
          <FieldGroup>
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="c-name">Naam *</FieldLabel>
              <Input
                id="c-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bijv. LED Barren"
                aria-invalid={!!error}
              />
              {error && <FieldError>{error}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="c-description">Korte omschrijving</FieldLabel>
              <Textarea
                id="c-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Bijv. Strakke, oplichtende bars voor elk feest."
              />
              <FieldDescription>
                Eén of twee zinnen. Deze tekst staat op de homepage onder de naam.
              </FieldDescription>
            </Field>

            <div className="rounded-xl border border-dashed border-border p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Zo ziet het eruit op de website
              </p>
              <p className="font-heading text-lg font-semibold text-foreground">
                {name.trim() || "Naam van de categorie"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {description.trim() || "Hier komt de korte omschrijving."}
              </p>
            </div>
          </FieldGroup>

          <SheetFooter className="px-0">
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? "Opslaan…" : "Opslaan"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => onOpenChange(false)}
            >
              Annuleren
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function DeleteCategorySheet({
  category,
  onClose,
  categories,
  productsInCategory,
  onDeleted,
}: {
  category: Category | null
  onClose: () => void
  categories: Category[]
  productsInCategory: Product[]
  onDeleted: () => void
}) {
  const [targetId, setTargetId] = useState("")
  const [deleting, setDeleting] = useState(false)

  const others = categories.filter((c) => c.id !== category?.id)
  const hasProducts = productsInCategory.length > 0
  const cannotDelete = hasProducts && others.length === 0

  useEffect(() => {
    setTargetId("")
  }, [category])

  async function handleDelete() {
    if (!category) return
    if (hasProducts && !targetId) {
      toast.error("Kies eerst waar de producten naartoe moeten.")
      return
    }
    setDeleting(true)
    const result = await deleteCategory(category.id, hasProducts ? targetId : undefined)
    setDeleting(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(`Categorie "${category.name}" verwijderd.`)
    onDeleted()
    onClose()
  }

  return (
    <Sheet open={!!category} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Categorie verwijderen</SheetTitle>
          <SheetDescription>
            Je staat op het punt <strong>{category?.name}</strong> te verwijderen. Dit kan
            niet ongedaan worden gemaakt.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-4">
          {cannotDelete ? (
            <p className="rounded-xl bg-secondary p-4 text-sm text-foreground">
              Dit is je enige categorie en er staan nog producten in. Maak eerst een
              andere categorie aan, dan kun je de producten daarnaartoe verplaatsen.
            </p>
          ) : hasProducts ? (
            <>
              <div className="rounded-xl bg-secondary p-4 text-sm text-foreground">
                <p className="mb-2">
                  In deze categorie staan nog{" "}
                  <strong>{productCountLabel(productsInCategory.length)}</strong>:
                </p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {productsInCategory.map((p) => (
                    <li key={p.id}>{p.name}</li>
                  ))}
                </ul>
              </div>
              <Field>
                <FieldLabel htmlFor="c-move-to">
                  Naar welke categorie moeten deze producten?
                </FieldLabel>
                <Select value={targetId} onValueChange={(v) => setTargetId(v ?? "")}>
                  <SelectTrigger id="c-move-to" className="w-full">
                    <SelectValue>
                      {(value: string) =>
                        others.find((c) => c.id === value)?.name ?? "Kies een categorie"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {others.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  De producten blijven gewoon bestaan, ze komen alleen in een andere
                  categorie te staan.
                </FieldDescription>
              </Field>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Er staan geen producten in deze categorie, dus er gaat verder niets verloren.
            </p>
          )}

          <SheetFooter className="px-0">
            {!cannotDelete && (
              <Button
                variant="destructive"
                size="lg"
                disabled={deleting || (hasProducts && !targetId)}
                onClick={handleDelete}
              >
                <Trash2 data-icon="inline-start" />
                {deleting
                  ? "Bezig…"
                  : hasProducts
                    ? "Producten verplaatsen en categorie verwijderen"
                    : "Ja, verwijderen"}
              </Button>
            )}
            <Button variant="outline" size="lg" onClick={onClose}>
              {cannotDelete ? "Sluiten" : "Nee, annuleren"}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
