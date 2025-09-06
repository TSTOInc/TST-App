"use client"

import React, { useEffect, useState, useRef } from "react"
import { Controller, useFieldArray } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface Option {
  id: string
  label: string
}

interface PartiesStepProps {
  control: any
  errors: any
}

export default function PartiesStep({ control, errors }: PartiesStepProps) {
  const [brokers, setBrokers] = useState<Option[]>([])
  const [drivers, setDrivers] = useState<Option[]>([])
  const [trucks, setTrucks] = useState<Option[]>([])
  const [trailers, setTrailers] = useState<Option[]>([])
  useEffect(() => {
    const fetchData = async () => {
      const [broRes, drvRes, trkRes, trlRes] = await Promise.all([
        fetch("http://tst.api.incashy.com/get/brokers").then((r) => r.json()),
        fetch("http://tst.api.incashy.com/get/drivers").then((r) => r.json()),
        fetch("http://tst.api.incashy.com/get/trucks").then((r) => r.json()),
        fetch("http://tst.api.incashy.com/get/equipment").then((r) => r.json()),
      ])
      setBrokers(broRes.map((b: any) => ({ id: b.id, label: `${b.name} - ${b.address} ${b.address_2}` })))
      setDrivers(drvRes.map((d: any) => ({ id: d.id, label: `${d.name} - ${d.license_number}` })))
      setTrucks(trkRes.map((t: any) => ({ id: t.id, label: `${t.truck_number} - ${t.make} ${t.model}` })))
      setTrailers(trlRes.map((t: any) => ({ id: t.id, label: `${t.equipment_number} - ${t.equipment_type.slice(0, 1).toUpperCase() + t.equipment_type.slice(1)}` })))
    }
    fetchData()
  }, [])

  const renderComboBox = (
    field: any,
    options: Option[],
    placeholder: string
  ) => {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const ref = useRef<HTMLDivElement>(null)

    const filteredOptions = query
      ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
      : options

    // Close if clicked outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
      if (field.value) {
        const selected = options.find((o) => o.id === field.value)
        if (selected) setQuery(selected.label)
      }
    }, [field.value, options])

    return (
      <div className="relative w-full" ref={ref}>
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
        />

        {open && filteredOptions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto">
            <Command>
              <CommandList>
                {filteredOptions.length === 0 ? (
                  <CommandEmpty>No results found</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {filteredOptions.map((opt) => (
                      <CommandItem
                        key={opt.id}
                        onSelect={() => {
                          field.onChange(opt.id)
                          setQuery(opt.label)
                          setOpen(false)
                        }}
                      >
                        {opt.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </div>
        )}
      </div>
    )
  }

  // Multi-driver support
  const { fields, append, remove } = useFieldArray({
    control,
    name: "parties.driver",
  })

  useEffect(() => {
    if (fields.length === 0) append("")
  }, [fields.length, append])

  return (
    <div className="space-y-4">
      {/* Broker */}
      <Controller
        name="parties.broker"
        control={control}
        render={({ field }) => renderComboBox(field, brokers, "Broker")}
      />
      {errors.parties?.broker && (
        <p className="text-xs text-red-600 mt-1">{errors.parties.broker.message}</p>
      )}

      {/* Drivers */}
      <div className="space-y-2">
        {fields.map((fieldItem, idx) => (
          <Controller
            key={fieldItem.id}
            name={`parties.driver.${idx}`}
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-2">
                {renderComboBox(field, drivers, `Driver #${idx + 1}`)}
                {fields.length > 1 && (
                  <Button
                    variant="ghost"
                    className="text-neutral-600 hover:text-red-600 font-bold"
                    onClick={() => remove(idx)}
                  >
                    ✕
                  </Button>
                )}
              </div>
            )}
          />
        ))}
        {errors.parties?.drivers && (
          <p className="text-xs text-red-600 mt-1">{errors.parties.drivers.message}</p>
        )}
        {fields.length < 2 ? (
          <Button
            type="button"
            onClick={() => append("")}
          >
            Add Driver
          </Button>
        ) : (
          null
        )}
      </div>

      {/* Truck */}
      <Controller
        name="parties.truck"
        control={control}
        render={({ field }) => renderComboBox(field, trucks, "Truck")}
      />
      {errors.parties?.truck && (
        <p className="text-xs text-red-600 mt-1">{errors.parties.truck.message}</p>
      )}

      {/* Trailer */}
      <Controller
        name="parties.trailer"
        control={control}
        render={({ field }) => renderComboBox(field, trailers, "Trailer")}
      />
      {errors.parties?.trailer && (
        <p className="text-xs text-red-600 mt-1">{errors.parties.trailer.message}</p>
      )}
    </div>
  )
}
