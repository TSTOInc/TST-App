import * as React from "react"
import { FieldError } from "react-hook-form" // 👈 Import the type
import { cn } from "../../lib/utils"

// Extend the component props to accept a react-hook-form error
interface InputProps extends React.ComponentProps<"input"> {
  error?: FieldError | boolean
}

function Input({ className, type, error, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      // Automatically apply aria-invalid if an error exists
      aria-invalid={!!error} 
      className={cn(
        "flex h-9 w-full min-w-0 items-center rounded-4xl border border-input bg-input/30 px-3 py-1 text-base outline-none shadow-xs md:text-sm",
        "transition-[color,box-shadow] duration-200",
        "file:inline-flex file:h-7 file:items-center file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // CSS rules that activate when aria-invalid="true"
        "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 focus-visible:aria-invalid:ring-destructive/30",
        "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }