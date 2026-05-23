"use client";

import { AppProvider } from "@/lib/context";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="app-shell">
        <Sidebar />
        <TopBar />
        <main className="main-content">{children}</main>
        <BottomNav />
      </div>
    </AppProvider>
  );
}