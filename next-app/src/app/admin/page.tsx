'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { PRODUCT_CATEGORIES, PRICING_TYPES, PricingType, Product, DAYS_OF_WEEK } from '@/lib/types';

type AdminSection = 'profile' | 'products' | 'customers' | 'data';

export default function AdminPage() {
  const { data, updateVendor, addProduct, updateProduct, deleteProduct, updateData, changePin, addCustomer, removeCustomer, getCustomerPageUrl, setToast } = useApp();
  const { vendor, products, customers } = data;
  const [section, setSection] = useState<AdminSection>('profile');

  // ─── PIN Change State ───
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handleChangePin = () => {
    if (newPin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    changePin(newPin);
    setNewPin('');
    setConfirmPin('');
    setPinError('');
  };

  // ─── Add Customer State ───
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custError, setCustError] = useState('');

  const handleAddCustomer = () => {
    if (!custName || !custEmail) {
      setCustError('Name and email are required');
      return;
    }
    if (customers.find(c => c.email === custEmail)) {
      setCustError('Customer with this email already exists');
      return;
    }
    addCustomer({
      id: `cust${Date.now()}`,
      name: custName,
      email: custEmail,
      phone: custPhone || undefined,
      joinedAt: new Date().toISOString(),
    });
    setCustName('');
    setCustEmail('');
    setCustPhone('');
    setCustError('');
  };

  // ─── Vendor Profile Form State ───
  const [farmName, setFarmName] = useState(vendor.farmName);
  const [tagline, setTagline] = useState(vendor.tagline);
  const [description, setDescription] = useState(vendor.description);
  const [phone, setPhone] = useState(vendor.phone);
  const [email, setEmail] = useState(vendor.email);
  const [address, setAddress] = useState(vendor.address);
  const [city, setCity] = useState(vendor.city);
  const [state, setState] = useState(vendor.state);
  const [zip, setZip] = useState(vendor.zip);

  // ─── Market Schedule State ───
  const [schedules, setSchedules] = useState(vendor.marketSchedules);

  const handleSaveProfile = () => {
    updateVendor({
      farmName, tagline, description, phone, email, address, city, state, zip,
      marketSchedules: schedules,
    });
  };

  // ─── Product Form State ───
  const emptyProduct: Product = {
    id: '', name: '', category: 'produce', description: '', pricingType: 'per_unit',
    pricePerUnit: 0, unitLabel: 'ea', emoji: '📦', inStock: true, isFeatured: false,
  };

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);

  const openNewProduct = () => {
    setEditingProduct({ ...emptyProduct, id: `p${Date.now()}` });
    setShowProductForm(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct({ ...product });
    setShowProductForm(true);
  };

  const handleSaveProduct = () => {
    if (!editingProduct) return;
    // Update unitLabel based on pricingType
    const pt = PRICING_TYPES.find((p) => p.value === editingProduct.pricingType);
    const updated = { ...editingProduct, unitLabel: pt?.unit || 'ea' };

    const existing = products.find((p) => p.id === updated.id);
    if (existing) {
      updateProduct(updated);
    } else {
      addProduct(updated);
    }
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Delete this product?')) {
      deleteProduct(id);
    }
  };

  // ─── Data Management ───
  const handleResetData = () => {
    if (confirm('Reset all data to demo defaults? This cannot be undone.')) {
      localStorage.removeItem('fmv-app-state');
      window.location.reload();
    }
  };

  const handleExportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fmv-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="section-header">
        <span className="emoji">⚙️</span>
        <h2>Admin Dashboard</h2>
      </div>

      {/* Section Tabs */}
      <div className="tabs">
        <button className={`tab ${section === 'profile' ? 'active' : ''}`} onClick={() => setSection('profile')}>👤 Profile</button>
        <button className={`tab ${section === 'products' ? 'active' : ''}`} onClick={() => setSection('products')}>🥬 Products</button>
        <button className={`tab ${section === 'customers' ? 'active' : ''}`} onClick={() => setSection('customers')}>👥 Customers</button>
        <button className={`tab ${section === 'data' ? 'active' : ''}`} onClick={() => setSection('data')}>💾 Data</button>
      </div>

      {/* ─── Profile Section ─── */}
      {section === 'profile' && (
        <div className="space-y-4">
          <div className="card">
            <div className="card-header">Farm Details</div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">Farm Name</label>
                <input className="input" value={farmName} onChange={(e) => setFarmName(e.target.value)} />
              </div>
              <div>
                <label className="label">Tagline</label>
                <input className="input" value={tagline} onChange={(e) => setTagline(e.target.value)} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">Address</div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">Street Address</label>
                <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">City</label>
                  <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <label className="label">State</label>
                  <input className="input" value={state} onChange={(e) => setState(e.target.value)} />
                </div>
                <div>
                  <label className="label">ZIP</label>
                  <input className="input" value={zip} onChange={(e) => setZip(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <span>📅 Market Schedules</span>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setSchedules([...schedules, { dayOfWeek: 0, marketName: '', address: '', city: '', openTime: '08:00', closeTime: '13:00' }])}
              >+ Add</button>
            </div>
            <div className="card-body space-y-3">
              {schedules.map((ms, i) => (
                <div key={i} className="border border-[var(--border)] rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Day</label>
                      <select
                        className="select"
                        value={ms.dayOfWeek}
                        onChange={(e) => {
                          const updated = [...schedules];
                          updated[i] = { ...updated[i], dayOfWeek: parseInt(e.target.value) };
                          setSchedules(updated);
                        }}
                      >
                        {DAYS_OF_WEEK.map((day, idx) => (
                          <option key={idx} value={idx}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Market Name</label>
                      <input
                        className="input"
                        value={ms.marketName}
                        onChange={(e) => {
                          const updated = [...schedules];
                          updated[i] = { ...updated[i], marketName: e.target.value };
                          setSchedules(updated);
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Address</label>
                      <input
                        className="input"
                        value={ms.address}
                        onChange={(e) => {
                          const updated = [...schedules];
                          updated[i] = { ...updated[i], address: e.target.value };
                          setSchedules(updated);
                        }}
                      />
                    </div>
                    <div>
                      <label className="label">City</label>
                      <input
                        className="input"
                        value={ms.city}
                        onChange={(e) => {
                          const updated = [...schedules];
                          updated[i] = { ...updated[i], city: e.target.value };
                          setSchedules(updated);
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Open Time</label>
                      <input
                        className="input"
                        type="time"
                        value={ms.openTime}
                        onChange={(e) => {
                          const updated = [...schedules];
                          updated[i] = { ...updated[i], openTime: e.target.value };
                          setSchedules(updated);
                        }}
                      />
                    </div>
                    <div>
                      <label className="label">Close Time</label>
                      <input
                        className="input"
                        type="time"
                        value={ms.closeTime}
                        onChange={(e) => {
                          const updated = [...schedules];
                          updated[i] = { ...updated[i], closeTime: e.target.value };
                          setSchedules(updated);
                        }}
                      />
                    </div>
                  </div>
                  <button
                    className="text-sm text-[var(--danger)] font-semibold"
                    onClick={() => setSchedules(schedules.filter((_, idx) => idx !== i))}
                  >Remove Schedule</button>
                </div>
              ))}
              {schedules.length === 0 && (
                <div className="text-sm text-[var(--text-muted)] text-center py-2">No market schedules added.</div>
              )}
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSaveProfile}>Save Profile</button>
        </div>
      )}

      {/* ─── Products Section ─── */}
      {section === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-muted)]">{products.length} products</span>
            <button className="btn btn-primary btn-sm" onClick={openNewProduct}>+ Add Product</button>
          </div>

          {/* Product List */}
          <div className="space-y-2">
            {products.map((product) => (
              <div key={product.id} className="card flex items-center gap-3 p-3">
                <span className="text-2xl">{product.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{product.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {PRODUCT_CATEGORIES.find((c) => c.value === product.category)?.label} · ${product.pricePerUnit.toFixed(2)}/{product.unitLabel}
                    {!product.inStock && ' · Sold Out'}
                    {product.isFeatured && ' · ⭐ Featured'}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => openEditProduct(product)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProduct(product.id)}>Delete</button>
              </div>
            ))}
          </div>

          {/* Product Form Modal */}
          {showProductForm && editingProduct && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowProductForm(false)}>
              <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="card-header">{editingProduct.name ? 'Edit' : 'New'} Product</div>
                <div className="card-body space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Name</label>
                      <input
                        className="input"
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Emoji</label>
                      <input
                        className="input"
                        value={editingProduct.emoji}
                        onChange={(e) => setEditingProduct({ ...editingProduct, emoji: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select
                      className="select"
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    >
                      {PRODUCT_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <input
                      className="input"
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Pricing Type</label>
                      <select
                        className="select"
                        value={editingProduct.pricingType}
                        onChange={(e) => setEditingProduct({ ...editingProduct, pricingType: e.target.value as PricingType })}
                      >
                        {PRICING_TYPES.map((pt) => (
                          <option key={pt.value} value={pt.value}>{pt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Price</label>
                      <input
                        className="input"
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingProduct.pricePerUnit || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, pricePerUnit: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.inStock}
                        onChange={(e) => setEditingProduct({ ...editingProduct, inStock: e.target.checked })}
                      />
                      In Stock
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.isFeatured}
                        onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                      />
                      Featured
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-ghost flex-1" onClick={() => setShowProductForm(false)}>Cancel</button>
                    <button className="btn btn-primary flex-1" onClick={handleSaveProduct}>Save Product</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Customers Section ─── */}
      {section === 'customers' && (
        <div className="space-y-4">
          <div className="card">
            <div className="card-header">Add Customer</div>
            <div className="card-body space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Name</label>
                  <input className="input" placeholder="Jane Doe" value={custName} onChange={(e) => { setCustName(e.target.value); setCustError(''); }} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" placeholder="jane@email.com" value={custEmail} onChange={(e) => { setCustEmail(e.target.value); setCustError(''); }} />
                </div>
                <div>
                  <label className="label">Phone (opt)</label>
                  <input className="input" placeholder="555-1234" value={custPhone} onChange={(e) => { setCustPhone(e.target.value); setCustError(''); }} />
                </div>
              </div>
              {custError && <p className="text-red-500 text-xs">{custError}</p>}
              <button className="btn btn-primary btn-sm" onClick={handleAddCustomer}>+ Add Customer</button>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <span>Customer List ({customers.length})</span>
              {customers.length > 0 && (
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    const list = customers.map(c => `${c.name} <${c.email}>`).join(', ');
                    navigator.clipboard.writeText(list);
                    setToast('Email list copied! 📋');
                  }}
                >
                  📋 Copy All Emails
                </button>
              )}
            </div>
            <div className="card-body">
              {customers.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">
                  No customers yet. Customers are auto-added when they place orders with an email, or you can add them manually above.
                </p>
              ) : (
                <div className="space-y-2">
                  {customers.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-2 border border-[var(--border)] rounded-lg">
                      <span className="text-lg">👤</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{c.name}</div>
                        <div className="text-xs text-[var(--text-muted)]">{c.email}{c.phone ? ` · ${c.phone}` : ''}</div>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Remove this customer?')) removeCustomer(c.id); }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">📧 Email Announcement</div>
            <div className="card-body space-y-3">
              <p className="text-xs text-[var(--text-muted)]">
                Compose an email to announce specials and your current market location. This opens your email client with all customer addresses.
              </p>
              <div>
                <label className="label">Subject</label>
                <input className="input" id="email-subject" placeholder="🔥 This week at Green Valley Farm!" />
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const subject = (document.getElementById('email-subject') as HTMLInputElement)?.value || 'Fresh Market Specials!';
                  const body = `Hi there!\n\nCheck out our fresh products and specials this week.\n\n📍 Find us at: ${vendor.marketSchedules.map(s => `${DAYS_OF_WEEK[s.dayOfWeek]} — ${s.marketName}, ${s.address}, ${s.city} (${s.openTime}–${s.closeTime})`).join('\n')}\n\nShop online: ${getCustomerPageUrl()}\n\n— ${vendor.farmName}`;
                  const to = customers.map(c => c.email).join(',');
                  window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                }}
              >
                ✉️ Open Email Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Data Section ─── */}
      {section === 'data' && (
        <div className="space-y-4">
          <div className="card">
            <div className="card-header">🔒 Change PIN</div>
            <div className="card-body space-y-3">
              <p className="text-xs text-[var(--text-muted)]">Current default PIN: <strong>1234</strong></p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">New PIN</label>
                  <input className="input" type="password" maxLength={6} value={newPin} onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, '')); setPinError(''); }} placeholder="New PIN" />
                </div>
                <div>
                  <label className="label">Confirm PIN</label>
                  <input className="input" type="password" maxLength={6} value={confirmPin} onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, '')); setPinError(''); }} placeholder="Confirm" />
                </div>
              </div>
              {pinError && <p className="text-red-500 text-xs">{pinError}</p>}
              <button className="btn btn-primary btn-sm" onClick={handleChangePin}>Change PIN</button>
            </div>
          </div>

          <div className="card">
            <div className="card-body space-y-4">
              <div>
                <h3 className="font-semibold text-sm mb-1">Reset to Demo Data</h3>
                <p className="text-xs text-[var(--text-muted)] mb-2">
                  Clear all changes and restore the original demo data. This cannot be undone.
                </p>
                <button className="btn btn-danger" onClick={handleResetData}>Reset Data</button>
              </div>
              <hr className="border-[var(--border)]" />
              <div>
                <h3 className="font-semibold text-sm mb-1">Export Data</h3>
                <p className="text-xs text-[var(--text-muted)] mb-2">
                  Download all vendor data, products, and orders as JSON.
                </p>
                <button className="btn btn-outline" onClick={handleExportData}>Export JSON</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}