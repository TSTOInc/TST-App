import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import {
  IconCircleDashed,
  IconLoader2,
  IconCircleCheckFilled,
  IconCash,
  IconCircleXFilled,
  IconAlertTriangle,
} from "@tabler/icons-react"

import { cn } from "../../lib/utils"

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "./tooltip"

// 1. Unified Badge Variants combining Shadcn updates and your custom statuses
const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-3 py-3 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive: "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline: "border-border bg-input/30 text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      status: {
        at_pickup: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 hover:bg-blue-200/50",
        in_transit: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 hover:bg-orange-200/50",
        delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 hover:bg-green-200/50",
        invoiced: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 hover:bg-yellow-200/50",
        received: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 hover:bg-blue-200/50",
        reviewing: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 hover:bg-orange-200/50",
        approved: "bg-green-100 text-emerald-800 dark:bg-green-900 dark:text-emerald-100 hover:bg-green-200/50",
        funded: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 hover:bg-yellow-200/50",
        paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100 hover:bg-emerald-200/50",
        rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 hover:bg-red-200/50",
        yes: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 hover:bg-green-200/50",
        no: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 hover:bg-red-200/50",
        active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 hover:bg-green-200/50",
        inactive: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 hover:bg-yellow-200/50",
        suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 hover:bg-red-200/50",
        pending: "bg-black text-white dark:bg-white dark:text-black hover:bg-black-200/50",
        pass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200/50",
        fail: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200/50",
        fixing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 hover:bg-yellow-200/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// 2. Status configurations remains intact
const statusKeys = [
  "at_pickup", "in_transit", "delivered", "invoiced", "received", "reviewing",
  "approved", "funded", "paid", "rejected", "yes", "no", "active", "inactive",
  "suspended", "pending", "pass", "fail", "fixing"
] as const

type StatusKey = (typeof statusKeys)[number]

const statusIconMap: Record<StatusKey, React.ReactNode> = {
  at_pickup: <IconCircleDashed className="text-blue-500 dark:text-blue-300" />,
  in_transit: <IconLoader2 className="animate-spin text-orange-500 dark:text-orange-300" />,
  delivered: <IconCircleCheckFilled className="text-green-500 dark:text-green-300" />,
  invoiced: <IconCash className="text-yellow-500 dark:text-yellow-300" />,
  received: <IconCircleDashed className="text-blue-500 dark:text-blue-300" />,
  reviewing: <IconLoader2 className="animate-spin text-orange-500 dark:text-orange-300" />,
  approved: <IconCircleCheckFilled className="text-green-500 dark:text-green-300" />,
  funded: <IconCash className="text-yellow-500 dark:text-yellow-300" />,
  paid: <IconCash className="text-emerald-500 dark:text-emerald-300" />,
  rejected: <IconCircleXFilled className="text-red-500 dark:text-red-300" />,
  yes: <IconCircleCheckFilled className="text-green-500 dark:text-green-300" />,
  no: <IconCircleXFilled className="text-red-500 dark:text-red-300" />,
  active: <IconCircleCheckFilled className="text-green-500 dark:text-green-300" />,
  inactive: <IconAlertTriangle className="text-yellow-600 dark:text-yellow-300" />,
  suspended: <IconCircleXFilled className="text-red-500 dark:text-red-300" />,
  pending: <IconLoader2 className="animate-spin text-white dark:text-black" />,
  pass: <IconCircleCheckFilled className="text-green-500 dark:text-green-300" />,
  fail: <IconCircleXFilled className="text-red-500 dark:text-red-300" />,
  fixing: <IconLoader2 className="animate-spin text-yellow-500 dark:text-yellow-300" />,
}

const statusTooltipMap: Record<StatusKey, string> = {
  at_pickup: "At pickup location.",
  in_transit: "In transit.",
  delivered: "Delivered to destination.",
  invoiced: "Invoice has been sent.",
  received: "Received your documents.",
  reviewing: "Reviewing documents.",
  approved: "Approved. Funding is on the way.",
  funded: "Payment has been issued.",
  paid: "The load has been paid.",
  rejected: "Request was rejected due to missing or incorrect info.",
  yes: "Yes",
  no: "No",
  active: "All good!",
  inactive: "Disabled!",
  suspended: "Can't be Work with!",
  pending: "Waiting for manual review",
  pass: "All good!",
  fail: "Failed!",
  fixing: "Under repair... ",
}

// 3. Strongly typed interface mapping native and variants cleanly
export interface BadgeProps
  extends Omit<React.ComponentProps<"span">, "status">,
    Omit<VariantProps<typeof badgeVariants>, "status"> {
  asChild?: boolean
  status?: StatusKey | string
  onlyIcon?: boolean
}

function Badge({
  className,
  variant = "default",
  status,
  onlyIcon,
  asChild = false,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span"

  const hasValidStatus = !!status && statusKeys.includes(status as StatusKey)
  const currentStatus = hasValidStatus ? (status as StatusKey) : undefined
  
  const icon = currentStatus ? statusIconMap[currentStatus] : null
  const label = currentStatus
    ? status?.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
    : children

  const tooltipText = currentStatus
    ? statusTooltipMap[currentStatus] || (typeof children === "string" ? children : "")
    : ""

  const badgeElement = (
    <Comp
      data-slot="badge"
      data-variant={variant}
      {...(currentStatus && { "data-status": currentStatus })}
      className={cn(badgeVariants({ variant, status: currentStatus }), className)}
      {...props}
    >
      {icon}
      {!onlyIcon && label}
    </Comp>
  )

  if (!tooltipText) return badgeElement

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badgeElement}</TooltipTrigger>
      {/* Retained your custom status passing logic to TooltipContent if required by your layout */}
      <TooltipContent status={currentStatus} side="top" align="center">
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export { Badge, badgeVariants }