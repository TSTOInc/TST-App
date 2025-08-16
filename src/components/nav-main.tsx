"use client"

import * as React from "react"
import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react"
import { GalleryVerticalEnd } from "lucide-react"
import {
  Sidebar,
  SidebarFooter,
  SidebarInset,
  SidebarGroupContent,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()
  // Check if a parent item is active
  const isItemActive = (item: { url: string; items?: { url: string }[] }) => {
    if (pathname === item.url || pathname.startsWith(item.url + "/")) return true
    if (item.items?.some(sub => pathname === sub.url || pathname.startsWith(sub.url + "/")))
      return true
    return false
  }

  // Check if a sub-item is active
  const isSubActive = (subItem: { url: string }) => {
    const regex = new RegExp(`^${subItem.url}(/|$)`)
    return regex.test(pathname)
  }
  const pageNames: Record<string, string> = {
    dashboard: "Dashboard",
    loads: "Load",
    brokers: "Broker",
    "brokers/agents": "Broker Agents",
    drivers: "Driver",
    trucks: "Truck",
    equipment: "Equipment",
  };

  const firstSegment = pathname.slice(1);
  const displayName = pageNames[firstSegment];
  const isValidPage = Boolean(displayName);

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              asChild
              disabled={!isValidPage}
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              {isValidPage ? (
                <Link href={`/${firstSegment}/add`} className="flex items-center gap-2 w-full h-full">
                  <IconCirclePlusFilled />
                  <span>Add {displayName}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2 w-full h-full cursor-not-allowed opacity-50">
                  <IconCirclePlusFilled />
                  <span>Add {displayName ?? ""}</span>
                </div>
              )}
            </SidebarMenuButton>

            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconMail />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu >
          {items.map((item) => (
            <React.Fragment key={item.title}>
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-active={isItemActive(item)} tooltip={item.title} className="cursor-pointer">
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {item.items?.length ? (
                <SidebarMenuSub>
                  {item.items.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton data-active={isSubActive(subItem)} asChild className="data-[slot=sidebar-menu-button]:!p-1.5 cursor-pointer">
                        <Link href={subItem.url}>{subItem.title}</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              ) : null}
            </React.Fragment>
          ))}
        </SidebarMenu>

      </SidebarGroupContent>
    </SidebarGroup>
  )
}
