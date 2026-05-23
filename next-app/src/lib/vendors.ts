/**
 * Fresh Market Vendor (FMV1.0) — Vendor Data Layer
 *
 * Supabase operations for farm vendor management.
 * Each vendor gets a row in the "fmv_vendors" table with their
 * farm profile, Stripe Connect status, products, and settings.
 */
import { createClient } from "@supabase/supabase-js";
import type { VendorRow, VendorPublicStatus, VendorPayments, VendorAlerts, VendorProduct, OrderRow, VendorOrderItem } from "@/types/vendor";
import type { OrderSource, PaymentMethod, OrderStatus } from "@/lib/types";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ─── Vendor CRUD ────────────────────────────────────────────

/**
 * Get a vendor by their vendor_id.
 */
export async function getVendor(vendorId: string): Promise<VendorRow | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("fmv_vendors")
    .select("*")
    .eq("vendor_id", vendorId)
    .maybeSingle();

  if (error) {
    console.error("[Get Vendor Error]", error);
    return null;
  }

  return data as VendorRow | null;
}

/**
 * Create a new vendor (farm stand) record.
 */
export async function createVendor(vendor: {
  vendorId: string;
  ownerPin: string;
  farmName: string;
  ownerName: string;
  email: string;
  phone: string;
  publicOrderPageLink: string;
  tagline?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  website?: string;
  logoUrl?: string;
  certifiedOrganic?: boolean;
}): Promise<VendorRow | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("fmv_vendors")
    .insert({
      vendor_id: vendor.vendorId,
      owner_pin: vendor.ownerPin,
      pin_enabled: true,
      farm_name: vendor.farmName,
      owner_name: vendor.ownerName || "",
      tagline: vendor.tagline || "",
      description: vendor.description || "",
      email: vendor.email,
      phone: vendor.phone,
      website: vendor.website || "",
      address: vendor.address || "",
      city: vendor.city || "",
      state: vendor.state || "",
      zip: vendor.zip || "",
      public_order_page_link: vendor.publicOrderPageLink,
      logo_url: vendor.logoUrl || "",
      cover_url: "",
      certified_organic: vendor.certifiedOrganic || false,
      accepting_orders: true,
      market_schedules: [],
      stripe_connected: false,
      stripe_connected_account_id: null,
      stripe_charges_enabled: false,
      stripe_payouts_enabled: false,
      stripe_details_submitted: false,
      public_status: {
        openStatus: "closed",
        location: "",
        hoursToday: "",
        pickupWait: "",
        customerNotice: "",
      },
      payments: {
        acceptOnlinePayments: false,
        allowTips: true,
        suggestedTips: "10, 15, 20",
        taxRate: 0,
      },
      alerts: {
        orderAlertEmail: vendor.email,
        orderAlertPhone: vendor.phone,
        emailOrderRequests: true,
        emailPaidOrders: true,
        smsAlerts: false,
      },
      products: [],
      urls: {
        successUrl: "",
        cancelUrl: "",
      },
    })
    .select()
    .single();

  if (error) {
    console.error("[Create Vendor Error]", error);
    return null;
  }

  return data as VendorRow;
}

/**
 * Update a vendor's Stripe Connect account ID and status.
 */
export async function updateVendorStripeStatus(
  vendorId: string,
  updates: {
    stripe_connected_account_id?: string;
    stripe_connected?: boolean;
    stripe_charges_enabled?: boolean;
    stripe_payouts_enabled?: boolean;
    stripe_details_submitted?: boolean;
  }
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("fmv_vendors")
    .update(updates)
    .eq("vendor_id", vendorId);

  if (error) {
    console.error("[Update Vendor Stripe Status Error]", error);
    return false;
  }

  return true;
}

/**
 * Look up a vendor by their Stripe Connect account ID.
 * Used by the webhook handler to find the vendor when processing
 * account.updated events.
 */
export async function getVendorByStripeAccount(
  connectedAccountId: string
): Promise<VendorRow | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("fmv_vendors")
    .select("*")
    .eq("stripe_connected_account_id", connectedAccountId)
    .maybeSingle();

  if (error) {
    console.error("[Get Vendor By Stripe Account Error]", error);
    return null;
  }

  return data as VendorRow | null;
}

/**
 * Update a vendor's public status (open/closed, location, etc.).
 */
export async function updateVendorPublicStatus(
  vendorId: string,
  status: VendorPublicStatus
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("fmv_vendors")
    .update({ public_status: status })
    .eq("vendor_id", vendorId);

  if (error) {
    console.error("[Update Vendor Status Error]", error);
    return false;
  }

  return true;
}

