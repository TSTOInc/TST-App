'use client'
import React, { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SendIcon } from "lucide-react"
import { ButtonGroup } from "@/components/ui/button-group"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { useUser } from "@clerk/nextjs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from '@/components/ui/skeleton'

const Page = ({ params }) => {
    const { id } = React.use(params)

    const { user } = useUser()
    const currentUserClerkId = user?.id

    const currentUser = useQuery(api.users.getUser, { clerkId: currentUserClerkId ?? "" })
    const currentUserId = currentUser?._id

    const chatData = useQuery(api.chats.get, { id })
    const messages = useQuery(api.messages.byChatId, { id }) || []
    const createMessage = useMutation(api.messages.create)

    const [newMessage, setNewMessage] = useState("")
    const messagesEndRef = useRef(null)
    const messagesContainerRef = useRef(null)

    const markAsDelivered = useMutation(api.messages.markAsDelivered);
    const markAsRead = useMutation(api.messages.markAsRead);

    // scroll to bottom when new messages appear
    useEffect(() => {
        if (!messages || !currentUserId) return;

        messages.forEach((msg) => {
            // Skip if current user sent the message
            if (msg.senderId !== currentUserId) {
                markAsDelivered({ messageId: msg._id, userId: currentUserId });
                markAsRead({ messageId: msg._id, userId: currentUserId });
            }
        });
    }, [messages, currentUserId]);


    if (!chatData) return <div className="flex flex-col h-[calc(100vh-100px)]">
        {/* Header */}
        <div className="flex-shrink-0 mb-4 p-4 border-b flex items-center gap-4">
            <>
                <Skeleton className="size-12 rounded-full" />
                <div>
                    <Skeleton className="h-6 w-50 mb-3 rounded" />
                    <Skeleton className="h-4 w-32 rounded" />
                </div>
            </>
        </div>


        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 flex flex-col min-h-0">
            <div className="flex flex-col mt-auto">
            </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 mt-4 px-4">
            <ButtonGroup className="[--radius:9999rem] w-full">
                <InputGroup className="flex-1">
                    <InputGroupInput
                        placeholder="Send a message..."
                        value="" // 👈 keep controlled
                        onChange={() => { }} // 👈 dummy no-op handler
                    />
                </InputGroup>

                <Button variant="outline" size="icon">
                    <SendIcon />
                </Button>
            </ButtonGroup>
        </div>
    </div>
    if (!messages) return <p>Loading messages...</p>

    const handleSend = async () => {
        if (!newMessage.trim()) return
        await createMessage({ senderId: currentUserId, chatId: id, text: newMessage })
        setNewMessage("")
        setTimeout(() => {
            if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
            }
        }, 50)
    }

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            {/* Header */}
            <div className="flex-shrink-0 mb-4 p-4 border-b flex items-center gap-4">
                {chatData.type === "group" ? (
                    <>
                        {/* Optional: Group avatar */}
                        <Avatar>
                            <AvatarFallback>G</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold">Chat Name {/* Later implement chat names for groups */}</h1>
                            <h2 className="text-sm text-gray-500">
                                {chatData.participants.map((p) => p.name).join(", ")}
                            </h2>
                        </div>
                    </>
                ) : (
                    (() => {
                        // Direct chat: find the other user
                        const otherUser = chatData.participants.find((p) => p.participant_id !== currentUserId)
                        return (
                            <>
                                <Avatar className="size-12">
                                    {otherUser?.image_url ? (
                                        <AvatarImage src={otherUser.image_url} alt={`${otherUser.first_name} ${otherUser.last_name}`} />
                                    ) : (
                                        <AvatarFallback>{otherUser ? otherUser.first_name[0] : "U"}</AvatarFallback>
                                    )}
                                </Avatar>
                                <div>
                                    <h1 className="text-2xl font-bold">{otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : "User"}</h1>
                                    <h2 className="text-sm text-gray-500">{otherUser?.username || "no username"}</h2>
                                </div>
                            </>
                        )
                    })()
                )}
            </div>


            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 flex flex-col min-h-0">
                <div className="flex flex-col mt-auto">
                    {messages
                        .slice()
                        .sort((a, b) => a._creationTime - b._creationTime)
                        .map((msg, index) => {
                            const isCurrentUser = msg.senderId === currentUserId
                            const prevMsg = messages[index - 1]
                            const nextMsg = messages[index + 1]

                            const sameSenderAsPrev = prevMsg && prevMsg.senderId === msg.senderId
                            const sameSenderAsNext = nextMsg && nextMsg.senderId === msg.senderId

                            // Determine corner rounding
                            let roundedClass = ""
                            if (!sameSenderAsPrev && !sameSenderAsNext) {
                                roundedClass = "rounded-2xl"
                            } else if (!sameSenderAsPrev && sameSenderAsNext) {
                                roundedClass = isCurrentUser ? "rounded-t-2xl rounded-l-2xl rounded-br-xs"
                                    : "rounded-t-2xl rounded-r-2xl rounded-bl-xs"
                            } else if (sameSenderAsPrev && sameSenderAsNext) {
                                roundedClass = isCurrentUser ? "rounded-tl-2xl rounded-bl-2xl rounded-tr-xs rounded-br-xs"
                                    : "rounded-tr-2xl rounded-br-2xl rounded-tl-xs rounded-bl-xs"
                            } else if (sameSenderAsPrev && !sameSenderAsNext) {
                                roundedClass = isCurrentUser ? "rounded-t-2xl rounded-l-2xl rounded-r-2xl rounded-b-2xl rounded-tr-xs"
                                    : "rounded-t-2xl rounded-r-2xl rounded-l-2xl rounded-b-2xl rounded-tl-xs"
                            }

                            return (
                                <div
                                    key={msg._id}
                                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} ${sameSenderAsPrev ? "mt-0.5" : "mt-2"}`}
                                >
                                    <div
                                        className={`relative p-1 px-3 max-w-xs break-words ${isCurrentUser ? "bg-blue-500 text-white" : "bg-secondary text-secondary-foreground"} ${roundedClass}`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            )
                        })}

                    <div ref={messagesEndRef} />
                </div>

            </div>

            {/* Footer */}
            <div className="flex-shrink-0 mt-4 px-4">
                <ButtonGroup className="[--radius:9999rem] w-full">
                    <InputGroup className="flex-1">
                        <InputGroupInput
                            placeholder="Send a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                    </InputGroup>
                    <Button variant="outline" size="icon" onClick={handleSend}>
                        <SendIcon />
                    </Button>
                </ButtonGroup>
            </div>
        </div>
    )
}

export default Page
