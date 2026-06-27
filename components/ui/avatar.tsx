"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// Helper function to extract initials safely from string children
function GetInitials(name?: string) {
  if (!name) return ""
  const parts = name.split(" ")
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase()
}

// 1. Root Component
interface AvatarProps extends React.ComponentProps<typeof AvatarPrimitive.Root> {
  size?: "default" | "sm" | "lg"
  fullsize?: boolean
}

function Avatar({
  className,
  size = "default",
  fullsize = false,
  ...props
}: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      {...(fullsize && { "data-fullsize": true })}
      className={cn(
        "group/avatar relative flex shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:mix-blend-darken dark:after:mix-blend-lighten",
        fullsize 
          ? "size-full" 
          : "size-8 data-[size=lg]:size-10 data-[size=sm]:size-6",
        className
      )}
      {...props}
    />
  )
}

// 2. Image Component
interface AvatarImageProps extends React.ComponentProps<typeof AvatarPrimitive.Image> {
  fullsize?: boolean
}

function AvatarImage({
  className,
  fullsize = false,
  ...props
}: AvatarImageProps) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square rounded-full object-cover size-full",
        fullsize
          ? "border-6 border-background shadow-none"
          : "shadow-none",
        className
      )}
      {...props}
    />
  )
}

// 3. Fallback Component
interface AvatarFallbackProps extends React.ComponentProps<typeof AvatarPrimitive.Fallback> {
  fullsize?: boolean
}

function AvatarFallback({
  className,
  fullsize = false,
  children,
  ...props
}: AvatarFallbackProps) {
  const containsString = typeof children === "string"

  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs",
        fullsize && "border-6 border-background font-bold text-6xl uppercase leading-none",
        className
      )}
      style={fullsize ? { backgroundColor: "#2c2c2c", color: "#ffffff" } : undefined}
      {...props}
    >
      {containsString ? GetInitials(children as string) : children}
    </AvatarPrimitive.Fallback>
  )
}

// 4. Badge Component
function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        "group-data-[fullsize]/avatar:hidden", // Optional safety guard if placed inside an ultra-large fullsize container
        className
      )}
      {...props}
    />
  )
}

// 5. Group Wrapper Component
function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className
      )}
      {...props}
    />
  )
}

// 6. Group Overflow Counter Component
function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
}