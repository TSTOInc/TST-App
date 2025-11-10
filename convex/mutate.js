import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const backfill = mutation({
  args: { table: v.string() },
  handler: async (ctx, { table } ) => {
    const trucks = await ctx.db.query(table).collect();
    const defaultOrgId = "org_340Hr587FJWZXdvKk7IfKNpTccG"; // replace with a real org ID

    for (const truck of trucks) {
      await ctx.db.patch(truck._id, { org_id: defaultOrgId });
    }

    return { success: true, patched: trucks.length };
  },
});
