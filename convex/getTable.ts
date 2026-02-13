import { Id } from "./_generated/dataModel";
import { query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { requireUserWithOrg } from "./lib/auth";

export const all = query({
  args: { table: v.string() },
  handler: async (ctx, args) => {

    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Not authenticated");

    const { user, org } = await requireUserWithOrg(ctx);

    const tasks = await ctx.db.query(args.table as any).withIndex("by_orgId", (q: any) => q.eq("org_id", org._id)).collect();

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
    else if (args.table === "brokers_agents") {
      const tasksWithBrokerName = await Promise.all(
        tasks.map(async (task: any) => {
          const brokerName = await getBrokerName(ctx, task.broker_id ?? null);
          return {
            ...task,
            broker_name: brokerName,
          };
        })
      );

      return tasksWithBrokerName;
    }
    else {
      return tasks;
    }
  },
});
export const allWithIndex = query({
  args: { table: v.string(), index: v.string(), field: v.string(), indexValue: v.string() },
  handler: async (ctx, args) => {


    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Not authenticated");

    const { user, org } = await requireUserWithOrg(ctx);

    const tasks = await ctx.db.query(args.table as any).withIndex(args.index, (q: any) => q.eq(args.field, args.indexValue)).collect();

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
    return tasks;
  },
});
export const byUserIds = query({
  args: { userIds: v.array(v.string()) },
  handler: async (ctx, args) => {

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");


    const usersQuery = ctx.db.query("users");

    // Build an OR condition for each userId
    const filtered = usersQuery.filter((q) =>
      q.or(...args.userIds.map((id) => q.eq(q.field("clerk_id"), id)))
    );

    const tasks = await filtered.collect();
    return tasks;
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