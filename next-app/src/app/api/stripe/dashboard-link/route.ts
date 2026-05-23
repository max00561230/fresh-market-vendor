/**
 * GET /api/stripe/dashboard-link
 *
 * Generates a Stripe Express dashboard login link for the farm vendor.
 * Vendors use this to view their balance, payouts, and manage
 * their Stripe account details.
 *
 * Called when the vendor clicks "Open Stripe Dashboard" in the admin page.
 */
import { NextRequest, NextResponse } from "next/server";
import { isStripeConnectConfigured, createDashboardLink } from "@/lib/stripe-connect";
import { getVendor } from "@/lib/vendors";

export async function GET(request: NextRequest) {
  try {
    if (!isStripeConnectConfigured()) {
      return NextResponse.json(
        { ok: false, message: "Stripe Connect is not configured yet." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");

    if (!vendorId) {
      return NextResponse.json(
        { ok: false, message: "vendorId query parameter is required." },
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

    const loginLink = await createDashboardLink(vendor.stripe_connected_account_id);

    return NextResponse.json({
      ok: true,
      url: loginLink.url,
    });
  } catch (error) {
    console.error("[Dashboard Link Error]", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to create Stripe dashboard link.",
      },
      { status: 500 }
    );
  }
}