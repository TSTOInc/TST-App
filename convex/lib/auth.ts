import { QueryCtx, MutationCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export async function requireUserWithOrg(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) =>
      q.eq("clerk_id", identity.subject)
    )
    .unique();

  if (!user) throw new Error("User not found");

  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_userId", (q) =>
      q.eq("user_id", user._id)
    )
    .unique();

  if (!membership) throw new Error("User not in organization");

  const org = await ctx.db.get(membership.org_id);
  if (!org) throw new Error("Organization not found");

  return { user, org, membership };
}
