'use client'
import * as React from "react"
import {
  IconCamera,
  IconUserSquare,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconTruckDelivery,
  IconFolder,
  IconHelp,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconMessageCircle,
  IconBuildings,
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
import { OrganizationSwitcher, useOrganization, useUser } from '@clerk/nextjs'
import { Skeleton } from "./ui/skeleton"
import { TeamSwitcher } from "@/components/ui/team-switcher"


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
      icon: IconBuildings,
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
      icon: IconUserSquare,
    },
    {
      title: "Trucks",
      url: "/trucks",
      icon: IconTruckDelivery,
    },
    {
      title: "Equipment",
      url: "/equipment",
      icon: IconFolder,
    },
    {
      title: "Directory",
      url: "/directory",
      icon: IconSearch,
    },
    {
      title: "Chats",
      url: "/chats",
      icon: IconMessageCircle,
      badge: "Alpha"
    },
    
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

  ],
}
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name?: string
    email?: string
    avatar?: string
  },
  organization: {
    id: string
    name: string
  }
}

export function  AppSidebar({organization, ...props }: AppSidebarProps) {
  const user = useUser()
  const org = useOrganization()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="flex flex-col">
        <div className="hidden lg:block">
          <OrganizationSwitcher
          organizationProfileMode="navigation"
          organizationProfileUrl="/organization"
          appearance={{
            elements: {
              rootBox: "w-full z-50",
              organizationSwitcherTrigger__organization: "w-full justify-between",
              avatarBox: "h-8 w-8",
              organizationSwitcherTrigger: "text-foreground text-left p-3",
              organizationSwitcherPopoverCard: "w-70 z-50",
            }
          }}
          fallback={
            <div className="w-full">
              <Skeleton className="h-14 w-full rounded-md" />
            </div>
          }
        />
        </div>
        <div className="lg:hidden">
          {org.organization && (
            <TeamSwitcher organizations={[
              {
                name: org.organization.name,
                logo: org.organization.imageUrl,
                plan: "Free"
              }
            ]} />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>

      </SidebarFooter>
    </Sidebar>
  )
}
