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
import SearchableSelect from "@/components/comp-229"

interface Option {
  value: string
  label: string
  broker_id?: string
  description?: string
}

interface PartiesStepProps {
  control: any
  errors: any
}

export default function PartiesStep({ control, errors }: PartiesStepProps) {
  const [brokers, setBrokers] = useState<Option[]>([])
  const [paymentTerms, setPaymentTerms] = useState<Option[]>([])
  const [drivers, setDrivers] = useState<Option[]>([])
  const [trucks, setTrucks] = useState<Option[]>([])
  const [trailers, setTrailers] = useState<Option[]>([])

  // Fetch lookup data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoints = {
          brokers: `${process.env.NEXT_PUBLIC_API_BASE}/get/brokers`,
          paymentTerms: `${process.env.NEXT_PUBLIC_API_BASE}/get/payment_terms`,
          drivers: `${process.env.NEXT_PUBLIC_API_BASE}/get/drivers`,
          trucks: `${process.env.NEXT_PUBLIC_API_BASE}/get/trucks`,
          trailers: `${process.env.NEXT_PUBLIC_API_BASE}/get/equipment`,
        }

        const results = await Promise.all(
          Object.entries(endpoints).map(async ([key, url]) => {
            const res = await fetch(url)
            const json = await res.json()
            return [key, json] as const
          })
        )

        const data = Object.fromEntries(results)

        setBrokers(
          (Array.isArray(data.brokers) ? data.brokers : data.brokers?.data || []).map((b: any) => ({
            value: String(b.id),
            label: b.name,
            description: `${b.address || ""}${b.address_2 ? ", " + b.address_2 : ""}`,
          }))
        )

        setPaymentTerms(
          (Array.isArray(data.paymentTerms)
            ? data.paymentTerms
            : data.paymentTerms?.data || []
          ).map((pt: any) => ({
            value: String(pt.id),
            label: pt.name,
            broker_id: pt.broker_id ? String(pt.broker_id) : undefined,
            description: pt.description || "",
          }))
        )

        setDrivers(
          (Array.isArray(data.drivers) ? data.drivers : data.drivers?.data || []).map((d: any) => ({
            value: String(d.id),
            label: d.name,
            description: d.license_number ? `License: ${d.license_number}` : "",
          }))
        )

        setTrucks(
          (Array.isArray(data.trucks) ? data.trucks : data.trucks?.data || []).map((t: any) => ({
            value: String(t.id),
            label: t.truck_number,
            description: `${t.make || ""} ${t.model || ""}`.trim(),
          }))
        )

        setTrailers(
          (Array.isArray(data.trailers) ? data.trailers : data.trailers?.data || []).map((t: any) => ({
            value: String(t.id),
            label: t.equipment_number,
            description: t.equipment_type
              ? t.equipment_type.charAt(0).toUpperCase() + t.equipment_type.slice(1)
              : "",
          }))
        )
      } catch (err) {
        console.error("Fetch failed:", err)
      }
    }
    fetchData()
  }, [])

  // Watch selected broker
  const selectedBroker = useWatch({
    control,
    name: "parties.broker",
  })

  const brokerValue = selectedBroker?.trim() !== "" ? selectedBroker : null

  // Filter payment terms by broker
  const filteredPaymentTerms = brokerValue
    ? paymentTerms.filter((pt) => pt.broker_id === brokerValue)
    : paymentTerms // fallback: show all if none selected

  // Multi-driver setup
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
          <SearchableSelect
            label="Broker"
            required 
            value={field.value}
            onChange={field.onChange}
            options={brokers}
            placeholder="Select Broker"
          />
        )}
      />
      {errors.parties?.broker && (
        <p className="text-xs text-red-600 mt-1">
          {errors.parties.broker.message}
        </p>
      )}

      {/* Payment Terms */}
      <Controller
        name="parties.paymentTerms"
        control={control}
        render={({ field }) => (
          <SearchableSelect
            label="Payment Terms"
            required
            value={field.value}
            onChange={field.onChange}
            options={filteredPaymentTerms}
            placeholder="Select Payment Terms"
          />
        )}
      />
      {errors.parties?.paymentTerms && (
        <p className="text-xs text-red-600 mt-1">
          {errors.parties.paymentTerms.message}
        </p>
      )}

      {/* Drivers */}
      <div className="space-y-2">
        {fields.map((fieldItem, idx) => (
          <Controller
            key={fieldItem.id}
            name={`parties.driver.${idx}`}
            control={control}
            render={({ field }) => (
              <div className="flex items-end gap-2">
                <SearchableSelect
                  label={`Driver #${idx + 1}`}
                  required
                  value={field.value}
                  onChange={field.onChange}
                  options={drivers}
                  placeholder={`Select Driver #${idx + 1}`}
                />
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
        render={({ field }) => (
          <SearchableSelect
            label="Truck"
            required
            value={field.value}
            onChange={field.onChange}
            options={trucks}
            placeholder="Select Truck"
          />
        )}
      />
      {errors.parties?.truck && (
        <p className="text-xs text-red-600 mt-1">
          {errors.parties.truck.message}
        </p>
      )}

      {/* Trailer */}
      <Controller
        name="parties.trailer"
        control={control}
        render={({ field }) => (
          <SearchableSelect
            label="Trailer"
            required
            value={field.value}
            onChange={field.onChange}
            options={trailers}
            placeholder="Select Trailer"
          />
        )}
      />
      {errors.parties?.trailer && (
        <p className="text-xs text-red-600 mt-1">
          {errors.parties.trailer.message}
        </p>
      )}
    </div>
  )
}
