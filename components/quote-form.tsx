"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Minus, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldDescription,
  FieldError,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { useQuote } from "@/lib/quote-context"
import { useProducts } from "@/lib/use-products"
import { submitQuote } from "@/lib/submit-quote"
import { toast } from "sonner"

export function QuoteForm() {
  const router = useRouter()
  const { items, addItem, removeItem, setQuantity } = useQuote()
  const { products } = useProducts()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectValue, setSelectValue] = useState("")

  const selectedSlugs = new Set(items.map((i) => i.slug))
  const availableToAdd = products.filter((p) => !selectedSlugs.has(p.slug))

  function handleAddProduct(slug: string) {
    const product = products.find((p) => p.slug === slug)
    if (product) {
      addItem(product.slug, product.name)
      setSelectValue("")
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = String(formData.get("name") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim()

    const nextErrors: Record<string, string> = {}
    if (!name) nextErrors.name = "Vul je naam in."
    if (!email) nextErrors.email = "Vul je e-mailadres in."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      nextErrors.email = "Vul een geldig e-mailadres in."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const payload = {
      name,
      email,
      phone: String(formData.get("phone") ?? ""),
      date: String(formData.get("date") ?? ""),
      guests: String(formData.get("guests") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      products: items,
    }

    startTransition(async () => {
      const result = await submitQuote(payload)
      if (result.success) {
        router.push("/offerte/bedankt")
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-5">
      <div className="flex flex-col gap-8 lg:col-span-3">
        <Card>
          <CardContent className="pt-6">
            <FieldGroup>
              <FieldSet>
                <FieldLegend>Jouw gegevens</FieldLegend>
                <Field orientation="responsive">
                  <Field data-invalid={!!errors.name}>
                    <FieldLabel htmlFor="name">Naam *</FieldLabel>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Voor- en achternaam"
                      aria-invalid={!!errors.name}
                      autoComplete="name"
                    />
                    {errors.name && <FieldError>{errors.name}</FieldError>}
                  </Field>
                  <Field data-invalid={!!errors.email}>
                    <FieldLabel htmlFor="email">E-mail *</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="jij@voorbeeld.nl"
                      aria-invalid={!!errors.email}
                      autoComplete="email"
                    />
                    {errors.email && <FieldError>{errors.email}</FieldError>}
                  </Field>
                </Field>

                <Field orientation="responsive">
                  <Field>
                    <FieldLabel htmlFor="phone">Telefoon</FieldLabel>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="06 12 34 56 78"
                      autoComplete="tel"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="date">Gewenste datum</FieldLabel>
                    <Input id="date" name="date" type="date" />
                  </Field>
                </Field>

                <Field>
                  <FieldLabel htmlFor="guests">Aantal personen</FieldLabel>
                  <Input
                    id="guests"
                    name="guests"
                    type="number"
                    min={1}
                    placeholder="Bijv. 80"
                  />
                  <FieldDescription>
                    Een indicatie van het aantal gasten helpt ons bij het advies.
                  </FieldDescription>
                </Field>
              </FieldSet>

              <Field>
                <FieldLabel htmlFor="notes">Opmerkingen</FieldLabel>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  placeholder="Vertel ons meer over je evenement, locatie of specifieke wensen."
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-2">
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <div>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Geselecteerde producten
              </h2>
              <p className="text-sm text-muted-foreground">
                Voeg een of meerdere producten toe aan je aanvraag.
              </p>
            </div>

            <Field>
              <FieldLabel htmlFor="add-product">Product toevoegen</FieldLabel>
              <Select value={selectValue} onValueChange={handleAddProduct}>
                <SelectTrigger id="add-product" className="w-full">
                  <SelectValue placeholder="Kies een product…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {availableToAdd.length > 0 ? (
                      availableToAdd.map((p) => (
                        <SelectItem key={p.slug} value={p.slug}>
                          {p.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        Alle producten toegevoegd
                      </SelectItem>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            {items.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <li
                    key={item.slug}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Aantal verlagen"
                        onClick={() => setQuantity(item.slug, item.quantity - 1)}
                      >
                        <Minus />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium tabular-nums">
                        {item.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="Aantal verhogen"
                        onClick={() => setQuantity(item.slug, item.quantity + 1)}
                      >
                        <Plus />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${item.name} verwijderen`}
                      onClick={() => removeItem(item.slug)}
                    >
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty className="border border-dashed border-border">
                <EmptyHeader>
                  <EmptyTitle>Nog geen producten</EmptyTitle>
                  <EmptyDescription>
                    Selecteer hierboven producten of voeg ze toe vanaf de
                    productpagina.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}

            <Button type="submit" size="lg" className="w-full glow-purple" disabled={isPending}>
              {isPending ? (
                "Versturen…"
              ) : (
                <>
                  <Send data-icon="inline-start" />
                  Offerte aanvragen
                </>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Vrijblijvend &middot; geen verplichtingen. We reageren binnen 1
              werkdag.
            </p>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
