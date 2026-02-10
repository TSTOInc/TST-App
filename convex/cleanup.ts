import { action } from "./_generated/server";
import { internal } from "./_generated/api";

type CleanupResult = { storageKeys: string[] };

export const cleanupStaleUploads = action({
  args: {},
  handler: async (ctx) : Promise<CleanupResult> => {

    const result = await ctx.runMutation(
      internal.files.cleanupStaleUploadsInternal,
      {}
    );
    return result;
  },
});
