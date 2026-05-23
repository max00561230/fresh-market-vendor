"use client";

import { useApp } from "@/lib/context";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Shop", emoji: "🛒" },
  { href: "/orders", label: "Orders", emoji: "📋" },
  { href: "/admin", label: "Admin", emoji: "⚙️" },
];

export default function Sidebar() {
  const { data, setView } = useApp();
  const pathname = usePathname();

  return (
    <aside className={`sidebar ${data.view === "admin" ? "" : ""}`}>
      <div className="sidebar-brand">
        <Image src="/jrt-logo.png" alt="JRT logo" width={36} height={36} style={{ borderRadius: 8 }} />
        <div>
          <div className="sidebar-brand-text">FMV</div>
          <div className="sidebar-brand-sub">Fresh Market Vendor</div>
        </div>
      </div>

      <div className="view-switcher">
        <button
          className={`view-btn ${data.view === "customer" ? "active" : ""}`}
          onClick={() => setView("customer")}
        >
          🛒 Shop
        </button>
        <button
          className={`view-btn ${data.view === "admin" ? "active" : ""}`}
          onClick={() => setView("admin")}
        >
          ⚙️ Admin
        </button>
      </div>

      <nav style={{ padding: "8px 14px", flex: 1 }}>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link ${pathname === link.href ? "active" : ""}`}
          >
            <span>{link.emoji}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div>{data.vendor.farmName}</div>
        <div style={{ marginTop: 4 }}>FMV v1.0</div>
      </div>
    </aside>
  );
}