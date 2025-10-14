import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const byChatId = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("chatId"), args.id))
      .collect();

    return messages;
  },
});

// create
export const create = mutation({
  args: { senderId: v.string(), chatId: v.string(), text: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Insert the message
    const newMessageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      senderId: args.senderId,
      text: args.text,
      deliveredTo: [],
      seenBy: [],
    });

    // Update chat with only lastMessageId
    const chatDocId = ctx.db.normalizeId("chats", args.chatId);
    if (chatDocId) {
      await ctx.db.patch(chatDocId, {
        lastMessageId: newMessageId,
      });
    }

    return newMessageId;
  },
});

export const markAsDelivered = mutation({
  args: { messageId: v.string(), userId: v.string() },
  handler: async (ctx, { messageId, userId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const normalizedMessageId = ctx.db.normalizeId("messages", messageId);
    if (!normalizedMessageId) throw new Error("Invalid message ID");

    const message = await ctx.db.get(normalizedMessageId);
    if (!message) throw new Error("Message not found");

    if (!message.deliveredTo.includes(userId)) {
      await ctx.db.patch(normalizedMessageId, {
        deliveredTo: [...message.deliveredTo, userId],
      });
    }
  },
});


export const markAsRead = mutation({
  args: { messageId: v.string(), userId: v.string() },
  handler: async (ctx, { messageId, userId }) => {

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const normalizedMessageId = ctx.db.normalizeId("messages", messageId);
    if (!normalizedMessageId) throw new Error("Invalid message ID");

    const msg = await ctx.db.get(normalizedMessageId);
    if (!msg) return;
    if (!msg.seenBy.includes(userId)) {
      await ctx.db.patch(normalizedMessageId, { seenBy: [...msg.seenBy, userId] });
    }
  },
});