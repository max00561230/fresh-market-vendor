'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { PaymentMethod } from '@/lib/types';
import { wouldExceedLimit } from '@/lib/plan-limits';
import Link from 'next/link';

export default function CartPage() {
  const {
    data, cartSubtotal, cartTax, cartTotal,
    updateQuantity, removeFromCart, clearCart, placeOrder,
    isFree, showUpgrade,
  } = useApp();
  const { cart, orders } = data;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  if (orderPlaced) {
    return (
      <div className="empty-state">
        <div className="emoji">🎉</div>
        <h3>Order Placed!</h3>
        <p>We&apos;ll get your order ready. Thank you!</p>
        <Link href="/products" className="btn btn-primary mt-4">Continue Shopping</Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="empty-state">
        <div className="emoji">🧺</div>
        <h3>Your cart is empty</h3>
        <p>Browse our products and add some fresh picks!</p>
        <Link href="/products" className="btn btn-primary mt-4">Browse Products</Link>
      </div>
    );
  }

  const handleStripeCheckout = async () => {
    if (!name.trim() || cart.length === 0) return;
    setCheckingOut(true);
    setCheckoutError('');
    try {
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/order-success`;
      const cancelUrl = `${baseUrl}/order-cancel`;
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: data.vendor.id || 'v1',
          cartItems: cart.map(item => ({
            id: item.product.id,
            quantity: item.product.pricingType === 'per_pound' ? item.quantity : Math.round(item.quantity),
            pricingType: item.product.pricingType,
            pricePerUnit: item.product.pricePerUnit,
            name: item.product.name,
          })),
          customerName: name.trim(),
          customerPhone: phone.trim() || undefined,
          customerEmail: email.trim() || undefined,
          pickupDay: data.vendor.marketSchedules[0]?.marketName,
          customerNotes: notes.trim() || undefined,
          successUrl,
          cancelUrl,
          source: 'mobile',
        }),
      });
      const resp = await res.json();
      if (resp.ok && resp.url) {
        window.location.href = resp.url;
      } else {
        setCheckoutError(resp.message || 'Unable to start checkout.');
      }
    } catch {
      setCheckoutError('Failed to start checkout. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    // Free plan order limit check
    if (isFree && wouldExceedLimit('orders', orders.length, 'free')) {
      showUpgrade('orders');
      return;
    }
    if (paymentMethod === 'card') {
      handleStripeCheckout();
    } else {
      placeOrder({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        paymentMethod,
        source: 'mobile',
      });
      setOrderPlaced(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="section-header">
        <span className="emoji">🛒</span>
        <h2>Your Cart</h2>
        <span className="badge">{cart.length}</span>
      </div>

      {/* Cart Items */}
      <div className="card">
        <div className="card-body space-y-3">
          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center gap-4 py-2 border-b border-[var(--border)] last:border-0">
              <span className="text-2xl">{item.product.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{item.product.name}</div>
                <div className="text-xs text-[var(--text-muted)]">
                  ${item.product.pricePerUnit.toFixed(2)}/{item.product.unitLabel}
                </div>
              </div>

              {/* Quantity Controls */}
              {item.product.pricingType === 'per_pound' ? (
                <div className="weight-input">
                  <input
                    type="number"
                    className="input"
                    style={{ width: 72, textAlign: 'center', padding: '6px' }}
                    step={0.1}
                    min={0.1}
                    value={item.quantity}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (v > 0) updateQuantity(item.product.id, v);
                    }}
                  />
                  <span>lb</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 10px', minWidth: 0 }}
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  >−</button>
                  <span className="font-semibold text-sm w-6 text-center">{item.quantity}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 10px', minWidth: 0 }}
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  >+</button>
                </div>
              )}

              <div className="font-bold text-sm w-20 text-right">${item.subtotal.toFixed(2)}</div>
              <button
                className="text-[var(--danger)] text-sm font-semibold hover:underline"
                onClick={() => removeFromCart(item.product.id)}
              >✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="card">
        <div className="card-body">
          <div className="receipt-line"><span>Subtotal</span><span>${cartSubtotal.toFixed(2)}</span></div>
          <div className="receipt-line text-[var(--text-muted)]"><span>Tax</span><span>${cartTax.toFixed(2)}</span></div>
          <div className="receipt-total"><span>Total</span><span>${cartTotal.toFixed(2)}</span></div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="card">
        <div className="card-header">Customer Information</div>
        <div className="card-body space-y-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} placeholder="Special instructions…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {/* Payment Method */}
          <div>
            <label className="label mb-2">Payment Method</label>
            <div className="payment-toggle">
              <button
                className={`payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                <span className="icon">💵</span>Cash
              </button>
              <button
                className={`payment-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <span className="icon">💳</span>Card
              </button>
            </div>
          </div>
          {checkoutError && (
            <p className="text-sm text-[var(--danger)]">{checkoutError}</p>
          )}
          {paymentMethod === 'card' && (
            <p className="text-xs text-[var(--text-muted)]">
              💳 You'll be redirected to Stripe for secure payment processing.
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="btn btn-ghost flex-1" onClick={clearCart}>Clear Cart</button>
        <button
          className="btn btn-primary flex-1"
          disabled={!name.trim() || checkingOut}
          onClick={handleSubmit}
          style={!name.trim() || checkingOut ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          {checkingOut ? 'Redirecting…' : `Place Order · $${cartTotal.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}