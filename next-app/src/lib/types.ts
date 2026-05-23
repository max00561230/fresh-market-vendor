// ─── Fresh Market Vendor App (FMV1.0) Types ───

export type PricingType = "per_pound" | "per_unit" | "per_bunch" | "per_dozen";
export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "picked_up" | "completed" | "cancelled";
export type PaymentMethod = "cash" | "card" | "mobile";
export type OrderSource = "in_person" | "mobile";
export type AppView = "customer" | "admin" | "checkout";

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  pricingType: PricingType;
  pricePerUnit: number; // $/lb, $/each, $/bunch, $/dozen
  unitLabel: string;     // "lb", "ea", "bunch", "dozen"
  emoji: string;
  imageUrl?: string;
  inStock: boolean;
  isFeatured: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;       // for per_unit/per_dozen/per_bunch: count; for per_pound: weight in lbs
  subtotal: number;       // pricePerUnit * quantity
}

export interface Order {
  id: string;
  items: CartItem[];
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  source: OrderSource;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  pickupDay?: string;     // day of week for pickup
  createdAt: string;
  updatedAt: string;
}

export interface VendorProfile {
  id: string;
  farmName: string;
  tagline: string;
  ownerName: string;
  description: string;
  email: string;
  phone: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  logoUrl?: string;
  coverUrl?: string;
  certifiedOrganic: boolean;
  acceptingOrders: boolean;
  marketSchedules: MarketSchedule[];
}

export interface MarketSchedule {
  dayOfWeek: number; // 0=Sun, 6=Sat
  marketName: string;
  address: string;
  city: string;
  openTime: string;
  closeTime: string;
}

export const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export const PRODUCT_CATEGORIES = [
  { value: "produce", label: "🥬 Produce", emoji: "🥬" },
  { value: "fruit", label: "🍎 Fruit", emoji: "🍎" },
  { value: "dairy", label: "🧀 Dairy & Cheese", emoji: "🧀" },
  { value: "meat", label: "🥩 Meat & Poultry", emoji: "🥩" },
  { value: "eggs", label: "🥚 Eggs", emoji: "🥚" },
  { value: "baked", label: "🍞 Baked Goods", emoji: "🍞" },
  { value: "honey", label: "🍯 Honey & Preserves", emoji: "🍯" },
  { value: "flowers", label: "🌻 Flowers & Plants", emoji: "🌻" },
  { value: "herbs", label: "🌿 Herbs & Spices", emoji: "🌿" },
  { value: "crafts", label: "🧶 Handmade Crafts", emoji: "🧶" },
  { value: "beverages", label: "🫗 Beverages", emoji: "🫗" },
  { value: "other", label: "📦 Other", emoji: "📦" },
] as const;

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  joinedAt: string;
}

export const PRICING_TYPES = [
  { value: "per_pound", label: "Per Pound ($/lb)", unit: "lb" },
  { value: "per_unit", label: "Per Item ($/ea)", unit: "ea" },
  { value: "per_bunch", label: "Per Bunch ($/bunch)", unit: "bunch" },
  { value: "per_dozen", label: "Per Dozen ($/doz)", unit: "doz" },
] as const;