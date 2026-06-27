import React from "react"
import { Controller } from "react-hook-form"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"

interface LoadDetailsStepProps {
  control: any
  errors: any
}

export default function LoadDetailsStep({ control, errors }: LoadDetailsStepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {/* LOAD NUMBER */}
        <div className="space-y-2">
          <Label required>Load Number</Label>
          <Controller
            name="loadDetails.loadNumber"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Enter Load Number" />}
          />
          {errors.loadDetails?.loadNumber && (
            <p className="text-red-500 text-sm">{String(errors.loadDetails.loadNumber.message)}</p>
          )}
        </div>

        {/* COMMODITY */}
        <div className="space-y-2">
          <Label required>Commodity</Label>
          <Controller
            name="loadDetails.commodity"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Commodity" />}
          />
          {errors.loadDetails?.commodity && (
            <p className="text-red-500 text-sm">{errors.loadDetails.commodity.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {/* LENGTH FT */}
        <div className="space-y-2">
          <Label required>Length (ft)</Label>
          <Controller
            name="loadDetails.lengthFt"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Length (ft)" />}
          />
          {errors.loadDetails?.lengthFt && (
            <p className="text-red-500 text-sm">{errors.loadDetails.lengthFt.message}</p>
          )}
        </div>

        {/* RATE */}
        <div className="space-y-2">
          <Label required>Rate</Label>
          <Controller
            name="loadDetails.rate"
            control={control}
            render={({ field: { onChange, onBlur, value, ...restField } }) => (
              <div className="relative mt-1 rounded-md shadow-sm">
                {/* Visual $ Indicator */}
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-muted-foreground text-sm">$</span>
                </div>
                
                <Input
                  {...restField}
                  value={value || ""}
                  className="pl-7" // Push the text out so it doesn't overlap the $
                  placeholder="0.00"
                  onChange={(e) => {
                    let val = e.target.value
                    
                    // 1. Filter out everything except digits and decimal dots
                    val = val.replace(/[^0-9.]/g, "")
                    
                    // 2. Prevent users from inputting multiple decimals (e.g., 12.34.56)
                    const parts = val.split(".")
                    if (parts.length > 2) {
                      val = parts[0] + "." + parts.slice(1).join("")
                    }
                    
                    onChange(val)
                  }}
                  onBlur={(e) => {
                    const rawValue = parseFloat(e.target.value)
                    if (!isNaN(rawValue)) {
                      // 3. Force exact .00 precision format when user changes focus
                      onChange(rawValue.toFixed(2))
                    }
                    onBlur() // Trigger React Hook Form's built-in validation pipeline
                  }}
                />
              </div>
            )}
          />
          {errors.loadDetails?.rate && (
            <p className="text-red-500 text-sm">{errors.loadDetails.rate.message}</p>
          )}
        </div>
      </div>

      {/* LOAD TYPE */}
      <div className="space-y-2">
        <Label required>Load Type</Label>
        <Controller
          name="loadDetails.loadType"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="Load Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FTL">FTL</SelectItem>
                <SelectItem value="LTL">LTL</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* SPECIAL INSTRUCTIONS */}
      <div className="space-y-2">
        <Label>Special Instructions</Label>
        <Controller
          name="loadDetails.instructions"
          control={control}
          render={({ field }) => <Textarea {...field} placeholder="Optional" />}
        />
      </div>
    </div>
  )
}