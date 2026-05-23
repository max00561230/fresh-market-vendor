"use client";

import { usePathname, useRouter } from "next/navigation";
import { AppProvider, useApp } from "@/lib/context";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import PinLock from "@/components/PinLock";
import UpgradePrompt from "@/components/UpgradePrompt";
import { useState, ReactNode } from "react";

const PROTECTED_PATHS = ["/admin", "/checkout", "/orders", "/customers"];

// Public pages that customers see (no admin UI)
const PUBLIC_PATHS = ["/", "/customer", "/products", "/flyer", "/cart"];

function AuthGuard({ children }: { children: ReactNode }) {
  const { data } = useApp();
  const pathname = usePathname();
  const [verified, setVerified] = useState(data.pinUnlocked);

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !verified) {
    return <PinLock onSuccess={() => setVerified(true)} />;
  }

  return <>{children}</>;
}

function UpgradeModal() {
  const { upgradeVisible, upgradeResource, hideUpgrade, setTier } = useApp();

  const handleActivate = async (key: string) => {
    const clean = key.trim().toUpperCase();
    if (/^JRT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(clean)) {
      setTier("full");
      return { ok: true };
    }
    return { ok: false, message: "Invalid license key format. Expected JRT-XXXX-XXXX-XXXX" };
  };

  if (!upgradeVisible) return null;
  return <UpgradePrompt resource={upgradeResource || undefined} onClose={hideUpgrade} onActivate={handleActivate} />;
}

function LayoutShell({ children }: { children: ReactNode }) {
  const { data } = useApp();
  const pathname = usePathname();

  // Determine if this is a public customer-facing page (no admin unlocked)
  const isAdmin = data.pinUnlocked;
  const isPublicPage = PUBLIC_PATHS.some((p) =>
    p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/")
  );

  // If on a public page and NOT in admin mode, show clean customer layout
  if (isPublicPage && !isAdmin) {
    return (
      <div className="app-shell">
        {/* Minimal topbar for customer view */}
        <header className="topbar" style={{ display: "flex" }}>
          <img src="/jrt-logo.png" alt="JRT" style={{ width: 28, height: 28, borderRadius: 6 }} />
          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{data.vendor.farmName}</span>
          <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#d4a843", fontWeight: 600 }}>
            Fresh Market
          </span>
        </header>
        <main className="main-content">
          {children}
          <footer className="app-footer">
            <img src="/jrt-logo.png" alt="JRT" className="app-footer-logo" />
            <span>Powered by <strong>Jade Rose Technology</strong></span>
          </footer>
        </main>
        {/* Customer-only bottom nav: Shop, Store, QR */}
        <nav className="bottom-nav">
          <div className="nav-items">
            <a href="/" className={`bottom-link ${pathname === "/" ? "active" : ""}`}>
              <span className="icon">🛒</span>
              <span>Shop</span>
            </a>
            <a href="/customer" className={`bottom-link ${pathname === "/customer" ? "active" : ""}`}>
              <span className="icon">🏪</span>
              <span>Store</span>
            </a>
            <a href="/flyer" className={`bottom-link ${pathname === "/flyer" ? "active" : ""}`}>
              <span className="icon">📄</span>
              <span>QR</span>
            </a>
          </div>
        </nav>
      </div>
    );
  }

  // Admin mode — show full sidebar + all nav
  return (
    <div className="app-shell">
      <Sidebar />
      <TopBar />
      <AuthGuard>
        <main className="main-content">
          {children}
          <footer className="app-footer">
            <img src="/jrt-logo.png" alt="JRT" className="app-footer-logo" />
            <span>Powered by <strong>Jade Rose Technology</strong></span>
          </footer>
        </main>
      </AuthGuard>
      <BottomNav />
    </div>
  );
}

export default function ClientShell({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <LayoutShell>
        {children}
      </LayoutShell>
      <UpgradeModal />
    </AppProvider>
  );
}