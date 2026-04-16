"use client";

import { useRouter, usePathname } from "next/navigation";
import { BarChart3, TrendingUp, FileSpreadsheet, Sparkles } from "lucide-react";
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

export function WorkbenchSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const isWorkbenchRoute = WORKBENCHES.some((wb) => pathname?.startsWith(wb.matchPrefix));
  if (!isWorkbenchRoute) return null;

  const activeId = WORKBENCHES.find((wb) => pathname?.startsWith(wb.matchPrefix))?.id;

  const handleAiToggle = () => {
    window.dispatchEvent(new CustomEvent("meeru-toggle-ai"));
  };

  return (
    <div
      className="flex items-center justify-between px-0 shrink-0"
      style={{
        background: "var(--theme-surface, #ffffff)",
        borderBottom: "1px solid var(--theme-border, #e2e8f0)",
      }}
    >
      {/* Left: tab navigation */}
      <div className="flex items-center">
        {WORKBENCHES.map((wb) => {
          const Icon = wb.icon;
          const isActive = wb.id === activeId;
          return (
            <button
              key={wb.id}
              onClick={() => { if (!isActive) router.push(wb.route); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors relative"
              style={{
                color: isActive ? "var(--theme-accent, #1E40AF)" : "var(--theme-text-muted, #94a3b8)",
                background: "transparent",
                borderBottom: isActive ? "2px solid var(--theme-accent, #1E40AF)" : "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--theme-text, #0f172a)";
                  e.currentTarget.style.background = "var(--theme-surface-alt, #f1f5f9)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--theme-text-muted, #94a3b8)";
                  e.currentTarget.style.background = "transparent";
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

      {/* Right: AI toggle */}
      <button
        onClick={handleAiToggle}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 mr-3 rounded-md text-[11px] font-medium transition-all duration-150"
        style={{
          color: "var(--theme-accent, #1E40AF)",
          background: "hsl(var(--primary) / 0.06)",
          border: "1px solid hsl(var(--primary) / 0.15)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "hsl(var(--primary) / 0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "hsl(var(--primary) / 0.06)";
        }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">AI Assistant</span>
      </button>
    </div>
  );
}
