import { Id } from "./_generated/dataModel";
import { query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireUserWithOrg } from "./lib/auth";




export const byId = query({
    args: {
        table: v.string(),
        id: v.string(),
    },
    handler: async (ctx, args) => {

        const identity = await ctx.auth.getUserIdentity();
        if (!identity?.subject) throw new Error("Not authenticated");

        const { user, org } = await requireUserWithOrg(ctx);

        const logs = await ctx.db
            .query("audit_logs")
            .withIndex("by_record_org", (q) =>
                q
                    .eq("table", args.table)
                    .eq("record_id", args.id)
                    .eq("org_id", org._id)
            )
            .order("desc")
            .collect();

        const logsWithUserAndEntity = await Promise.all(
            logs.map(async (log: any) => {
                const user = await ctx.db.get("users", log.performed_by);
                const entity = await ctx.db.get(log.table, log.record_id);


                return {
                    ...log,
                    entity,
                    user
                };
            })
        );

        return logsWithUserAndEntity;

        return logs;
    },
});