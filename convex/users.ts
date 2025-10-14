import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


// Create a new user
export const create = mutation({
  args: { email: v.string(), subject: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      email: args.email,
      clerk_id: args.subject, // store Clerk ID here
    });
  },
});

// Get a user by Clerk ID
export const getUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerk_id"), clerkId))
      .first();
  },
});

// Update or create a user
export const updateOrCreateUser = mutation({
  args: { clerkUser: v.any() },
  handler: async (ctx, { clerkUser }) => {
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerk_id"), clerkUser.id))
      .first();

    if (existing) {
      return await ctx.db.patch(existing._id, { ...clerkUser, clerk_id: clerkUser.id });
    } else {
      return await ctx.db.insert("users", { ...clerkUser, clerk_id: clerkUser.id });
    }
  },
});

// Delete a user by Clerk ID
export const deleteUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerk_id"), clerkId))
      .first();

    if (!user) return;

    return await ctx.db.delete(user._id);
  },
});
