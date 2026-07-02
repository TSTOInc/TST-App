import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserWithOrg } from "./lib/auth";

export const getOptions = query({
  args: { 
    referenceTable: v.string() // Pass the target table name here (e.g., "trucks", "equipment")
  },
  handler: async (ctx, args) => {
    // 1. Authenticate user and fetch organizational context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Not authenticated");

    const { org } = await requireUserWithOrg(ctx);

    // 2. Security Check: Added "drivers" to whitelist array
    const allowedTables = ["trucks", "equipment", "brokers", "broker_agents", "drivers"];
    if (!allowedTables.includes(args.referenceTable)) {
      throw new Error(`Unauthorized or invalid universal table query: ${args.referenceTable}`);
    }

    // 3. Dynamic query fetching records belonging to this organization
    const records = await ctx.db.query(args.referenceTable as any).collect();
    const orgRecords = records.filter((rec: any) => rec.org_id === org._id);

    // 4. Normalize records dynamically into common { id, label } values for the UI
    return orgRecords.map((rec: any) => {
      let label = rec.name || rec._id; // Fallback default identity

      // Tailor display labels dynamically based on table target configurations
      if (args.referenceTable === "trucks") {
        label = rec.truck_number;
      } else if (args.referenceTable === "equipment") {
        label = rec.equipment_number;
      } else if (args.referenceTable === "drivers") {
        label = `${rec.first_name || ""} ${rec.last_name || ""}`.trim() || "Unnamed Driver";
      } else if (args.referenceTable === "brokers") {
        label = rec.name || "Unnamed Broker";
      } else if (args.referenceTable === "broker_agents") {
        label = rec.name || "Unnamed Agent";
      }

      return {
        id: rec._id,
        label: label,
      };
    });
  },
});