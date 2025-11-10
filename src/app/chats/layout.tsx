'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery, useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from '@convex/_generated/api'
import { useUser, useOrganization } from '@clerk/nextjs'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
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

export default function ChatsLayout({ selectedChatId, children }: ChatsLayoutProps) {
  const router = useRouter()
  const { user } = useUser()
  const { organization } = useOrganization();
  const orgId = organization?.id || "";
  const currentUserId = user?.id

  // Queries
  const currentUserQuery = useQuery(api.users.getUser, {
    clerkId: currentUserId || "",
  })
  console.log("orgId", orgId)
  const usersQuery = useQuery(api.users.getAll, { orgId: orgId } )
  const currentUserIdFromDB = currentUserQuery?._id
  const chatsQuery = useQuery(api.chats.byParticipant, {
    participantId: currentUserIdFromDB || "",
  })
  const createChat = useMutation(api.chats.create)

  // Loading skeletons
  if (!currentUserQuery || !usersQuery || !chatsQuery) {
    return (
      <div className="flex h-full">
        <div className="w-1/4 border-r overflow-y-auto">
          <h2 className="text-2xl font-bold p-4">Messages</h2>
          {Array.from({ length: 8 }).map((_, i) => (
            <Item
              key={i}
              variant="outline"
              className="w-full px-4 py-3 cursor-pointer hover:bg-muted/20 transition rounded-none border-none justify-center"
            >
              <ItemMedia>
                <Skeleton className="h-12 w-12 rounded-full" />
              </ItemMedia>
              <ItemContent className="hidden md:block">
                <Skeleton className="h-4 w-28 mb-2 rounded" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
              </ItemContent>
            </Item>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    )
  }

  const currentUser = currentUserQuery
  const users = usersQuery.filter((u: any) => u.clerk_id !== currentUserId)

  const handleChat = async (otherUserId: string) => {
    try {
      const newChatId = await createChat({
        type: "direct",
        participants: [currentUser._id, otherUserId],
        orgId: orgId
      })
      router.push(`/chats/${newChatId}`)
    } catch (err) {
      console.error("Error starting chat:", err)
    }
  }

  return (
    <div className="flex h-full">
      {/* Left panel: chat list */}
      <div className="w-1/4 border-r overflow-y-auto flex flex-col">
        <h2 className="text-2xl font-bold p-4">Messages</h2>

        {/* ✅ Empty state */}
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-muted-foreground mb-3">
              There are no users you can chat with in this organization.
            </p>
            <Button variant="outline" onClick={() => router.push("/account/organization/organization-members")}>
              Invite Users
            </Button>
          </div>
        ) : (
          users.map((u: any) => {
            const existingChat = chatsQuery.find((chat: any) =>
              chat.participants.some((p: any) => p.id === u._id)
            )

            const handleClick = () =>
              existingChat
                ? router.push(`/chats/${existingChat._id}`)
                : handleChat(u._id)

            return (
              <Item
                key={u._id}
                variant="outline"
                className="w-full px-4 py-3 cursor-pointer hover:bg-muted/20 transition rounded-none border-none justify-center"
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
                  <ItemTitle
                    className={`flex items-center gap-2 ${
                      existingChat?.lastMessage &&
                      existingChat.lastMessage.senderId !== currentUserIdFromDB &&
                      !existingChat.lastMessage.seenBy.includes(currentUserIdFromDB as Id<"users">)
                        ? "font-bold"
                        : "font-normal"
                    }`}
                  >
                    {u.first_name} {u.last_name}
                  </ItemTitle>

                  <div
                    className={`${
                      existingChat?.lastMessage &&
                      existingChat.lastMessage.senderId !== currentUserIdFromDB &&
                      !existingChat.lastMessage.seenBy.includes(currentUserIdFromDB as Id<"users">)
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {existingChat?.lastMessage ? (
                      <div className="flex items-center justify-start gap-1">
                        <span className="truncate max-w-[150px] sm:max-w-[200px]">
                          {existingChat.lastMessage.senderId === currentUserIdFromDB
                            ? "You: "
                            : ""}
                          {existingChat.lastMessage.text}
                        </span>
                        <span className="font-bold">·</span>
                        <span className="flex-shrink-0 text-muted-foreground text-xs ml-1">
                          {timeAgo(existingChat.lastMessage._creationTime)}
                        </span>
                      </div>
                    ) : (
                      "No messages yet"
                    )}
                  </div>
                </ItemContent>

                <ItemActions>
                  {existingChat?.lastMessage &&
                    existingChat.lastMessage.senderId !== currentUserIdFromDB &&
                    !existingChat.lastMessage.seenBy.includes(currentUserIdFromDB as Id<"users">) && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />
                    )}
                </ItemActions>
              </Item>
            )
          })
        )}
      </div>

      {/* Right panel: chat content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
