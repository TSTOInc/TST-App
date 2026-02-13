import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserWithOrg } from "./lib/auth";

export const byId = query({
    args: { table: v.string(), id: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity?.subject) throw new Error("Not authenticated");

        const { user, org } = await requireUserWithOrg(ctx);

        const docId = ctx.db.normalizeId(args.table as any, args.id);
        if (!docId) throw new Error("Invalid document ID");

        const record = await ctx.db.get(docId);
        if (!record) return null;
        if (record.org_id !== org._id) return null;


        return record;
    },
});