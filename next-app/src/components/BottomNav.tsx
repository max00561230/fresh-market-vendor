"use client";

import { useApp } from "@/lib/context";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Shop", emoji: "🛒" },
  { href: "/orders", label: "Orders", emoji: "📋" },
  { href: "/admin", label: "Admin", emoji: "⚙️" },
];

export default function BottomNav() {
  const { data, cartCount } = useApp();
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      <div className="nav-items">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-link ${pathname === item.href ? "active" : ""}`}
          >
            <span className="icon">
              {item.emoji}
              {item.href === "/" && cartCount > 0 && (
                <span className="badge" style={{ position: "absolute", top: -4, right: -6, fontSize: "0.55rem", padding: "0 4px", minWidth: 16, height: 16 }}>
                  {cartCount}
                </span>
              )}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}