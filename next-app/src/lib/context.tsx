"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import {
  AppView, Product, CartItem, Order, OrderStatus, VendorProfile, PaymentMethod,
} from "./types";
import { DEMO_VENDOR, DEMO_PRODUCTS, DEMO_ORDERS } from "./db";

interface AppState {
  view: AppView;
  vendor: VendorProfile;
  products: Product[];
  orders: Order[];
  cart: CartItem[];
}

interface AppContextType {
  data: AppState;
  updateData: (partial: Partial<AppState>) => void;
  setView: (v: AppView) => void;

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

  // Toast
  toast: string | null;
  setToast: (msg: string | null) => void;
}

const STORAGE_KEY = "fmv-app-state";

function loadState(): AppState {
  if (typeof window === "undefined") {
    return { view: "customer", vendor: DEMO_VENDOR, products: DEMO_PRODUCTS, orders: DEMO_ORDERS, cart: [] };
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed, view: parsed.view || "customer" };
    }
  } catch { /* ignore */ }
  return { view: "customer", vendor: DEMO_VENDOR, products: DEMO_PRODUCTS, orders: DEMO_ORDERS, cart: [] };
}

function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppState>(loadState);
  const [toast, setToastState] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback((state: AppState) => {
    saveState(state);
    setData(state);
  }, []);

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

  // ─── Cart ───
  const cartSubtotal = data.cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartTax = 0; // No tax for farm products in NC
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
    setData((prev) => {
      const next = { ...prev, orders: [order, ...prev.orders], cart: [] };
      saveState(next);
      return next;
    });
    setToast("Order placed! 🎉");
    return order;
  }, [data.cart, data.vendor, cartSubtotal, cartTax, cartTotal, setToast]);

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

  return (
    <AppContext.Provider
      value={{
        data, updateData, setView,
        addToCart, removeFromCart, updateQuantity, clearCart,
        cartSubtotal, cartTax, cartTotal, cartCount,
        placeOrder, updateOrderStatus,
        addProduct, updateProduct, deleteProduct,
        updateVendor,
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