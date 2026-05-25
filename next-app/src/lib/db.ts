// ─── Fresh Market Vendor App — Seed Data (FMV1.0) ───
// This is demo/placeholder data. In production, vendor data comes from Supabase.

import { Product, VendorProfile, Order } from "./types";
import { buildFreeDemoProducts } from "./plans/free-demo-plan";

export const DEMO_VENDOR: VendorProfile = {
  id: "v1",
  farmName: "Green Valley Farm",
  tagline: "Fresh. Local. Organic.",
  ownerName: "Sarah Mitchell",
  description: "Family-owned organic farm growing seasonal produce, free-range eggs, and raw honey since 2012. We believe in sustainable farming and bringing the freshest food from our fields to your table.",
  email: "sarah@greenvalleyfarm.com",
  phone: "(252) 555-0147",
  website: "https://greenvalleyfarm.com",
  address: "420 Valley Road",
  city: "Halifax",
  state: "NC",
  zip: "27839",
  logoUrl: undefined,
  coverUrl: undefined,
  certifiedOrganic: true,
  acceptingOrders: true,
  marketSchedules: [
    { dayOfWeek: 6, marketName: "Halifax Farmers Market", address: "10 Market St", city: "Halifax, NC", openTime: "08:00", closeTime: "13:00" },
    { dayOfWeek: 3, marketName: "Weldon Wednesday Market", address: "205 Washington St", city: "Weldon, NC", openTime: "07:00", closeTime: "12:00" },
  ],
};

export const DEMO_PRODUCTS: Product[] = buildFreeDemoProducts();

export const DEMO_ORDERS: Order[] = [
  {
    id: "o1",
    items: [
      { product: DEMO_PRODUCTS[0], quantity: 2.5, subtotal: 8.73 },
      { product: DEMO_PRODUCTS[1], quantity: 1, subtotal: 4.50 },
    ],
    customerName: "Mike Johnson",
    customerPhone: "(252) 555-0199",
    source: "mobile",
    status: "pending",
    paymentMethod: "card",
    subtotal: 13.23,
    tax: 0.00,
    total: 13.23,
    notes: "Pick up Saturday",
    pickupDay: "Saturday",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "o2",
    items: [
      { product: DEMO_PRODUCTS[2], quantity: 1, subtotal: 12.00 },
      { product: DEMO_PRODUCTS[5], quantity: 2, subtotal: 10.00 },
    ],
    customerName: "Lisa Chen",
    source: "in_person",
    status: "completed",
    paymentMethod: "cash",
    subtotal: 22.00,
    tax: 0.00,
    total: 22.00,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];
