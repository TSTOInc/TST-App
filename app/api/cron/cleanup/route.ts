import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  const result = await client.action(api.cleanup.cleanupStaleUploads, {});

  await supabase.storage.from("TST").remove(result.storageKeys);

  return NextResponse.json({ ok: true });
}
