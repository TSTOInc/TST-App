import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";


// 🏢 Get Current Organization
export const getCurrentOrganizationDeprecated = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Find user by clerk_id
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerk_id", identity.subject)
      )
      .unique();

    if (!user) return null;

    // Find membership
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_userId", (q) =>
        q.eq("user_id", user._id)
      )
      .unique();

    if (!membership) return null;

    // Return organization
    return await ctx.db.get(membership.org_id);
  },
});



// 🏢 Create or Update Organization (Webhook Sync)
export const upsertOrganizationInternal = internalMutation({
  args: {
    clerkOrg: v.any(),
  },
  handler: async (ctx, { clerkOrg }) => {
    const clerkOrgId = clerkOrg.id;

    if (!clerkOrgId) {
      throw new Error("Missing Clerk organization ID");
    }

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q) =>
        q.eq("clerk_org_id", clerkOrgId)
      )
      .unique();

    const orgData = {
      clerk_org_id: clerkOrgId,
      name: clerkOrg.name ?? "Unnamed Organization",
      image_url: clerkOrg.image_url ?? undefined,
    };

    if (existing) {
      console.log("🟡 Updating organization:", clerkOrgId);
      await ctx.db.patch(existing._id, orgData);
    } else {
      console.log("🟢 Creating organization:", clerkOrgId);
      await ctx.db.insert("organizations", {
        ...orgData,

        // Initialize your SaaS fields safely
        subscription_status: "inactive",
        plan: "free",
      });
    }
  },
});


// ❌ Delete Organization
export const deleteOrganizationInternal = internalMutation({
  args: {
    clerkOrgId: v.string(),
  },
  handler: async (ctx, { clerkOrgId }) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q) =>
        q.eq("clerk_org_id", clerkOrgId)
      )
      .unique();

    if (!org) return;

    console.log("🔴 Deleting organization:", clerkOrgId);

    await ctx.db.delete(org._id);

    // Optional: cascade delete memberships
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_orgId", (q) => q.eq("org_id", org._id))
      .collect();

    for (const m of memberships) {
      await ctx.db.delete(m._id);
    }
  },
});



export const update = mutation({
  args: {
    id: v.id("organizations"),
    name: v.string(),
    usdot: v.optional(v.string()),
    docket_number: v.optional(v.string()),
    years_in_operation: v.optional(v.number()),
    ein: v.optional(v.float64()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zip: v.optional(v.string()),
    company_email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});