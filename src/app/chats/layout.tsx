'use client'

import React from 'react'
import { useQuery, useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from '@convex/_generated/api'
import { useUser } from '@clerk/nextjs'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Id } from '@convex/_generated/dataModel'

interface ChatsLayoutProps {
  selectedChatId?: string
  children: React.ReactNode
}

function timeAgo(dateString: string | number | Date) {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const intervals: Record<string, number> = {
    w: 604800,
    d: 86400,
    h: 3600,
    m: 60,
  }

  for (const [unit, value] of Object.entries(intervals)) {
    const amount = Math.floor(seconds / value)
    if (amount >= 1) return `${amount}${unit} ago`
  }

  return "Just now"
}

export default function ChatsLayout({ children }: ChatsLayoutProps) {
  const router = useRouter()
  const { user } = useUser()

  const organization = useQuery(api.organizations.getCurrentOrganization)
  const orgId = organization?._id
  const clerkId = user?.id

  const currentUser = useQuery(
    api.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip"
  )

  const currentUserId = currentUser?._id

  const usersQuery = useQuery(
    api.users.getAllByOrganization,
    orgId ? { orgId } : "skip"
  )

  const chatsQuery = useQuery(
    api.chats.byParticipantInOrg, // <-- safer query
    currentUserId && orgId
      ? { participantId: currentUserId, orgId }
      : "skip"
  )

  const createChat = useMutation(api.chats.create)

  if (!currentUser || !usersQuery || !chatsQuery) {
    return (
      <div className="flex h-full">
        <div className="w-1/4 border-r overflow-y-auto">
          <h2 className="text-2xl font-bold p-4">Messages</h2>
          {Array.from({ length: 8 }).map((_, i) => (
            <Item key={i} variant="outline" className="w-full px-4 py-3 border-none">
              <ItemMedia>
                <Skeleton className="h-12 w-12 rounded-full" />
              </ItemMedia>
              <ItemContent className="hidden md:block">
                <Skeleton className="h-4 w-28 mb-2 rounded" />
              </ItemContent>
            </Item>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    )
  }

  // ✅ Filter out current user using DB id
  const users = usersQuery.filter(
    (u: any) => u._id !== currentUserId
  )

  const handleChat = async (otherUserId: Id<"users">) => {
    if (!currentUserId || !orgId) return;

    const newChatId = await createChat({
      type: "direct",
      participants: [currentUserId, otherUserId],
      orgId,
    });

    router.push(`/chats/${newChatId}`);
  };


  return (
    <div className="flex h-full">
      <div className="w-1/4 border-r overflow-y-auto flex flex-col">
        <h2 className="text-2xl font-bold p-4">Messages</h2>

        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-muted-foreground mb-3">
              There are no users in this organization.
            </p>
            <Button
              variant="outline"
              onClick={() =>
                router.push("/organization/organization-members")
              }
            >
              Invite Users
            </Button>
          </div>
        ) : (
          users.map((u: any) => {
            const existingChat = chatsQuery.find(
              (chat: any) =>
                chat.type === "direct" &&
                chat.participants.includes(u._id)
            )


            const handleClick = () =>
              existingChat
                ? router.push(`/chats/${existingChat._id}`)
                : handleChat(u._id)

            return (
              <Item
                key={u._id}
                variant="outline"
                className="w-full px-4 py-3 border-none cursor-pointer"
                onClick={handleClick}
              >
                <ItemMedia>
                  <Avatar className="size-12">
                    <AvatarImage src={u.image_url} />
                    <AvatarFallback>
                      {u.first_name?.[0]}
                      {u.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </ItemMedia>

                <ItemContent className="hidden md:block">
                  <ItemTitle>
                    {u.first_name} {u.last_name}
                  </ItemTitle>
                </ItemContent>

                <ItemActions>
                  {existingChat?.unread && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />
                  )}
                </ItemActions>
              </Item>
            )
          })
        )}
      </div>

      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
