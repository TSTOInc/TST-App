import React from "react"
import { Controller, useFieldArray } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"


interface PartiesStepProps {
  control: any
  errors: any
}

export default function PartiesStep({ control, errors }: PartiesStepProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "parties.driver", // now an array
  })

  // Make sure at least 1 driver exists, max 2 drivers
  React.useEffect(() => {
    if (fields.length === 0) append("") // start with 1 driver input if empty
  }, [fields.length, append])

  return (
    <div className="space-y-4">
      {/* Broker input stays the same */}
      <Controller
        name="parties.broker"
        control={control}
        render={({ field }) => (
          <>
            <Input {...field} placeholder="Broker" autoComplete="off" />
            {errors.parties?.broker && (
              <p className="text-xs text-red-600 mt-1">
                {errors.parties.broker.message}
              </p>
            )}
          </>
        )}
      />

      {/* Drivers inputs as an array, max 2 */}
      <div>
        <Label>Drivers (max 2)</Label>
        {fields.map((field, idx) => (
          <div key={field.id} className="flex items-center gap-2 mt-1">
            <Controller
              name={`parties.driver.${idx}`}
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder={`Driver #${idx + 1}`} autoComplete="off" />
              )}
            />
            {fields.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => remove(idx)}
                aria-label={`Remove driver ${idx + 1}`}
              >
                ✕
              </Button>
            )}
          </div>
        ))}
        {fields.length < 2 && (
          <Button
            type="button"
            size="sm"
            onClick={() => append("")}
            className="mt-2"
          >
            Add Driver
          </Button>
        )}
        {errors.parties?.driver && typeof errors.parties.driver === "object" && (
          <div className="space-y-1 mt-1">
            {errors.parties.driver.map((err: any, i: number) =>
              err ? (
                <p key={i} className="text-xs text-red-600">
                  Driver #{i + 1}: {err.message}
                </p>
              ) : null
            )}
          </div>
        )}
      </div>

      {/* Truck */}
      <Controller
        name="parties.truck"
        control={control}
        render={({ field }) => (
          <>
            <Input {...field} placeholder="Truck" autoComplete="off" />
            {errors.parties?.truck && (
              <p className="text-xs text-red-600 mt-1">
                {errors.parties.truck.message}
              </p>
            )}
          </>
        )}
      />

      {/* Trailer */}
      <Controller
        name="parties.trailer"
        control={control}
        render={({ field }) => (
          <>
            <Input {...field} placeholder="Trailer" autoComplete="off" />
            {errors.parties?.trailer && (
              <p className="text-xs text-red-600 mt-1">
                {errors.parties.trailer.message}
              </p>
            )}
          </>
        )}
      />
    </div>
  )
}
