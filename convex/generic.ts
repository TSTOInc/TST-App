import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const updateGenericFields = mutation({
  args: {
    tableName: v.string(),
    id: v.string(), 
    fields: v.any(), // Passes { fieldKey: newValue, anotherFieldKey: value }
  },
  handler: async (ctx, args) => {
    // Dynamically validate and normalize the string ID for the given table
    const targetId = ctx.db.normalizeId(args.tableName as any, args.id);
    if (!targetId) {
      throw new Error(`Invalid ID format for table: ${args.tableName}`);
    }

    // Apply the partial updates safely
    await ctx.db.patch(targetId, args.fields);
    return { success: true };
  },
});