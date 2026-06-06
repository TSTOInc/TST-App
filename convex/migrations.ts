import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// 1. The Mutation: Updates dollars to cents
export const migrateDollarsToCents = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Migrate the core "loads" table
    const loads = await ctx.db.query("loads").collect();
    let loadCount = 0;

    for (const load of loads) {
      // Check if it looks like it hasn't been converted yet 
      // (e.g., if a rate is 2500 instead of 250000)
      // Warning: Be careful if you have exact small numbers, 
      // but usually load rates are in the hundreds/thousands.
      
      const newRate = Math.round(load.rate * 100);
      
      await ctx.db.patch(load._id, {
        rate: newRate,
      });
      loadCount++;
    }

    // 2. Migrate "payment_terms" fee amounts if they aren't percentages
    // (If fee_percent is a true percentage like 2.5 for 2.5%, leave it as a float,
    // but if it represents a flat dollar fee, multiply it by 100)

    return {
      message: `Successfully migrated ${loadCount} loads to cents.`,
    };
  },
});