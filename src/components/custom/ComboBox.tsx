"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type ComboBoxOption = {
  value: string;
  label: string;
};

type ComboBoxProps = {
  options: ComboBoxOption[];
  placeholder?: string;
  maxWidth?: string;
  onSelect?: (selected: ComboBoxOption) => void;
  showBadges?: boolean; // whether to display badges
  defaultValue?: ComboBoxOption;
  className?: string;
};

export default function ComboBox({
  options,
  placeholder = "Select...",
  maxWidth = "max-w-[200px]",
  onSelect,
  showBadges = false,
  defaultValue,
  className,
}: ComboBoxProps) {
  const [selectedOption, setSelectedOption] = useState<ComboBoxOption | null>(
    defaultValue || null
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (defaultValue) onSelect?.(defaultValue);
  }, [defaultValue, onSelect]);

  const handleSelect = (option: ComboBoxOption) => {
    setSelectedOption(option);
    onSelect?.(option);
    setOpen(false);
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`inline-flex justify-start w-auto ${maxWidth} px-3`}
          >

            {selectedOption ? (
              showBadges ? (
                <Badge status={selectedOption.value} />
              ) : (
                <span className="flex-1 text-left">{selectedOption.label}</span>
              )
            ) : (
              <span className="flex-1 text-left">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" side="right" align="start">
          <Command>
            <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option)}
                    className="flex items-center gap-2"
                  >
                    {showBadges && <Badge status={option.value} />}
                    {!showBadges && option.label}
                    {showBadges && !option.label.includes(option.value) && (
                      <span>{option.label}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>

  );
}
