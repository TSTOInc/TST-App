import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";
import { api } from "./_generated/api";
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});
function ensureEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing environment variable: ${name}`);
  return val;
}

const webhookSecret = ensureEnv("CLERK_WEBHOOK_SECRET");

const handleClerkWebhook = httpAction(async (ctx, req) => {
  const event = await validateRequest(req);
  if (!event) return new Response("Invalid webhook", { status: 400 });

  console.log("📩 Clerk Event:", event.type);

  try {
    switch (event.type) {
      // 👤 USER EVENTS
      case "user.created":
      case "user.updated": {
        // Update or create user
        await ctx.runAction(api.users.syncUserFromClerk, {
          clerkUser: event.data,
        });
        break;
      }
      case "user.deleted": {
        // Delete user
        if (event.data.id) {
          await ctx.runMutation(internal.users.deleteUserInternal, {
            clerkId: event.data.id,
          });
        }
        break;
      }
      // 🏢 ORGANIZATION EVENTS
      case "organization.created":
      case "organization.updated": {
        await ctx.runMutation(internal.organizations.upsertOrganizationInternal, {
          clerkOrg: event.data,
        });
        break;
      }

      case "organization.deleted": {
        if (event.data.id) {
          await ctx.runMutation(internal.organizations.deleteOrganizationInternal, {
            clerkOrgId: event.data.id,
          });
        }
        break;
      }
      // 👥 MEMBERSHIP EVENTS
      case "organizationMembership.created":
      case "organizationMembership.updated":
      case "organizationMembership.deleted": {
        const userId = event.data.public_user_data?.user_id;
        const fullUser = await clerkClient.users.getUser(userId!);
        const safeUser = {
          id: fullUser.id,
          first_name: fullUser.firstName,
          last_name: fullUser.lastName,
          image_url: fullUser.imageUrl,
          username: fullUser.username,
          email_addresses: fullUser.emailAddresses.map((e) => ({
            email_address: e.emailAddress,
          })),
        };

        // safest approach: re-sync the user completely
        await ctx.runAction(api.users.syncUserFromClerk, {
          clerkUser: safeUser,
        });
        break;
      }
      default:
        console.log("ℹ️ Ignored Clerk event:", event.type);
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("❌ Webhook processing failed:", error);
    return new Response("Server error", { status: 500 });
  }


});


// 🛡️ Webhook Signature Validation
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


// 🌐 Router
const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: handleClerkWebhook,
});


export default http;
