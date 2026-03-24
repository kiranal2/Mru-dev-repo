"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface CrossModuleLink {
  label: string;
  route: string;
  severity: "High" | "Medium" | "Low";
}

interface CrossModuleBannerProps {
  scenarioTitle: string;
  message: string;
  severity: "High" | "Medium" | "Low";
  links: CrossModuleLink[];
  resolutionProgress?: { completed: number; total: number };
  dismissible?: boolean;
}

export function CrossModuleBanner({
  scenarioTitle,
  message,
  severity,
  links,
  resolutionProgress,
  dismissible = true,
}: CrossModuleBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const colors = {
    High: "border-red-200 bg-red-50 text-red-800",
    Medium: "border-amber-200 bg-amber-50 text-amber-800",
    Low: "border-blue-200 bg-blue-50 text-blue-800",
  };

  const iconColors = {
    High: "text-red-600",
    Medium: "text-amber-600",
    Low: "text-blue-600",
  };

  return (
    <div className={cn("mx-5 rounded-lg border p-3", colors[severity])}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <AlertTriangle className={cn("h-4 w-4 mt-0.5 shrink-0", iconColors[severity])} />
          <div className="min-w-0">
            <div className="text-xs font-semibold">{scenarioTitle}</div>
            <p className="mt-0.5 text-[11px] opacity-80">{message}</p>

            {/* Resolution progress */}
            {resolutionProgress && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 max-w-[200px] h-1.5 rounded-full bg-white/50">
                  <div
                    className="h-full rounded-full bg-current opacity-60 transition-all"
                    style={{
                      width: `${resolutionProgress.total ? (resolutionProgress.completed / resolutionProgress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-medium">
                  {resolutionProgress.completed}/{resolutionProgress.total} steps
                </span>
              </div>
            )}

            {/* Cross-module links */}
            {links.length > 0 && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {links.map((link) => (
                  <button
                    key={link.route}
                    onClick={() => router.push(link.route)}
                    className="inline-flex items-center gap-1 rounded-md bg-white/60 px-2 py-1 text-[10px] font-semibold transition-colors hover:bg-white/80"
                  >
                    {link.label}
                    <ArrowRight className="h-2.5 w-2.5" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded p-0.5 transition-colors hover:bg-white/50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
