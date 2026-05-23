'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="empty-state">
      <div className="emoji">🎉</div>
      <h2>Order Confirmed!</h2>
      <p>Your payment was processed successfully. We&apos;re getting your order ready!</p>
      {sessionId && (
        <p className="text-xs text-[var(--text-muted)] mt-2">
          Order reference: {sessionId.slice(-8)}
        </p>
      )}
      <div className="flex gap-3 mt-6">
        <Link href="/" className="btn btn-primary">Back to Shop</Link>
        <Link href="/products" className="btn btn-outline">Browse Products</Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="empty-state"><div className="emoji">⏳</div><p>Loading order details…</p></div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
