"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"



const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/vercel.svg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconDashboard,
    },
    {
      title: "Loads",
      url: "/loads",
      icon: IconListDetails,
    },
    {
      title: "Brokers",
      url: "/brokers",
      icon: IconUsers,
      items: [
        {
          title: "Broker Agents",
          url: "/brokers/agents",
          icon: IconUsers,
        },
      ]
    },
    {
      title: "Drivers",
      url: "/drivers",
      icon: IconUsers,
    },
    {
      title: "Trucks",
      url: "/trucks",
      icon: IconUsers,
    },
    {
      title: "Equipment",
      url: "/equipment",
      icon: IconUsers,
    }
  ],
  navClouds: [
    {
      title: "Cloud Storage",
      url: "#",
      icon: IconDatabase,
      items: [
        {
          title: "Files",
          url: "#",
          icon: IconFileDescription,
        },
        {
          title: "Images",
          url: "#",
          icon: IconCamera,
        },
        {
          title: "Videos",
          url: "#",
          icon: IconFileAi,
        },
      ]
    },
    {
      title: "Reports",
      url: "#",
      icon: IconReport,
    },
  ],
  navSecondary: [
    {
      title: "Directory",
      url: "/directory",
      icon: IconSearch,
    },
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },

  ],
}
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name?: string
    email?: string
    avatar?: string
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <img src="/logo.png" alt="logo" className="h-8 w-8" />
                <span className="text-base font-semibold">Three Stars Transport Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user as any} />
      </SidebarFooter>
    </Sidebar>
  )
}
