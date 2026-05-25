// Fresh Market Vendor App (FMV1.0) - Plan Limits

import { FREE_DEMO_PLAN } from "./plans/free-demo-plan";

export type PlanTier = 'free' | 'full';

export interface PlanLimit {
  customers: number | null;   // null = unlimited
  products: number | null;     // null = unlimited
  orders: number | null;       // null = unlimited
  marketSchedules: number | null;
  featuredProducts: number | null;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimit> = {
  free: {
    customers: FREE_DEMO_PLAN.limits.customers,
    products: FREE_DEMO_PLAN.limits.products,
    orders: FREE_DEMO_PLAN.limits.orders,
    marketSchedules: FREE_DEMO_PLAN.limits.marketSchedules,
    featuredProducts: FREE_DEMO_PLAN.limits.featuredProducts,
  },
  full: {
    customers: null,  // unlimited
    products: null,   // unlimited
    orders: null,     // unlimited
    marketSchedules: null,
    featuredProducts: null,
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
