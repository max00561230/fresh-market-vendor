"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

  const isAdmin = data.pinUnlocked;
  const isPublicPage = PUBLIC_PATHS.some((p) =>
    p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/")
  );

  if (isPublicPage && !isAdmin) {
    return (
      <div className="app-shell">
        <header className="topbar" style={{ display: "flex" }}>
          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{data.vendor.farmName}</span>
          <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#d4a843", fontWeight: 600 }}>
            Fresh Market
          </span>
        </header>
        <main className="main-content">
          {children}
          <footer className="app-footer">
            <Image src="/jrt-logo.png" alt="JRT" className="app-footer-logo" width={28} height={28} />
            <span>Powered by <strong>Jade Rose Technology</strong></span>
          </footer>
        </main>
        <nav className="bottom-nav">
          <div className="nav-items">
            <Link href="/" className={`bottom-link ${pathname === "/" ? "active" : ""}`}>
              <span className="icon">🛒</span>
              <span>Shop</span>
            </Link>
            <Link href="/customer" className={`bottom-link ${pathname === "/customer" ? "active" : ""}`}>
              <span className="icon">🏪</span>
              <span>Store</span>
            </Link>
            <Link href="/flyer" className={`bottom-link ${pathname === "/flyer" ? "active" : ""}`}>
              <span className="icon">📄</span>
              <span>QR</span>
            </Link>
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <TopBar />
      <AuthGuard>
        <main className="main-content has-sidebar">
          {children}
          <footer className="app-footer">
            <Image src="/jrt-logo.png" alt="JRT" className="app-footer-logo" width={28} height={28} />
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
