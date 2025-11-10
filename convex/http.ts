import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";
import { api } from "./_generated/api";

function ensureEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing environment variable: ${name}`);
  return val;
}

const webhookSecret = ensureEnv("CLERK_WEBHOOK_SECRET");

const handleClerkWebhook = httpAction(async (ctx, req) => {
  const event = await validateRequest(req);
  if (!event) return new Response("Invalid webhook", { status: 400 });

  switch (event.type) {
    case "user.created":
    case "user.updated":
      // Update or create user
      await ctx.runAction(api.users.updateOrCreateUserAction, {
        clerkUser: event.data,
      });
      break;

    case "user.deleted":
      // Delete user
      if (event.data.id) {
        await ctx.runMutation(internal.users.deleteUser, {
          clerkId: event.data.id,
        });
      }
      break;

    default:
      console.log("Ignored Clerk event:", event.type);
  }

  return new Response(null, { status: 200 });
});

const http = httpRouter();
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: handleClerkWebhook,
});

async function validateRequest(req: Request): Promise<WebhookEvent | undefined> {
  try {
    const payload = await req.text();
    const headers = {
      "svix-id": req.headers.get("svix-id") ?? "",
      "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
      "svix-signature": req.headers.get("svix-signature") ?? "",
    };

    if (!headers["svix-id"] || !headers["svix-timestamp"] || !headers["svix-signature"]) {
      console.error("Missing Svix headers");
      return;
    }

    const wh = new Webhook(webhookSecret);
    return wh.verify(payload, headers) as WebhookEvent;
  } catch (err) {
    console.error("Webhook validation failed:", err);
    return;
  }
}

export default http;
