"use client";

import { usePathname, useRouter } from "next/navigation";
import { AppProvider, useApp } from "@/lib/context";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import PinLock from "@/components/PinLock";
import { useState, ReactNode } from "react";

const PROTECTED_PATHS = ["/admin", "/checkout", "/orders"];

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

export default function ClientShell({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <AuthGuardWrapper>{children}</AuthGuardWrapper>
    </AppProvider>
  );
}

function AuthGuardWrapper({ children }: { children: ReactNode }) {
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