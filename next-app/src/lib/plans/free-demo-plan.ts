// Fresh Market Vendor (FMV) - Free Demo Plan
// Gives vendors enough sample data to test the workflow without replacing the full plan.

import type { Product } from "@/lib/types";

export type DemoLockedFeature =
  | "live_selling"
  | "unlimited_products"
  | "unlimited_orders"
  | "unlimited_customers"
  | "remove_demo_branding"
  | "export_data"
  | "custom_domain"
  | "advanced_inventory"
  | "multi_vendor"
  | "priority_support";

export interface FreeDemoLimits {
  products: number;
  customers: number;
  orders: number;
  marketSchedules: number;
  featuredProducts: number;
}

export const FREE_DEMO_PLAN = {
  tier: "free" as const,
  name: "Free Demo Mode",
  shortName: "Demo",
  badge: "Free Demo",
  upgradeLabel: "Upgrade to Full Vendor Plan",
  description:
    "Try the Fresh Market Vendor workflow with sample products, limited orders, and demo features before using it for a real market business.",
  limits: {
    products: 12,
    customers: 10,
    orders: 5,
    marketSchedules: 2,
    featuredProducts: 4,
  } satisfies FreeDemoLimits,
  lockedFeatures: [
    "live_selling",
    "unlimited_products",
    "unlimited_orders",
    "unlimited_customers",
    "remove_demo_branding",
    "export_data",
    "custom_domain",
    "advanced_inventory",
    "multi_vendor",
    "priority_support",
  ] as DemoLockedFeature[],
  bannerTitle: "You are using Free Demo Mode",
  bannerMessage:
    "Add up to 12 products and test the full workflow. Upgrade when you are ready to accept real customer orders and run your market business.",
};

export const FREE_DEMO_UPGRADE_MESSAGES: Record<string, string> = {
  products:
    "Free Demo Mode includes 12 products so you can test the catalog. Upgrade to add a full market inventory.",
  customers:
    "Free Demo Mode includes 10 customers for testing. Upgrade to manage your full customer list.",
  orders:
    "Free Demo Mode includes 5 test orders. Upgrade to accept and manage real customer orders.",
  marketSchedules:
    "Free Demo Mode includes 2 market schedules. Upgrade to add more market days and locations.",
  featuredProducts:
    "Free Demo Mode includes 4 featured products. Upgrade to promote more items.",
  export_data:
    "Export is available in the Full Vendor Plan so active businesses can keep records and backups.",
  live_selling:
    "Live selling is available in the Full Vendor Plan. Demo Mode is for testing the workflow before launch.",
};

export function getFreeDemoUpgradeMessage(resource?: string): string {
  if (!resource) return FREE_DEMO_PLAN.bannerMessage;
  return FREE_DEMO_UPGRADE_MESSAGES[resource] || FREE_DEMO_PLAN.bannerMessage;
}

export function freeDemoWouldExceedLimit(
  resource: keyof FreeDemoLimits,
  currentCount: number
): boolean {
  return currentCount >= FREE_DEMO_PLAN.limits[resource];
}

export function freeDemoRemaining(
  resource: keyof FreeDemoLimits,
  currentCount: number
): number {
  return Math.max(0, FREE_DEMO_PLAN.limits[resource] - currentCount);
}

export const FREE_DEMO_PRODUCTS: Product[] = [
  {
    id: "demo-p1",
    name: "Heirloom Tomatoes",
    category: "produce",
    description: "Vine-ripened tomatoes with rich flavor. Great for salads and sandwiches.",
    pricingType: "per_pound",
    pricePerUnit: 3.49,
    unitLabel: "lb",
    emoji: "🍅",
    inStock: true,
    isFeatured: true,
  },
  {
    id: "demo-p2",
    name: "Cucumbers",
    category: "produce",
    description: "Fresh crisp cucumbers picked for market.",
    pricingType: "per_unit",
    pricePerUnit: 1.25,
    unitLabel: "ea",
    emoji: "🥒",
    inStock: true,
    isFeatured: false,
  },
  {
    id: "demo-p3",
    name: "Mixed Greens Bag",
    category: "produce",
    description: "Fresh bag of mixed lettuces and tender baby greens.",
    pricingType: "per_unit",
    pricePerUnit: 4.0,
    unitLabel: "ea",
    emoji: "🥬",
    inStock: true,
    isFeatured: true,
  },
  {
    id: "demo-p4",
    name: "Sweet Corn",
    category: "produce",
    description: "Fresh-picked sweet corn, great for boiling or grilling.",
    pricingType: "per_dozen",
    pricePerUnit: 6.0,
    unitLabel: "doz",
    emoji: "🌽",
    inStock: true,
    isFeatured: false,
  },
  {
    id: "demo-p5",
    name: "Green Beans",
    category: "produce",
    description: "Tender green beans sold by the pound.",
    pricingType: "per_pound",
    pricePerUnit: 3.0,
    unitLabel: "lb",
    emoji: "🫘",
    inStock: true,
    isFeatured: false,
  },
  {
    id: "demo-p6",
    name: "Fresh Strawberries",
    category: "fruit",
    description: "Sweet market strawberries in a fresh-picked basket.",
    pricingType: "per_unit",
    pricePerUnit: 5.0,
    unitLabel: "basket",
    emoji: "🍓",
    inStock: true,
    isFeatured: true,
  },
  {
    id: "demo-p7",
    name: "Blueberries",
    category: "fruit",
    description: "Local blueberries sold by the pint.",
    pricingType: "per_unit",
    pricePerUnit: 4.5,
    unitLabel: "pint",
    emoji: "🫐",
    inStock: true,
    isFeatured: false,
  },
  {
    id: "demo-p8",
    name: "Farm Fresh Eggs",
    category: "eggs",
    description: "Pasture-raised eggs with rich golden yolks.",
    pricingType: "per_dozen",
    pricePerUnit: 4.5,
    unitLabel: "doz",
    emoji: "🥚",
    inStock: true,
    isFeatured: true,
  },
  {
    id: "demo-p9",
    name: "Local Honey",
    category: "honey",
    description: "Raw local honey in a market jar.",
    pricingType: "per_unit",
    pricePerUnit: 12.0,
    unitLabel: "jar",
    emoji: "🍯",
    inStock: true,
    isFeatured: false,
  },
  {
    id: "demo-p10",
    name: "Fresh Bread",
    category: "baked",
    description: "Fresh baked market loaf.",
    pricingType: "per_unit",
    pricePerUnit: 6.0,
    unitLabel: "loaf",
    emoji: "🍞",
    inStock: true,
    isFeatured: false,
  },
  {
    id: "demo-p11",
    name: "Basil Bunch",
    category: "herbs",
    description: "Fresh basil bunch for cooking, salads, and pesto.",
    pricingType: "per_bunch",
    pricePerUnit: 2.5,
    unitLabel: "bunch",
    emoji: "🌿",
    inStock: true,
    isFeatured: false,
  },
  {
    id: "demo-p12",
    name: "Flower Bouquet",
    category: "flowers",
    description: "Seasonal fresh-cut flower bouquet.",
    pricingType: "per_unit",
    pricePerUnit: 10.0,
    unitLabel: "bouquet",
    emoji: "🌻",
    inStock: true,
    isFeatured: false,
  },
];

export function buildFreeDemoProducts(): Product[] {
  return FREE_DEMO_PRODUCTS.map((product) => ({ ...product }));
}