/**
 * Update a vendor's products.
 */
export async function updateVendorProducts(
  vendorId: string,
  products: VendorProduct[]
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("fmv_vendors")
    .update({ products })
    .eq("vendor_id", vendorId);

  if (error) {
    console.error("[Update Vendor Products Error]", error);
    return false;
  }

  return true;
}

/**
 * Update a vendor's payment settings.
 */
export async function updateVendorPayments(
  vendorId: string,
  payments: VendorPayments
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("fmv_vendors")
    .update({ payments })
    .eq("vendor_id", vendorId);

  if (error) {
    console.error("[Update Vendor Payments Error]", error);
    return false;
  }

  return true;
}

/**
 * Update a vendor's alert settings.
 */
export async function updateVendorAlerts(
  vendorId: string,
  alerts: VendorAlerts
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("fmv_vendors")
    .update({ alerts })
    .eq("vendor_id", vendorId);

  if (error) {
    console.error("[Update Vendor Alerts Error]", error);
    return false;
  }

  return true;
}

/**
 * Update a vendor's PIN and pin_enabled setting.
 */
export async function updateVendorPin(
  vendorId: string,
  ownerPin: string,
  pinEnabled: boolean
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("fmv_vendors")
    .update({ owner_pin: ownerPin, pin_enabled: pinEnabled })
    .eq("vendor_id", vendorId);

  if (error) {
    console.error("[Update Vendor PIN Error]", error);
    return false;
  }

  return true;
}

/**
 * Update vendor checkout URLs.
 */
export async function updateVendorUrls(
  vendorId: string,
  urls: { successUrl: string; cancelUrl: string }
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("fmv_vendors")
    .update({ urls })
    .eq("vendor_id", vendorId);

  if (error) {
    console.error("[Update Vendor URLs Error]", error);
    return false;
  }

  return true;
}

// ─── Order helpers ──────────────────────────────────────────

/**
 * Create an order record in Supabase.
 * Called by the webhook handler when a checkout.session.completed event fires.
 */
export async function createOrder(order: {
  vendorId: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: VendorOrderItem[];
  totalCents: number;
  source: OrderSource;
  paymentMethod: PaymentMethod;
  pickupDay: string;
  notes: string;
  paymentStatus: "paid" | "unpaid";
  isTest?: boolean;
}): Promise<OrderRow | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("fmv_orders")
    .insert({
      vendor_id: order.vendorId,
      stripe_session_id: order.stripeSessionId,
      stripe_payment_intent_id: order.stripePaymentIntentId || null,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      customer_email: order.customerEmail,
      items: order.items,
      total_cents: order.totalCents,
      source: order.source,
      payment_method: order.paymentMethod,
      pickup_day: order.pickupDay,
      notes: order.notes,
      status: "pending",
      payment_status: order.paymentStatus,
      is_test: order.isTest || false,
    })
    .select()
    .single();

  if (error) {
    console.error("[Create Order Error]", error);
    return null;
  }

  return data as OrderRow;
}

/**
 * Get orders for a vendor, ordered by newest first.
 */
export async function getOrders(
  vendorId: string
): Promise<OrderRow[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("fmv_orders")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Get Orders Error]", error);
    return [];
  }

  return (data as OrderRow[]) || [];
}

/**
 * Update an order's status and/or payment status.
 */
export async function updateOrder(
  orderId: string,
  updates: {
    status?: OrderStatus;
    payment_status?: "unpaid" | "paid" | "refunded";
  }
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("fmv_orders")
    .update(updates)
    .eq("id", orderId);

  if (error) {
    console.error("[Update Order Error]", error);
    return false;
  }

  return true;
}

/**
 * Get order counts for a vendor (for plan-limit checking).
 */
export async function getOrderCounts(
  vendorId: string
): Promise<{ total: number; pending: number; completed: number }> {
  const supabase = getSupabaseAdmin();

  const { count: total, error: totalError } = await supabase
    .from("fmv_orders")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", vendorId);

  const { count: pending, error: pendingError } = await supabase
    .from("fmv_orders")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", vendorId)
    .in("status", ["pending", "confirmed", "preparing", "ready"]);

  const { count: completed, error: completedError } = await supabase
    .from("fmv_orders")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", vendorId)
    .eq("status", "completed");

  if (totalError || pendingError || completedError) {
    console.error("[Get Order Counts Error]", { totalError, pendingError, completedError });
    return { total: 0, pending: 0, completed: 0 };
  }

  return {
    total: total ?? 0,
    pending: pending ?? 0,
    completed: completed ?? 0,
  };
}