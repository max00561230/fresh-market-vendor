"use client";

import { useApp } from "@/lib/context";
import Image from "next/image";

export default function TopBar() {
  const { data } = useApp();

  return (
    <header className="topbar">
      <Image src="/jrt-logo.png" alt="JRT logo" width={28} height={28} style={{ borderRadius: 6 }} />
      <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>FMV</span>
      <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#d4a843", fontWeight: 600 }}>
        {data.view === "admin" ? "Admin" : "Shop"}
      </span>
    </header>
  );
}