"use client";

import { useApp } from "@/lib/context";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Shop", emoji: "🛒" },
  { href: "/customer", label: "My Store", emoji: "🏪" },
  { href: "/flyer", label: "QR / Flyer", emoji: "📄" },
  { href: "/manage-customers", label: "Customer List", emoji: "👥" },
  { href: "/orders", label: "Orders", emoji: "📋", protected: true },
  { href: "/checkout", label: "Checkout", emoji: "💰", protected: true },
  { href: "/admin", label: "Admin", emoji: "⚙️", protected: true },
];

export default function Sidebar() {
  const { data, lockAdmin, isFree, showUpgrade } = useApp();
  const pathname = usePathname();
  const isAdmin = data.pinUnlocked;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Image src="/jrt-logo.png" alt="JRT logo" width={36} height={36} style={{ borderRadius: 8 }} />
        <div>
          <div className="sidebar-brand-text">FMV</div>
          <div className="sidebar-brand-sub">Fresh Market Vendor</div>
        </div>
      </div>

      {/* Plan Tier Badge */}
      {isFree ? (
        <button
          className="w-full mt-2 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
          style={{ background: 'rgba(180, 83, 9, 0.15)', color: '#d97706', border: '1px solid rgba(180, 83, 9, 0.3)' }}
          onClick={() => showUpgrade('general')}
        >
          👑 Free Demo - Upgrade
        </button>
      ) : (
        <div className="mt-2 px-3 py-2 rounded-lg text-xs font-semibold text-center" style={{ background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', border: '1px solid rgba(22, 163, 74, 0.2)' }}>
          ✅ FMV Custom Build
        </div>
      )}

      <nav style={{ padding: "8px 14px", flex: 1 }}>
        {NAV_LINKS.map((link) => {
          // Hide protected links when locked
          if (link.protected && !isAdmin) return null;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${pathname === link.href ? "active" : ""}`}
            >
              <span>{link.emoji}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <button
            className="nav-link"
            style={{ marginTop: 12, width: "100%", background: "rgba(255,255,255,.06)" }}
            onClick={lockAdmin}
          >
            <span>🔒</span>
            <span>Lock Admin</span>
          </button>
        )}
      </nav>

      <div className="sidebar-footer">
        <div>{data.vendor.farmName}</div>
        <div style={{ marginTop: 4 }}>FMV v1.0</div>
      </div>
    </aside>
  );
}
