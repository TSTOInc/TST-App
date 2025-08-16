import React, { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"

export function DateTimePicker({
  value,
  onChange,
}: {
  value?: Date
  onChange: (date: Date) => void
}) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(value)

  const onTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!date) return
    const [hours, minutes] = e.target.value.split(":").map(Number)
    const newDate = new Date(date)
    newDate.setHours(hours, minutes)
    setDate(newDate)
    onChange(newDate)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          readOnly
          value={date ? format(date, "MM/dd/yyyy hh:mm aa") : ""}
          onClick={() => setOpen(true)}
          placeholder="Select date & time"
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            if (!selectedDate) return // guard here
            setDate(selectedDate)
            onChange(selectedDate)
          }}
          initialFocus
        />
        <input
          type="time"
          className="mt-2 w-full px-2 py-1 border border-gray-300 rounded"
          value={date ? format(date, "HH:mm") : ""}
          onChange={onTimeChange}
        />
      </PopoverContent>
    </Popover>
  )
}

export function StopTimeInputs({
  timeType,
  appointmentTime,
  windowStart,
  windowEnd,
  onChange,
}: {
  timeType: "appointment" | "window"
  appointmentTime?: Date
  windowStart?: Date
  windowEnd?: Date
  onChange: (value: {
    appointmentTime?: Date
    windowStart?: Date
    windowEnd?: Date
  }) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {timeType === "appointment" ? (
        <div className="flex flex-col w-48">
          <label className="text-xs mb-1">Appointment Time</label>
          <DateTimePicker
            value={appointmentTime}
            onChange={(date) => onChange({ appointmentTime: date })}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col w-48">
            <label className="text-xs mb-1">Window Start</label>
            <DateTimePicker
              value={windowStart}
              onChange={(date) => onChange({ windowStart: date })}
            />
          </div>
          <div className="flex flex-col w-48">
            <label className="text-xs mb-1">Window End</label>
            <DateTimePicker
              value={windowEnd}
              onChange={(date) => onChange({ windowEnd: date })}
            />
          </div>
        </>
      )}
    </div>
  )
}
