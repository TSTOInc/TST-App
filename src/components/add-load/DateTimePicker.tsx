import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  label?: string;
}

export function DateTimePicker({ value, onChange, label }: DateTimePickerProps) {
  // Default to today if no value provided
  const defaultDate = value ?? new Date();
  const defaultTime = value ? format(value, "HH:mm") : format(new Date(), "HH:mm");

  const [open, setOpen] = React.useState(false);
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(defaultDate);
  const [internalTime, setInternalTime] = React.useState<string>(defaultTime);

  // Update parent when internal changes
  React.useEffect(() => {
    if (internalDate && internalTime) {
      const [hours, minutes] = internalTime.split(":").map(Number);
      const combined = new Date(internalDate);
      combined.setHours(hours);
      combined.setMinutes(minutes);
      combined.setSeconds(0);
      onChange(combined);
    } else if (internalDate && !internalTime) {
      onChange(undefined);
    }
  }, [internalDate, internalTime]);

  const handleDateChange = (date: Date | undefined) => {
    setInternalDate(date);
    setOpen(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalTime(e.target.value);
  };

  return (
    <div className="flex gap-2 w-full">
      <div className="flex-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full"
              type="button"
              aria-label={label || "Select date"}
            >
              {internalDate ? format(internalDate, "PPP") : "Select Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50">
            <Calendar
              mode="single"
              selected={internalDate ? new Date(internalDate) : undefined}
              onSelect={handleDateChange}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Input
        type="time"
        value={internalTime}
        onChange={handleTimeChange}
        aria-label={label ? `${label} time` : "Select time"}
        className="flex-1"
      />
    </div>
  );
}
