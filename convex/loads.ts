import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const byId = query({
  args: { id: v.string(), orgId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const docId = ctx.db.normalizeId("loads", args.id);
    if (!docId) throw new Error("Invalid document ID");

    const record = await ctx.db.get(docId);
    if (!record) return null;
    if (record.org_id !== args.orgId) return null;
    let stops, payment_terms, broker, truck, equipment, broker_Agent
    stops = await getStops(ctx, record._id);
    payment_terms = await ctx.db.get(record.payment_terms_id as Id<"payment_terms">);
    broker = await ctx.db.get(record.broker_id as Id<"brokers">);
    truck = await ctx.db.get(record.truck_id as Id<"trucks">);
    equipment = await ctx.db.get(record.equipment_id as Id<"equipment">);
    if (typeof record.agent_id === "string" && record.agent_id.length > 0) {
      broker_Agent = await ctx.db.get(record.agent_id as Id<"brokers_agents">);
    }
    return {
      ...record,
      stops,
      payment_terms,
      broker,
      truck,
      equipment,
      broker_Agent
    };
  },
});


async function getStops(ctx: QueryCtx, loadId: Id<"loads"> | null) {
  if (loadId === null) {
    return null;
  }
  const stops = await ctx.db
    .query("stops")
    .withIndex("by_loadId", (q) => q.eq("load_id", loadId)).collect();
  return stops;
}


export const updateProgress = mutation({
  args: {
    loadId: v.id("loads"),
    progress: v.number(),
    load_status: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const { loadId, progress, load_status } = args
    const load = await ctx.db.get(loadId)
    if (!load) throw new Error("Load not found")

    const safeProgress = Math.min(100, Math.max(0, progress))

    await ctx.db.patch(loadId, {
      progress: safeProgress,
      load_status,
    })

    return { updated: true, progress: safeProgress, load_status }
  },
})



async function getNextInvoiceNumber(ctx: MutationCtx, orgId: string) {
  const existing = await ctx.db
    .query("counters")
    .withIndex("by_org", (q) => q.eq("org_id", orgId)).unique();

  if (!existing) {
    // first ever invoice
    const newCounterId = await ctx.db.insert("counters", {
      org_id: orgId,
      last_number: 1,
    });
    return "0001";
  }

  const next = existing.last_number + 1;

  await ctx.db.patch(existing._id, { last_number: next });

  // format with padding
  return `${next.toString().padStart(4, "0")}`;
}






export const create = mutation({
  args: {
    org_id: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const { data, org_id } = args
    const invoice_number = await getNextInvoiceNumber(ctx, org_id);
    // Prepare load data (exclude stops)
    const payload = {
      org_id,
      broker_id: data.parties?.broker || "",
      equipment_id: data.parties?.trailer || "",
      truck_id: data.parties?.truck || "",
      drivers: data.parties?.driver || [],
      payment_terms_id: data.parties?.paymentTerms || "",
      load_number: data.loadDetails?.loadNumber || "",
      load_type: data.loadDetails?.loadType || "",
      commodity: data.loadDetails?.commodity || "",
      length_ft: Number(data.loadDetails?.lengthFt || 0),
      rate: Number(data.loadDetails?.rate || 0),
      instructions: data.loadDetails?.instructions || null,
      load_status: "new",
      docs: [],
      invoice_number: invoice_number,
      invoiced_at: undefined,
      progress: 0,
      paid_at: null,
      agent_id: data.parties?.agent || "",
    }

    // ✅ Insert the load (no stops here)
    const loadId = await ctx.db.insert("loads", payload)

    // ✅ Now insert stops separately
    for (const stop of data.stops || []) {
      await ctx.db.insert("stops", {
        org_id,
        load_id: loadId,
        type: stop.type,
        location: stop.location,
        time_type: stop.timeType,
        appointment_time: stop.appointmentTime
          ? new Date(stop.appointmentTime).toISOString()
          : null,
        window_start: stop.windowStart
          ? new Date(stop.windowStart).toISOString()
          : null,
        window_end: stop.windowEnd
          ? new Date(stop.windowEnd).toISOString()
          : null,
      })
    }

    return loadId
  },
})


