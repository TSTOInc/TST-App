'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Button } from '@/components/ui/button'
import { SendIcon } from "lucide-react"
import { ButtonGroup } from "@/components/ui/button-group"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { useUser } from "@clerk/nextjs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from "next/navigation"

const Page = ({ params }) => {
  const { id } = React.use(params)
  const router = useRouter()

  const { user } = useUser()
  const currentUserClerkId = user?.id

  // ✅ Proper skip usage
  const currentUser = useQuery(
    api.users.getUserByClerkId,
    currentUserClerkId ? { clerkId: currentUserClerkId } : "skip"
  )

  const currentUserId = currentUser?._id

  const chatData = useQuery(
    api.chats.get,
    id ? { id } : "skip"
  )

  const messages = useQuery(
    api.messages.byChatId,
    id ? { id } : "skip"
  )

  const createMessage = useMutation(api.messages.create)
  const markAsDelivered = useMutation(api.messages.markAsDelivered)
  const markAsRead = useMutation(api.messages.markAsRead)

  const [newMessage, setNewMessage] = useState("")
  const messagesContainerRef = useRef(null)

  // ✅ Mark unread messages once
  useEffect(() => {
    if (!messages || !currentUserId) return

    messages.forEach((msg) => {
      if (
        msg.senderId !== currentUserId &&
        !msg.seenBy.includes(currentUserId)
      ) {
        markAsDelivered({ messageId: msg._id, userId: currentUserId })
        markAsRead({ messageId: msg._id, userId: currentUserId })
      }
    })
  }, [messages, currentUserId])

  // ✅ Auto scroll
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  if (chatData === undefined) {
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-40 mb-4" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (chatData === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-semibold mb-2">
          No chat found
        </h2>
        <Button onClick={() => router.push("/chats")}>
          Go back
        </Button>
      </div>
    )
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUserId) return

    await createMessage({
      senderId: currentUserId,
      chatId: id,
      text: newMessage,
    })

    setNewMessage("")
  }

  const sortedMessages =
    messages?.slice().sort(
      (a, b) => a._creationTime - b._creationTime
    ) || []

  const otherUser =
    chatData.type === "direct"
      ? chatData.participants.find(
          (p) => p.participant_id !== currentUserId
        )
      : null

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">

      {/* Header */}
      <div className="p-4 border-b flex items-center gap-4">
        {chatData.type === "direct" && otherUser ? (
          <>
            <Avatar className="size-12">
              <AvatarImage src={otherUser.image_url} />
              <AvatarFallback>
                {otherUser.first_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">
                {otherUser.first_name} {otherUser.last_name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {otherUser.username}
              </p>
            </div>
          </>
        ) : (
          <h1 className="text-xl font-bold">Group Chat</h1>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-2"
      >
        {sortedMessages.map((msg) => {
          const isCurrentUser =
            msg.senderId === currentUserId

          return (
            <div
              key={msg._id}
              className={`flex mb-2 ${
                isCurrentUser
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`px-3 py-2 max-w-xs rounded-2xl break-words ${
                  isCurrentUser
                    ? "bg-blue-500 text-white"
                    : "bg-secondary"
                }`}
              >
                {msg.text}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <ButtonGroup className="[--radius:9999rem] w-full">
          <InputGroup className="flex-1">
            <InputGroupInput
              placeholder="Send a message..."
              value={newMessage}
              onChange={(e) =>
                setNewMessage(e.target.value)
              }
              onKeyDown={(e) =>
                e.key === "Enter" && handleSend()
              }
            />
          </InputGroup>

          <Button
            variant="outline"
            size="icon"
            onClick={handleSend}
          >
            <SendIcon />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  )
}

export default Page