"use client"

import React, { useEffect, useState, useRef } from "react"
import { Controller, useFieldArray, useWatch } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import ComboBox from "../custom/ComboBox"

interface Option {
  id: string
  label: string
  broker_id?: string
}

interface PartiesStepProps {
  control: any
  errors: any
}

export default function PartiesStep({ control, errors }: PartiesStepProps) {
  const [brokers, setBrokers] = useState<Option[]>([])
  const [payment_terms, setPaymentTerms] = useState<Option[]>([])
  const [drivers, setDrivers] = useState<Option[]>([])
  const [trucks, setTrucks] = useState<Option[]>([])
  const [trailers, setTrailers] = useState<Option[]>([])

  // Fetch lookups
  useEffect(() => {
    const fetchData = async () => {
      const [broRes, ptRes, drvRes, trkRes, trlRes] = await Promise.all([
        fetch("http://tst.api.incashy.com/get/brokers").then((r) => r.json()),
        fetch("http://tst.api.incashy.com/get/payment_terms").then((r) => r.json()),
        fetch("http://tst.api.incashy.com/get/drivers").then((r) => r.json()),
        fetch("http://tst.api.incashy.com/get/trucks").then((r) => r.json()),
        fetch("http://tst.api.incashy.com/get/equipment").then((r) => r.json()),
      ])

      setBrokers(
        broRes.map((b: any) => ({
          id: b.id,
          label: `${b.name} - ${b.address} ${b.address_2 || ""}`,
        }))
      )

      setPaymentTerms(
        ptRes.map((pt: any) => ({
          id: pt.id,
          label: pt.name,
          broker_id: pt.broker_id,
        }))
      )

      setDrivers(
        drvRes.map((d: any) => ({
          id: d.id,
          label: `${d.name} - ${d.license_number}`,
        }))
      )

      setTrucks(
        trkRes.map((t: any) => ({
          id: t.id,
          label: `${t.truck_number} - ${t.make} ${t.model}`,
        }))
      )

      setTrailers(
        trlRes.map((t: any) => ({
          id: t.id,
          label: `${t.equipment_number} - ${t.equipment_type.charAt(0).toUpperCase()}${t.equipment_type.slice(1)}`,
        }))
      )
    }
    fetchData()
  }, [])

  // Watch selected broker
  const selectedBroker = useWatch({
    control,
    name: "parties.broker",
  })

  const brokerId = selectedBroker?.trim() !== "" ? selectedBroker : null

  // Filter payment terms
  const filteredPaymentTerms = brokerId
    ? payment_terms.filter((pt) => pt.broker_id === brokerId)
    : []

  // ComboBoxInput for text input fields
  const ComboBoxInput: React.FC<{
    field: any
    options: Option[]
    placeholder?: string
  }> = ({ field, options, placeholder }) => {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const ref = useRef<HTMLDivElement>(null)

    const filteredOptions = query
      ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
      : options

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
        setQuery(selected?.label || "")
      } else {
        setQuery("")
      }
    }, [field.value, options])

    return (
      <div className="relative w-full" ref={ref}>
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            const val = e.target.value
            setQuery(val)
            setOpen(true)
            if (val === "") field.onChange("") // clear selection
          }}
          onFocus={() => setOpen(true)}
        />

        {open && (
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

  // Multi-driver
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
        render={({ field }) => (
          <ComboBoxInput field={field} options={brokers} placeholder="Broker" />
        )}
      />
      {errors.parties?.broker && (
        <p className="text-xs text-red-600 mt-1">{errors.parties.broker.message}</p>
      )}

      {/* Payment Terms */}
      <Controller
        name="parties.paymentTerms"
        control={control}
        render={({ field }) => (
          <ComboBox
            disabled={!brokerId}
            options={filteredPaymentTerms.map((pt) => ({ value: pt.id, label: pt.label }))}
            onSelect={(val) => field.onChange(val.value)} // only ID
            placeholder="Select Payment Terms"
          />
        )}
      />
      {errors.parties?.paymentTerms && (
        <p className="text-xs text-red-600 mt-1">{errors.parties.paymentTerms.message}</p>
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
                <ComboBoxInput field={field} options={drivers} placeholder={`Driver #${idx + 1}`} />
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
        {fields.length < 2 && (
          <Button type="button" onClick={() => append("")}>
            Add Driver
          </Button>
        )}
      </div>

      {/* Truck */}
      <Controller
        name="parties.truck"
        control={control}
        render={({ field }) => <ComboBoxInput field={field} options={trucks} placeholder="Truck" />}
      />
      {errors.parties?.truck && (
        <p className="text-xs text-red-600 mt-1">{errors.parties.truck.message}</p>
      )}

      {/* Trailer */}
      <Controller
        name="parties.trailer"
        control={control}
        render={({ field }) => <ComboBoxInput field={field} options={trailers} placeholder="Trailer" />}
      />
      {errors.parties?.trailer && (
        <p className="text-xs text-red-600 mt-1">{errors.parties.trailer.message}</p>
      )}
    </div>
  )
}
