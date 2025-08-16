import React from "react"
import { Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LoadDetailsStepProps {
  control: any
  errors: any
}

export default function LoadDetailsStep({ control, errors }: LoadDetailsStepProps) {
  return (
    <div className="space-y-4">
      <Controller
        name="loadDetails.loadNumber"
        control={control}
        render={({ field }) => (
          <>
            <Input {...field} placeholder="Load Number" autoComplete="off" />
            {errors.loadDetails?.loadNumber && (
              <p className="text-xs text-red-600 mt-1">
                {errors.loadDetails.loadNumber.message}
              </p>
            )}
          </>
        )}
      />
      <Controller
        name="loadDetails.commodity"
        control={control}
        render={({ field }) => (
          <>
            <Input {...field} placeholder="Commodity" autoComplete="off" />
            {errors.loadDetails?.commodity && (
              <p className="text-xs text-red-600 mt-1">
                {errors.loadDetails.commodity.message}
              </p>
            )}
          </>
        )}
      />
      <div className="grid grid-cols-2 gap-2">
        <Controller
          name="loadDetails.loadType"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue>{field.value || "Load Type (FTL / LTL)"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FTL">FTL</SelectItem>
                <SelectItem value="LTL">LTL</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <Controller
          name="loadDetails.equipmentType"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue>{field.value || "Equipment Type"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reefer">Reefer</SelectItem>
                <SelectItem value="van">Van</SelectItem>
                <SelectItem value="flatbed">Flatbed</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Controller
          name="loadDetails.lengthFt"
          control={control}
          render={({ field }) => (
            <>
              <Input {...field} placeholder="Length (ft)" autoComplete="off" />
              {errors.loadDetails?.lengthFt && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.loadDetails.lengthFt.message}
                </p>
              )}
            </>
          )}
        />
        <Controller
          name="loadDetails.rate"
          control={control}
          render={({ field }) => (
            <>
              <Input {...field} placeholder="Rate ($)" autoComplete="off" />
              {errors.loadDetails?.rate && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.loadDetails.rate.message}
                </p>
              )}
            </>
          )}
        />
      </div>
      <Controller
        name="loadDetails.instructions"
        control={control}
        render={({ field }) => (
          <Textarea {...field} placeholder="Special Instructions (optional)" />
        )}
      />
    </div>
  )
}