import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireUserWithOrg } from "./lib/auth";
import { logAudit } from "./lib/audit";

export const byId = query({
    args: { id: v.string() },
    handler: async (ctx, args) => {

        //Check if user is authenticated
        const identity = await ctx.auth.getUserIdentity();
        if (!identity?.subject) throw new Error("Not authenticated");

        const { user, org } = await requireUserWithOrg(ctx);

        //Check if the id is valid
        const docId = ctx.db.normalizeId("trucks", args.id);
        if (!docId) throw new Error("Invalid document ID");

        //Get the record
        const truck = await ctx.db.get(docId);
        if (!truck) return null;
        //Check if the user has access to the record
        if (truck.org_id !== org._id) return null;

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
            color: v.optional(v.string()),
            driver_id: v.optional(v.id("drivers")),
            image_url: v.string(),
            make: v.optional(v.string()),
            model: v.optional(v.string()),
            status: v.string(),
            transponder_id: v.optional(v.string()),
            truck_alias: v.optional(v.string()),
            truck_number: v.string(),
            vin: v.optional(v.string()),
            year: v.optional(v.float64()),
        })
    },
    handler: async (ctx, args) => {

        const identity = await ctx.auth.getUserIdentity();
        if (!identity?.subject) throw new Error("Not authenticated");

        const { user, org } = await requireUserWithOrg(ctx);

        const newTruckId = await ctx.db.insert("trucks",
            {
                created_by: user._id,
                org_id: org._id,
                color: args.truck.color,
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

        if (!newTruckId) throw new Error("Failed to create truck");

        await logAudit(ctx, {
            table: "trucks",
            recordId: newTruckId,
            action: "create",
            userId: user._id,
            org_id: org._id,
            after: args.truck,
        });
        return newTruckId;

    },
});