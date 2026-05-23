/**
 * Fresh Market Vendor (FMV1.0) — Vendor & Order Types
 *
 * Vendor data model for Stripe Connect platform.
 * Each vendor (farm stand) gets a custom-built app with their
 * farm profile, products, market schedules, and order management.
 */

import type { PricingType, OrderSource, OrderStatus, PaymentMethod } from "@/lib/types";

// ─── Vendor (Supabase fmv_vendors row) ───────────────────────

export interface MarketScheduleRow {
  dayOfWeek: number;
  marketName: string;
  address: string;
  city: string;
  openTime: string;
  closeTime: string;
}

export interface VendorPublicStatus {
  openStatus: "open" | "soon" | "closed";
  location: string;
  hoursToday: string;
  pickupWait: string;
  customerNotice: string;
}

export interface VendorPayments {
  acceptOnlinePayments: boolean;
  allowTips: boolean;
  suggestedTips: string;
  taxRate: number;
}

export interface VendorAlerts {
  orderAlertEmail: string;
  orderAlertPhone: string;
  emailOrderRequests: boolean;
  emailPaidOrders: boolean;
  smsAlerts: boolean;
}

export interface VendorProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  pricingType: PricingType;
  pricePerUnit: number;
  unitLabel: string;
  emoji: string;
  imageUrl?: string;
  inStock: boolean;
  isFeatured: boolean;
}

export interface VendorOrderItem {
  productId: string;
  name: string;
  pricePerUnit: number;
  pricingType: PricingType;
  quantity: number;
  subtotal: number;
}

/** Supabase fmv_vendors table row */
export interface VendorRow {
  id: string;
  created_at: string;
  vendor_id: string;
  owner_pin: string;
  pin_enabled: boolean;
  farm_name: string;
  tagline: string;
  owner_name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  logo_url: string;
  cover_url: string;
  certified_organic: boolean;
  accepting_orders: boolean;
  market_schedules: MarketScheduleRow[];
  public_order_page_link: string;
  stripe_connected_account_id: string | null;
  stripe_connected: boolean;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_details_submitted: boolean;
  public_status: VendorPublicStatus;
  payments: VendorPayments;
  alerts: VendorAlerts;
  products: VendorProduct[];
  urls: { successUrl: string; cancelUrl: string };
}

// ─── Order (Supabase fmv_orders row) ─────────────────────────

/** Supabase fmv_orders table row */
export interface OrderRow {
  id: string;
  created_at: string;
  vendor_id: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  items: VendorOrderItem[];
  total_cents: number;
  source: OrderSource;
  payment_method: PaymentMethod;
  pickup_day: string;
  notes: string;
  status: OrderStatus;
  payment_status: "unpaid" | "paid" | "refunded";
  is_test: boolean;
}

// ─── API response shapes ─────────────────────────────────────

export interface ConnectAccountLinkResponse {
  ok: boolean;
  url?: string;
  message?: string;
}

export interface AccountStatusResponse {
  ok: boolean;
  connected: boolean;
  connectedAccountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsDue: boolean;
  message?: string;
}

export interface DashboardLinkResponse {
  ok: boolean;
  url?: string;
  message?: string;
}

export interface CheckoutSessionResponse {
  ok: boolean;
  url?: string;
  sessionId?: string;
  message?: string;
}