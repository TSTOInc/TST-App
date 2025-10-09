"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const tooltipVariants = cva(
  "text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-[var(--radix-tooltip-content-transform-origin)] rounded-md px-3 py-1.5 text-xs text-balance shadow-sm",
  {
    variants: {
      status: {
        at_pickup:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
        in_transit:
          "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
        delivered:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        invoiced:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
        received:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
        reviewing:
          "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
        approved:
          "bg-green-100 text-emerald-800 dark:bg-green-900 dark:text-emerald-100",
        funded:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
        paid:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
        rejected:
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
        yes:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        no:
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
        active:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        inactive:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
        suspended:
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
        pending:
          "bg-black text-white dark:bg-white dark:text-black",
        pass:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        fail:
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        fixing:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 ",
      },
    },
    defaultVariants: {
      status: "at_pickup",
    },
  }
)
const tooltipArrowVariants = cva(
  "z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]",
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
      },
    },
    defaultVariants: {
      status: "at_pickup",
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
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}


interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
  VariantProps<typeof tooltipVariants> { }

function TooltipContent({
  className,
  sideOffset = 0,
  status,
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
        <TooltipPrimitive.Arrow className={cn(tooltipArrowVariants({ status }))} />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
