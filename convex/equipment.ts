import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireUserWithOrg } from "./lib/auth";
import { logAudit } from "./lib/audit";

export const create = mutation({
    args: {
        equipment: v.object({
            equipment_length: v.optional(v.string()),
            equipment_number: v.string(),
            equipment_type: v.string(),
            image_url: v.optional(v.string()),
            status: v.string(),
        })
    },
    handler: async (ctx, args) => {

        const identity = await ctx.auth.getUserIdentity();
        if (!identity?.subject) throw new Error("Not authenticated");

        const { user, org } = await requireUserWithOrg(ctx);

        const newEquipmentId = await ctx.db.insert("equipment", {
            org_id: org._id,
            created_by: user._id,
            ...args.equipment,
        });

        if (!newEquipmentId) throw new Error("Failed to create equipment");

        await logAudit(ctx, {
            table: "equipment",
            recordId: newEquipmentId,
            action: "create",
            userId: user._id,
            org_id: org._id,
            after: args.equipment,
        });

        if (!newEquipmentId) throw new Error("Failed to log the creation of the equipment");

        return newEquipmentId;

    },
});



