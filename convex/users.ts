import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { createClerkClient } from '@clerk/backend'
import { internal } from "./_generated/api";
function ensureEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing environment variable: ${name}`);
  return val;
}
// Create a new user (we are not using this so far, but could be useful, so for now its commented out)
/*
export const create = mutation({
  args: { email: v.string(), subject: v.string() },
  handler: async (ctx, args) => {

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");


    return await ctx.db.insert("users", {
      email: args.email,
      clerk_id: args.subject, // store Clerk ID here
    });
  },
});
*/


//Get all users from a organization
export const getAll = query({
  args: { orgId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const users = await ctx.db.query("users").collect();
    const filtered = users.filter((u) =>
      Array.isArray(u.organization_ids) && u.organization_ids.includes(args.orgId)
    );

    return filtered;
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


//THIS IS CALLED FROM THE WEBHOOK IN http.ts
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

// ✅ Action that runs in Node and can use fetch()
export const updateOrCreateUserAction = action({
  args: { clerkUser: v.any() },
  handler: async (ctx, { clerkUser }) => {
    // 0️⃣ Call internal mutation to store the data in Convex
    console.log("🟢 Creating user on action", clerkUser.id);
    await ctx.runMutation(internal.users.updateOrCreateUserInternal, {
        clerkUser,
        organization_ids: [],
      });
    const userId = clerkUser.id;
    try {
       console.log("🟢 Getting orgs for user on action", clerkUser.id);
      // 1️⃣ Fetch organization memberships from Clerk (external request allowed here)
      const memberships = await clerkClient.users.getOrganizationMembershipList({
        userId,
        limit: 50,
      });

      const orgIds = memberships.data.map(
        (m) => m.organization.id || m.organization?.id
      );
      console.log("✅ Found orgs for user:", orgIds);
      // 2️⃣ Call internal mutation to store the data in Convex
      await ctx.runMutation(internal.users.updateOrCreateUserInternal, {
        clerkUser,
        organization_ids: orgIds,
      });
      return { success: true, orgIds };
    }
    catch (error) {
      console.error("❌ Error in updateOrCreateUserAction:", error);
    }
    

    return { success: false};
  },
});



// Update or create a user
export const updateOrCreateUserInternal = internalMutation({
  args: { clerkUser: v.any(), organization_ids: v.array(v.string()) },
  handler: async (ctx, { clerkUser, organization_ids }) => {
    const userId = clerkUser.id;

    const userData = {
      ...clerkUser,
      clerk_id: userId,
      organization_ids,
    };

    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerk_id"), userId))
      .first();

    if (existing) {
      console.log("🟡 Updating existing user:", userId);
      await ctx.db.patch(existing._id, userData);
    } else {
      console.log("🟢 Creating new user:", userId);
      await ctx.db.insert("users", userData);
    }
  },
});


//THIS IS CALLED FROM THE WEBHOOK IN http.ts

// Delete a user by Clerk ID
export const deleteUser = internalMutation({
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
