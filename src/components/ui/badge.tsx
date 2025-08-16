import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import {
  IconCircleDashed,
  IconLoader2,
  IconCircleCheckFilled,
  IconCash,
  IconCircleXFilled,
  IconAlertTriangle,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

// Define the styles for badge variants and statuses
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 focus-visible:ring-[3px] transition-[color,box-shadow] overflow-hidden [&>svg]:h-4 [&>svg]:w-4 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-ring/50",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90 focus-visible:border-ring focus-visible:ring-ring/50",
        destructive:
          "border-transparent bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground hover:bg-accent hover:text-accent-foreground",
      },
      status: {
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
          "bg-black text-white dark:bg-white dark:text-black ",
        pass:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        fail:
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        fixing:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Step 1: Define status keys as a const tuple
const statusKeys = [
  "received",
  "reviewing",
  "approved",
  "funded",
  "paid",
  "rejected",
  "yes",
  "no",
  "active",
  "inactive",
  "suspended",
  "pending",
  "pass",
  "fail",
  "fixing",
] as const

// Step 2: Define StatusKey union from tuple
type StatusKey = (typeof statusKeys)[number]

// Step 3: Maps with StatusKey typings
const statusIconMap: Record<StatusKey, React.ReactNode> = {
  received: (
    <IconCircleDashed className="h-4 w-4 text-blue-500 dark:text-blue-300" />
  ),
  reviewing: (
    <IconLoader2 className="h-4 w-4 animate-spin text-orange-500 dark:text-orange-300" />
  ),
  approved: (
    <IconCircleCheckFilled className="h-4 w-4 text-green-500 dark:text-green-300" />
  ),
  funded: (
    <IconCash className="h-4 w-4 text-yellow-500 dark:text-yellow-300" />
  ),
  paid: (
    <IconCash className="h-4 w-4 text-emerald-500 dark:text-emerald-300" />
  ),
  rejected: (
    <IconCircleXFilled className="h-4 w-4 text-red-500 dark:text-red-300" />
  ),
  yes: (
    <IconCircleCheckFilled className="h-4 w-4 text-green-500 dark:text-green-300" />
  ),
  no: (
    <IconCircleXFilled className="h-4 w-4 text-red-500 dark:text-red-300" />
  ),
  active: (
    <IconCircleCheckFilled className="h-4 w-4 text-green-500 dark:text-green-300" />
  ),
  inactive: (
    <IconAlertTriangle className="h-4 w-4 text-yellow-500 dark:text-yellow-300" />
  ),
  suspended: (
    <IconCircleXFilled className="h-4 w-4 text-red-500 dark:text-red-300" />
  ),
  pending: (
    <IconLoader2 className="h-4 w-4 animate-spin text-white dark:text-black" />
  ),
  pass: (
    <IconCircleCheckFilled className="h-4 w-4 text-green-500 dark:text-green-300" />
  ),
  fail: (
    <IconCircleXFilled className="h-4 w-4 text-red-500 dark:text-red-300" />
  ),
  fixing: (
    <IconLoader2 className="h-4 w-4 animate-spin text-yellow-500 dark:text-yellow-300" />
  ),
}

const statusTooltipMap: Record<StatusKey, string> = {
  received: "Received your documents.",
  reviewing: "Reviewing documents.",
  approved: "Approved. Funding is on the way.",
  funded: "Payment has been issued.",
  paid: "The load has been paid.",
  rejected: "Request was rejected due to missing or incorrect info.",
  yes: "Yes ✅",
  no: "No ❌",
  active: "All good! ✅",
  inactive: "Disabled! ❌",
  suspended: "Can't be Work with! ❌",
  pending: "Waiting for manual review",
  pass: "All good! ✅",
  fail: "Failed! ❌",
  fixing: "Under repair... ",
}

export interface BadgeProps
  extends Omit<React.ComponentProps<"span">, "status">, // omit status from native props
  Omit<VariantProps<typeof badgeVariants>, "status"> { // omit status from cva
  asChild?: boolean
  status?: StatusKey | string
  onlyIcon?: boolean
}


const Badge: React.FC<BadgeProps> = ({
  className,
  variant,
  status,
  onlyIcon,
  asChild = false,
  children,
  ...props
}) => {
  const Component = asChild ? Slot : "span"

  const icon = status && statusIconMap[status as StatusKey] || null
  const label =
    status && statusTooltipMap[status as StatusKey]
      ? status.charAt(0).toUpperCase() + status.slice(1)
      : children

  const tooltipText = status
    ? statusTooltipMap[status as StatusKey] || (typeof children === "string" ? children : "")
    : typeof children === "string"
      ? children
      : ""

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Component
          data-slot="badge"
          className={cn(badgeVariants({ variant, status: statusKeys.includes(status as StatusKey) ? (status as StatusKey) : undefined  }), className)}
          {...props}
        >
          {icon}
          {onlyIcon ? ("") : (label)}
        </Component>
      </TooltipTrigger>
      <TooltipContent side="top" align="center">
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export { Badge, badgeVariants }
