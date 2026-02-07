import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const create = mutation({
    args: {
        file: v.object({
            category: v.union(
                v.literal("CDL"),
                v.literal("BOL"),
                v.literal("POD"),
                v.literal("RATE_CONFIRMATION"),
                v.literal("CARRIER_AGREEMENT"),
                v.literal("TRAILER_INTERCHANGE"),
                v.literal("REGISTRATION"),
            ),
            entityId: v.string(),
            entityType: v.union(
                v.literal("drivers"),
                v.literal("loads"),
                v.literal("brokers"),
                v.literal("trucks"),
                v.literal("trailers")
            ),
            filename: v.string(),
            mimeType: v.string(),
            size: v.number(),
            storageKey: v.string(),
            expiresAt: v.optional(v.number()),
            org_id: v.string(),
        })
    },
    handler: async (ctx, args) => {

        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        //get the user
        const user = await ctx.db.query("users").withIndex("by_clerkId", (q) =>q.eq("clerk_id", identity.subject)).unique();

        if (!user) throw new Error("User not found");

        try {
            const newfileId = await ctx.db.insert("files",
                {
                    category: args.file.category,
                    entityId: args.file.entityId,
                    entityType: args.file.entityType,
                    filename: args.file.filename,
                    mimeType: args.file.mimeType,
                    size: args.file.size,
                    storageKey: args.file.storageKey,
                    uploadedBy: user._id,
                    expiresAt: args.file.expiresAt,
                    org_id: args.file.org_id
                });
            return newfileId;
        }
        catch (e) {
            console.log(e);
            return null;
        }

    },
});

export const byId = query({
    args: { entityType: v.union(v.literal("drivers"), v.literal("loads"), v.literal("brokers"), v.literal("trucks"), v.literal("trailers")), entityId: v.string(), orgId: v.string() },
    handler: async (ctx, args) => {
        
        //Check if user is authenticated
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        return await ctx.db
      .query("files")
      .withIndex("by_entity", (q) =>
        q
          .eq("entityType", args.entityType)
          .eq("entityId", args.entityId)
          .eq("org_id", args.orgId)
      )
      .collect();
    },
});
