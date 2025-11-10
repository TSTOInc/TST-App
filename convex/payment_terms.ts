import { mutation, query } from "./_generated/server";
import { v } from "convex/values";




export const create = mutation({
    args: {
        payment_term: v.object({
            org_id: v.string(),
            broker_id: v.string(),
            days_to_pay: v.float64(),
            email: v.union(v.null(), v.string()),
            fee_percent: v.number(),
            is_quickpay: v.boolean(),
            name: v.string(),
        })
    },
    handler: async (ctx, args) => {

        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");


        try {
            const newPaymentTermId = await ctx.db.insert("payment_terms",
                {
                    org_id: args.payment_term.org_id,
                    broker_id: args.payment_term.broker_id,
                    days_to_pay: args.payment_term.days_to_pay,
                    email: args.payment_term.email,
                    fee_percent: args.payment_term.fee_percent,
                    is_quickpay: args.payment_term.is_quickpay,
                    name: args.payment_term.name
                });
            return newPaymentTermId;
        }
        catch (e) {
            console.log(e);
            return null;
        }

    },
});