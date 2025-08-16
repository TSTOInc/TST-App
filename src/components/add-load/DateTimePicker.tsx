import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label?: string;
}

export function DateTimePicker({ value, onChange, label }: DateTimePickerProps) {
  // Internal state for date and time (split)
  const [open, setOpen] = React.useState(false);
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(value || undefined);
  const [internalTime, setInternalTime] = React.useState(
    value ? format(value, "HH:mm") : ""
  );

  // Update parent when internal changes
  React.useEffect(() => {
    if (internalDate && internalTime) {
      // Combine date and time
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

  // Handle date select
  const handleDateChange = (date: Date | undefined) => {
    setInternalDate(date);
    setOpen(false);
  };

  // Handle time input
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalTime(e.target.value);
  };

  return (
    <div className="flex flex-row gap-2 w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="min-w-[130px] max-w-[180px] w-[50%] flex-1"
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
      <Input
        type="time"
        value={internalTime}
        onChange={handleTimeChange}
        className="min-w-[100px] max-w-[140px] w-[50%] flex-1"
        aria-label={label ? `${label} time` : "Select time"}
      />
    </div>
  );
}