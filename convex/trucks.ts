import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const byId = query({
    args: { id: v.string(), orgId: v.string() },
    handler: async (ctx, args) => {
        
        //Check if user is authenticated
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        //Check if the id is valid
        const docId = ctx.db.normalizeId("trucks", args.id);
        if (!docId) throw new Error("Invalid document ID");

        //Get the record
        const truck = await ctx.db.get(docId);
        if (!truck) return null;
        //Check if the user has access to the record
        if(truck.org_id !== args.orgId) return null;

        //Get inspection for truck
        const inspections = await ctx.db.query("truck_inspections").filter(q => q.eq(q.field("truck_id"), truck._id)).collect();
        //Add inspections to truck record
        const record = { ...truck, inspections };

        return record;
    },
});

export const create = mutation({
    args: {
        truck: v.object({
            org_id: v.string(),
            color: v.null(),
            docs: v.array(v.string()),
            driver_id: v.null(),
            image_url: v.string(),
            make: v.string(),
            model: v.string(),
            status: v.string(),
            transponder_id: v.null(),
            truck_alias: v.union(v.null(), v.string()),
            truck_number: v.string(),
            vin: v.string(),
            year: v.union(v.null(), v.float64()),
        })
    },
    handler: async (ctx, args) => {

        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        try {
            const newTruckId = await ctx.db.insert("trucks",
                {
                    org_id: args.truck.org_id,
                    color: args.truck.color,
                    docs: args.truck.docs,
                    driver_id: args.truck.driver_id,
                    image_url: args.truck.image_url,
                    make: args.truck.make,
                    model: args.truck.model,
                    status: args.truck.status,
                    transponder_id: args.truck.transponder_id,
                    truck_alias: args.truck.truck_alias,
                    truck_number: args.truck.truck_number,
                    vin: args.truck.vin,
                    year: args.truck.year
                });
            return newTruckId;
        }
        catch (e) {
            console.log(e);
            return null;
        }

    },
});