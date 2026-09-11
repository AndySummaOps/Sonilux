"use client"

import Link from "next/link"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useQuote } from "@/lib/quote-context"
import { cn } from "@/lib/utils"

type QuoteCtaButtonProps = {
  className?: string
  size?: "header" | "default" | "lg"
  showIcon?: boolean
  onClick?: () => void
}

export function QuoteCtaButton({
  className,
  size = "default",
  showIcon = true,
  onClick,
}: QuoteCtaButtonProps) {
  const { count } = useQuote()
  const isHeader = size === "header"
  const isLarge = size === "lg"

  return (
    <Button
      asChild
      variant="default"
      className={cn(
        "inline-flex items-center justify-center font-semibold shadow-none",
        isHeader && "h-10 gap-1.5 px-4 text-sm",
        isLarge && "h-11 gap-2 px-6 text-base",
        !isHeader && !isLarge && "h-10 gap-2 px-5",
        className,
      )}
    >
      <Link href="/offerte" onClick={onClick}>
        {showIcon && !isHeader && (
          <FileText className="size-4 shrink-0" aria-hidden />
        )}
        {isHeader ? (
          <>
            <span className="lg:hidden">Offerte</span>
            <span className="hidden lg:inline">Offerte aanvragen</span>
          </>
        ) : (
          "Offerte aanvragen"
        )}
        {count > 0 && (
          <Badge
            variant="secondary"
            className="min-w-5 justify-center rounded-full px-1.5 py-0 text-[11px] font-semibold"
          >
            {count}
          </Badge>
        )}
      </Link>
    </Button>
  )
}
