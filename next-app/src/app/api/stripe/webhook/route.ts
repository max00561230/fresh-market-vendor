/**
 * Fresh Market Vendor (FMV1.0) — Stripe Webhook
 *
 * Processes Stripe webhook events for vendor Connect accounts.
 * Handles payment successes, account updates, and other Connect events.
 *
 * This webhook endpoint must be registered in the Stripe Dashboard.
 * For Connect accounts, use a Connect webhook endpoint (not a regular one).
 */
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe-connect";
import Stripe from "stripe";
import { updateVendorStripeStatus, getVendorByStripeAccount, createOrder } from "@/lib/vendors";

function requireEnv(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StripeEvent = any;

export async function POST(request: Request) {
  try {
    const signature = (await headers()).get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ ok: false, message: "Missing Stripe signature." }, { status: 400 });
    }

    const payload = await request.text();
    const stripe = getStripe();
    const webhookSecret = requireEnv(process.env.STRIPE_WEBHOOK_SECRET, "STRIPE_WEBHOOK_SECRET");

    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const vendorId = session.metadata?.vendorId;
        const connectedAccountId = event.account;
        const isTest = session.metadata?.testCheckout === "true";

        console.log(`[Webhook] Checkout completed for vendor ${vendorId}, account ${connectedAccountId}, session ${session.id}`);

        if (vendorId) {
          // Extract order details from the Checkout Session metadata and line items
          const customerName = session.metadata?.customerName || "";
          const customerPhone = session.metadata?.customerPhone || "";
          const customerEmail = session.customer_email || session.metadata?.customerEmail || "";
          const pickupDay = session.metadata?.pickupDay || "";
          const source = session.metadata?.source || "mobile";
          const customerNotes = session.metadata?.customerNotes || "";

          // Get line items from the session to build order items
          let orderItems: Array<{ productId: string; name: string; pricePerUnit: number; pricingType: "per_unit" | "per_pound" | "per_bunch" | "per_dozen"; quantity: number; subtotal: number }> = [];
          try {
            const lineItems = await stripe.checkout.sessions.listLineItems(
              session.id,
              undefined,
              { stripeAccount: connectedAccountId }
            );
            orderItems = lineItems.data.map((item: Stripe.LineItem, index: number) => ({
              productId: `line_${index}`,
              name: item.description ?? `Item ${index + 1}`,
              pricePerUnit: (item.amount_total ?? 0) / (item.quantity ?? 1) / 100, // unit price in dollars
              pricingType: "per_unit" as const, // default; real pricingType is in product data, not line item
              quantity: item.quantity ?? 1,
              subtotal: (item.amount_total ?? 0) / 100, // total for this line in dollars
            }));
          } catch (lineItemErr) {
            console.error("[Webhook] Failed to fetch line items for session", session.id, lineItemErr);
          }

          const totalCents = session.amount_total || 0;

          // Extract payment intent ID safely (can be string | PaymentIntent | null)
          const paymentIntentId = typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id || undefined;

          // Create order record in Supabase
          const order = await createOrder({
            vendorId,
            stripeSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
            customerName,
            customerPhone,
            customerEmail,
            items: orderItems,
            totalCents,
            source: (source === "in_person" ? "in_person" : "mobile") as "in_person" | "mobile",
            paymentMethod: "card",
            pickupDay,
            notes: customerNotes,
            paymentStatus: "paid",
            isTest: isTest === true,
          });

          if (order) {
            console.log(`[Webhook] Order ${order.id} created for vendor ${vendorId}, total: $${(totalCents / 100).toFixed(2)}`);
          } else {
            console.error(`[Webhook] Failed to create order for vendor ${vendorId}, session ${session.id}`);
          }

          // TODO: Send order notification emails (requires email service integration)
          console.log(`[Webhook] Email notifications not yet implemented. Vendor alert email should be checked for: vendor ${vendorId}`);
        } else {
          console.warn(`[Webhook] No vendorId in session metadata for session ${session.id}`);
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object;
        const accountId = account.id;

        console.log(`[Webhook] Account updated: ${accountId}, charges_enabled: ${account.charges_enabled}, payouts_enabled: ${account.payouts_enabled}, details_submitted: ${account.details_submitted}`);

        // Look up vendor by their Stripe connected account ID
        const vendor = await getVendorByStripeAccount(accountId);

        if (vendor) {
          const updated = await updateVendorStripeStatus(vendor.vendor_id, {
            stripe_connected: account.charges_enabled && account.payouts_enabled,
            stripe_charges_enabled: account.charges_enabled,
            stripe_payouts_enabled: account.payouts_enabled,
            stripe_details_submitted: account.details_submitted,
          });

          if (updated) {
            console.log(`[Webhook] Updated Stripe status for vendor ${vendor.vendor_id}`);
          } else {
            console.error(`[Webhook] Failed to update Stripe status for vendor ${vendor.vendor_id}`);
          }
        } else {
          console.warn(`[Webhook] No vendor found for Stripe account ${accountId}`);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log(`[Webhook] Payment succeeded: ${paymentIntent.id}, amount: ${paymentIntent.amount}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        console.log(`[Webhook] Payment failed: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Webhook Error]", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Webhook processing failed.",
      },
      { status: 400 }
    );
  }
}