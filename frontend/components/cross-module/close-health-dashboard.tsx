"use client";

import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  GitBranch,
  RefreshCw,
  Shield,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

interface Alert {
  id: string;
  type: "reconciliation" | "variance" | "close-task" | "statement";
  severity: "High" | "Medium" | "Low";
  message: string;
  route: string;
  linkedId: string | null;
}

interface Scenario {
  id: string;
  title: string;
  severity: string;
  status: string;
  owner: string;
  impactSummary: string;
  modules: {
    commandCenter: {
      closeHealth: string;
      criticalExceptions: number;
      impactedStatementLines: string[];
      alerts: Alert[];
    };
  };
  resolution: {
    status: string;
    steps: Array<{ id: number; label: string; status: string; completedAt: string | null }>;
  };
}

interface CloseHealthDashboardProps {
  scenarios: Scenario[];
}

/* ─── Alert Icon ─── */

function AlertIcon({ type }: { type: string }) {
  switch (type) {
    case "reconciliation":
      return <RefreshCw className="h-3.5 w-3.5" />;
    case "variance":
      return <TrendingUp className="h-3.5 w-3.5" />;
    case "close-task":
      return <GitBranch className="h-3.5 w-3.5" />;
    case "statement":
      return <FileText className="h-3.5 w-3.5" />;
    default:
      return <AlertTriangle className="h-3.5 w-3.5" />;
  }
}

/* ─── Component ─── */

export function CloseHealthDashboard({ scenarios }: CloseHealthDashboardProps) {
  const router = useRouter();

  if (!scenarios.length) return null;

  // Aggregate across all scenarios
  const totalExceptions = scenarios.reduce(
    (sum, s) => sum + s.modules.commandCenter.criticalExceptions,
    0
  );
  const allAlerts = scenarios.flatMap((s) => s.modules.commandCenter.alerts);
  const impactedLines = Array.from(
    new Set(scenarios.flatMap((s) => s.modules.commandCenter.impactedStatementLines))
  );
  const worstHealth = scenarios.some(
    (s) => s.modules.commandCenter.closeHealth === "At Risk"
  )
    ? "At Risk"
    : scenarios.some((s) => s.modules.commandCenter.closeHealth === "Amber")
    ? "Amber"
    : "On Track";

  // Resolution progress
  const allSteps = scenarios.flatMap((s) => s.resolution.steps);
  const completedSteps = allSteps.filter((s) => s.status === "Completed").length;
  const progressPct = allSteps.length ? Math.round((completedSteps / allSteps.length) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-slate-600" />
          <h2 className="text-xs font-semibold text-slate-800">Close Health</h2>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
            worstHealth === "At Risk"
              ? "bg-red-50 text-red-700 border border-red-200"
              : worstHealth === "Amber"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          )}
        >
          {worstHealth}
        </span>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Status</div>
          <div
            className={cn(
              "mt-1 text-lg font-bold",
              worstHealth === "At Risk" ? "text-red-600" : worstHealth === "Amber" ? "text-amber-600" : "text-emerald-600"
            )}
          >
            {worstHealth}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Exceptions</div>
          <div className={cn("mt-1 text-lg font-bold", totalExceptions > 0 ? "text-red-600" : "text-emerald-600")}>
            {totalExceptions}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Impacted Lines</div>
          <div className="mt-1 text-lg font-bold text-amber-600">
            {impactedLines.length}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Resolution</div>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-700">{progressPct}%</span>
          </div>
        </div>
      </div>

      {/* Active Scenarios */}
      {scenarios.map((scenario) => (
        <div
          key={scenario.id}
          className="rounded-lg border border-red-200 bg-red-50/50 p-3 space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                <span className="text-xs font-semibold text-red-800">{scenario.title}</span>
              </div>
              <p className="mt-1 text-[11px] text-red-700/80">{scenario.impactSummary}</p>
            </div>
            <span className="shrink-0 text-[10px] font-medium text-red-600">
              Owner: {scenario.owner}
            </span>
          </div>

          {/* Resolution Steps */}
          <div className="flex items-center gap-1 flex-wrap">
            {scenario.resolution.steps.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-1">
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold",
                    step.status === "Completed"
                      ? "bg-emerald-500 text-white"
                      : step.status === "In Progress"
                      ? "bg-amber-400 text-white"
                      : "bg-slate-200 text-slate-500"
                  )}
                >
                  {step.status === "Completed" ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    step.id
                  )}
                </span>
                {idx < scenario.resolution.steps.length - 1 && (
                  <div className={cn("h-px w-3", step.status === "Completed" ? "bg-emerald-400" : "bg-slate-200")} />
                )}
              </div>
            ))}
            <span className="ml-2 text-[10px] text-slate-500">
              {completedSteps}/{allSteps.length} steps
            </span>
          </div>
        </div>
      ))}

      {/* Alert Cards */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Action Items
        </div>
        {allAlerts.map((alert) => (
          <button
            key={alert.id}
            onClick={() => router.push(alert.route)}
            className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 text-left transition-colors hover:bg-slate-50 hover:border-slate-300"
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                alert.severity === "High"
                  ? "bg-red-100 text-red-600"
                  : "bg-amber-100 text-amber-600"
              )}
            >
              <AlertIcon type={alert.type} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-slate-800 truncate">{alert.message}</div>
              <div className="text-[10px] text-slate-400 capitalize">{alert.type.replace("-", " ")}</div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
