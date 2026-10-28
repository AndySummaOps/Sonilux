"use client"

import { useCallback, useEffect, useState } from "react"
import { Bot, RefreshCw, Send, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
} from "@/components/ui/sheet"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import {
  CONVERSATION_STATUS_LABELS,
  HANDOVER_REASON_LABELS,
  QUOTE_STATUS_LABELS,
  fetchConversationDetail,
  fetchConversations,
  sendAdminMessage,
  setConversationStatus,
  setQuoteStatus,
  type Conversation,
  type Message,
  type QuoteRequest,
  type QuoteStatus,
} from "@/lib/conversations"
import { toast } from "sonner"

const dateTime = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

const eventDate = new Intl.DateTimeFormat("nl-NL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
})

export function ConversationInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Conversation | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setConversations(await fetchConversations())
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const waiting = conversations.filter((c) => c.status === "wacht_op_mens").length

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {waiting === 0
            ? "Geen gesprekken die op jou wachten."
            : `${waiting} ${waiting === 1 ? "gesprek wacht" : "gesprekken wachten"} op jou.`}
        </p>
        <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
          <RefreshCw data-icon="inline-start" />
          Vernieuwen
        </Button>
      </div>

      {loading && conversations.length === 0 ? (
        <p className="text-sm text-muted-foreground">Gesprekken laden…</p>
      ) : conversations.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Nog geen gesprekken</EmptyTitle>
            <EmptyDescription>
              Zodra een klant de WhatsApp-assistent een bericht stuurt, verschijnt het hier.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {conversations.map((conversation) => {
            const waitsForRik = conversation.status === "wacht_op_mens"
            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => setSelected(conversation)}
                  className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-secondary"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                    {waitsForRik ? <UserRound className="size-5" /> : <Bot className="size-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {conversation.customerName}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {waitsForRik && conversation.handoverReason
                        ? (HANDOVER_REASON_LABELS[conversation.handoverReason] ??
                          conversation.handoverReason)
                        : conversation.whatsappNumber}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge
                      variant={waitsForRik ? "default" : "secondary"}
                      className={
                        waitsForRik
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary text-muted-foreground"
                      }
                    >
                      {CONVERSATION_STATUS_LABELS[conversation.status]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {dateTime.format(new Date(conversation.lastMessageAt))}
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <ConversationSheet
        conversation={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onChanged={refetch}
      />
    </>
  )
}

function ConversationSheet({
  conversation,
  onOpenChange,
  onChanged,
}: {
  conversation: Conversation | null
  onOpenChange: (open: boolean) => void
  onChanged: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [requests, setRequests] = useState<QuoteRequest[]>([])
  const [status, setStatus] = useState(conversation?.status)
  const [reply, setReply] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!conversation) return
    const detail = await fetchConversationDetail(conversation.id)
    setMessages(detail.messages)
    setRequests(detail.requests)
  }, [conversation])

  useEffect(() => {
    setStatus(conversation?.status)
    setReply("")
    setMessages([])
    setRequests([])
    load()
  }, [conversation, load])

  async function changeStatus(next: "open" | "wacht_op_mens" | "gesloten", message: string) {
    if (!conversation) return
    setBusy(true)
    const result = await setConversationStatus(conversation.id, next)
    setBusy(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    setStatus(next)
    toast.success(message)
    onChanged()
  }

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!conversation || !reply.trim()) return
    setBusy(true)
    const result = await sendAdminMessage(conversation.id, reply)
    setBusy(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    setReply("")
    setStatus("wacht_op_mens")
    toast.success("Bericht verstuurd.")
    load()
    onChanged()
  }

  async function handleQuoteStatus(quoteId: string, next: QuoteStatus) {
    const result = await setQuoteStatus(quoteId, next)
    if (result.error) {
      toast.error(result.error)
      return
    }
    setRequests((rs) => rs.map((r) => (r.id === quoteId ? { ...r, status: next } : r)))
    toast.success("Status van de aanvraag bijgewerkt.")
  }

  const waitsForRik = status === "wacht_op_mens"

  return (
    <Sheet open={!!conversation} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{conversation?.customerName}</SheetTitle>
          <SheetDescription>
            {conversation?.whatsappNumber}
            {status && ` · ${CONVERSATION_STATUS_LABELS[status]}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {waitsForRik ? (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => changeStatus("open", "De assistent beantwoordt dit gesprek weer.")}
              >
                <Bot data-icon="inline-start" />
                Teruggeven aan assistent
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={busy || status === "gesloten"}
                onClick={() =>
                  changeStatus("wacht_op_mens", "Je hebt het gesprek overgenomen; de assistent zwijgt.")
                }
              >
                <UserRound data-icon="inline-start" />
                Zelf overnemen
              </Button>
            )}
            {status !== "gesloten" && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => changeStatus("gesloten", "Gesprek gesloten.")}
              >
                Gesprek sluiten
              </Button>
            )}
          </div>

          {requests.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="font-heading font-semibold text-foreground">Aanvragen</h3>
              {requests.map((request) => (
                <div key={request.id} className="rounded-xl border border-border bg-card p-3 text-sm">
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                    <dt className="text-muted-foreground">Datum</dt>
                    <dd>{request.eventDate ? eventDate.format(new Date(request.eventDate)) : "-"}</dd>
                    <dt className="text-muted-foreground">Locatie</dt>
                    <dd>{request.location ?? "-"}</dd>
                    <dt className="text-muted-foreground">Gasten</dt>
                    <dd>{request.guests ?? "-"}</dd>
                    <dt className="text-muted-foreground">Type event</dt>
                    <dd>{request.eventType ?? "-"}</dd>
                  </dl>
                  {request.notes && (
                    <p className="mt-2 whitespace-pre-line text-muted-foreground">{request.notes}</p>
                  )}
                  <div className="mt-3">
                    <Select
                      value={request.status}
                      onValueChange={(v) => v && handleQuoteStatus(request.id, v as QuoteStatus)}
                    >
                      <SelectTrigger className="w-full" aria-label="Status van de aanvraag">
                        <SelectValue>
                          {(value: QuoteStatus) => QUOTE_STATUS_LABELS[value] ?? value}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {Object.entries(QUOTE_STATUS_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </section>
          )}

          <section className="flex flex-col gap-2">
            <h3 className="font-heading font-semibold text-foreground">Gesprek</h3>
            {messages.map((message) => {
              const fromCustomer = message.direction === "inbound"
              return (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    fromCustomer
                      ? "self-start bg-secondary text-foreground"
                      : "self-end bg-primary text-primary-foreground"
                  }`}
                >
                  <p className="whitespace-pre-line">{message.content}</p>
                  <p className="mt-1 text-xs opacity-70">
                    {message.senderType === "klant"
                      ? "Klant"
                      : message.senderType === "bot"
                        ? "Assistent"
                        : "Rik"}{" "}
                    · {dateTime.format(new Date(message.createdAt))}
                  </p>
                </div>
              )
            })}
          </section>

          {status !== "gesloten" && (
            <form onSubmit={handleSend} className="flex flex-col gap-2">
              <Textarea
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Typ je antwoord aan de klant…"
                aria-label="Antwoord aan de klant"
              />
              <p className="text-xs text-muted-foreground">
                Gaat via WhatsApp naar de klant. Kan alleen binnen 24 uur na het laatste
                bericht van de klant. De assistent zwijgt daarna in dit gesprek tot je
                het teruggeeft.
              </p>
              <Button type="submit" disabled={busy || !reply.trim()} className="self-start">
                <Send data-icon="inline-start" />
                Versturen
              </Button>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
