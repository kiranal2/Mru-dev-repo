"use client";

import { useRouter, usePathname } from "next/navigation";
import { BarChart3, TrendingUp, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

const WORKBENCHES = [
  {
    id: "strategic",
    label: "Performance Intelligence",
    shortLabel: "Performance",
    route: "/workbench/custom-workbench/uberflux",
    matchPrefix: "/workbench/custom-workbench/uberflux",
    icon: BarChart3,
  },
  {
    id: "margin",
    label: "Margin Intelligence",
    shortLabel: "Margin",
    route: "/workbench/custom-workbench/form-factor",
    matchPrefix: "/workbench/custom-workbench/form-factor",
    icon: TrendingUp,
  },
  {
    id: "flux",
    label: "Flux Intelligence",
    shortLabel: "Flux",
    route: "/workbench/record-to-report/standard-flux",
    matchPrefix: "/workbench/record-to-report/standard-flux",
    icon: FileSpreadsheet,
  },
] as const;

/**
 * Tab bar for switching between the three intelligence workbenches.
 * Only renders on workbench routes. Uses theme-aware colors.
 */
export function WorkbenchSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const isWorkbenchRoute = WORKBENCHES.some((wb) => pathname?.startsWith(wb.matchPrefix));
  if (!isWorkbenchRoute) return null;

  const activeId = WORKBENCHES.find((wb) => pathname?.startsWith(wb.matchPrefix))?.id;

  return (
    <div
      className="flex items-center gap-1.5 px-4 py-2"
      style={{
        background: "var(--theme-surface)",
        borderBottom: "1px solid var(--theme-border)",
      }}
    >
      {WORKBENCHES.map((wb) => {
        const Icon = wb.icon;
        const isActive = wb.id === activeId;
        return (
          <button
            key={wb.id}
            onClick={() => { if (!isActive) router.push(wb.route); }}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
            )}
            style={
              isActive
                ? {
                    background: "var(--theme-accent, #1E40AF)",
                    color: "#ffffff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
                  }
                : {
                    background: "transparent",
                    color: "var(--theme-text-muted)",
                  }
            }
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "var(--theme-surface-alt, #f1f5f9)";
                e.currentTarget.style.color = "var(--theme-text)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--theme-text-muted)";
              }
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{wb.label}</span>
            <span className="sm:hidden">{wb.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
