"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";
import { Customer, DAYS_OF_WEEK } from "@/lib/types";
import Link from "next/link";

export default function CustomersPage() {
  const { data, addCustomer, removeCustomer, getCustomerPageUrl, setToast } = useApp();
  const { vendor, customers } = data;

  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custError, setCustError] = useState("");
  const [emailSubject, setEmailSubject] = useState("");

  const handleAdd = () => {
    if (!custName || !custEmail) {
      setCustError("Name and email are required");
      return;
    }
    if (customers.find((c) => c.email === custEmail)) {
      setCustError("Customer with this email already exists");
      return;
    }
    addCustomer({
      id: `cust${Date.now()}`,
      name: custName,
      email: custEmail,
      phone: custPhone || undefined,
      joinedAt: new Date().toISOString(),
    });
    setCustName("");
    setCustEmail("");
    setCustPhone("");
    setCustError("");
  };

  const handleEmailAll = () => {
    if (customers.length === 0) return;
    const body = `Hi there!\n\nCheck out our fresh products and specials this week.\n\n📍 Find us at:\n${vendor.marketSchedules.map((s) => `${DAYS_OF_WEEK[s.dayOfWeek]} — ${s.marketName}, ${s.address}, ${s.city} (${s.openTime}–${s.closeTime})`).join("\n")}\n\nShop online: ${getCustomerPageUrl()}\n\n— ${vendor.farmName}`;
    const to = customers.map((c) => c.email).join(",");
    window.open(
      `mailto:${to}?subject=${encodeURIComponent(emailSubject || "Fresh Market Specials!")}&body=${encodeURIComponent(body)}`,
      "_blank"
    );
  };

  const handleCopyEmails = () => {
    const list = customers.map((c) => c.email).join(", ");
    navigator.clipboard.writeText(list);
    setToast("Emails copied! 📋");
  };

  return (
    <div className="space-y-6">
      <div className="section-header">
        <span className="emoji">👥</span>
        <h2>Customers</h2>
      </div>

      {/* Add Customer */}
      <div className="card">
        <div className="card-header">Add Customer</div>
        <div className="card-body space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Name</label>
              <input className="input" placeholder="Jane Doe" value={custName} onChange={(e) => { setCustName(e.target.value); setCustError(""); }} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="jane@email.com" value={custEmail} onChange={(e) => { setCustEmail(e.target.value); setCustError(""); }} />
            </div>
            <div>
              <label className="label">Phone (opt)</label>
              <input className="input" placeholder="555-1234" value={custPhone} onChange={(e) => { setCustPhone(e.target.value); setCustError(""); }} />
            </div>
          </div>
          {custError && <p className="text-red-500 text-xs">{custError}</p>}
          <button className="btn btn-primary btn-sm" onClick={handleAdd}>+ Add Customer</button>
        </div>
      </div>

      {/* Customer List */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <span>Customer List ({customers.length})</span>
          {customers.length > 0 && (
            <button className="btn btn-sm btn-outline" onClick={handleCopyEmails}>📋 Copy All Emails</button>
          )}
        </div>
        <div className="card-body">
          {customers.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-4">
              No customers yet. Customers are auto-added when they place orders with an email, or add them manually above.
            </p>
          ) : (
            <div className="space-y-2">
              {customers.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2 border border-[var(--border)] rounded-lg">
                  <span className="text-lg">👤</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{c.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{c.email}{c.phone ? ` · ${c.phone}` : ""}</div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => { if (confirm("Remove this customer?")) removeCustomer(c.id); }}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Email Announcement */}
      <div className="card">
        <div className="card-header">📧 Email Announcement</div>
        <div className="card-body space-y-3">
          <p className="text-xs text-[var(--text-muted)]">
            Send an email to all customers announcing specials and your current market location. Opens your default email client.
          </p>
          <div>
            <label className="label">Subject</label>
            <input className="input" placeholder="🔥 This week at the market!" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
          </div>
          {vendor.marketSchedules.length > 0 && (
            <div className="text-xs text-[var(--text-muted)] bg-[var(--surface)] p-3 rounded-lg">
              <strong>Your locations will be included:</strong>
              {vendor.marketSchedules.map((s, i) => (
                <div key={i}>{DAYS_OF_WEEK[s.dayOfWeek]} — {s.marketName}, {s.address}, {s.city} ({s.openTime}–{s.closeTime})</div>
              ))}
            </div>
          )}
          <button className="btn btn-primary btn-sm" onClick={handleEmailAll} disabled={customers.length === 0}>
            ✉️ Open Email Client {customers.length > 0 && `(${customers.length} recipients)`}
          </button>
        </div>
      </div>

      {/* QR Flyer Link */}
      <div className="card">
        <div className="card-body text-center">
          <p className="text-sm mb-3">Want a printable flyer with a QR code to your store?</p>
          <Link href="/flyer" className="btn btn-outline">🖨️ Generate QR Flyer</Link>
        </div>
      </div>
    </div>
  );
}