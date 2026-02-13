import { internalQuery } from "./_generated/server";
import { v } from "convex/values";


// 🏢 Get Current Organization
export const getUserWithOrg = internalQuery({
    handler: async (ctx) => {
        // Check if user is authenticated
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        // Find user by clerk_id
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) =>
                q.eq("clerk_id", identity.subject)
            )
            .unique();

        if (!user) throw new Error("User not found");

        // Find membership
        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_userId", (q) =>
                q.eq("user_id", user._id)
            )
            .unique();

        if (!membership) {
            throw new Error("User not in organization");
        }

        const org = await ctx.db.get(membership.org_id);
        if (!org) {
            throw new Error("Organization not found");
        }
        // Return organization
        return {
            user,
            org,
            membership,
        };
    },
});