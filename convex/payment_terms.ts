import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserWithOrg } from "./lib/auth";
import { logAudit } from "./lib/audit";




export const create = mutation({
    args: {
        payment_term: v.object({
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
        if (!identity?.subject) throw new Error("Not authenticated");

        const { user, org } = await requireUserWithOrg(ctx);


        const newPaymentTermId = await ctx.db.insert("payment_terms",
            {
                org_id: org._id,
                broker_id: args.payment_term.broker_id,
                days_to_pay: args.payment_term.days_to_pay,
                email: args.payment_term.email,
                fee_percent: args.payment_term.fee_percent,
                is_quickpay: args.payment_term.is_quickpay,
                name: args.payment_term.name
            });

        if (!newPaymentTermId) throw new Error("Failed to create payment term");

        await logAudit(ctx, {
            table: "payment_terms",
            recordId: newPaymentTermId,
            action: "create",
            userId: user._id,
            org_id: org._id,
            after: args.payment_term,
        });

        return newPaymentTermId;

    },
});