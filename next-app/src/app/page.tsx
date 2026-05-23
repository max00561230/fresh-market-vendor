'use client';

import { useApp } from '@/lib/context';
import { DAYS_OF_WEEK } from '@/lib/types';
import Link from 'next/link';

export default function HomePage() {
  const { data } = useApp();
  const { vendor, products } = data;
  const featured = products.filter((p) => p.isFeatured && p.inStock);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="hero-gradient">
        <h1>{vendor.farmName}</h1>
        <p>{vendor.tagline}</p>
      </div>

      {/* Market Schedule */}
      {vendor.marketSchedules.length > 0 && (
        <div className="card">
          <div className="card-header">📅 Market Schedule</div>
          <div className="card-body space-y-2">
            {vendor.marketSchedules.map((ms, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold">{DAYS_OF_WEEK[ms.dayOfWeek]}</span>
                  {' · '}
                  <span className="text-[var(--text-muted)]">
                    {ms.marketName} — {ms.address}, {ms.city}
                  </span>
                </div>
                <span className="font-mono text-xs font-semibold text-[var(--brand)]">
                  {ms.openTime}–{ms.closeTime}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Products */}
      <div>
        <div className="section-header">
          <span className="emoji">⭐</span>
          <h2>Featured Products</h2>
        </div>
        {featured.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">🧺</div>
            <h3>No featured products yet</h3>
            <p>Check back soon for fresh picks!</p>
          </div>
        ) : (
          <div className="product-grid">
            {featured.map((product) => (
              <Link key={product.id} href="/products" className="product-card no-underline">
                <div className="product-img">{product.emoji}</div>
                <div className="product-body">
                  <div className="font-semibold text-sm text-[var(--text)]">{product.name}</div>
                  <div className="text-xs text-[var(--text-muted)] mb-2">{product.description}</div>
                  <div className="text-base font-bold text-[var(--brand)]">
                    ${product.pricePerUnit.toFixed(2)}/{product.unitLabel}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="text-center mt-6">
        <Link href="/products" className="btn btn-primary">
          Browse All Products →
        </Link>
      </div>
    </div>
  );
}