/**
 * Fresh Market Vendor (FMV1.0) — Stripe Connect Library
 *
 * Shared utilities for Stripe Connect vendor onboarding, account management,
 * and checkout sessions. Uses Express accounts (recommended for small vendors).
 *
 * Platform takes an application_fee_amount on each transaction.
 * Payments go directly to the vendor's connected Stripe account.
 */
import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function isStripeConnectConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(requireEnv(process.env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY"), {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return stripeClient;
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://fresh-market-vendor.vercel.app";
}

/**
 * Create a Stripe Connect Express account for a vendor.
 * Called once per vendor when they first connect.
 */
export async function createConnectAccount(
  vendorId: string,
  email: string,
  farmName: string
): Promise<Stripe.Account> {
  const stripe = getStripe();

  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    email,
    business_profile: {
      name: farmName,
    },
    metadata: {
      vendorId,
    },
  });

  return account;
}

/**
 * Create an onboarding account link for the vendor to complete
 * their Stripe Connect setup (identity verification, bank details, etc.)
 */
export async function createConnectAccountLink(
  accountId: string,
  refreshToken: string,
  returnUrl: string
): Promise<Stripe.AccountLink> {
  const stripe = getStripe();

  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshToken,
    return_url: returnUrl,
    type: "account_onboarding",
  });
}

/**
 * Retrieve the vendor's Connect account status.
 * Returns connection state, charges/payouts enabled, and requirements.
 */
export async function getConnectAccountStatus(
  accountId: string
): Promise<{
  connected: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsDue: boolean;
}> {
  const stripe = getStripe();

  try {
    const account = await stripe.accounts.retrieve(accountId);
    return {
      connected: true,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirementsDue: Boolean(
        account.requirements?.currently_due?.length ||
        account.requirements?.past_due?.length ||
        account.requirements?.eventually_due?.length
      ),
    };
  } catch {
    return {
      connected: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      requirementsDue: true,
    };
  }
}

/**
 * Create a login link so the vendor can access their Stripe Express dashboard.
 * Vendors can view payouts, balance, and manage their account details.
 */
export async function createDashboardLink(
  accountId: string
): Promise<Stripe.LoginLink> {
  const stripe = getStripe();

  return stripe.accounts.createLoginLink(accountId);
}

/**
 * Platform fee percentage (in basis points).
 * 5% = 500 basis points.
 * Configure via STRIPE_PLATFORM_FEE_BPS env var.
 * Defaults to 500 (5%).
 */
export function getPlatformFeeBps(): number {
  return Number(process.env.STRIPE_PLATFORM_FEE_BPS || 500);
}

/**
 * Calculate the platform fee from a total amount.
 * Amount is in cents (Stripe's smallest unit).
 */
export function calculatePlatformFee(amountCents: number): number {
  const bps = getPlatformFeeBps();
  return Math.round(amountCents * (bps / 10000));
}

/**
 * Create a Checkout Session on the vendor's connected account.
 * Platform takes a fee via application_fee_amount.
 * The vendor receives the payment minus the platform fee.
 */
export async function createVendorCheckoutSession(params: {
  connectedAccountId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lineItems: any[];
  customerEmail?: string;
  vendorId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  const stripe = getStripe();
  const { connectedAccountId, lineItems, customerEmail, vendorId, successUrl, cancelUrl, metadata } = params;

  // Calculate total to determine platform fee
  let totalCents = 0;
  for (const item of lineItems) {
    const pd = item.price_data;
    if (pd && pd.unit_amount) {
      totalCents += pd.unit_amount * (item.quantity || 1);
    }
  }

  const platformFee = calculatePlatformFee(totalCents);

  return stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: lineItems,
      customer_email: customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_intent_data: {
        application_fee_amount: platformFee,
      },
      metadata: {
        vendorId,
        ...metadata,
      },
    },
    {
      stripeAccount: connectedAccountId,
    }
  );
}

/**
 * Create a test Checkout Session for $1.00 on the vendor's connected account.
 * Used to verify the full payment flow works before going live.
 */
export async function createTestCheckoutSession(params: {
  connectedAccountId: string;
  vendorId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const { connectedAccountId, vendorId, successUrl, cancelUrl } = params;

  // $1.00 test charge
  const platformFee = calculatePlatformFee(100);

  return stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 100,
            product_data: {
              name: "Test Checkout — $1.00",
              description: "Verify your Stripe payment setup is working. This is a real $1.00 charge that will be refunded.",
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_intent_data: {
        application_fee_amount: platformFee,
      },
      metadata: {
        vendorId,
        testCheckout: "true",
      },
    },
    {
      stripeAccount: connectedAccountId,
    }
  );
}