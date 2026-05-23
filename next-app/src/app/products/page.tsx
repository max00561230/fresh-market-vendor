'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { PRODUCT_CATEGORIES, PricingType } from '@/lib/types';

const PRICE_LABELS: Record<PricingType, string> = {
  per_pound: '/lb',
  per_unit: '/ea',
  per_bunch: '/bunch',
  per_dozen: '/doz',
};

export default function ProductsPage() {
  const { data, addToCart } = useApp();
  const { products } = data;

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'all' || p.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="section-header">
        <span className="emoji">🛒</span>
        <h2>Product Catalog</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          className="input sm:flex-1"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select sm:w-48"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">🔍</div>
          <h3>No products found</h3>
          <p>Try adjusting your search or category filter.</p>
        </div>
      ) : (
        <div className="product-grid">
          {filtered.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-img">
                {product.emoji}
                {!product.inStock && (
                  <span className="absolute top-2 right-2 text-xs font-semibold bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                    Sold Out
                  </span>
                )}
              </div>
              <div className="product-body">
                <div className="font-semibold text-sm text-[var(--text)]">{product.name}</div>
                <div className="text-xs text-[var(--text-muted)] mb-1">{product.description}</div>
                <div className="text-base font-bold text-[var(--brand)]">
                  ${product.pricePerUnit.toFixed(2)}{PRICE_LABELS[product.pricingType]}
                </div>
                <button
                  className="btn btn-primary btn-sm w-full mt-2"
                  disabled={!product.inStock}
                  onClick={() => addToCart(product)}
                  style={product.inStock ? undefined : { opacity: 0.5, cursor: 'not-allowed' }}
                >
                  {product.inStock ? 'Add to Cart' : 'Sold Out'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}