/**
 * GET /api/stripe/account-status
 *
 * Checks the farm vendor's Stripe Connect account status.
 * Returns whether charges/payouts are enabled and if there are
 * any due requirements the vendor needs to complete.
 *
 * Called when the vendor clicks "Refresh Status" or when the admin
 * page loads to show the current Stripe connect state.
 */
import { NextRequest, NextResponse } from "next/server";
import { isStripeConnectConfigured, getConnectAccountStatus } from "@/lib/stripe-connect";
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

    // Look up vendor in Supabase to get connectedAccountId
    const vendor = await getVendor(vendorId);

    if (!vendor) {
      return NextResponse.json({
        ok: true,
        connected: false,
        connectedAccountId: "",
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        requirementsDue: true,
        message: "Vendor not found in database. Please set up the vendor first.",
      });
    }

    const connectedAccountId = vendor.stripe_connected_account_id;

    if (!connectedAccountId) {
      return NextResponse.json({
        ok: true,
        connected: false,
        connectedAccountId: "",
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        requirementsDue: true,
        message: "No Stripe account connected. Click 'Connect Stripe Account' to get started.",
      });
    }

    const status = await getConnectAccountStatus(connectedAccountId);

    return NextResponse.json({
      ok: true,
      connected: status.connected,
      connectedAccountId,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      detailsSubmitted: status.detailsSubmitted,
      requirementsDue: status.requirementsDue,
    });
  } catch (error) {
    console.error("[Account Status Error]", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to check Stripe account status.",
      },
      { status: 500 }
    );
  }
}