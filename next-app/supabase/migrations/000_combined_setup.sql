-- ─── Fresh Market Vendor (FMV1.0) — Combined Setup Migration ───
-- Creates: fmv_vendors, fmv_orders tables
-- Uses same Supabase project as Food Vendor app (xplqfyzcmvjczvbmpzpk)
-- Table names prefixed with fmv_ to avoid collision with FV vendors/orders

-- ═══════════════════════════════════════════════════════════
--  fmv_vendors — Farm/vendor profile and Stripe Connect state
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS fmv_vendors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Identity
  vendor_id     TEXT NOT NULL UNIQUE,
  owner_pin     TEXT NOT NULL DEFAULT '1234',
  pin_enabled   BOOLEAN NOT NULL DEFAULT true,

  -- Farm profile
  farm_name       TEXT NOT NULL DEFAULT '',
  tagline         TEXT NOT NULL DEFAULT '',
  owner_name      TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  email           TEXT NOT NULL DEFAULT '',
  phone           TEXT NOT NULL DEFAULT '',
  website         TEXT NOT NULL DEFAULT '',
  address         TEXT NOT NULL DEFAULT '',
  city            TEXT NOT NULL DEFAULT '',
  state           TEXT NOT NULL DEFAULT '',
  zip             TEXT NOT NULL DEFAULT '',
  logo_url        TEXT NOT NULL DEFAULT '',
  cover_url       TEXT NOT NULL DEFAULT '',
  certified_organic BOOLEAN NOT NULL DEFAULT false,
  accepting_orders  BOOLEAN NOT NULL DEFAULT true,

  -- Market schedules (JSONB array of MarketSchedule objects)
  market_schedules JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Public link
  public_order_page_link TEXT NOT NULL DEFAULT '',

  -- Stripe Connect
  stripe_connected_account_id  TEXT,
  stripe_connected             BOOLEAN NOT NULL DEFAULT false,
  stripe_charges_enabled       BOOLEAN NOT NULL DEFAULT false,
  stripe_payouts_enabled       BOOLEAN NOT NULL DEFAULT false,
  stripe_details_submitted     BOOLEAN NOT NULL DEFAULT false,

  -- App settings (JSONB)
  public_status  JSONB NOT NULL DEFAULT '{
    "openStatus": "closed",
    "location": "",
    "hoursToday": "",
    "pickupWait": "",
    "customerNotice": ""
  }'::jsonb,
  payments       JSONB NOT NULL DEFAULT '{
    "acceptOnlinePayments": false,
    "allowTips": true,
    "suggestedTips": "10, 15, 20",
    "taxRate": 0
  }'::jsonb,
  alerts         JSONB NOT NULL DEFAULT '{
    "orderAlertEmail": "",
    "orderAlertPhone": "",
    "emailOrderRequests": true,
    "emailPaidOrders": true,
    "smsAlerts": false
  }'::jsonb,
  products       JSONB NOT NULL DEFAULT '[]'::jsonb,
  urls           JSONB NOT NULL DEFAULT '{
    "successUrl": "",
    "cancelUrl": ""
  }'::jsonb
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_fmv_vendors_stripe_account ON fmv_vendors (stripe_connected_account_id) WHERE stripe_connected_account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fmv_vendors_email ON fmv_vendors (email);

-- ═══════════════════════════════════════════════════════════
--  fmv_orders — Customer orders for farm vendors
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS fmv_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Relationship
  vendor_id     TEXT NOT NULL REFERENCES fmv_vendors(vendor_id),

  -- Stripe payment tracking
  stripe_session_id         TEXT,
  stripe_payment_intent_id  TEXT,

  -- Customer info
  customer_name   TEXT NOT NULL DEFAULT '',
  customer_phone  TEXT NOT NULL DEFAULT '',
  customer_email  TEXT NOT NULL DEFAULT '',

  -- Order items (JSONB array of VendorOrderItem)
  items           JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Totals
  total_cents     INTEGER NOT NULL DEFAULT 0,

  -- FMV-specific order fields
  source          TEXT NOT NULL DEFAULT 'mobile' CHECK (source IN ('mobile', 'in_person')),
  payment_method  TEXT NOT NULL DEFAULT 'card' CHECK (payment_method IN ('cash', 'card', 'mobile')),
  pickup_day      TEXT NOT NULL DEFAULT '',

  -- Notes & status
  notes           TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'completed', 'cancelled')),
  payment_status  TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  is_test         BOOLEAN NOT NULL DEFAULT false
);

-- Indexes for order queries
CREATE INDEX IF NOT EXISTS idx_fmv_orders_vendor_id ON fmv_orders (vendor_id);
CREATE INDEX IF NOT EXISTS idx_fmv_orders_status ON fmv_orders (status);
CREATE INDEX IF NOT EXISTS idx_fmv_orders_stripe_session ON fmv_orders (stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════
--  Row Level Security
-- ═══════════════════════════════════════════════════════════
ALTER TABLE fmv_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE fmv_orders  ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by API routes)
CREATE POLICY "Service role full access on fmv_vendors"
  ON fmv_vendors FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on fmv_orders"
  ON fmv_orders FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════
--  Helpful comments
-- ═══════════════════════════════════════════════════════════
COMMENT ON TABLE fmv_vendors IS 'Fresh Market Vendor profiles — farm stands, produce sellers, etc.';
COMMENT ON TABLE fmv_orders  IS 'Customer orders placed against FMV vendors via Stripe checkout or in-person';

COMMENT ON COLUMN fmv_vendors.market_schedules IS 'JSONB array: [{dayOfWeek: 0-6, marketName, address, city, openTime, closeTime}]';
COMMENT ON COLUMN fmv_vendors.certified_organic IS 'Whether the farm is USDA Certified Organic';
COMMENT ON COLUMN fmv_vendors.products IS 'JSONB array of FMV products with pricingType (per_pound, per_unit, per_bunch, per_dozen)';
COMMENT ON COLUMN fmv_orders.source IS 'mobile = ordered via app, in_person = ordered at the stand';
COMMENT ON COLUMN fmv_orders.pickup_day IS 'Day of week the customer will pick up their order';