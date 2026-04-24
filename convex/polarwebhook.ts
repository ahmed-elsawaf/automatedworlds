/**
 * AutomatedWorlds — Polar Webhook Action
 *
 * This is the Convex HTTP action that Polar calls for payment events.
 * Register it in convex/http.ts:
 *
 *   http.route({ path: "/webhooks/polar", method: "POST", handler: polarWebhook });
 *
 * Set POLAR_WEBHOOK_SECRET in your Convex environment variables.
 */

import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function verifyPolarSignature(
  secret: string,
  body: string,
  signatureHeader: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const sigBytes = hexToBytes(signatureHeader.replace("sha256=", ""));
  const bodyBytes = encoder.encode(body);

  return crypto.subtle.verify("HMAC", key, sigBytes as BufferSource, bodyBytes as BufferSource);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

// Map Polar product IDs to plan names (set these in site settings or env)
function productIdToPlan(
  productId: string,
  knownProducts: Record<string, string>
): "starter" | "pro" | "enterprise" | "free" {
  return (knownProducts[productId] as any) ?? "free";
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook handler
// ─────────────────────────────────────────────────────────────────────────────

export const polarWebhook = httpAction(async (ctx, request) => {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    console.error("POLAR_WEBHOOK_SECRET is not set.");
    return new Response("Server misconfigured", { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("polar-signature") ?? "";

  // Verify signature
  const valid = await verifyPolarSignature(secret, body, signature);
  if (!valid) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const eventType = event.type as string;
  const data = event.data as Record<string, unknown>;

  try {
    switch (eventType) {
      // ── Customer created (first checkout) ──────────────────────────────
      case "customer.created": {
        const clerkId = (data.metadata as any)?.clerkId as string | undefined;
        if (clerkId) {
          await ctx.runMutation(internal.users.setPolarCustomerId, {
            clerkId,
            polarCustomerId: data.id as string,
          });
        }
        break;
      }

      // ── Subscription events ────────────────────────────────────────────
      case "subscription.created":
      case "subscription.updated":
      case "subscription.activated": {
        const sub = data as Record<string, unknown>;
        // Derive plan from product metadata
        const planName = (sub.product as any)?.metadata?.plan ?? "starter";

        await ctx.runMutation(internal.users.syncPolarSubscription, {
          polarCustomerId: sub.customer_id as string,
          polarSubscriptionId: sub.id as string,
          polarSubscriptionStatus: sub.status as any,
          plan: planName,
          planExpiresAt:
            sub.current_period_end
              ? new Date(sub.current_period_end as string).getTime()
              : undefined,
        });
        break;
      }

      case "subscription.canceled":
      case "subscription.revoked": {
        const sub = data as Record<string, unknown>;
        await ctx.runMutation(internal.users.syncPolarSubscription, {
          polarCustomerId: sub.customer_id as string,
          polarSubscriptionId: sub.id as string,
          polarSubscriptionStatus: "canceled",
          plan: "free",
          planExpiresAt: undefined,
        });
        break;
      }

      // ── One-time order (code purchase / exclusive / customization) ─────
      case "order.created":
      case "checkout.succeeded": {
        const order = data as Record<string, unknown>;
        const meta = (order.metadata ?? (order.checkout as any)?.metadata ?? {}) as Record<string, string>;

        // These must be set in Polar checkout metadata by your frontend
        const clerkId = meta.clerkId;
        const ideaId = meta.ideaId;
        const orderType = (meta.orderType ?? "code_purchase") as
          | "code_purchase"
          | "exclusive_license"
          | "customization_deposit";

        if (!clerkId || !ideaId) {
          console.warn("Polar order missing clerkId or ideaId in metadata", meta);
          break;
        }

        // Resolve user
        const user = await ctx.runQuery(internal.users.getByClerkId, { clerkId });
        if (!user) {
          console.error("User not found for clerkId:", clerkId);
          break;
        }

        await ctx.runMutation(internal.orders.createOrderFromPolar, {
          userId: user._id,
          ideaId: ideaId as any,
          type: orderType,
          amountTotal: Math.round(((order.amount ?? (order as any).total_amount) as number)),
          amountTax: Math.round(((order.tax_amount ?? 0) as number)),
          currency: (order.currency ?? "usd") as string,
          polarOrderId: order.id as string,
          polarProductId: (order.product_id ?? (order as any).product?.id) as string,
          polarCheckoutId: (order.checkout_id ?? (order as any).checkout?.id) as string | undefined,
          receiptUrl: order.receipt_url as string | undefined,
          buyerNotes: meta.buyerNotes,
          maxDownloads: meta.maxDownloads ? parseInt(meta.maxDownloads) : undefined,
        });

        // Handle affiliate attribution
        const affiliateCode = meta.ref;
        if (affiliateCode) {
          const link = await ctx.runMutation(internal.discounts.recordAffiliateClick, {
            code: affiliateCode,
          } as any);
          // Note: affiliate conversion is recorded in createOrderFromPolar flow
        }

        break;
      }

      // ── Refund ─────────────────────────────────────────────────────────
      case "order.refunded": {
        await ctx.runMutation(internal.orders.updateOrderStatusFromPolar, {
          polarOrderId: data.id as string,
          status: "refunded",
        });
        break;
      }

      default:
        // Log unhandled events for debugging
        console.log(`Unhandled Polar event: ${eventType}`);
    }
  } catch (error) {
    console.error(`Error handling Polar event ${eventType}:`, error);
    // Return 200 anyway so Polar doesn't retry — log the error for manual fix
  }

  return new Response("OK", { status: 200 });
});