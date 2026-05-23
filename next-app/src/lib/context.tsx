"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import {
  AppView, Product, CartItem, Order, OrderStatus, VendorProfile, PaymentMethod, Customer,
} from "./types";
import { DEMO_VENDOR, DEMO_PRODUCTS, DEMO_ORDERS } from "./db";
import { PlanTier, PLAN_LIMITS, STORAGE_KEY_PLAN, wouldExceedLimit, getRemaining } from "./plan-limits";

interface AppState {
  view: AppView;
  vendor: VendorProfile;
  products: Product[];
  orders: Order[];
  cart: CartItem[];
  customers: Customer[];
  adminPin: string;
  pinUnlocked: boolean;
}

interface AppContextType {
  data: AppState;
  updateData: (partial: Partial<AppState>) => void;
  setView: (v: AppView) => void;

  // PIN
  verifyPin: (pin: string) => boolean;
  changePin: (newPin: string) => void;
  lockAdmin: () => void;

  // Plan
  tier: PlanTier;
  setTier: (tier: PlanTier) => void;
  isFree: boolean;
  canAdd: (resource: "customers" | "products" | "orders", currentCount: number) => boolean;
  remaining: (resource: "customers" | "products" | "orders", currentCount: number) => number | null;
  showUpgrade: (resource?: string) => void;
  hideUpgrade: () => void;
  upgradeVisible: boolean;
  upgradeResource: string | null;

  // Cart
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;
  cartCount: number;

  // Orders
  placeOrder: (customerInfo: { name: string; phone?: string; email?: string; notes?: string; paymentMethod: PaymentMethod; source: "mobile" | "in_person" }) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

  // Products (admin)
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;

  // Vendor profile (admin)
  updateVendor: (partial: Partial<VendorProfile>) => void;

  // Customers
  addCustomer: (customer: Customer) => void;
  removeCustomer: (customerId: string) => void;
  getCustomerPageUrl: () => string;

  // Toast
  toast: string | null;
  setToast: (msg: string | null) => void;
}

const STORAGE_KEY = "fmv-app-state";
const DEFAULT_PIN = "1234";

function loadState(): AppState {
  if (typeof window === "undefined") {
    return {
      view: "customer",
      vendor: DEMO_VENDOR,
      products: DEMO_PRODUCTS,
      orders: DEMO_ORDERS,
      cart: [],
      customers: [],
      adminPin: DEFAULT_PIN,
      pinUnlocked: false,
    };
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Restore pinUnlocked from sessionStorage (survives page reloads within session)
      let pinUnlocked = false;
      try { pinUnlocked = sessionStorage.getItem("fmv_pin_unlocked") === "true"; } catch {}
      return {
        ...parsed,
        view: parsed.view || "customer",
        customers: parsed.customers || [],
        adminPin: parsed.adminPin || DEFAULT_PIN,
        pinUnlocked,
      };
    }
  } catch { /* ignore */ }
  let pinUnlocked = false;
  try { pinUnlocked = sessionStorage.getItem("fmv_pin_unlocked") === "true"; } catch {}
  return {
    view: "customer",
    vendor: DEMO_VENDOR,
    products: DEMO_PRODUCTS,
    orders: DEMO_ORDERS,
    cart: [],
    customers: [],
    adminPin: DEFAULT_PIN,
    pinUnlocked,
  };
}

function loadTier(): PlanTier {
  if (typeof window === "undefined") return "free";
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PLAN);
    if (stored === "full") return "full";
  } catch { /* ignore */ }
  return "free";
}

