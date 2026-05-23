"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/context";
import { PRODUCT_CATEGORIES, PRICING_TYPES, Product } from "@/lib/types";
import Image from "next/image";

export default function CustomerPage() {
  const { data, addToCart, getCustomerPageUrl } = useApp();
  const { vendor, products } = data;
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const storeUrl = useMemo(() => getCustomerPageUrl(), [getCustomerPageUrl]);

  const filteredProducts = products.filter((p) => {
    if (!p.inStock) return false;
    if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const featured = products.filter((p) => p.isFeatured && p.inStock);

  return (
    <div className="space-y-6">
      <div className="vendor-banner">
        <div className="vendor-banner-content">
          <Image src="/jrt-logo.png" alt="JRT logo" width={48} height={48} style={{ borderRadius: 10 }} />
          <div>
            <h1 className="text-2xl font-bold text-white">{vendor.farmName}</h1>
            <p className="text-[var(--gold-light)] text-sm">{vendor.tagline}</p>
          </div>
        </div>
        <p className="text-white/80 text-sm mt-2 max-w-xl">{vendor.description}</p>
      </div>

      <div className="card">
        <div className="card-header">📍 Where to Find Us</div>
        <div className="card-body">
          <div className="grid gap-3">
            {vendor.marketSchedules.map((ms, i) => {
              const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
              return (
                <div key={i} className="flex items-start gap-3 p-2 bg-[var(--surface)] rounded-lg">
                  <span className="text-lg">📅</span>
                  <div>
                    <div className="font-semibold text-sm">{DAYS[ms.dayOfWeek]} — {ms.marketName}</div>
                    <div className="text-xs text-[var(--text-muted)]">{ms.address}, {ms.city} · {ms.openTime}–{ms.closeTime}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">📞 Contact</div>
        <div className="card-body">
          <div className="flex flex-wrap gap-4 text-sm">
            {vendor.phone && <span>📱 {vendor.phone}</span>}
            {vendor.email && <span>✉️ {vendor.email}</span>}
            {vendor.address && <span>📍 {vendor.address}, {vendor.city}, {vendor.state} {vendor.zip}</span>}
          </div>
        </div>
      </div>

      {featured.length > 0 && (
        <div>
          <h2 className="section-header"><span className="emoji">⭐</span> Featured</h2>
          <div className="product-grid">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="section-header"><span className="emoji">🥬</span> Fresh Products</h2>

        <div className="flex flex-wrap gap-2 mb-4">
          <input
            className="input flex-1 min-w-[180px]"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex flex-wrap gap-1">
            <button
              className={`btn btn-sm ${selectedCategory === "all" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setSelectedCategory("all")}
            >All</button>
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                className={`btn btn-sm ${selectedCategory === cat.value ? "btn-primary" : "btn-outline"}`}
                onClick={() => setSelectedCategory(cat.value)}
              >{cat.emoji} {cat.label}</button>
            ))}
          </div>
        </div>

        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={addToCart} />
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <p className="text-sm text-[var(--text-muted)] text-center py-8">No products found.</p>
        )}
      </div>

      <div className="card">
        <div className="card-header">🔗 Share Your Store</div>
        <div className="card-body">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[var(--text-muted)]">Share this link with customers so they can browse and order online.</p>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                value={storeUrl}
                readOnly
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  if (storeUrl) {
                    navigator.clipboard.writeText(storeUrl).then(() => alert("Store link copied! ✅"));
                  }
                }}
              >
                📋 Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  const pt = PRICING_TYPES.find((p) => p.value === product.pricingType);
  return (
    <div className="product-card">
      <div className="text-3xl mb-1">{product.emoji}</div>
      <div className="product-name">{product.name}</div>
      <div className="product-price">${product.pricePerUnit.toFixed(2)}/{pt?.unit || "ea"}</div>
      {product.description && (
        <div className="product-desc">{product.description}</div>
      )}
      <button className="btn btn-primary btn-sm w-full mt-2" onClick={() => onAdd(product)}>
        Add to Cart
      </button>
    </div>
  );
}
