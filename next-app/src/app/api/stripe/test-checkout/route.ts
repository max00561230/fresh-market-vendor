/**
 * POST /api/stripe/test-checkout
 *
 * Creates a $1.00 test Checkout Session on the vendor's connected account.
 * Verifies the full payment flow works before going live.
 * The $1.00 charge is real and will appear on the test card.
 *
 * Called when the vendor clicks "Test Checkout" in the admin page.
 */
import { NextRequest, NextResponse } from "next/server";
import { isStripeConnectConfigured, createTestCheckoutSession } from "@/lib/stripe-connect";
import { getVendor } from "@/lib/vendors";

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConnectConfigured()) {
      return NextResponse.json(
        { ok: false, message: "Stripe Connect is not configured yet." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { vendorId, successUrl, cancelUrl } = body as {
      vendorId?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!vendorId) {
      return NextResponse.json(
        { ok: false, message: "vendorId is required." },
        { status: 400 }
      );
    }

    // Look up vendor in Supabase to get connected account ID
    const vendor = await getVendor(vendorId);

    if (!vendor?.stripe_connected_account_id) {
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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fresh-market-vendor.vercel.app";
    const success = successUrl || `${siteUrl}/admin?payment=test-success`;
    const cancel = cancelUrl || `${siteUrl}/admin?payment=test-cancel`;

    const session = await createTestCheckoutSession({
      connectedAccountId: vendor.stripe_connected_account_id,
      vendorId,
      successUrl: success,
      cancelUrl: cancel,
    });

    return NextResponse.json({
      ok: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("[Test Checkout Error]", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to create test checkout session.",
      },
      { status: 500 }
    );
  }
}