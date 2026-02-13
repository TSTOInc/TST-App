import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { requireUserWithOrg } from "./lib/auth";
import { logAudit } from "./lib/audit";





const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;




export const createUpload = mutation({
    args: {
        file: v.object({
            category: v.union(
                v.literal("CDL"),
                v.literal("BOL"),
                v.literal("POD"),
                v.literal("RATE_CONFIRMATION"),
                v.literal("INNOUT_TICKET"),
                v.literal("LUMPER"),
                v.literal("SCALE_TICKET"),
                v.literal("TRAILER_INTERCHANGE"),
                v.literal("CARRIER_AGREEMENT"),
                v.literal("QUICKPAY_AGREEMENT"),
                v.literal("REGISTRATION"),
                v.literal("ID_CARD"),
                v.literal("MISC"),
            ),
            entityId: v.string(),
            entityType: v.union(
                v.literal("drivers"),
                v.literal("loads"),
                v.literal("brokers"),
                v.literal("trucks"),
                v.literal("equipment")
            ),
            filename: v.string(),
            mimeType: v.string(),
            size: v.number(),
            expiresAt: v.optional(v.number()),
        })
    },
    handler: async (ctx, args) => {

        const identity = await ctx.auth.getUserIdentity();
        if (!identity?.subject) throw new Error("Not authenticated");

        const { user, org } = await requireUserWithOrg(ctx);

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
                    storageKey: "",
                    uploadedBy: user._id,
                    expiresAt: args.file.expiresAt,
                    org_id: org._id,
                    status: "uploading"
                });
            return newfileId;
        }
        catch (e) {
            console.log(e);
            return null;
        }

    },
});

export const finalizeUpload = mutation({
    args: {
        id: v.id("files"),
        storageKey: v.string(),
    },
    handler: async (ctx, args) => {

        const identity = await ctx.auth.getUserIdentity();
        if (!identity?.subject) throw new Error("Not authenticated");

        const { user, org } = await requireUserWithOrg(ctx);

        if (!user) throw new Error("User not found");

        try {
            const file = await ctx.db.get(args.id);
            if (!file) throw new Error("Load not found")

            await ctx.db.patch(args.id, {
                storageKey: args.storageKey,
                status: "ready"
            });


            await logAudit(ctx, {
                table: "files",
                recordId: args.id,
                action: "update",
                userId: user._id,
                org_id: org._id,
                before: file,
                after: {
                    ...file,
                    storageKey: args.storageKey,
                    status: "ready"
                },
            });
        }
        catch (e) {
            console.log(e);
            throw new Error("Failed to finalize upload");
        }

    },
});

export const failedUpload = mutation({
    args: { id: v.id("files") },
    handler: async (ctx, { id }) => {
        await ctx.db.patch(id, {
            status: "failed",
        });
    },
});

export const byId = query({
    args: { entityType: v.union(v.literal("drivers"), v.literal("loads"), v.literal("brokers"), v.literal("trucks"), v.literal("equipment")), entityId: v.string(), status: v.optional(v.union(v.literal("uploading"), v.literal("ready"), v.literal("failed"), v.literal("deleted"))) },
    handler: async (ctx, args) => {

        //Check if user is authenticated
        const identity = await ctx.auth.getUserIdentity();
        if (!identity?.subject) throw new Error("Not authenticated");

        const { user, org } = await requireUserWithOrg(ctx);



        return await ctx.db
            .query("files")
            .withIndex("by_entity", (q) =>
                q
                    .eq("entityType", args.entityType)
                    .eq("entityId", args.entityId)
                    .eq("org_id", org._id)
                    .eq("status", args.status ?? "ready")
            )
            .collect();
    },
});

export const deleteFile = mutation({
    args: { id: v.id("files") },
    handler: async (ctx, { id }) => {

        const identity = await ctx.auth.getUserIdentity();
        if (!identity?.subject) throw new Error("Not authenticated");

        const { user, org } = await requireUserWithOrg(ctx);

        const file = await ctx.db.get(id);
        if (!file) throw new Error("File not found");
        if (file.org_id !== org._id) throw new Error("Unauthorized to delete this file");
        if (file.storageKey) {
            await ctx.db.patch(id, { status: "deleted" }); // mark as deleted
        }
    },
});


export const renameFile = mutation({
    args: {
        id: v.id("files"),
        filename: v.string(),
    },
    handler: async (ctx, args) => {

        const identity = await ctx.auth.getUserIdentity();
        if (!identity?.subject) throw new Error("Not authenticated");

        const { user, org } = await requireUserWithOrg(ctx);

        if (!user) throw new Error("User not found");

        const file = await ctx.db.get(args.id);
        if (!file) throw new Error("File not found");
        if (file.org_id !== org._id) throw new Error("Unauthorized to rename this file");

        try {
            await ctx.db.patch(args.id, {
                filename: args.filename,
            });
        }
        catch (e) {
            throw new Error("Failed to rename file");
        }

    },
});

export const changeExpiration = mutation({
    args: {
        id: v.id("files"),
        expiresAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {

        const identity = await ctx.auth.getUserIdentity();
        if (!identity?.subject) throw new Error("Not authenticated");

        const { user, org } = await requireUserWithOrg(ctx);

        if (!user) throw new Error("User not found");

        const file = await ctx.db.get(args.id);
        if (!file) throw new Error("File not found");
        if (file.org_id !== org._id) throw new Error("Unauthorized to rename this file");

        try {
            await ctx.db.patch(args.id, {
                expiresAt: args.expiresAt,
            });
        }
        catch (e) {
            throw new Error("Failed to change expiration");
        }

    },
});

// HELPER MUTATION TO DELETE FAILED OR EXPIRED UPLOADS (NOT EXPOSED TO FRONTEND)
export const cleanupStaleUploadsInternal = internalMutation({
    args: {},
    handler: async (ctx) => {
        console.log("Cleaning up stale uploads...");
        const now = Date.now();
        const cutoff = now - ONE_HOUR;
        const cutoff_thirty = now - ONE_DAY;


        // Files stuck uploading for more than 1 hour
        const staleUploading = await ctx.db
            .query("files")
            .withIndex("by_status", (q) => q.eq("status", "uploading"))
            .filter((q) => q.lt(q.field("_creationTime"), cutoff))
            .collect();

        // Files explicitly marked as failed
        const failedFiles = await ctx.db
            .query("files")
            .withIndex("by_status", (q) => q.eq("status", "failed"))
            .collect();

        // Files marked as deleted for more than 30 days
        const softDeletedFiles = await ctx.db
            .query("files")
            .withIndex("by_status", (q) => q.eq("status", "deleted"))
            .filter((q) => q.lt(q.field("_creationTime"), cutoff_thirty))
            .collect();

        const filesToDelete = [...staleUploading, ...failedFiles, ...softDeletedFiles];

        for (const file of filesToDelete) {
            await ctx.db.delete(file._id);
        }

        //return list of storage keys that should be deleted from storage
        return {
            storageKeys: filesToDelete.map(f => f.storageKey).filter(Boolean)
        };
    },
});

