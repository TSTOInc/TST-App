import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireUserWithOrg } from "./lib/auth";
import { logAudit } from "./lib/audit";

export const byId = query({
    args: { id: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity?.subject) throw new Error("Not authenticated");

        const { user, org } = await requireUserWithOrg(ctx);

        const docId = ctx.db.normalizeId("brokers", args.id);
        if (!docId) throw new Error("Invalid document ID");

        const record = await ctx.db.get(docId);
        if (!record) return null;
        if (record.org_id !== org._id) return null;
        const payment_terms = await ctx.db.query("payment_terms").withIndex("by_brokerId", (q) => q.eq("broker_id", record._id)).collect();

        return {
            ...record,
            payment_terms,
        };
    },
});



export const updateNotes = mutation({
    args: {
        broker_id: v.string(),
        notes: v.union(v.null(), v.string()),
    },
    handler: async (ctx, args) => {

        if (!args.broker_id) return null;
        if (!args.notes) return null;

        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");


        try {
            await ctx.db.patch(args.broker_id as Id<"brokers">,
                {
                    notes: args.notes,
                });
            return true;
        }
        catch (e) {
            console.log(e);
            return null;
        }

    },
})

export const create = mutation({
    args: {
        broker: v.object({
            address: v.string(),
            address_2: v.optional(v.string()),
            docket_number: v.string(),
            email: v.optional(v.string()),
            image_url: v.optional(v.string()),
            name: v.string(),
            notes: v.optional(v.string()),
            phone: v.optional(v.string()),
            status: v.string(),
            usdot_number: v.string(),
            website: v.optional(v.string()),
        })
    },
    handler: async (ctx, args) => {

        const identity = await ctx.auth.getUserIdentity();
        if (!identity?.subject) throw new Error("Not authenticated");

        const { user, org } = await requireUserWithOrg(ctx);

        const newBrokerId = await ctx.db.insert("brokers",
            {
                org_id: org._id,
                created_by: user._id,
                ...args.broker,
            });

        await logAudit(ctx, {
            table: "brokers",
            recordId: newBrokerId,
            action: "create",
            userId: user._id,
            org_id: org._id,
            after: args.broker,
        });

        return newBrokerId;

    },
});