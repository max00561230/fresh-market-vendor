"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";
import Link from "next/link";

export default function CustomerCart() {
  const {
    data, cartSubtotal, cartTax, cartTotal, cartCount,
    updateQuantity, removeFromCart, clearCart,
  } = useApp();
  const { cart } = data;
  const [open, setOpen] = useState(false);

  // On desktop, cart is always visible as a sidebar panel
  // On mobile, it's a slide-up sheet triggered by the floating button

  if (cart.length === 0) {
    return (
      <div className="customer-cart-panel empty">
        <div className="customer-cart-header">
          <span>🛒</span>
          <span className="customer-cart-title">Your Cart</span>
        </div>
        <div className="customer-cart-empty">
          <p>Your cart is empty</p>
          <p className="text-xs text-[var(--text-muted)]">Add items from the store</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ─── Desktop: Always-visible sidebar cart ─── */}
      <div className="customer-cart-panel">
        <div className="customer-cart-header">
          <span>🛒</span>
          <span className="customer-cart-title">Your Cart</span>
          <span className="customer-cart-count">{cartCount}</span>
        </div>

        <div className="customer-cart-items">
          {cart.map((item) => (
            <div key={item.product.id} className="customer-cart-item">
              <div className="customer-cart-item-info">
                <span className="customer-cart-item-emoji">{item.product.emoji}</span>
                <div className="customer-cart-item-details">
                  <div className="customer-cart-item-name">{item.product.name}</div>
                  <div className="customer-cart-item-price">
                    ${item.product.pricePerUnit.toFixed(2)}/{item.product.unitLabel}
                  </div>
                </div>
              </div>

              {/* Quantity controls */}
              {item.product.pricingType === "per_pound" ? (
                <div className="customer-cart-qty-weight">
                  <input
                    type="number"
                    className="customer-cart-weight-input"
                    step={0.1}
                    min={0.1}
                    value={item.quantity}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (v > 0) updateQuantity(item.product.id, v);
                    }}
                  />
                  <span className="customer-cart-weight-label">lb</span>
                </div>
              ) : (
                <div className="customer-cart-qty">
                  <button
                    className="customer-cart-qty-btn"
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  >−</button>
                  <span className="customer-cart-qty-num">{item.quantity}</span>
                  <button
                    className="customer-cart-qty-btn"
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  >+</button>
                </div>
              )}

              <div className="customer-cart-item-subtotal">${item.subtotal.toFixed(2)}</div>
              <button
                className="customer-cart-remove"
                onClick={() => removeFromCart(item.product.id)}
                title="Remove"
              >✕</button>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="customer-cart-totals">
          <div className="customer-cart-totals-line">
            <span>Subtotal</span>
            <span>${cartSubtotal.toFixed(2)}</span>
          </div>
          <div className="customer-cart-totals-line muted">
            <span>Tax</span>
            <span>${cartTax.toFixed(2)}</span>
          </div>
          <div className="customer-cart-totals-line total">
            <span>Total</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="customer-cart-actions">
          <Link href="/cart" className="customer-cart-checkout-btn">
            Checkout · ${cartTotal.toFixed(2)}
          </Link>
          <button className="customer-cart-clear-btn" onClick={clearCart}>
            Clear Cart
          </button>
        </div>
      </div>

      {/* ─── Mobile: Floating cart button + slide-up sheet ─── */}
      <div className="customer-cart-mobile">
        {/* Floating button */}
        <button
          className="customer-cart-fab"
          onClick={() => setOpen(true)}
        >
          🛒 <span className="customer-cart-fab-count">{cartCount}</span> · ${cartTotal.toFixed(2)}
        </button>

        {/* Slide-up sheet */}
        {open && (
          <div className="customer-cart-overlay" onClick={() => setOpen(false)}>
            <div className="customer-cart-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="customer-cart-sheet-header">
                <h3>Your Cart ({cartCount})</h3>
                <button className="customer-cart-sheet-close" onClick={() => setOpen(false)}>✕</button>
              </div>

              <div className="customer-cart-sheet-items">
                {cart.map((item) => (
                  <div key={item.product.id} className="customer-cart-item mobile">
                    <div className="customer-cart-item-info">
                      <span className="customer-cart-item-emoji">{item.product.emoji}</span>
                      <div className="customer-cart-item-details">
                        <div className="customer-cart-item-name">{item.product.name}</div>
                        <div className="customer-cart-item-price">
                          ${item.product.pricePerUnit.toFixed(2)}/{item.product.unitLabel}
                        </div>
                      </div>
                    </div>

                    <div className="customer-cart-item-controls">
                      {item.product.pricingType === "per_pound" ? (
                        <div className="customer-cart-qty-weight">
                          <input
                            type="number"
                            className="customer-cart-weight-input"
                            step={0.1}
                            min={0.1}
                            value={item.quantity}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (v > 0) updateQuantity(item.product.id, v);
                            }}
                          />
                          <span className="customer-cart-weight-label">lb</span>
                        </div>
                      ) : (
                        <div className="customer-cart-qty">
                          <button
                            className="customer-cart-qty-btn"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >−</button>
                          <span className="customer-cart-qty-num">{item.quantity}</span>
                          <button
                            className="customer-cart-qty-btn"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >+</button>
                        </div>
                      )}

                      <span className="customer-cart-item-subtotal">${item.subtotal.toFixed(2)}</span>
                      <button
                        className="customer-cart-remove"
                        onClick={() => removeFromCart(item.product.id)}
                      >✕</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="customer-cart-sheet-totals">
                <div className="customer-cart-totals-line total">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="customer-cart-sheet-actions">
                <Link href="/cart" className="customer-cart-checkout-btn" onClick={() => setOpen(false)}>
                  Checkout · ${cartTotal.toFixed(2)}
                </Link>
                <button className="customer-cart-clear-btn" onClick={clearCart}>
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}