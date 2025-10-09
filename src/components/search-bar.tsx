"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export interface SearchBarProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string
  onValueChange?: (value: string) => void
  onClear?: () => void
  showClearButton?: boolean
  debounceMs?: number
  containerClassName?: string
  skeleton?: boolean
}

export function SearchBar({
  value: controlledValue,
  onValueChange,
  onClear,
  showClearButton = true,
  debounceMs = 0,
  className,
  containerClassName,
  placeholder = "Search...",
  skeleton = false,
  ...props
}: SearchBarProps) {
  const [internalValue, setInternalValue] = React.useState("")
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Use controlled value if provided, otherwise use internal state
  const value = controlledValue !== undefined ? controlledValue : internalValue
  const setValue = controlledValue !== undefined ? onValueChange : setInternalValue

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    if (debounceMs > 0) {
      // Update internal state immediately for responsive UI
      if (controlledValue === undefined) {
        setInternalValue(newValue)
      }

      // Debounce the callback
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        setValue?.(newValue)
      }, debounceMs)
    } else {
      // No debounce, update immediately
      setValue?.(newValue)
    }
  }

  const handleClear = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setValue?.("")
    onClear?.()
  }

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (skeleton) {
    return (
      <div className={cn("relative w-full flex justify-center", containerClassName)}>
        <div className="w-full max-w-xl relative">
        <Skeleton className={cn("h-9 w-full rounded-full", className)} />
        </div> 
      </div>  
    )
  }

  return (
    <div className={cn("relative w-full flex justify-center", containerClassName)}>
      <div className="w-full max-w-xl relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden rounded-full w-full",
            className,
          )}
          {...props}
        />
        {showClearButton && value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 size-7 -translate-y-1/2"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </div>

  )
}
