import { Id } from "./_generated/dataModel";
import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { decrypt } from "./encryption";

// Create a new task with the given text
export const create = mutation({
  args: { participants: v.array(v.string()), type: v.string(), orgId: v.string() },
  handler: async (ctx, args) => {

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");


    const newChatId = await ctx.db.insert("chats", { type: args.type, participantsIds: args.participants as Id<"users">[], org_id: args.orgId });
    return newChatId;
  },
});




export const get = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const chatDocId = ctx.db.normalizeId("chats", args.id);
    if (!chatDocId) return null;

    const chat = await ctx.db.get(chatDocId);
    if (!chat) return null;

    const participants = await Promise.all(
      chat.participantsIds.map(async (participantId: Id<"users">) => {
        const info = await getParticipantInfo(ctx, participantId);
        return {
          participant_id: participantId,
          ...info, // spreads firstName, lastName, username
        };
      })
    );

    return {
      _creationTime: chat._creationTime,
      _id: chat._id,
      participants,
    };
  },
});





export const byParticipant = query({
  args: { participantId: v.string() },
  handler: async (ctx, args) => {

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get all chats
    const allChats = await ctx.db.query("chats").collect()

    // Filter chats where the participant is included
    const userChats = allChats.filter((chat) =>
      chat.participantsIds.includes(args.participantId as Id<"users">)
    )

    // Map each chat to include participant objects with names
    const chatsWithParticipants = await Promise.all(
      userChats.map(async (chat) => {
        let lastMessage = null;
        if (chat.lastMessageId) {
          const lastMessageDocId = ctx.db.normalizeId("messages", chat.lastMessageId);
          if (!lastMessageDocId) throw new Error("Invalid document ID");
          lastMessage = await ctx.db.get(lastMessageDocId);
        }
        if (lastMessage) {
          lastMessage = {
            ...lastMessage,
            text: lastMessage.text,
          };
        }
        const participants = await Promise.all(
          chat.participantsIds.map(async (id: Id<"users">) => {
            const user = await ctx.db.get(id)
            return {
              id,
              name: user?.first_name ?? "Unknown",
              image_url: user?.image_url
            }
          })
        )

        return {
          ...chat,
          participants,
          lastMessage,
        }
      })
    )

    return chatsWithParticipants
  },
})



async function getParticipantInfo(
  ctx: QueryCtx,
  userId: Id<"users"> | null
) {
  if (!userId) return null;

  const user = await ctx.db.get(userId);
  if (!user) return null;

  return {
    first_name: user.first_name ?? null,
    last_name: user.last_name ?? null,
    username: user.username ?? null,
    image_url: user.image_url ?? null
  };
}
