"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Upload } from "lucide-react"
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
import { Toggle } from "@/components/ui/toggle"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { categories, type Product } from "@/lib/data"
import { createProduct, updateProduct, uploadProductImage } from "@/lib/products"
import { assetPath } from "@/lib/asset-path"
import { toast } from "sonner"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSaved: () => void
}

const emptyForm = {
  name: "",
  categorySlug: categories[0]?.slug ?? "",
  shortDescription: "",
  description: "",
  dimensions: "",
  available: true,
}

export function ProductForm({ open, onOpenChange, product, onSaved }: Props) {
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [existingImageUrl, setExistingImageUrl] = useState<string>("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    if (product) {
      setForm({
        name: product.name,
        categorySlug: product.categorySlug,
        shortDescription: product.shortDescription,
        description: product.description,
        dimensions: product.dimensions,
        available: product.available,
      })
      setExistingImageUrl(product.image)
      setImagePreview(product.image ? assetPath(product.image) : "")
    } else {
      setForm(emptyForm)
      setExistingImageUrl("")
      setImagePreview("")
    }
    setImageFile(null)
    setErrors({})
  }, [open, product])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) nextErrors.name = "Vul een naam in."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)

    let imageUrl = existingImageUrl
    if (imageFile) {
      const uploadResult = await uploadProductImage(imageFile)
      if (uploadResult.error || !uploadResult.url) {
        toast.error(uploadResult.error ?? "Foto uploaden is mislukt.")
        setSaving(false)
        return
      }
      imageUrl = uploadResult.url
    }

    const input = {
      name: form.name.trim(),
      categorySlug: form.categorySlug,
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      dimensions: form.dimensions.trim(),
      available: form.available,
      imageUrl,
    }

    const result = product
      ? await updateProduct(product.id, input)
      : await createProduct(input)

    setSaving(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(product ? "Product bijgewerkt." : "Product toegevoegd.")
    onSaved()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{product ? "Product bewerken" : "Nieuw product"}</SheetTitle>
          <SheetDescription>
            {product
              ? "Pas de gegevens van dit product aan."
              : "Vul de gegevens in om een nieuw product toe te voegen."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="p-name">Naam *</FieldLabel>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Bijv. LED Bar Classic 200"
                aria-invalid={!!errors.name}
              />
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="p-category">Categorie</FieldLabel>
              <Select
                value={form.categorySlug}
                onValueChange={(v) => setForm((f) => ({ ...f, categorySlug: v ?? f.categorySlug }))}
              >
                <SelectTrigger id="p-category" className="w-full">
                  <SelectValue>
                    {(value: string) =>
                      categories.find((c) => c.slug === value)?.name ?? "Kies een categorie"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {categories.map((c) => (
                      <SelectItem key={c.slug} value={c.slug}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="p-short">Korte omschrijving</FieldLabel>
              <Input
                id="p-short"
                value={form.shortDescription}
                onChange={(e) =>
                  setForm((f) => ({ ...f, shortDescription: e.target.value }))
                }
                placeholder="Één zin, zichtbaar in het overzicht"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="p-description">Uitgebreide omschrijving</FieldLabel>
              <Textarea
                id="p-description"
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Zichtbaar op de productpagina"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="p-dimensions">Afmetingen</FieldLabel>
              <Input
                id="p-dimensions"
                value={form.dimensions}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dimensions: e.target.value }))
                }
                placeholder="Bijv. 200 × 60 × 110 cm"
              />
            </Field>

            <Field>
              <FieldLabel>Foto</FieldLabel>
              <div className="flex items-center gap-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
                  {imagePreview && (
                    <Image
                      src={imagePreview}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload data-icon="inline-start" />
                  Foto kiezen
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </div>
              <FieldDescription>JPG of PNG, wordt automatisch geüpload.</FieldDescription>
            </Field>

            <Field orientation="horizontal">
              <FieldLabel htmlFor="p-available">Beschikbaar voor verhuur</FieldLabel>
              <Toggle
                id="p-available"
                variant="outline"
                pressed={form.available}
                onPressedChange={(v) => setForm((f) => ({ ...f, available: v }))}
              >
                {form.available ? "Ja" : "Nee"}
              </Toggle>
            </Field>
          </FieldGroup>

          <SheetFooter className="px-0">
            <Button type="submit" disabled={saving}>
              {saving ? "Opslaan…" : "Opslaan"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
