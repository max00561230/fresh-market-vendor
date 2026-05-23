"use client";

import { useApp } from "@/lib/context";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Shop", emoji: "🛒" },
  { href: "/customer", label: "Store", emoji: "🏪" },
  { href: "/flyer", label: "QR", emoji: "📄" },
  { href: "/orders", label: "Orders", emoji: "📋", protected: true },
  { href: "/checkout", label: "POS", emoji: "💰", protected: true },
  { href: "/admin", label: "Admin", emoji: "⚙️", protected: true },
];

export default function BottomNav() {
  const { data, cartCount } = useApp();
  const pathname = usePathname();
  const isAdmin = data.pinUnlocked;

  return (
    <nav className="bottom-nav">
      <div className="nav-items">
        {NAV_ITEMS.map((item) => {
          if (item.protected && !isAdmin) return null;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`bottom-link ${pathname === item.href ? "active" : ""}`}
            >
              <span className="icon" style={{ position: "relative" }}>
                {item.emoji}
                {item.href === "/" && cartCount > 0 && (
                  <span className="badge" style={{ position: "absolute", top: -4, right: -6, fontSize: "0.55rem", padding: "0 4px", minWidth: 16, height: 16 }}>
                    {cartCount}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}