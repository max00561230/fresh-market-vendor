// ─── Fresh Market Vendor App (FMV1.0) — Free Trial Limits ───
// Same pattern as LawnCare Manager: 3 customers, 3 products, 3 orders on free plan
// Custom build unlocks unlimited everything

export type PlanTier = 'free' | 'full';

export interface PlanLimit {
  customers: number | null;   // null = unlimited
  products: number | null;     // null = unlimited
  orders: number | null;       // null = unlimited
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimit> = {
  free: {
    customers: 3,
    products: 3,
    orders: 3,
  },
  full: {
    customers: null,  // unlimited
    products: null,   // unlimited
    orders: null,     // unlimited
  },
};

export const STORAGE_KEY_PLAN = 'fmv_plan_tier';

export function wouldExceedLimit(
  resource: keyof PlanLimit,
  currentCount: number,
  tier: PlanTier
): boolean {
  const limit = PLAN_LIMITS[tier][resource];
  if (limit === null) return false; // unlimited
  return currentCount >= limit;
}

export function getRemaining(
  resource: keyof PlanLimit,
  currentCount: number,
  tier: PlanTier
): number | null {
  const limit = PLAN_LIMITS[tier][resource];
  if (limit === null) return null; // unlimited
  return Math.max(0, limit - currentCount);
}