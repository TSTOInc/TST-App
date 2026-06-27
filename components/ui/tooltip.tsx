"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

// 1. Tooltip Content state styles matching Shadcn updates and your custom status colors
const tooltipVariants = cva(
  "z-50 inline-flex w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-4xl data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
  {
    variants: {
      status: {
        at_pickup: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
        in_transit: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
        delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        invoiced: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
        received: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
        reviewing: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
        approved: "bg-green-100 text-emerald-800 dark:bg-green-900 dark:text-emerald-100",
        funded: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
        paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
        rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
        yes: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        no: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
        active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        inactive: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
        suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
        pending: "bg-black text-white dark:bg-white dark:text-black",
        pass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        fail: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        fixing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
        default: "bg-foreground text-background",
      },
    },
    defaultVariants: {
      status: "default",
    },
  }
)

// 2. Tooltip Arrow state styles reflecting layout-specific backgrounds and color fills
const tooltipArrowVariants = cva(
  "z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] data-[side=left]:translate-x-[-1.5px] data-[side=right]:translate-x-[1.5px]",
  {
    variants: {
      status: {
        at_pickup: "bg-blue-100 dark:bg-blue-900 fill-blue-100 dark:fill-blue-900",
        in_transit: "bg-orange-100 dark:bg-orange-900 fill-orange-100 dark:fill-orange-900",
        delivered: "bg-green-100 dark:bg-green-900 fill-green-100 dark:fill-green-900",
        invoiced: "bg-yellow-100 dark:bg-yellow-900 fill-yellow-100 dark:fill-yellow-900",
        received: "bg-blue-100 dark:bg-blue-900 fill-blue-100 dark:fill-blue-900",
        reviewing: "bg-orange-100 dark:bg-orange-900 fill-orange-100 dark:fill-orange-900",
        approved: "bg-green-100 dark:bg-emerald-900 fill-emerald-100 dark:fill-emerald-900",
        funded: "bg-yellow-100 dark:bg-yellow-900 fill-yellow-100 dark:fill-yellow-900",
        paid: "bg-emerald-100 dark:bg-emerald-900 fill-emerald-100 dark:fill-emerald-900",
        rejected: "bg-red-100 dark:bg-red-900 fill-red-100 dark:fill-red-900",
        yes: "bg-green-100 dark:bg-green-900 fill-green-100 dark:fill-green-900",
        no: "bg-red-100 dark:bg-red-900 fill-red-100 dark:fill-red-900",
        active: "bg-green-100 dark:bg-green-900 fill-green-100 dark:fill-green-900",
        inactive: "bg-yellow-100 dark:bg-yellow-900 fill-yellow-100 dark:fill-yellow-900",
        suspended: "bg-red-100 dark:bg-red-900 fill-red-100 dark:fill-red-900",
        pending: "bg-black dark:bg-white fill-black dark:fill-white",
        pass: "bg-green-100 dark:bg-green-900 fill-green-100 dark:fill-green-900",
        fail: "bg-red-100 dark:bg-red-900 fill-red-100 dark:fill-red-900",
        fixing: "bg-yellow-100 dark:bg-yellow-900 fill-yellow-100 dark:fill-yellow-900",
        default: "bg-foreground fill-foreground",
      },
    },
    defaultVariants: {
      status: "default",
    },
  }
)

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

// 3. Merged props combining Radix component props and CVA variant typings
export interface TooltipContentProps
  extends React.ComponentProps<typeof TooltipPrimitive.Content>,
  VariantProps<typeof tooltipVariants> { }

function TooltipContent({
  className,
  sideOffset = 4, // Shadcn v4 defaults to 4
  status = "default",
  children,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(tooltipVariants({ status }), className)}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow
          className={cn(tooltipArrowVariants({ status }))}
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }