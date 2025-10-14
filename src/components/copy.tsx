"use client"

import { useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CopyProps {
  value: string
}

export default function Copy({ value }: CopyProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative w-6 h-6 text-muted-foreground disabled:opacity-100"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy to clipboard"}
            disabled={copied}
          >
            {/* Check icon */}
            <div
              className={cn(
                "absolute transition-all",
                copied ? "scale-75 opacity-100" : "scale-0 opacity-0"
              )}
            >
              <CheckIcon className="stroke-emerald-500" size={16} />
            </div>

            {/* Copy icon */}
            <div
              className={cn(
                "absolute transition-all",
                copied ? "scale-0 opacity-0" : "scale-75 opacity-100"
              )}
            >
              <CopyIcon size={16} />
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="px-2 py-1 text-xs">
          {copied ? "Copied!" : "Click to copy"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
