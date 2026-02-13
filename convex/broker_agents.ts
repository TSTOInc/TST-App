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

        const docId = ctx.db.normalizeId("brokers_agents", args.id);
        if (!docId) throw new Error("Invalid document ID");

        const record = await ctx.db.get(docId);
        if (!record) return null;
        if (record.org_id !== org._id) throw new Error("Unauthorized to view this record");

        const broker = await ctx.db.get("brokers", <Id<"brokers">>record.broker_id);

        return {
            ...record,
            broker,
        };
    },
});


export const create = mutation({
    args: {
        agent: v.object({
            broker_id: v.string(),
            email: v.optional(v.string()),
            name: v.string(),
            phone: v.optional(v.string()),
            position: v.optional(v.string()),
        })
    },
    handler: async (ctx, args) => {

        const identity = await ctx.auth.getUserIdentity();
        if (!identity?.subject) throw new Error("Not authenticated");

        const { user, org } = await requireUserWithOrg(ctx);

        const newBrokersAgentsId = await ctx.db.insert("brokers_agents",
            {
                org_id: org._id,
                created_by: user._id,
                ...args.agent,
            });


        await logAudit(ctx, {
            table: "brokers_agents",
            recordId: newBrokersAgentsId,
            action: "create",
            userId: user._id,
            org_id: org._id,
            after: args.agent,
        });

        return newBrokersAgentsId;

    },
});