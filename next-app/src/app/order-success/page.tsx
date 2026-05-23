'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function OrderSuccessPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session_id');
    if (sid) setSessionId(sid);
  }, []);

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