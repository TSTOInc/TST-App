"use client"

import React, { useEffect } from "react"
import { Controller, useFieldArray, useWatch } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import SearchableSelect from "@/components/comp-229"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"

interface Option {
  value: string
  label: string
  broker_id?: string
  description?: string
}

interface PartiesStepProps {
  control: any
  errors: any
  orgId: string
}

export default function PartiesStep({ control, errors, orgId }: PartiesStepProps) {
  // Query all lookup data
  const brokersData = useQuery(api.getTable.all, { table: "brokers", orgId })
  const paymentTermsData = useQuery(api.getTable.all, { table: "payment_terms", orgId })
  const driversData = useQuery(api.getTable.all, { table: "drivers", orgId })
  const trucksData = useQuery(api.getTable.all, { table: "trucks", orgId })
  const trailersData = useQuery(api.getTable.all, { table: "equipment", orgId })

  // Transform data for each select
  const brokers: Option[] =
    brokersData?.map((b: any) => ({
      value: String(b._id),
      label: b.name,
      description: `${b.address || ""}${b.address_2 ? ", " + b.address_2 : ""}`,
    })) ?? []

  const paymentTerms: Option[] =
    paymentTermsData?.map((pt: any) => ({
      value: String(pt._id),
      label: pt.name,
      broker_id: pt.broker_id ? String(pt.broker_id) : undefined,
      description: pt.description || "",
    })) ?? []

  const drivers: Option[] =
    driversData?.map((d: any) => ({
      value: String(d._id),
      label: d.name,
      description: d.license_number ? `License: ${d.license_number}` : "",
    })) ?? []

  const trucks: Option[] =
    trucksData?.map((t: any) => ({
      value: String(t._id),
      label: t.truck_number,
      description: `${t.make || ""} ${t.model || ""}`.trim(),
    })) ?? []

  const trailers: Option[] =
    trailersData?.map((t: any) => ({
      value: String(t._id),
      label: t.equipment_number,
      description: t.equipment_type
        ? t.equipment_type.charAt(0).toUpperCase() + t.equipment_type.slice(1)
        : "",
    })) ?? []

  // Watch selected broker to filter payment terms
  const selectedBroker = useWatch({
    control,
    name: "parties.broker",
  })

  const brokerValue = selectedBroker?.trim() !== "" ? selectedBroker : null

  const filteredPaymentTerms = brokerValue
    ? paymentTerms.filter((pt) => pt.broker_id === brokerValue)
    : paymentTerms

  // Multi-driver setup
  const { fields, append, remove } = useFieldArray({
    control,
    name: "parties.driver",
  })

  useEffect(() => {
    if (fields.length === 0) append("")
  }, [fields.length, append])

  // Handle loading state
  const isLoading =
    !brokersData || !paymentTermsData || !driversData || !trucksData || !trailersData

  if (isLoading) {
    return <p className="text-sm text-neutral-500">Loading party data...</p>
  }

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
