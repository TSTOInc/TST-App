import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const byId = query({
    args: { id: v.string(), orgId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const docId = ctx.db.normalizeId("brokers", args.id);
        if (!docId) throw new Error("Invalid document ID");

        const record = await ctx.db.get(docId);
        if (!record) return null;
        if (record.org_id !== args.orgId) return null;
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
            org_id: v.string(),
            address: v.string(),
            address_2: v.union(v.null(), v.string()),
            docket_number: v.string(),
            email: v.union(v.null(), v.string()),
            image_url: v.union(v.null(), v.string()),
            name: v.string(),
            notes: v.union(v.null(), v.string()),
            phone: v.union(v.null(), v.string()),
            status: v.string(),
            usdot_number: v.string(),
            website: v.union(v.null(), v.string()),
        })
    },
    handler: async (ctx, args) => {

        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");


        try {
            const newBrokerId = await ctx.db.insert("brokers",
                {
                    org_id: args.broker.org_id,
                    address: args.broker.address,
                    address_2: args.broker.address_2,
                    docket_number: args.broker.docket_number,
                    email: args.broker.email,
                    image_url: args.broker.image_url,
                    name: args.broker.name,
                    notes: args.broker.notes,
                    phone: args.broker.phone,
                    status: args.broker.status,
                    usdot_number: args.broker.usdot_number,
                    website: args.broker.website
                });
            return newBrokerId;
        }
        catch (e) {
            console.log(e);
            return null;
        }

    },
});