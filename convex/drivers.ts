import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireUserWithOrg } from "./lib/auth";
import { logAudit } from "./lib/audit";

export const create = mutation({
    args: {
        driver: v.object({
            email: v.optional(v.string()),
            image_url: v.optional(v.string()),
            license_number: v.optional(v.string()),
            license_url: v.optional(v.string()),
            name: v.string(),
            phone: v.string(),
            status: v.string(),
        })
    },
    handler: async (ctx, args) => {

        const identity = await ctx.auth.getUserIdentity();
        if (!identity?.subject) throw new Error("Not authenticated");

        const { user, org } = await requireUserWithOrg(ctx);

        const newDriverId = await ctx.db.insert("drivers", {
            org_id: org._id,
            created_by: user._id,
            ...args.driver,
        });

        await logAudit(ctx, {
            table: "drivers",
            recordId: newDriverId,
            action: "create",
            userId: user._id,
            org_id: org._id,
            after: args.driver,
        });


        return newDriverId;

    },
});



