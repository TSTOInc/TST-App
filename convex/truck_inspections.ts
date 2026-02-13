import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { logAudit } from "./lib/audit";
import { requireUserWithOrg } from "./lib/auth";

export const create = mutation({
    args: {
        truck_inspections: v.object({
            org_id: v.string(),
            inspection_date: v.string(),
            inspection_type: v.string(),
            notes: v.null(),
            result: v.string(),
            truck_id: v.string(),
        })
    },
    handler: async (ctx, args) => {

        const identity = await ctx.auth.getUserIdentity();
        if (!identity?.subject) throw new Error("Not authenticated");

        const { user, org } = await requireUserWithOrg(ctx);


        const newTruck_InspectionId = await ctx.db.insert("truck_inspections",
            {
                org_id: args.truck_inspections.org_id,
                inspection_date: args.truck_inspections.inspection_date,
                inspection_type: args.truck_inspections.inspection_type,
                notes: args.truck_inspections.notes,
                result: args.truck_inspections.result,
                truck_id: args.truck_inspections.truck_id
            });

        if (!newTruck_InspectionId) throw new Error("Failed to create inspection");

        await logAudit(ctx, {
            table: "truck_inspections",
            recordId: newTruck_InspectionId,
            action: "create",
            userId: user._id,
            org_id: org._id,
            after: args.truck_inspections,
        });

        return newTruck_InspectionId;
    }

});