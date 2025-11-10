import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const create = mutation({
    args: {
        equipment: v.object({
            org_id: v.string(),
            equipment_length: v.union(v.null(), v.string()),
            equipment_number: v.string(),
            equipment_type: v.string(),
            image_url: v.union(v.null(), v.string()),
            status: v.string(),
        })
    },
    handler: async (ctx, args) => {

        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");


        try {
            const newEquipmentId = await ctx.db.insert("equipment",
                {
                    org_id: args.equipment.org_id,
                    equipment_length: args.equipment.equipment_length,
                    equipment_number: args.equipment.equipment_number,
                    equipment_type: args.equipment.equipment_type,
                    image_url: args.equipment.image_url,
                    status: args.equipment.status
                });
            return newEquipmentId;
        }
        catch (e) {
            console.log(e);
            return null;
        }

    },
});



