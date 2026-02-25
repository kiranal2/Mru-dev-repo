"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { useMenuVisibility, MenuVisibility } from "@/lib/revenue-leakage/menuVisibilityContext";

interface RevenueLeakageShellProps {
  title?: string;
  subtitle?: string;
  statusChips?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const navItems = [
  { label: "AI Chat", path: "/workbench/revenue-leakage/ai-chat" },
  { label: "Overview", path: "/workbench/revenue-leakage/overview" },
  { label: "Cases", path: "/workbench/revenue-leakage/cases" },
  { label: "Rules", path: "/workbench/revenue-leakage/rules" },
  { label: "Insights", path: "/workbench/revenue-leakage/insights" },
  { label: "Patterns", path: "/workbench/revenue-leakage/patterns" },
  { label: "Exports", path: "/workbench/revenue-leakage/exports" },
  { label: "Admin", path: "/workbench/revenue-leakage/admin" },
];

export function RevenueLeakageShell({
  title = "Revenue Intelligence & Leakage Detection System",
  subtitle,
  statusChips,
  actions,
  children,
}: RevenueLeakageShellProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { visibility } = useMenuVisibility();

  const toggleableLabels: Record<string, keyof MenuVisibility> = {
    Insights: "insights",
    Patterns: "patterns",
    Rules: "rules",
  };

  const filteredNavItems = navItems.filter((item) => {
    const key = toggleableLabels[item.label];
    return !key || visibility[key];
  });

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b">
        {/* Row 1: Title + Status Chips + Actions */}
        <div className="px-6 pt-3 pb-1 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-bold text-slate-900">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {statusChips}
            {statusChips && actions && <div className="w-px h-6 bg-slate-200" />}
            {actions}
          </div>
        </div>
        {/* Row 2: Navigation */}
        <div className="px-6 pb-2 pt-1">
          <div className="flex items-center gap-1">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
