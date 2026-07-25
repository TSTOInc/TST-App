import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserWithOrg } from "./lib/auth";
import { logAudit } from "./lib/audit";

// Fetch payment terms specifically for the assigned broker
export const getByBroker = query({
  args: {
    broker_id: v.optional(v.id("brokers")),
  },
  handler: async (ctx, args) => {
    const { org } = await requireUserWithOrg(ctx);

    if (!args.broker_id) {
      return [];
    }

    // Query using the by_brokerId index, then ensure org ownership security
    const terms = await ctx.db
      .query("payment_terms")
      .withIndex("by_brokerId_orgId", (q) => q.eq("broker_id", args.broker_id!).eq("org_id", org._id))
      .collect();

    return terms;
  },
});

export const create = mutation({
    args: {
        payment_term: v.object({
            broker_id: v.id("brokers"),
            days_to_pay: v.float64(),
            email: v.optional(v.string()),
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
                created_by: user._id,
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