import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

// Allowed color names
const colorKeys = [
  "black", "white", "silver", "gray", "red", "blue", "green", "yellow",
  "brown", "beige", "gold", "orange", "purple", "pink", "turquoise"
] as const

export type ColorKey = (typeof colorKeys)[number]

// Tailwind color class mapping
const colorMap: Record<ColorKey, string> = {
  black: "bg-neutral-200 border-neutral-500 text-neutral-800",
  white: "bg-white border-gray-300 text-gray-700",
  silver: "bg-gray-200 border-gray-400 text-gray-700",
  gray: "bg-gray-200 border-gray-400 text-gray-700",
  red: "bg-red-200 border-red-400 text-red-700",
  blue: "bg-blue-200 border-blue-400 text-blue-700",
  green: "bg-green-200 border-green-400 text-green-700",
  yellow: "bg-yellow-200 border-yellow-400 text-yellow-700",
  brown: "bg-amber-200 border-amber-500 text-amber-800",
  beige: "bg-amber-50 border-amber-300 text-amber-700",
  gold: "bg-yellow-100 border-yellow-500 text-yellow-700",
  orange: "bg-orange-100 border-orange-400 text-orange-700",
  purple: "bg-purple-100 border-purple-400 text-purple-700",
  pink: "bg-pink-100 border-pink-400 text-pink-700",
  turquoise: "bg-cyan-100 border-cyan-400 text-cyan-700",
}

// Base badge style
const badgeVariants = cva(
  "inline-flex items-center justify-center mr-4  rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 focus-visible:ring-[3px] transition-[color,box-shadow] overflow-hidden"
)

export interface ColorBadgeProps extends React.ComponentProps<"span"> {
  asChild?: boolean
  color?: ColorKey
  icon?: React.ReactNode
  onlyIcon?: boolean
  tooltip?: string
}

const ColorBadge: React.FC<ColorBadgeProps> = ({
  className,
  color = "gray",
  icon,
  onlyIcon,
  asChild = false,
  tooltip,
  ...props
}) => {
  const Component = asChild ? Slot : "span"
  const label = color.charAt(0).toUpperCase() + color.slice(1) // Capitalized color name

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Component
          data-slot="color-badge"
          className={cn(badgeVariants(), colorMap[color], className)}
          {...props}
        >
          {icon}
          {!onlyIcon && label}
        </Component>
      </TooltipTrigger>
      {tooltip && (
        <TooltipContent side="top" align="center">
          <p>{tooltip}</p>
        </TooltipContent>
      )}
    </Tooltip>
  )
}

export { ColorBadge, colorKeys }
