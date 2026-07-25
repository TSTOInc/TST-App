import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUserWithOrg } from "./lib/auth";
import { logAudit } from "./lib/audit"; // Update this import path to match where your logAudit helper lives

export const updateGenericFields = mutation({
  args: {
    tableName: v.string(),
    id: v.string(), 
    fields: v.any(), // Passes { fieldKey: newValue, anotherFieldKey: value }
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Not authenticated");

    const { user, org } = await requireUserWithOrg(ctx);

    // 1. Normalize the ID for the target table
    const targetId = ctx.db.normalizeId(args.tableName as any, args.id);
    if (!targetId) {
      throw new Error(`Invalid ID format for table: ${args.tableName}`);
    }

    // 2. Fetch current record state ("before")
    const beforeRecord = await ctx.db.get(targetId);
    if (!beforeRecord) {
      throw new Error(`Record not found in ${args.tableName}`);
    }

    // 3. Patch the record
    await ctx.db.patch(targetId, args.fields);

    // 4. Build updated state snapshot ("after")
    const afterRecord = {
      ...beforeRecord,
      ...args.fields,
    };

    // 5. Call your centralized logAudit helper
    await logAudit(ctx, {
      table: args.tableName,
      recordId: targetId,
      action: "update",
      userId: user._id,
      org_id: org._id,
      before: beforeRecord,
      after: afterRecord,
    });

    return { success: true };
  },
});