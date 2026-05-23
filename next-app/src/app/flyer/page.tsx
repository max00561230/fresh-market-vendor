"use client";

import { useApp } from "@/lib/context";
import { DAYS_OF_WEEK } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";

export default function FlyerPage() {
  const { data, getCustomerPageUrl } = useApp();
  const { vendor } = data;
  const storeUrl = getCustomerPageUrl();

  return (
    <div className="flyer-page">
      {/* Print Button — hidden in print */}
      <div className="no-print" style={{ padding: "16px 0", textAlign: "center" }}>
        <button className="btn btn-primary" onClick={() => window.print()}>
          🖨️ Print Flyer
        </button>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          Print this flyer and post it at your market stand so customers can scan the QR code to shop online.
        </p>
      </div>

      {/* ─── Flyer Content ─── */}
      <div className="flyer-content">
        {/* Header */}
        <div className="flyer-header">
          <div className="flyer-logo-row">
            <Image src="/jrt-logo.png" alt="JRT logo" width={52} height={52} style={{ borderRadius: 8 }} />
            <div>
              <h1 className="flyer-title">{vendor.farmName}</h1>
              <p className="flyer-tagline">{vendor.tagline}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {vendor.description && (
          <p className="flyer-description">{vendor.description}</p>
        )}

        {/* Market Schedule */}
        {vendor.marketSchedules.length > 0 && (
          <div className="flyer-section">
            <h2 className="flyer-section-title">📅 Where to Find Us</h2>
            <div className="flyer-schedule-list">
              {vendor.marketSchedules.map((ms, i) => (
                <div key={i} className="flyer-schedule-item">
                  <strong>{DAYS_OF_WEEK[ms.dayOfWeek]}</strong> — {ms.marketName}
                  <br />
                  <span className="flyer-schedule-detail">
                    {ms.address}, {ms.city} · {ms.openTime}–{ms.closeTime}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="flyer-section">
          <h2 className="flyer-section-title">📞 Contact Us</h2>
          <div className="flyer-contact">
            {vendor.phone && <span>📱 {vendor.phone}</span>}
            {vendor.email && <span> ✉️ {vendor.email}</span>}
          </div>
        </div>

        {/* QR Code */}
        <div className="flyer-qr-section">
          <h2 className="flyer-section-title">🛒 Shop Online — Scan to Order!</h2>
          <div className="flyer-qr-box">
            <QRCodeSVG
              value={storeUrl}
              size={180}
              level="H"
              bgColor="#ffffff"
              fgColor="#1a1a1a"
              includeMargin={true}
            />
          </div>
          <p className="flyer-qr-url">{storeUrl}</p>
          <p className="flyer-qr-hint">Scan with your phone camera to browse products & place orders for pickup!</p>
        </div>

        {/* Footer */}
        <div className="flyer-footer">
          <div className="flyer-footer-brand">
            <Image src="/jrt-logo.png" alt="JRT" width={20} height={20} style={{ borderRadius: 4 }} />
            <span>Powered by JRT Fresh Market Vendor</span>
          </div>
        </div>
      </div>

      {/* ─── Print Styles ─── */}
      <style jsx global>{`
        @media print {
          .no-print, .sidebar, .top-bar, .bottom-nav, .toast { display: none !important; }
          .main-content { padding: 0 !important; margin: 0 !important; }
          .flyer-page { padding: 0 !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }

        .flyer-page { max-width: 600px; margin: 0 auto; }

        .flyer-content {
          border: 3px solid var(--brand);
          border-radius: 16px;
          padding: 32px;
          background: white;
        }

        .flyer-header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 3px solid var(--gold);
        }

        .flyer-logo-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .flyer-title {
          font-size: 28px;
          font-weight: 900;
          color: var(--brand);
          line-height: 1.1;
        }

        .flyer-tagline {
          font-size: 14px;
          color: var(--gold);
          font-weight: 600;
          font-style: italic;
        }

        .flyer-description {
          text-align: center;
          font-size: 13px;
          color: #555;
          margin-bottom: 20px;
          line-height: 1.4;
        }

        .flyer-section {
          margin-bottom: 20px;
        }

        .flyer-section-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--brand);
          margin-bottom: 8px;
          border-bottom: 1px solid var(--gold);
          padding-bottom: 4px;
        }

        .flyer-schedule-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .flyer-schedule-item {
          font-size: 14px;
          color: #333;
        }

        .flyer-schedule-detail {
          font-size: 12px;
          color: #666;
        }

        .flyer-contact {
          font-size: 14px;
          color: #333;
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .flyer-qr-section {
          text-align: center;
          margin: 24px 0 16px;
          padding: 20px;
          background: linear-gradient(135deg, #fef9f0 0%, #fff5e6 100%);
          border-radius: 12px;
          border: 2px dashed var(--gold);
        }

        .flyer-qr-box {
          display: inline-block;
          padding: 12px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin: 12px 0;
        }

        .flyer-qr-url {
          font-size: 11px;
          color: #666;
          word-break: break-all;
          margin: 8px 0 4px;
        }

        .flyer-qr-hint {
          font-size: 13px;
          color: var(--brand);
          font-weight: 600;
        }

        .flyer-footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 12px;
          border-top: 1px solid #ddd;
        }

        .flyer-footer-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 10px;
          color: #999;
        }
      `}</style>
    </div>
  );
}