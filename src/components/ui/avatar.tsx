"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.ComponentProps<typeof AvatarPrimitive.Root> {
  fullsize?: boolean
}

function Avatar({ className, fullsize = false, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        fullsize ? "size-full" : "size-8",
        className
      )}
      {...props}
    />
  )
}

function GetInitials(name?: string) {
  if (!name) return "";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
}

interface AvatarImageProps extends React.ComponentProps<typeof AvatarPrimitive.Image> {
  fullsize?: boolean
}

function AvatarImage({ className, fullsize = false, ...props }: AvatarImageProps) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square rounded-full object-cover",
        fullsize
          ? "size-full border-6 border-background shadow-none"
          : "size-full border-6 border-background shadow-none",
        className
      )}
      {...props}
    />
  )
}

interface AvatarFallbackProps extends React.ComponentProps<typeof AvatarPrimitive.Fallback> {
  fullsize?: boolean
  children?: React.ReactNode
}

function AvatarFallback({ className, fullsize = false, children, ...props }: AvatarFallbackProps) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex items-center justify-center rounded-full",
        fullsize ? "size-full border-6 border-background font-bold text-6xl uppercase select-none leading-none" : "size-full",
        className
      )}
      style={fullsize ? { backgroundColor: "#2c2c2c", color: "#ffffff" } : undefined}
      {...props}
    >
      {typeof children === "string" ? GetInitials(children) : null}
    </AvatarPrimitive.Fallback>
  )
}

export { Avatar, AvatarImage, AvatarFallback }
