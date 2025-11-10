import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

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
        if (!identity) throw new Error("Not authenticated");


        try {
            const newTruck_InspectionId = await ctx.db.insert("truck_inspections",
                {
                    org_id: args.truck_inspections.org_id,
                    inspection_date: args.truck_inspections.inspection_date,                    
                    inspection_type: args.truck_inspections.inspection_type,
                    notes: args.truck_inspections.notes,
                    result: args.truck_inspections.result,
                    truck_id: args.truck_inspections.truck_id
                });
            return newTruck_InspectionId;
        }
        catch (e) {
            console.log(e);
            return null;
        }

    },
});