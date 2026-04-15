"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Users, CheckCircle2, Target, AlertTriangle,
  Clock, BarChart3, Activity, FileCheck, Sparkles, ArrowRight,
} from "lucide-react";
import { useCloseTasks } from "@/hooks/data/use-close-tasks";
import { useReconciliations } from "@/hooks/data/use-reconciliations";
import { cn } from "@/lib/utils";

interface Props {
  onToggleAI: () => void;
  aiActive?: boolean;
}

const PHASES = ["Pre-Close", "Core Close", "Post-Close", "Reporting"] as const;

export function ControllerHomeDashboard({ onToggleAI, aiActive }: Props) {
  const closeTasks = useCloseTasks({ page: 1, pageSize: 200 });
  const reconHook = useReconciliations();
  const tasks = closeTasks.data || [];
  const recons = reconHook.data || [];

  const teamKpis = useMemo(() => {
    if (!tasks.length) return null;
    const assignees = Array.from(new Set(tasks.map((t: any) => t.assignee as string).filter(Boolean)));
    const completed = tasks.filter((t: any) => t.status === "Completed").length;
    const inProgress = tasks.filter((t: any) => t.status === "In Progress").length;
    const pendingReview = tasks.filter((t: any) => t.status === "Pending Review").length;
    const notStarted = tasks.filter((t: any) => t.status === "Not Started").length;
    const blocked = tasks.filter((t: any) => t.status === "Blocked").length;
    const late = tasks.filter((t: any) => t.status === "Blocked" || (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "Completed")).length;
    const progressPct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    return { teamSize: assignees.length, total: tasks.length, progressPct, late, completed, inProgress, pendingReview, notStarted, blocked };
  }, [tasks]);

  const phaseBreakdown = useMemo(() => {
    return PHASES.map((phase) => {
      const phaseTasks = tasks.filter((t: any) => t.phase === phase);
      const completed = phaseTasks.filter((t: any) => t.status === "Completed").length;
      const pct = phaseTasks.length > 0 ? Math.round((completed / phaseTasks.length) * 100) : 0;
      return { phase, total: phaseTasks.length, completed, pct };
    });
  }, [tasks]);

  const teamPerformance = useMemo(() => {
    const assignees = Array.from(new Set(tasks.map((t: any) => t.assignee as string).filter(Boolean)));
    return assignees
      .map((name: string) => {
        const memberTasks = tasks.filter((t: any) => t.assignee === name);
        const completed = memberTasks.filter((t: any) => t.status === "Completed").length;
        const pct = memberTasks.length > 0 ? Math.round((completed / memberTasks.length) * 100) : 0;
        return { name, total: memberTasks.length, completed, pct };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5);
  }, [tasks]);

  const reconSummary = useMemo(() => {
    const open = recons.filter((r: any) => r.status !== "Completed").length;
    const matched = recons.filter((r: any) => r.status === "Matched" || r.status === "Completed").length;
    const exceptions = recons.filter((r: any) => r.status === "Exceptions").length;
    return { open, matched, exceptions, total: recons.length };
  }, [recons]);

  // Task status donut
  const statusData = teamKpis ? [
    { label: "Completed", count: teamKpis.completed, color: "#10b981" },
    { label: "In Progress", count: teamKpis.inProgress, color: "#3b82f6" },
    { label: "Review", count: teamKpis.pendingReview, color: "#f59e0b" },
    { label: "Not Started", count: teamKpis.notStarted, color: "#94a3b8" },
    { label: "Blocked", count: teamKpis.blocked, color: "#ef4444" },
  ].filter(s => s.count > 0) : [];

  // Phase progress as horizontal stacked bar
  const phaseColors = ["#818cf8", "#3b82f6", "#06b6d4", "#64748b"] as const;

  return (
    <div className="px-3 sm:px-5 py-3">
      {/* ── Row 1: Title + KPI chips ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-slate-900">Controller Dashboard</h1>
          <span className="text-[11px] text-slate-400">Close Management</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
            <span className="text-slate-500">Team</span>
            <span className="font-semibold text-slate-900">{teamKpis?.teamSize ?? 0}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
            <span className="text-slate-500">Tasks</span>
            <span className="font-semibold text-slate-900">{teamKpis?.total ?? 0}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
            <span className="text-slate-500">On Track</span>
            <span className="font-semibold text-emerald-600">{teamKpis?.progressPct ?? 0}%</span>
          </div>
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border", teamKpis && teamKpis.late > 0 ? "border-red-200" : "border-slate-200")}>
            <span className="text-slate-500">At Risk</span>
            <span className={cn("font-semibold", teamKpis && teamKpis.late > 0 ? "text-red-600" : "text-slate-900")}>{teamKpis?.late ?? 0}</span>
          </div>
          <button onClick={onToggleAI} className={cn("flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors", aiActive ? "bg-primary/10 text-primary" : "text-slate-500 hover:text-primary hover:bg-slate-100")}>
            <Sparkles className="w-3 h-3" /> AI
          </button>
        </div>
      </div>

      {/* ── Row 2: Task Status Donut + Phase Progress + Recon Summary ── */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {/* Task Status Donut */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-700">Task Status</span>
            <span className="text-[10px] text-slate-400">{teamKpis?.total ?? 0} total</span>
          </div>
          <div className="flex items-center gap-4">
            <svg width="80" height="80" viewBox="0 0 80 80">
              {(() => {
                const total = statusData.reduce((s, d) => s + d.count, 0) || 1;
                let cumAngle = -90;
                return statusData.map((d, i) => {
                  const angle = (d.count / total) * 360;
                  const startAngle = cumAngle;
                  cumAngle += angle;
                  const r = 32, cx = 40, cy = 40;
                  const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
                  const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180);
                  const x2 = cx + r * Math.cos(((startAngle + angle) * Math.PI) / 180);
                  const y2 = cy + r * Math.sin(((startAngle + angle) * Math.PI) / 180);
                  const large = angle > 180 ? 1 : 0;
                  return <path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`} fill={d.color} stroke="white" strokeWidth="1" />;
                });
              })()}
              <circle cx="40" cy="40" r="18" fill="white" />
              <text x="40" y="38" textAnchor="middle" fill="#0f172a" fontSize="16" fontWeight="700">{teamKpis?.progressPct ?? 0}%</text>
              <text x="40" y="50" textAnchor="middle" fill="#94a3b8" fontSize="8">done</text>
            </svg>
            <div className="space-y-1.5 flex-1">
              {statusData.map((d) => (
                <div key={d.label} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-600">{d.label}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phase Progress */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-700">Close Progress by Phase</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          {/* Stacked horizontal bar */}
          <div className="mb-3">
            <div className="w-full h-6 rounded-full bg-slate-100 overflow-hidden flex">
              {phaseBreakdown.map((p, i) => {
                const widthPct = teamKpis && teamKpis.total > 0 ? (p.completed / teamKpis.total) * 100 : 0;
                return widthPct > 0 ? (
                  <div key={p.phase} className="h-full" style={{ width: `${widthPct}%`, backgroundColor: phaseColors[i] }} title={`${p.phase}: ${p.completed} completed`} />
                ) : null;
              })}
            </div>
          </div>
          <div className="space-y-2">
            {phaseBreakdown.map((p, i) => (
              <div key={p.phase} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: phaseColors[i] }} />
                  <span className="text-slate-700">{p.phase}</span>
                </div>
                <span className="text-slate-500">{p.completed}/{p.total} <span className={cn("font-semibold", p.pct === 100 ? "text-emerald-600" : p.pct >= 50 ? "text-blue-600" : "text-slate-900")}>{p.pct}%</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Reconciliation Summary */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-700">Reconciliation Summary</span>
            <FileCheck className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2.5 rounded-lg bg-slate-50">
              <div className="text-lg font-bold text-slate-900">{reconSummary.open}</div>
              <div className="text-[9px] text-slate-500">Open</div>
            </div>
            <div className="text-center p-2.5 rounded-lg bg-emerald-50">
              <div className="text-lg font-bold text-emerald-700">{reconSummary.matched}</div>
              <div className="text-[9px] text-emerald-600">Matched</div>
            </div>
            <div className="text-center p-2.5 rounded-lg bg-red-50">
              <div className="text-lg font-bold text-red-700">{reconSummary.exceptions}</div>
              <div className="text-[9px] text-red-600">Exceptions</div>
            </div>
          </div>
          {/* Mini horizontal bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
            {reconSummary.total > 0 && (
              <>
                <div className="h-full bg-emerald-500" style={{ width: `${(reconSummary.matched / reconSummary.total) * 100}%` }} />
                <div className="h-full bg-red-500" style={{ width: `${(reconSummary.exceptions / reconSummary.total) * 100}%` }} />
                <div className="h-full bg-slate-300" style={{ width: `${(reconSummary.open / reconSummary.total) * 100}%` }} />
              </>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-2 text-center">{reconSummary.total} total reconciliations</div>
        </div>
      </div>

      {/* ── Row 3: Team Performance + AI Insights ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {/* Team Performance */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Team Performance</span>
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="p-4">
            {teamPerformance.length > 0 ? (
              <div className="space-y-2.5">
                {teamPerformance.map((member, idx) => (
                  <div key={member.name}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white",
                          idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-slate-400" : idx === 2 ? "bg-amber-700" : "bg-slate-300"
                        )}>
                          {idx + 1}
                        </div>
                        <span className="text-slate-700 font-medium">{member.name}</span>
                      </div>
                      <span className="text-slate-500">{member.completed}/{member.total} ({member.pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-1.5 rounded-full" style={{ width: `${member.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 py-4 text-center">Loading team data...</div>
            )}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">AI Insights</span>
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="p-4 space-y-2.5">
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50/50 border border-amber-100">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-700 leading-relaxed">
                <span className="font-semibold">2 tasks at risk</span> — "Intercompany Eliminations" and "Fixed Asset Roll-forward" are past SLA. Escalation recommended.
              </div>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-700 leading-relaxed">
                <span className="font-semibold">Pre-Close on track</span> — All journal entries posted. Bank reconciliation 100% matched.
              </div>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50/50 border border-blue-100">
              <Activity className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-700 leading-relaxed">
                <span className="font-semibold">Team velocity</span> — {teamPerformance[0]?.name || "Top performer"} leads at {teamPerformance[0]?.pct || 0}% completion. Consider reassigning blocked items.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Close Intelligence ── */}
      <div data-tour-id="dashboard-ci">
        <div className="flex items-center gap-1.5 mb-2">
          <Activity className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Close Intelligence</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { title: "Standard Flux", desc: "AI-powered variance analysis — commentary, drivers, close workflow", icon: <Activity className="w-5 h-5" />, route: "/workbench/record-to-report/standard-flux", accent: "from-emerald-600 to-teal-700" },
            { title: "Reconciliations", desc: "GL-to-subledger matching — auto-match, exceptions, certify", icon: <FileCheck className="w-5 h-5" />, route: "/workbench/record-to-report/reconciliations", accent: "from-blue-600 to-indigo-700" },
          ].map((wb) => (
            <Link key={wb.route} href={wb.route} className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 px-5 py-4 hover:shadow-md hover:border-primary/30 transition-all group">
              <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shrink-0", wb.accent)}>{wb.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900">{wb.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{wb.desc}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Quick Navigation ── */}
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick Navigation</div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { title: "Close Workbench", desc: "Task management", icon: <CheckCircle2 className="w-3.5 h-3.5" />, route: "/workbench/record-to-report/close" },
          { title: "Flux Analysis", desc: "Variance drill-downs", icon: <BarChart3 className="w-3.5 h-3.5" />, route: "/reports/analysis/flux-analysis" },
          { title: "Trial Balance", desc: "GL account listing", icon: <Target className="w-3.5 h-3.5" />, route: "/reports/financials/trial-balance" },
        ].map((nav) => (
          <Link key={nav.route} href={nav.route} className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-3 py-2.5 hover:shadow-sm hover:border-primary/20 transition-all">
            <div className="w-7 h-7 rounded-md bg-slate-50 flex items-center justify-center text-slate-400">{nav.icon}</div>
            <div>
              <div className="text-xs font-semibold text-slate-900">{nav.title}</div>
              <div className="text-[10px] text-slate-500">{nav.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
