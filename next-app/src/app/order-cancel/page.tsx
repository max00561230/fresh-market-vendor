'use client';

import Link from 'next/link';

export default function OrderCancelPage() {
  return (
    <div className="empty-state">
      <div className="emoji">⚠️</div>
      <h2>Order Cancelled</h2>
      <p>Your payment was not processed. Your cart is still available if you&apos;d like to try again.</p>
      <div className="flex gap-3 mt-6">
        <Link href="/cart" className="btn btn-primary">Return to Cart</Link>
        <Link href="/" className="btn btn-outline">Back to Shop</Link>
      </div>
    </div>
  );
}