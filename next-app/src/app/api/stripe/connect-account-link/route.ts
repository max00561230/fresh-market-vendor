/**
 * POST /api/stripe/connect-account-link
 *
 * Initiates Stripe Connect onboarding for a farm vendor.
 * If the vendor already has a connected account, creates a new account link
 * (for continuing onboarding if requirements are due).
 * If no connected account exists, creates one first.
 *
 * Called when the vendor clicks "Connect Stripe Account" in the admin page.
 */
import { NextRequest, NextResponse } from "next/server";
import { isStripeConnectConfigured, getStripe, createConnectAccount, createConnectAccountLink } from "@/lib/stripe-connect";
import { getVendor, updateVendorStripeStatus, createVendor } from "@/lib/vendors";

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConnectConfigured()) {
      return NextResponse.json(
        { ok: false, message: "Stripe Connect is not configured yet." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { vendorId, ownerEmail, farmName, returnUrl, refreshUrl } = body as {
      vendorId?: string;
      ownerEmail?: string;
      farmName?: string;
      returnUrl?: string;
      refreshUrl?: string;
    };

    if (!vendorId || !ownerEmail || !farmName) {
      return NextResponse.json(
        { ok: false, message: "vendorId, ownerEmail, and farmName are required." },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fresh-market-vendor.vercel.app";
    const returnTo = returnUrl || `${siteUrl}/admin?stripe=connected`;
    const refreshTo = refreshUrl || `${siteUrl}/admin?stripe=refresh`;

    // Look up vendor in Supabase to check for existing connected account
    let vendor = await getVendor(vendorId);
    let connectedAccountId: string | undefined;

    // If vendor doesn't exist yet, create the record in Supabase
    if (!vendor) {
      console.log(`[Connect] Vendor ${vendorId} not found in Supabase, creating new record...`);
      vendor = await createVendor({
        vendorId,
        ownerPin: "1234",
        farmName,
        ownerName: "",
        email: ownerEmail,
        phone: "",
        publicOrderPageLink: `${siteUrl}`,
      });
      if (!vendor) {
        return NextResponse.json(
          { ok: false, message: "Failed to create vendor record in database." },
          { status: 500 }
        );
      }
      console.log(`[Connect] Created vendor record for ${vendorId}`);
    }

    if (vendor.stripe_connected_account_id) {
      connectedAccountId = vendor.stripe_connected_account_id;
      console.log(`[Connect] Found existing Stripe account for vendor ${vendorId}: ${connectedAccountId}`);
    }

    if (!connectedAccountId) {
      // Create a new Express Connect account
      const account = await createConnectAccount(vendorId, ownerEmail, farmName);
      connectedAccountId = account.id;

      // Save connectedAccountId to Supabase fmv_vendors table
      const saved = await updateVendorStripeStatus(vendorId, {
        stripe_connected_account_id: connectedAccountId,
        stripe_connected: true,
      });

      if (!saved) {
        console.error(`[Connect] Failed to save Stripe account ID for vendor ${vendorId}. Account ${connectedAccountId} was created but not persisted.`);
        // Continue anyway — the onboarding link still works, but we log the error
      } else {
        console.log(`[Connect] Saved Stripe account ${connectedAccountId} for vendor ${vendorId}`);
      }
    }

    // Check if account needs further onboarding
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(connectedAccountId!);

    if (!account.details_submitted) {
      // Create onboarding link
      const accountLink = await createConnectAccountLink(
        connectedAccountId,
        refreshTo,
        returnTo
      );

      return NextResponse.json({
        ok: true,
        url: accountLink.url,
        connectedAccountId,
      });
    }

    // Account is already fully onboarded
    // If there are requirements due, redirect to onboarding again
    const hasRequirements = Boolean(
      account.requirements?.currently_due?.length ||
      account.requirements?.past_due?.length
    );

    if (hasRequirements) {
      const accountLink = await createConnectAccountLink(
        connectedAccountId,
        refreshTo,
        returnTo
      );

      return NextResponse.json({
        ok: true,
        url: accountLink.url,
        connectedAccountId,
      });
    }

    // Already connected and verified — update Supabase with current status
    await updateVendorStripeStatus(vendorId, {
      stripe_connected: account.charges_enabled && account.payouts_enabled,
      stripe_charges_enabled: account.charges_enabled,
      stripe_payouts_enabled: account.payouts_enabled,
      stripe_details_submitted: account.details_submitted,
    });

    // Redirect to admin with status
    return NextResponse.json({
      ok: true,
      url: returnTo,
      connectedAccountId,
      message: "Stripe account is already connected and verified.",
    });
  } catch (error) {
    console.error("[Connect Account Link Error]", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to create Stripe Connect onboarding link.",
      },
      { status: 500 }
    );
  }
}