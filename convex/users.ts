import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { createClerkClient } from "@clerk/backend";
import { internal } from "./_generated/api";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

//
// 🔥 PUBLIC ACTION (Called from webhook)
//

export const syncUserFromClerk = action({
  args: { clerkUser: v.any() },
  handler: async (ctx, { clerkUser }) => {
    const clerkUserId = clerkUser.id;

    // 1️⃣ Upsert user first
    const userId = await ctx.runMutation(
      internal.users.upsertUserInternal,
      {
        clerkUser,
      }
    );

    // 2️⃣ Fetch org memberships from Clerk
    const memberships =
      await clerkClient.users.getOrganizationMembershipList({
        userId: clerkUserId,
        limit: 50,
      });

    // 3️⃣ Sync orgs + memberships
    const sanitizedMemberships = memberships.data.map((m) => ({
      clerk_org_id: m.organization.id,
      organization_name: m.organization.name,
      role: m.role,
    }));

    await ctx.runMutation(
      internal.users.syncMembershipsInternal,
      {
        userId,
        memberships: sanitizedMemberships,
      }
    );

    return { success: true };
  },
});

//
// 🔒 INTERNAL: UPSERT USER
//

export const upsertUserInternal = internalMutation({
  args: { clerkUser: v.any() },
  handler: async (ctx, { clerkUser }) => {
    const clerkId = clerkUser.id;

    const email =
      clerkUser.email_addresses?.[0]?.email_address;

    const userData: any = {
      clerk_id: clerkId,
    };

    if (email) userData.email = email;
    if (clerkUser.first_name) userData.first_name = clerkUser.first_name;
    if (clerkUser.last_name) userData.last_name = clerkUser.last_name;
    if (clerkUser.image_url) userData.image_url = clerkUser.image_url;
    if (clerkUser.username) userData.username = clerkUser.username;


    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerk_id", clerkId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, userData);
      return existing._id;
    }

    return await ctx.db.insert("users", userData);
  },
});

//
// 🔒 INTERNAL: SYNC MEMBERSHIPS + ORGANIZATIONS
//

export const syncMembershipsInternal = internalMutation({
  args: {
    userId: v.id("users"),
    memberships: v.array(
      v.object({
        clerk_org_id: v.string(),
        organization_name: v.string(),
        role: v.string(),
      })
    ),

  },
  handler: async (ctx, { userId, memberships }) => {
    for (const membership of memberships) {
      const clerkOrgId = membership.clerk_org_id;



      // 1️⃣ Upsert Organization
      let org = await ctx.db
        .query("organizations")
        .withIndex("by_clerkOrgId", (q) =>
          q.eq("clerk_org_id", clerkOrgId)
        )
        .unique();

      if (!org) {
        const orgId = await ctx.db.insert("organizations", {
          clerk_org_id: clerkOrgId,
          name: membership.organization_name,
        });

        org = await ctx.db.get(orgId);
      }

      if (!org) continue;

      // 2️⃣ Upsert Membership
      const existingMembership = await ctx.db
        .query("memberships")
        .withIndex("by_userId", (q) =>
          q.eq("user_id", userId)
        )
        .collect();

      const alreadyExists = existingMembership.find(
        (m) => m.org_id === org!._id
      );

      if (!alreadyExists) {
        await ctx.db.insert("memberships", {
          user_id: userId,
          org_id: org._id,
          role: membership.role,
        });
      } else {
        await ctx.db.patch(alreadyExists._id, {
          role: membership.role,
        });
      }
    }
  },
});

//
// 🔒 DELETE USER (Webhook: user.deleted)
//

export const deleteUserInternal = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerk_id", clerkId)
      )
      .unique();

    if (!user) return;

    // delete memberships first
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) =>
        q.eq("user_id", user._id)
      )
      .collect();

    for (const m of memberships) {
      await ctx.db.delete(m._id);
    }

    await ctx.db.delete(user._id);
  },
});
