"use client";

import { MenuVisibilityProvider } from "@/lib/revenue-leakage/menuVisibilityContext";

export default function RevenueLeakageLayout({ children }: { children: React.ReactNode }) {
  return <MenuVisibilityProvider>{children}</MenuVisibilityProvider>;
}
