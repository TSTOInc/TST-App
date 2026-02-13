import { Id } from "./_generated/dataModel";
import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { decrypt } from "./encryption";
import { requireUserWithOrg } from "./lib/auth";

// Create a new task with the given text
export const create = mutation({
  args: {
    participants: v.array(v.id("users")),
    type: v.string(),
  },
  handler: async (ctx, { participants, type }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Not authenticated");

    const { user, org } = await requireUserWithOrg(ctx);

    const chatId = await ctx.db.insert("chats", {
      type,
      org_id: org._id,
    });

    for (const userId of participants) {
      await ctx.db.insert("chatParticipants", {
        chatId,
        userId,
      });
    }

    return chatId;
  },
});






export const get = query({
  args: { id: v.id("chats") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const chat = await ctx.db.get(id);
    if (!chat) return null;

    // 1️⃣ Get participants from join table
    const participantRows = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chatId", (q) =>
        q.eq("chatId", id)
      )
      .collect();

    // 2️⃣ Fetch user info
    const participants = await Promise.all(
      participantRows.map(async (row) => {
        const user = await ctx.db.get(row.userId);
        return {
          participant_id: row.userId,
          first_name: user?.first_name ?? null,
          last_name: user?.last_name ?? null,
          username: user?.username ?? null,
          image_url: user?.image_url ?? null,
        };
      })
    );

    return {
      _creationTime: chat._creationTime,
      _id: chat._id,
      type: chat.type,
      org_id: chat.org_id,
      participants,
    };
  },
});







export const byParticipant = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Not authenticated");

    const { user, org } = await requireUserWithOrg(ctx);

    // 1️⃣ Get chatParticipant rows for this user
    const memberships = await ctx.db
      .query("chatParticipants")
      .withIndex("by_userId", (q) =>
        q.eq("userId", user._id)
      )
      .collect();

    if (memberships.length === 0) return [];

    // 2️⃣ Get chats
    const chats = await Promise.all(
      memberships.map((m) => ctx.db.get(m.chatId))
    );

    // 3️⃣ Filter by org
    const orgChats = chats.filter(
      (chat) => chat && chat.org_id === org._id
    );

    return orgChats;
  },
});



export const findDirectChat = query({
  args: {
    userA: v.id("users"),
    userB: v.id("users"),
  },
  handler: async (ctx, { userA, userB }) => {

    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Not authenticated");

    const { user, org } = await requireUserWithOrg(ctx);

    const userAChats = await ctx.db
      .query("chatParticipants")
      .withIndex("by_userId", q => q.eq("userId", userA))
      .collect();

    for (const membership of userAChats) {
      const chat = await ctx.db.get(membership.chatId);
      if (!chat || chat.org_id !== org._id) continue;

      const otherParticipants = await ctx.db
        .query("chatParticipants")
        .withIndex("by_chatId", q => q.eq("chatId", chat._id))
        .collect();

      const hasUserB = otherParticipants.some(p => p.userId === userB);

      if (hasUserB && chat.type === "direct") {
        return chat;
      }
    }

    return null;
  },
});


export const byParticipantInOrg = query({
  handler: async (ctx) => {

    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Not authenticated");

    const { user, org } = await requireUserWithOrg(ctx);

    const memberships = await ctx.db
      .query("chatParticipants")
      .withIndex("by_userId", (q) =>
        q.eq("userId", user._id)
      )
      .collect();

    const chatIds = memberships.map((m) => m.chatId);

    if (chatIds.length === 0) return [];

    const chats = await Promise.all(
      chatIds.map(async (chatId) => {
        const chat = await ctx.db.get(chatId);
        if (!chat || chat.org_id !== org._id) return null;

        // 🔥 Check if there are unread messages
        const unreadMessages = await ctx.db
          .query("messages")
          .filter((q) =>
            q.and(
              q.eq(q.field("chatId"), chatId),
              q.neq(q.field("senderId"), user._id)
            )
          )
          .collect();

        const hasUnread = unreadMessages.some(
          (msg) => !msg.seenBy.includes(user._id)
        );

        const participantRows = await ctx.db
          .query("chatParticipants")
          .withIndex("by_chatId", q => q.eq("chatId", chatId))
          .collect();

        return {
          ...chat,
          participants: participantRows.map(p => p.userId),
          unread: hasUnread,
        };
      })
    );

    return chats.filter(Boolean);
  },
});


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
