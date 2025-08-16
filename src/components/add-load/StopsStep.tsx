import React from "react"
import { Controller } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateTimePicker } from "@/components/add-load/DateTimePicker"

interface StopsStepProps {
  control: any
  errors: any
  stops: any[]
  canAddStop: boolean
  canRemoveStop: boolean
  append: (value: any) => void
  remove: (idx: number) => void
  fields: any[]
}

export default function StopsStep({
  control,
  errors,
  stops,
  canAddStop,
  canRemoveStop,
  append,
  remove,
  fields,
}: StopsStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Add Stops (min 2, max 10)</Label>
        <Button
          size="sm"
          type="button"
          onClick={() =>
            append({
              type: "pickup",
              location: "",
              timeType: "appointment",
              appointmentTime: undefined,
              windowStart: undefined,
              windowEnd: undefined,
            })
          }
          disabled={!canAddStop}
        >
          Add Stop
        </Button>
      </div>
      {fields.map((field, idx) => {
        const stop = stops[idx]
        return (
          <div
            key={field.id}
            className="grid grid-cols-12 gap-2 items-center border-b border-neutral-700 pb-2"
          >
            <div className="col-span-1">
              <Controller
                name={`stops.${idx}.type`}
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {field.value.charAt(0).toUpperCase() +
                          field.value.slice(1)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickup">Pickup</SelectItem>
                      <SelectItem value="stop">Stop</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="col-span-5">
              <Controller
                name={`stops.${idx}.location`}
                control={control}
                render={({ field }) => (
                  <>
                    <Input
                      {...field}
                      placeholder="1890 Main St, City, State, ZIP"
                      autoComplete="off"
                      onChange={(e) => field.onChange(e.target.value)}
                      className={
                        errors.stops?.[idx]?.location
                          ? "border-red-600"
                          : ""
                      }
                    />
                    {errors.stops?.[idx]?.location && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.stops[idx]?.location?.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
            <div className="col-span-2">
              <Controller
                name={`stops.${idx}.timeType`}
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {field.value.charAt(0).toUpperCase() +
                          field.value.slice(1)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appointment">Appointment</SelectItem>
                      <SelectItem value="window">Time Window</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {/* Use flex-col for the date/time pickers to ensure enough space and prevent overlap */}
            <div className="col-span-3">
              {stop.timeType === "appointment" && (
                <Controller
                  control={control}
                  name={`stops.${idx}.appointmentTime`}
                  render={({ field }) => (
                    <div className="flex flex-col gap-2 w-full">
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        label="Appointment"
                      />
                    </div>
                  )}
                />
              )}
              {stop.timeType === "window" && (
                <div className="flex flex-col gap-2 w-full">
                  <Controller
                    control={control}
                    name={`stops.${idx}.windowStart`}
                    render={({ field }) => (
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        label="Window Start"
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name={`stops.${idx}.windowEnd`}
                    render={({ field }) => (
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        label="Window End"
                      />
                    )}
                  />
                </div>
              )}
            </div>
            <div className="col-span-1 flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => remove(idx)}
                disabled={!canRemoveStop}
              >
                Remove
              </Button>
            </div>
            {errors.stops?.[idx]?.appointmentTime && (
              <p className="col-span-12 text-xs text-red-600 mt-1">
                {errors.stops[idx]?.appointmentTime?.message}
              </p>
            )}
            {errors.stops?.[idx]?.windowStart && (
              <p className="col-span-12 text-xs text-red-600 mt-1">
                {errors.stops[idx]?.windowStart?.message}
              </p>
            )}
            {errors.stops?.[idx]?.windowEnd && (
              <p className="col-span-12 text-xs text-red-600 mt-1">
                {errors.stops[idx]?.windowEnd?.message}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}