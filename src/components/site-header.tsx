"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import DynamicBreadcrumb from "./layout/DynamicBreadcrumb"
import { ThemeToggle } from "./theme-toggle"
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"
import { Skeleton } from "./ui/skeleton"

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b px-4 lg:px-6">
      <div className="flex w-full items-center gap-1">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <DynamicBreadcrumb />
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <UserButton
              appearance={{
                elements: {
                  rootBox: "h-9 w-9",
                  avatarBox: "h-9 w-9",
                }
              }}
              fallback={
                <Skeleton className="h-9 w-9 rounded-full" />
              } />

        </div>
      </div>
    </header>
  )
}
