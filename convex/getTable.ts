import { Id } from "./_generated/dataModel";
import { query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

export const all = query({
  args: { table: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const tasks = await (ctx.db.query(args.table) as any).collect();

    if (args.table === "loads") {
      const tasksWithStops = await Promise.all(
        tasks.map(async (task: any) => {
          const brokerName = await getBrokerName(ctx, task.broker_id ?? null);
          const paymentTermsDays = await getPaymentTernmsDays(ctx, task.payment_terms_id ?? null);

          const stops = await ctx.db
            .query("stops")
            .filter((q) => q.eq(q.field("load_id"), task._id))
            .collect();
          

          return {
            ...task,
            broker_name: brokerName,
            stops,
            payment_days_to_pay: paymentTermsDays ?? 0,
          };
        })
      );

      return tasksWithStops;
    }
    else {
      return tasks;
    }
  },
});

async function getBrokerName(ctx: QueryCtx, userId: Id<"brokers"> | null) {
  if (!userId) return null;
  return (await ctx.db.get(userId))?.name ?? null;
}
async function getPaymentTernmsDays(ctx: QueryCtx, userId: Id<"payment_terms"> | null) {
  if (!userId) return null;
  return (await ctx.db.get(userId))?.days_to_pay ?? null;
}