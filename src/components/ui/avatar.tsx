"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}
function GetInitials(name ?: string) {
    if (!name) return "";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
}
function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full rounded-full border-6 border-background object-cover shadow-none", className)}
      {...props}
    />
  )
}
function AvatarFallback({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback> & { children?: React.ReactNode }) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex items-center justify-center rounded-full size-full border-6 border-background",
        "font-bold text-6xl uppercase select-none leading-none",
        className
      )}
      style={{ backgroundColor: "#C9E4FF", color: "#1B6DC1" }}
      {...props}
    >
      {typeof children === "string" ? GetInitials(children) : null}
    </AvatarPrimitive.Fallback>
  );
}




export { Avatar, AvatarImage, AvatarFallback }
