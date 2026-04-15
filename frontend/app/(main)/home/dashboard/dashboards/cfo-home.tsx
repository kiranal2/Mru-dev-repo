"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Target, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown,
  BarChart3, Activity, Sparkles, BookOpen, ArrowRight, DollarSign,
  Landmark, CreditCard, PieChart, Users, Clock,
} from "lucide-react";
import { useCloseTasks } from "@/hooks/data/use-close-tasks";
import { useFluxAnalysis, useBalanceSheet, useIncomeStatement } from "@/hooks/data/use-reports";
import { useReconciliations } from "@/hooks/data/use-reconciliations";
import { useCollections } from "@/hooks/data/use-collections";
import { cn } from "@/lib/utils";

interface Props {
  onToggleAI: () => void;
  aiActive?: boolean;
}

const fmt = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

const pct = (a: number, b: number) => b !== 0 ? Math.round(((a - b) / Math.abs(b)) * 100) : 0;

export function CFOHomeDashboard({ onToggleAI, aiActive }: Props) {
  const closeTasks = useCloseTasks({ page: 1, pageSize: 200 });
  const { data: fluxData } = useFluxAnalysis();
  const { data: bsData } = useBalanceSheet();
  const { data: isData } = useIncomeStatement();
  const reconHook = useReconciliations();
  const collectionsHook = useCollections();

  const tasks = closeTasks.data || [];
  const recons = reconHook.data || [];
  const collections = collectionsHook.data || [];

  // ── Derive financials from real data ──
  const financials = useMemo(() => {
    const find = (data: any[], id: string) => data.find((d: any) => d.id === id);
    const val = (node: any, period: string) => node?.values?.[period] ?? 0;

    const revenue = val(find(isData, "IS-001"), "q4_2024");
    const revenuePrior = val(find(isData, "IS-001"), "q3_2024");
    const cogs = val(find(isData, "IS-005"), "q4_2024");
    const grossProfit = val(find(isData, "IS-008"), "q4_2024");
    const opIncome = val(find(isData, "IS-014"), "q4_2024");
    const opIncomePrior = val(find(isData, "IS-014"), "q3_2024");
    const netIncome = val(find(isData, "IS-021"), "q4_2024");
    const netIncomePrior = val(find(isData, "IS-021"), "q3_2024");

    const cash = val(find(bsData, "BS-003"), "q4_2024");
    const cashPrior = val(find(bsData, "BS-003"), "q3_2024");
    const ar = val(find(bsData, "BS-005"), "q4_2024");
    const ap = val(find(bsData, "BS-017"), "q4_2024");
    const totalAssets = val(find(bsData, "BS-001"), "q4_2024");
    const totalLiab = val(find(bsData, "BS-015"), "q4_2024");
    const equity = val(find(bsData, "BS-027"), "q4_2024");
    const shortTermInv = val(find(bsData, "BS-004"), "q4_2024");
    const currentLiab = val(find(bsData, "BS-016"), "q4_2024");
    const currentAssets = val(find(bsData, "BS-002"), "q4_2024");
    const longTermDebt = val(find(bsData, "BS-023"), "q4_2024");

    const grossMarginPct = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0;
    const opMarginPct = revenue > 0 ? Math.round((opIncome / revenue) * 100) : 0;
    const netMarginPct = revenue > 0 ? Math.round((netIncome / revenue) * 100) : 0;
    const currentRatio = currentLiab > 0 ? (currentAssets / currentLiab).toFixed(1) : "—";
    const dso = revenue > 0 ? Math.round((ar / (revenue / 90))) : 0;
    const dpo = cogs > 0 ? Math.round((ap / (cogs / 90))) : 0;
    const totalLiquidity = cash + shortTermInv;

    return {
      revenue, revenuePrior, grossProfit, grossMarginPct, opIncome, opIncomePrior, opMarginPct,
      netIncome, netIncomePrior, netMarginPct, cash, cashPrior, ar, ap, totalAssets, totalLiab,
      equity, totalLiquidity, currentRatio, dso, dpo, longTermDebt,
    };
  }, [isData, bsData]);

  // ── Close KPIs ──
  const closeKpis = useMemo(() => {
    if (!tasks.length) return null;
    const completed = tasks.filter((t: any) => t.status === "Completed").length;
    const inProgress = tasks.filter((t: any) => t.status === "In Progress").length;
    const blocked = tasks.filter((t: any) => t.status === "Blocked").length;
    const progressPct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    return { progressPct, completed, inProgress, blocked, total: tasks.length };
  }, [tasks]);

  // ── Collections KPIs ──
  const arHealth = useMemo(() => {
    const totalOutstanding = collections.reduce((s: number, c: any) => s + (c.totalOutstanding || 0), 0);
    const pastDue = collections.reduce((s: number, c: any) => s + (c.pastDueAmount || 0), 0);
    const critical = collections.filter((c: any) => c.severity === "Critical" || c.severity === "High").length;
    return { totalOutstanding, pastDue, critical, count: collections.length };
  }, [collections]);

  // ── Recon KPIs ──
  const reconKpis = useMemo(() => {
    const exceptions = recons.filter((r: any) => r.status === "Exceptions").length;
    const completed = recons.filter((r: any) => r.status === "Completed" || r.status === "Matched").length;
    const matchRate = recons.length > 0 ? Math.round((completed / recons.length) * 100) : 0;
    return { exceptions, completed, matchRate, total: recons.length };
  }, [recons]);

  const topVariances = useMemo(() => {
    return [...fluxData].sort((a, b) => Math.abs(b.varianceAmount) - Math.abs(a.varianceAmount)).slice(0, 6);
  }, [fluxData]);

  // ── Revenue trend (3 quarters) ──
  const revTrend = useMemo(() => {
    const find = (id: string) => isData.find((d: any) => d.id === id);
    const node = find("IS-001");
    if (!node) return [];
    return [
      { period: "Q4 '23", value: node.values["q4_2023"] || 0 },
      { period: "Q3 '24", value: node.values["q3_2024"] || 0 },
      { period: "Q4 '24", value: node.values["q4_2024"] || 0 },
    ];
  }, [isData]);

  const projectedClose = new Date();
  projectedClose.setDate(projectedClose.getDate() + 5);

  const criticalAreas = [
    { name: "Revenue Recognition", progress: 85, risk: "Low" as const },
    { name: "AP Close", progress: 45, risk: "Medium" as const },
    { name: "Bank Reconciliation", progress: 100, risk: "Low" as const },
    { name: "Fixed Assets", progress: 30, risk: "High" as const },
  ];

  return (
    <div className="px-4 sm:px-6 py-4 space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-slate-900">CFO Dashboard</h1>
          <span className="text-xs text-slate-400">Q4 2024 · March 2026 Close</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded-md bg-white border border-slate-200">
            <span className="text-slate-500">Revenue </span><span className="font-bold text-slate-900">{fmt(financials.revenue)}</span>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-white border border-slate-200">
            <span className="text-slate-500">Cash </span><span className="font-bold text-emerald-600">{fmt(financials.cash)}</span>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-white border border-slate-200">
            <span className="text-slate-500">Close </span><span className="font-bold text-primary">{closeKpis?.progressPct ?? 0}%</span>
          </div>
          <div className={cn("px-2.5 py-1 rounded-md bg-white border", closeKpis && closeKpis.blocked > 0 ? "border-red-200" : "border-slate-200")}>
            <span className="text-slate-500">Blocked </span><span className={cn("font-bold", closeKpis && closeKpis.blocked > 0 ? "text-red-600" : "text-slate-900")}>{closeKpis?.blocked ?? 0}</span>
          </div>
          <button onClick={onToggleAI} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors", aiActive ? "bg-primary/10 text-primary" : "text-slate-500 hover:text-primary hover:bg-slate-100")}>
            <Sparkles className="w-3.5 h-3.5" /> AI
          </button>
        </div>
      </div>

      {/* ── Row 1: Financial Snapshot (full width, 6 metric cards) ── */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Financial Snapshot</h3>
        <div className="grid grid-cols-6 gap-4">
          {[
            { label: "Revenue", value: fmt(financials.revenue), change: pct(financials.revenue, financials.revenuePrior), icon: <DollarSign className="w-4 h-4" />, color: "text-emerald-600", link: "/reports/sec/income-statement" },
            { label: "Gross Margin", value: `${financials.grossMarginPct}%`, change: 2, icon: <TrendingUp className="w-4 h-4" />, color: "text-emerald-600", link: "/reports/analysis/flux-analysis" },
            { label: "Operating Income", value: fmt(financials.opIncome), change: pct(financials.opIncome, financials.opIncomePrior), icon: <BarChart3 className="w-4 h-4" />, color: "text-emerald-600", link: "/reports/sec/income-statement" },
            { label: "Net Income", value: fmt(financials.netIncome), change: pct(financials.netIncome, financials.netIncomePrior), icon: <Target className="w-4 h-4" />, color: "text-emerald-600", link: "/reports/sec/income-statement" },
            { label: "Cash & Liquidity", value: fmt(financials.totalLiquidity), change: pct(financials.cash, financials.cashPrior), icon: <Landmark className="w-4 h-4" />, color: "text-blue-600", link: "/reports/sec/balance-sheet" },
            { label: "Total Debt", value: fmt(financials.longTermDebt), change: 0, icon: <CreditCard className="w-4 h-4" />, color: "text-slate-600", link: "/reports/sec/balance-sheet" },
          ].map((m) => (
            <Link key={m.label} href={m.link} className="group rounded-lg border border-slate-100 p-3 hover:border-primary/20 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{m.label}</span>
                <div className="text-slate-300 group-hover:text-primary/50 transition-colors">{m.icon}</div>
              </div>
              <div className="text-lg font-bold text-slate-900">{m.value}</div>
              {m.change !== 0 && (
                <div className={cn("flex items-center gap-0.5 mt-1 text-[10px] font-medium", m.change > 0 ? "text-emerald-600" : "text-red-600")}>
                  {m.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {m.change > 0 ? "+" : ""}{m.change}% vs prior
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Row 2: Cash & Working Capital + AR/Collections Health ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Cash & Working Capital */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Cash & Working Capital</h3>
            <Link href="/reports/sec/balance-sheet" className="text-xs text-primary font-medium flex items-center gap-1">Balance Sheet <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {/* Horizontal stacked bar: Cash vs AR vs AP */}
          <div className="mb-4">
            <div className="flex items-center gap-1 mb-1.5">
              <span className="text-[10px] text-slate-400 w-12">Assets</span>
              <div className="flex-1 h-6 rounded-md overflow-hidden flex bg-slate-100">
                <div className="h-full bg-emerald-500 flex items-center justify-center text-[8px] text-white font-bold" style={{ width: `${(financials.cash / financials.totalLiquidity * 100)}%` }}>Cash</div>
                <div className="h-full bg-blue-400 flex items-center justify-center text-[8px] text-white font-bold" style={{ width: `${((financials.totalLiquidity - financials.cash) / financials.totalLiquidity * 100)}%` }}>Invest</div>
              </div>
              <span className="text-xs font-bold text-slate-900 w-16 text-right">{fmt(financials.totalLiquidity)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 w-12">AR</span>
              <div className="flex-1 h-6 rounded-md overflow-hidden bg-slate-100">
                <div className="h-full bg-amber-400 flex items-center justify-center text-[8px] text-white font-bold" style={{ width: `${Math.min((financials.ar / financials.totalLiquidity) * 100, 100)}%` }}>Receivable</div>
              </div>
              <span className="text-xs font-bold text-slate-900 w-16 text-right">{fmt(financials.ar)}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 rounded-lg bg-slate-50">
              <div className="text-sm font-bold text-slate-900">{financials.dso}d</div>
              <div className="text-[10px] text-slate-500">DSO</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-50">
              <div className="text-sm font-bold text-slate-900">{financials.dpo}d</div>
              <div className="text-[10px] text-slate-500">DPO</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-50">
              <div className="text-sm font-bold text-slate-900">{financials.currentRatio}x</div>
              <div className="text-[10px] text-slate-500">Current Ratio</div>
            </div>
          </div>
        </div>

        {/* AR & Collections Health */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Collections & AR Health</h3>
            <Link href="/workbench/order-to-cash/collections" className="text-xs text-primary font-medium flex items-center gap-1">Collections <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-slate-50">
              <div className="text-[10px] text-slate-500 mb-1">Outstanding</div>
              <div className="text-lg font-bold text-slate-900">{fmt(arHealth.totalOutstanding)}</div>
            </div>
            <div className="p-3 rounded-lg bg-red-50">
              <div className="text-[10px] text-red-600 mb-1">Past Due</div>
              <div className="text-lg font-bold text-red-700">{fmt(arHealth.pastDue)}</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Accounts in collection</span>
              <span className="font-bold">{arHealth.count}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Critical / High severity</span>
              <span className={cn("font-bold", arHealth.critical > 0 ? "text-red-600" : "text-emerald-600")}>{arHealth.critical}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Reconciliation match rate</span>
              <span className={cn("font-bold", reconKpis.matchRate >= 80 ? "text-emerald-600" : "text-amber-600")}>{reconKpis.matchRate}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Recon exceptions</span>
              <span className={cn("font-bold", reconKpis.exceptions > 0 ? "text-red-600" : "text-emerald-600")}>{reconKpis.exceptions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Close Progress + Critical Areas ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Close Progress Donut + Velocity */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Close Progress</h3>
            <Link href="/workbench/record-to-report/close" className="text-xs text-primary font-medium flex items-center gap-1">Close Workbench <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="flex items-center gap-6">
            <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
              {(() => {
                const data = [
                  { count: closeKpis?.completed ?? 0, color: "#10b981" },
                  { count: closeKpis?.inProgress ?? 0, color: "#3b82f6" },
                  { count: (closeKpis?.total ?? 0) - (closeKpis?.completed ?? 0) - (closeKpis?.inProgress ?? 0) - (closeKpis?.blocked ?? 0), color: "#e2e8f0" },
                  { count: closeKpis?.blocked ?? 0, color: "#ef4444" },
                ].filter(d => d.count > 0);
                const total = data.reduce((s, d) => s + d.count, 0) || 1;
                let cum = -90;
                return data.map((d, i) => {
                  const angle = (d.count / total) * 360;
                  const start = cum; cum += angle;
                  const r = 56, cx = 70, cy = 70;
                  const x1 = cx + r * Math.cos((start * Math.PI) / 180);
                  const y1 = cy + r * Math.sin((start * Math.PI) / 180);
                  const x2 = cx + r * Math.cos(((start + angle) * Math.PI) / 180);
                  const y2 = cy + r * Math.sin(((start + angle) * Math.PI) / 180);
                  return <path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`} fill={d.color} stroke="white" strokeWidth="2" />;
                });
              })()}
              <circle cx="70" cy="70" r="30" fill="white" />
              <text x="70" y="66" textAnchor="middle" fill="#0f172a" fontSize="22" fontWeight="700">{closeKpis?.progressPct ?? 0}%</text>
              <text x="70" y="80" textAnchor="middle" fill="#94a3b8" fontSize="10">done</text>
            </svg>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs"><span className="text-slate-600">Completed</span><span className="font-bold text-emerald-600">{closeKpis?.completed ?? 0}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-600">In Progress</span><span className="font-bold text-blue-600">{closeKpis?.inProgress ?? 0}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-600">Blocked</span><span className="font-bold text-red-600">{closeKpis?.blocked ?? 0}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-600">Total</span><span className="font-bold text-slate-900">{closeKpis?.total ?? 0}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-600">Est. Close</span><span className="font-bold text-primary">{projectedClose.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div>
            </div>
          </div>
        </div>

        {/* Critical Areas */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Critical Area Status</h3>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-4">
            {criticalAreas.map((area) => (
              <div key={area.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-700">{area.name}</span>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", area.risk === "Low" ? "bg-emerald-50 text-emerald-700" : area.risk === "Medium" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>{area.risk}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className={cn("h-2.5 rounded-full", area.progress === 100 ? "bg-emerald-500" : area.progress >= 50 ? "bg-blue-500" : "bg-amber-500")} style={{ width: `${area.progress}%` }} />
                </div>
                <div className="text-right text-[10px] font-bold text-slate-500 mt-0.5">{area.progress}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 4: Top Variances + AI Narratives ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Top Variances</h3>
            <Link href="/reports/analysis/flux-analysis" className="text-xs text-primary font-medium flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {topVariances.length > 0 ? (
            <svg width="100%" height="140" viewBox="0 0 320 140">
              <line x1="15" y1="65" x2="315" y2="65" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4,4" />
              {(() => {
                const maxAbs = Math.max(...topVariances.map(v => Math.abs(v.varianceAmount)), 1);
                return topVariances.map((v, i) => {
                  const barH = (Math.abs(v.varianceAmount) / maxAbs) * 50;
                  const isPos = v.varianceAmount >= 0;
                  const x = i * 50 + 20;
                  return (
                    <g key={i}>
                      <rect x={x} y={isPos ? 65 - barH : 65} width="38" height={barH} rx="3" fill={isPos ? "#10b981" : "#ef4444"} opacity="0.85" />
                      <text x={x + 19} y={isPos ? 61 - barH : 79 + barH} textAnchor="middle" fill={isPos ? "#059669" : "#dc2626"} fontSize="8" fontWeight="600">
                        {v.varianceAmount >= 0 ? "+" : ""}{(v.varianceAmount / 1e6).toFixed(0)}M
                      </text>
                      <text x={x + 19} y="136" textAnchor="middle" fill="#64748b" fontSize="7">
                        {v.accountName.length > 8 ? v.accountName.substring(0, 8) + "…" : v.accountName}
                      </text>
                    </g>
                  );
                });
              })()}
            </svg>
          ) : (
            <div className="text-xs text-slate-400 py-8 text-center">Loading...</div>
          )}
        </div>

        {/* AI Narratives */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">AI Narratives</h3>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold">Revenue up {pct(financials.revenue, financials.revenuePrior)}% QoQ</span> — driven by Product Revenue growth. Gross margin stable at {financials.grossMarginPct}%.
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50/60 border border-amber-100">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold">AP Close at risk</span> — 3 vendor reconciliations pending. DSO at {financials.dso} days, {arHealth.critical} critical collection accounts.
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50/60 border border-blue-100">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold">Cash position strong</span> — {fmt(financials.totalLiquidity)} total liquidity. Current ratio {financials.currentRatio}x. Net income grew {pct(financials.netIncome, financials.netIncomePrior)}% to {fmt(financials.netIncome)}.
              </div>
            </div>
          </div>
          <Link href="/home/narratives" className="flex items-center gap-1 mt-3 text-xs text-primary font-medium">View all narratives <ArrowRight className="w-3 h-3" /></Link>
        </div>
      </div>

      {/* ── Decision Intelligence ── */}
      <div data-tour-id="dashboard-di">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Decision Intelligence</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { title: "FluxPlus", desc: "Regional performance intelligence — revenue, margins, exceptions", icon: <BarChart3 className="w-5 h-5" />, route: "/workbench/custom-workbench/uberflux", accent: "from-blue-600 to-indigo-700" },
            { title: "Form Factor", desc: "Margin bridge analysis — price, volume, mix decomposition", icon: <PieChart className="w-5 h-5" />, route: "/workbench/custom-workbench/form-factor", accent: "from-amber-600 to-orange-700" },
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

        {/* ── Close Intelligence ── */}
        <div data-tour-id="dashboard-ci">
          <div className="flex items-center gap-1.5 mb-2">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Close Intelligence</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { title: "Standard Flux", desc: "AI-powered variance", icon: <TrendingUp className="w-4 h-4" />, route: "/workbench/record-to-report/standard-flux" },
              { title: "Close Workbench", desc: "Period-end tasks", icon: <CheckCircle2 className="w-4 h-4" />, route: "/workbench/record-to-report/close" },
              { title: "Reconciliations", desc: "GL matching", icon: <DollarSign className="w-4 h-4" />, route: "/workbench/record-to-report/reconciliations" },
            ].map((nav) => (
              <Link key={nav.route} href={nav.route} className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-4 py-3 hover:shadow-sm hover:border-primary/20 transition-all">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">{nav.icon}</div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">{nav.title}</div>
                  <div className="text-[10px] text-slate-500">{nav.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
