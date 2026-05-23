/**
 * POST /api/stripe/create-checkout-session
 *
 * Creates a live Checkout Session on the vendor's connected account.
 * The customer pays, the vendor receives the payment (minus platform fee),
 * and the platform receives the application_fee_amount.
 *
 * SERVER-OWNED PRICES: The client sends productIds + quantities.
 * The server looks up real prices from Supabase before creating the session.
 * This prevents customers from modifying prices client-side.
 *
 * FMV-specific: Products have pricingType (per_pound, per_unit, per_bunch, per_dozen)
 * and pricePerUnit. The unitLabel is included in the description for clarity.
 * Quantity for per_pound items represents weight in lbs.
 *
 * Called when a customer clicks "Pay with Stripe" on the order page.
 */
import { NextRequest, NextResponse } from "next/server";
import { isStripeConnectConfigured, createVendorCheckoutSession } from "@/lib/stripe-connect";
import { getVendor } from "@/lib/vendors";
import type { PricingType } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConnectConfigured()) {
      return NextResponse.json(
        { ok: false, message: "Stripe Connect is not configured yet." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { vendorId, productIds, quantities, customerName, customerPhone, customerEmail, pickupDay, source, customerNotes, successUrl, cancelUrl, cartItems } = body as {
      vendorId?: string;
      productIds?: string[];
      quantities?: Record<string, number> | number[];
      cartItems?: Array<{ id: string; quantity?: number }>;
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      pickupDay?: string;
      source?: string;
      customerNotes?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!vendorId) {
      return NextResponse.json(
        { ok: false, message: "vendorId is required." },
        { status: 400 }
      );
    }

    // Accept product data in multiple formats:
    // 1. productIds + quantities (parallel arrays) — from CustomerPage component
    // 2. cartItems (array of {id, quantity}) — from admin test or mobile app
    // 3. productIds only (quantity defaults to 1)
    let resolvedProductIds: string[] = [];
    let resolvedQuantities: Record<string, number> = {};

    if (cartItems && cartItems.length > 0) {
      for (const item of cartItems) {
        resolvedProductIds.push(item.id);
        resolvedQuantities[item.id] = item.quantity || 1;
      }
    } else if (productIds && productIds.length > 0) {
      resolvedProductIds = productIds;
      if (Array.isArray(quantities)) {
        // Parallel arrays: productIds[0] matches quantities[0]
        productIds.forEach((id, i) => {
          resolvedQuantities[id] = (quantities as number[])[i] || 1;
        });
      } else if (quantities && typeof quantities === "object" && !Array.isArray(quantities)) {
        resolvedQuantities = quantities as Record<string, number>;
      } else {
        // No quantities provided — default all to 1
        productIds.forEach((id) => {
          resolvedQuantities[id] = 1;
        });
      }
    }

    if (resolvedProductIds.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Cart cannot be empty — provide productIds or cartItems." },
        { status: 400 }
      );
    }

    // Look up vendor in Supabase to get connected account ID and product prices
    const vendor = await getVendor(vendorId);

    if (!vendor) {
      return NextResponse.json(
        { ok: false, message: "Vendor not found." },
        { status: 404 }
      );
    }

    if (!vendor.stripe_connected_account_id) {
      return NextResponse.json(
        { ok: false, message: "Vendor has not connected their Stripe account yet." },
        { status: 400 }
      );
    }

    if (!vendor.stripe_charges_enabled) {
      return NextResponse.json(
        { ok: false, message: "Vendor's Stripe account is not fully set up — charges not enabled." },
        { status: 400 }
      );
    }

    const connectedAccountId = vendor.stripe_connected_account_id;

    // Build line items using SERVER-OWNED prices from Supabase
    // Map products by ID for quick lookup
    const productMap = new Map((vendor.products || []).map((p) => [p.id, p]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineItems: any[] = [];

    let totalCents = 0;

    for (const productId of resolvedProductIds) {
      const product = productMap.get(productId);
      if (!product) {
        return NextResponse.json(
          { ok: false, message: `Product ${productId} not found or removed from menu.` },
          { status: 400 }
        );
      }

      if (!product.inStock) {
        return NextResponse.json(
          { ok: false, message: `Product "${product.name}" is currently sold out.` },
          { status: 400 }
        );
      }

      const qty = resolvedQuantities[productId] || 1;
      // FMV: pricePerUnit is in dollars, convert to cents for Stripe
      const unitAmountCents = Math.round(product.pricePerUnit * 100);

      // Build a descriptive label for FMV pricing types
      const pricingLabels: Record<PricingType, string> = {
        per_pound: `$${product.pricePerUnit.toFixed(2)}/lb`,
        per_unit: `$${product.pricePerUnit.toFixed(2)} each`,
        per_bunch: `$${product.pricePerUnit.toFixed(2)}/bunch`,
        per_dozen: `$${product.pricePerUnit.toFixed(2)}/dozen`,
      };

      const priceLabel = pricingLabels[product.pricingType as PricingType] || `$${product.pricePerUnit.toFixed(2)}/${product.unitLabel}`;
      const desc = [product.description, `(${priceLabel})`].filter(Boolean).join(" — ");

      lineItems.push({
        price_data: {
          currency: "usd",
          unit_amount: unitAmountCents,
          product_data: {
            name: `${product.emoji} ${product.name}`,
            description: desc || undefined,
          },
        },
        quantity: qty,
      });

      totalCents += unitAmountCents * qty;
    }

    if (lineItems.length === 0) {
      return NextResponse.json(
        { ok: false, message: "No valid products in cart." },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fresh-market-vendor.vercel.app";
    const success = successUrl || vendor.urls?.successUrl || `${siteUrl}/order-success`;
    const cancel = cancelUrl || vendor.urls?.cancelUrl || `${siteUrl}/order-cancel`;

    const session = await createVendorCheckoutSession({
      connectedAccountId,
      lineItems,
      vendorId,
      successUrl: success,
      cancelUrl: cancel,
      customerEmail: customerEmail,
      metadata: {
        customerName: customerName || "",
        customerPhone: customerPhone || "",
        customerEmail: customerEmail || "",
        pickupDay: pickupDay || "",
        source: source || "mobile",
        customerNotes: customerNotes || "",
      },
    });

    return NextResponse.json({
      ok: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("[Create Checkout Session Error]", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to create checkout session.",
      },
      { status: 500 }
    );
  }
}