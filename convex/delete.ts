import { mutation } from "./_generated/server"
import { v } from "convex/values"

export const byId = mutation({
  args: {
    table: v.string(),
    id: v.string(),
    orgId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const identity = await ctx.auth.getUserIdentity()
      if (!identity) throw new Error("Not authenticated")

      const docId = ctx.db.normalizeId(args.table as any, args.id)
      if (!docId) throw new Error("Invalid document ID")

      const record = await ctx.db.get(docId)
      if (!record) return null

      if (record.org_id !== args.orgId) {
        console.warn(
          `Unauthorized delete attempt: record org_id ${record.org_id} ≠ ${args.orgId}`
        )
        return null
      }

      await ctx.db.delete(docId)
      return { success: true }
    } catch (error) {
      return { success: false }
    }
  },
})
