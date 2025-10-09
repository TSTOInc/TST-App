"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Option {
  value: string
  label: string
  description?: string
}

interface SearchableSelectProps {
  id?: string
  label?: string
  required?: boolean
  placeholder?: string
  options: Option[]
  value?: string
  onChange?: (value: string) => void
  className?: string
}

export default function SearchableSelect({
  id,
  label,
  required,
  placeholder = "Select an option",
  options,
  value,
  onChange,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const internalId = id ?? React.useId()

  const selected = options.find((opt) => opt.value === value)

  return (
    <div className={cn("*:not-first:mt-2", className)}>
      {label && <Label htmlFor={internalId} required={required}>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={internalId}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]"
          >
            <span className={cn("truncate", !selected && "text-muted-foreground")}>
              {selected ? selected.label : placeholder}
            </span>
            <ChevronDownIcon size={16} className="text-muted-foreground/80 shrink-0" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${label?.toLowerCase() || "options"}...`} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={(currentValue) => {
                      onChange?.(currentValue === value ? "" : currentValue)
                      setOpen(false)
                    }}
                  >
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="font-medium">{opt.label}</span>
                      {opt.description && (
                        <span className="text-muted-foreground text-xs leading-relaxed">
                          {opt.description}
                        </span>
                      )}
                    </div>
                    {value === opt.value && <CheckIcon size={16} className="ml-auto shrink-0" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
