"use client"

import { ExternalLinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface LinkButtonProps {
  href: string
  external?: boolean
  blank?: boolean
}

export default function LinkButton({ href, external = true, blank = true }: LinkButtonProps) {
  const handleClick = () => {
    if (!href) return

    // Automatically add https:// if missing
    const hasProtocol = href.startsWith("http://") || href.startsWith("https://")
    const fullUrl = hasProtocol ? href : `https://${href}`

    window.open(external ? fullUrl : href, blank ? "_blank" : "_self")
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            className={cn(
              "w-6 h-6 text-muted-foreground transition-colors hover:text-primary"
            )}
            aria-label="Open link"
          >
            <ExternalLinkIcon size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="px-2 py-1 text-xs">
          {blank ? "Open in new tab" : "Open link"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