function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  try {
    // Don't persist pinUnlocked
    const { pinUnlocked, ...toSave } = state;
    void pinUnlocked;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch { /* ignore */ }
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppState>(loadState);
  const [tier, setTierState] = useState<PlanTier>(loadTier);
  const [upgradeVisible, setUpgradeVisible] = useState(false);
  const [upgradeResource, setUpgradeResource] = useState<string | null>(null);
  const [toast, setToastState] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFree = tier === "free";

  const updateData = useCallback((partial: Partial<AppState>) => {
    setData((prev) => {
      const next = { ...prev, ...partial };
      saveState(next);
      return next;
    });
  }, []);

  const setView = useCallback((v: AppView) => {
    setData((prev) => {
      const next = { ...prev, view: v };
      saveState(next);
      return next;
    });
  }, []);

  const setToast = useCallback((msg: string | null) => {
    setToastState(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current as unknown as number);
    if (msg) {
      toastTimer.current = setTimeout(() => setToastState(null), 2000);
    }
  }, []);

  const setTier = useCallback((newTier: PlanTier) => {
    setTierState(newTier);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_PLAN, newTier);
    }
  }, []);

  // ─── Plan Limit Checks ───
  const canAdd = useCallback((resource: "customers" | "products" | "orders", currentCount: number) => {
    return !wouldExceedLimit(resource, currentCount, tier);
  }, [tier]);

  const remaining = useCallback((resource: "customers" | "products" | "orders", currentCount: number) => {
    return getRemaining(resource, currentCount, tier);
  }, [tier]);

  const showUpgrade = useCallback((resource?: string) => {
    setUpgradeResource(resource || null);
    setUpgradeVisible(true);
  }, []);

  const hideUpgrade = useCallback(() => {
    setUpgradeVisible(false);
    setUpgradeResource(null);
  }, []);

  // ─── PIN ───
  const verifyPin = useCallback((pin: string) => {
    if (pin === data.adminPin) {
      setData((prev) => ({ ...prev, pinUnlocked: true }));
      try { sessionStorage.setItem("fmv_pin_unlocked", "true"); } catch {}
      return true;
    }
    return false;
  }, [data.adminPin]);

  const changePin = useCallback((newPin: string) => {
    setData((prev) => {
      const next = { ...prev, adminPin: newPin, pinUnlocked: true };
      saveState(next);
      return next;
    });
    try { sessionStorage.setItem("fmv_pin_unlocked", "true"); } catch {}
    setToast("PIN changed ✅");
  }, [setToast]);

  const lockAdmin = useCallback(() => {
    setData((prev) => ({ ...prev, pinUnlocked: false }));
    try { sessionStorage.removeItem("fmv_pin_unlocked"); } catch {}
  }, []);

  // ─── Cart ───
  const cartSubtotal = data.cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartTax = 0;
  const cartTotal = cartSubtotal + cartTax;
  const cartCount = data.cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setData((prev) => {
      const existing = prev.cart.find((c) => c.product.id === product.id);
      let newCart: CartItem[];
      if (existing) {
        const newQty = existing.quantity + quantity;
        newCart = prev.cart.map((c) =>
          c.product.id === product.id
            ? { ...c, quantity: newQty, subtotal: product.pricePerUnit * newQty }
            : c
        );
      } else {
        newCart = [...prev.cart, { product, quantity, subtotal: product.pricePerUnit * quantity }];
      }
      const next = { ...prev, cart: newCart };
      saveState(next);
      return next;
    });
    setToast(`Added ${product.emoji} ${product.name}`);
  }, [setToast]);

  const removeFromCart = useCallback((productId: string) => {
    setData((prev) => {
      const next = { ...prev, cart: prev.cart.filter((c) => c.product.id !== productId) };
      saveState(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setData((prev) => {
      const next = {
        ...prev,
        cart: prev.cart.map((c) =>
          c.product.id === productId
            ? { ...c, quantity, subtotal: c.product.pricePerUnit * quantity }
            : c
        ),
      };
      saveState(next);
      return next;
    });
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setData((prev) => {
      const next = { ...prev, cart: [] };
      saveState(next);
      return next;
    });
  }, []);

  // ─── Orders ───
  const placeOrder = useCallback((info: { name: string; phone?: string; email?: string; notes?: string; paymentMethod: PaymentMethod; source: "mobile" | "in_person" }) => {
    const order: Order = {
      id: `o${Date.now()}`,
      items: [...data.cart],
      customerName: info.name,
      customerPhone: info.phone,
      customerEmail: info.email,
      source: info.source,
      status: "pending",
      paymentMethod: info.paymentMethod,
      subtotal: cartSubtotal,
      tax: cartTax,
      total: cartTotal,
      notes: info.notes,
      pickupDay: data.vendor.marketSchedules[0]?.marketName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Auto-add customer from order if email provided
    let newCustomers = [...data.customers];
    if (info.email && !data.customers.find(c => c.email === info.email)) {
      newCustomers.push({
        id: `cust${Date.now()}`,
        name: info.name,
        email: info.email,
        phone: info.phone,
        joinedAt: new Date().toISOString(),
      });
    }

    setData((prev) => {
      const next = { ...prev, orders: [order, ...prev.orders], cart: [], customers: newCustomers };
      saveState(next);
      return next;
    });
    setToast("Order placed! 🎉");
    return order;
  }, [data.cart, data.vendor, data.customers, cartSubtotal, cartTax, cartTotal, setToast]);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setData((prev) => {
      const next = {
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
        ),
      };
      saveState(next);
      return next;
    });
  }, []);

  // ─── Products (admin) ───
  const addProduct = useCallback((product: Product) => {
    setData((prev) => {
      const next = { ...prev, products: [...prev.products, product] };
      saveState(next);
      return next;
    });
    setToast("Product added ✅");
  }, [setToast]);

  const updateProduct = useCallback((product: Product) => {
    setData((prev) => {
      const next = { ...prev, products: prev.products.map((p) => p.id === product.id ? product : p) };
      saveState(next);
      return next;
    });
    setToast("Product updated ✅");
  }, [setToast]);

  const deleteProduct = useCallback((productId: string) => {
    setData((prev) => {
      const next = { ...prev, products: prev.products.filter((p) => p.id !== productId) };
      saveState(next);
      return next;
    });
    setToast("Product removed");
  }, [setToast]);

  // ─── Vendor profile (admin) ───
  const updateVendor = useCallback((partial: Partial<VendorProfile>) => {
    setData((prev) => {
      const next = { ...prev, vendor: { ...prev.vendor, ...partial } };
      saveState(next);
      return next;
    });
    setToast("Profile updated ✅");
  }, [setToast]);

  // ─── Customers ───
  const addCustomer = useCallback((customer: Customer) => {
    setData((prev) => {
      if (prev.customers.find(c => c.email === customer.email)) {
        return prev; // Already exists
      }
      const next = { ...prev, customers: [...prev.customers, customer] };
      saveState(next);
      return next;
    });
    setToast("Customer added ✅");
  }, [setToast]);

  const removeCustomer = useCallback((customerId: string) => {
    setData((prev) => {
      const next = { ...prev, customers: prev.customers.filter((c) => c.id !== customerId) };
      saveState(next);
      return next;
    });
    setToast("Customer removed");
  }, [setToast]);

  const getCustomerPageUrl = useCallback(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/customer`;
    }
    return "/customer";
  }, []);

  return (
    <AppContext.Provider
      value={{
        data, updateData, setView,
        verifyPin, changePin, lockAdmin,
        tier, setTier, isFree, canAdd, remaining, showUpgrade, hideUpgrade, upgradeVisible, upgradeResource,
        addToCart, removeFromCart, updateQuantity, clearCart,
        cartSubtotal, cartTax, cartTotal, cartCount,
        placeOrder, updateOrderStatus,
        addProduct, updateProduct, deleteProduct,
        updateVendor,
        addCustomer, removeCustomer, getCustomerPageUrl,
        toast, setToast,
      }}
    >
      {children}
      {toast && <div className="toast">{toast}</div>}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}