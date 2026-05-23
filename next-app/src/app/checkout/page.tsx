'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { PaymentMethod, PricingType } from '@/lib/types';

const PRICE_LABELS: Record<PricingType, string> = {
  per_pound: '/lb',
  per_unit: '/ea',
  per_bunch: '/bunch',
  per_dozen: '/doz',
};

export default function CheckoutPage() {
  const {
    data, addToCart, removeFromCart,
    cartSubtotal, cartTax, cartTotal, cartCount,
    placeOrder, isFree, showUpgrade,
  } = useApp();
  const { cart, products, orders } = data;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [weightModal, setWeightModal] = useState<{ product: typeof products[0] | null; weight: string }>({ product: null, weight: '1.0' });
  const [saleComplete, setSaleComplete] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const handleProductClick = (product: typeof products[0]) => {
    if (!product.inStock) return;
    if (product.pricingType === 'per_pound') {
      setWeightModal({ product, weight: '1.0' });
    } else {
      addToCart(product);
    }
  };

  const handleWeightConfirm = () => {
    if (weightModal.product) {
      const w = parseFloat(weightModal.weight);
      if (w > 0) addToCart(weightModal.product, w);
      setWeightModal({ product: null, weight: '1.0' });
    }
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    // Free plan order limit check
    if (isFree && orders.length >= 3) {
      showUpgrade('orders');
      return;
    }
    if (paymentMethod === 'card') {
      // Redirect to Stripe Checkout for card payments
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
            customerName: 'Walk-in Customer',
            source: 'in_person',
            successUrl,
            cancelUrl,
          }),
        });
        const resp = await res.json();
        if (resp.ok && resp.url) {
          window.location.href = resp.url;
        } else {
          setCheckoutError(resp.message || 'Unable to start checkout.');
          setCheckingOut(false);
        }
      } catch {
        setCheckoutError('Failed to start checkout.');
        setCheckingOut(false);
      }
    } else {
      placeOrder({
        name: 'Walk-in Customer',
        paymentMethod,
        source: 'in_person',
      });
      setSaleComplete(true);
    }
  };

  if (saleComplete) {
    return (
      <div className="space-y-4">
        <div className="empty-state">
          <div className="emoji">✅</div>
          <h3>Sale Complete!</h3>
          <p>Order has been recorded.</p>
        </div>
        <button className="btn btn-primary w-full" onClick={() => setSaleComplete(false)}>
          New Sale
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-4 flex-col lg:flex-row">
      {/* Product Grid */}
      <div className="flex-1 space-y-4">
        <div className="section-header">
          <span className="emoji">🏪</span>
          <h2>Point of Sale</h2>
        </div>

        <div className="pos-grid">
          {products.map((product) => (
            <button
              key={product.id}
              className="pos-btn"
              onClick={() => handleProductClick(product)}
              style={!product.inStock ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
              disabled={!product.inStock}
            >
              <span className="pos-emoji">{product.emoji}</span>
              <span className="pos-name">{product.name}</span>
              <span className="pos-price">${product.pricePerUnit.toFixed(2)}{PRICE_LABELS[product.pricingType]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-80 space-y-4">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <span>🛒 Cart</span>
            <span className="badge">{cartCount}</span>
          </div>
          <div className="card-body space-y-2">
            {cart.length === 0 ? (
              <div className="text-sm text-[var(--text-muted)] text-center py-4">
                Tap products to add
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-2 text-sm">
                  <span>{item.product.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{item.product.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {item.product.pricingType === 'per_pound'
                        ? `${item.quantity.toFixed(1)} lb`
                        : `×${item.quantity}`}
                    </div>
                  </div>
                  <span className="font-bold">${item.subtotal.toFixed(2)}</span>
                  <button
                    className="text-[var(--danger)] text-xs"
                    onClick={() => removeFromCart(item.product.id)}
                  >✕</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Totals */}
        {cart.length > 0 && (
          <div className="card">
            <div className="card-body">
              <div className="receipt-line"><span>Subtotal</span><span>${cartSubtotal.toFixed(2)}</span></div>
              <div className="receipt-line text-[var(--text-muted)]"><span>Tax</span><span>${cartTax.toFixed(2)}</span></div>
              <div className="receipt-total"><span>Total</span><span>${cartTotal.toFixed(2)}</span></div>
            </div>
          </div>
        )}

        {/* Payment Toggle */}
        <div>
          <label className="label">Payment</label>
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

        <button
          className="btn btn-primary w-full"
          disabled={cart.length === 0 || checkingOut}
          onClick={handleCompleteSale}
          style={cart.length === 0 || checkingOut ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          {checkingOut ? 'Redirecting…' : `Complete Sale · $${cartTotal.toFixed(2)}`}
        </button>
      </div>

      {/* Weight Modal */}
      {weightModal.product && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setWeightModal({ product: null, weight: '1.0' })}>
          <div className="card w-80" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              {weightModal.product.emoji} {weightModal.product.name}
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">Weight (lbs)</label>
                <input
                  type="number"
                  className="input"
                  step="0.1"
                  min="0.1"
                  value={weightModal.weight}
                  onChange={(e) => setWeightModal({ ...weightModal, weight: e.target.value })}
                />
              </div>
              <div className="text-right text-sm font-semibold text-[var(--brand)]">
                ${(parseFloat(weightModal.weight || '0') * weightModal.product.pricePerUnit).toFixed(2)}
              </div>
              <div className="flex gap-2">
                <button className="btn btn-ghost flex-1" onClick={() => setWeightModal({ product: null, weight: '1.0' })}>Cancel</button>
                <button className="btn btn-primary flex-1" onClick={handleWeightConfirm}>Add to Cart</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}