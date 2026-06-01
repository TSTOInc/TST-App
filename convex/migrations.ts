import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// 1. The Mutation: Updates a batch of brokers
export const patchBrokersBatch = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Fetch brokers that have an address_2 but haven't been migrated yet
    const brokers = await ctx.db
      .query("brokers")
      .collect();

    let updatedCount = 0;

    for (const broker of brokers) {
      // Only process if address_2 exists AND we haven't filled city/state/zip yet
      if (broker.address_2 && !broker.city && !broker.state && !broker.zip) {
        
        // Regex to match: Everything before comma (City), 2 letters (State), 5-10 digits (Zip)
        // Example: "VERNON, CA 90058" or "Saint Louis, MO 63101-1234"
        const match = broker.address_2.match(/^([^,]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);

        if (match) {
          const [_, city, state, zip] = match;

          await ctx.db.patch(broker._id, {
            city: city.trim(),
            state: state.toUpperCase().trim(),
            zip: zip.trim(),
          });
          
          updatedCount++;
        } else {
          console.warn(`Skipping broker ${broker._id}: "${broker.address_2}" format didn't match.`);
        }
      }
    }

    return { updatedCount };
  },
});

// 2. The Action: Explicitly typed to prevent the TS7022 / TS7023 loops
export const runAddressMigration = internalAction({
    args: {},
    handler: async (ctx): Promise<{ updatedCount: number }> => {
      console.log("Starting address migration...");
      
      // Explicitly casting or letting the explicit mutation return type handle it
      const result = await ctx.runMutation(internal.migrations.patchBrokersBatch);
      
      console.log(`Migration finished. Updated ${result.updatedCount} brokers.`);
      return result;
    },
  });