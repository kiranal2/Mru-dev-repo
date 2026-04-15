"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, AlertTriangle, Eye, BarChart3, Activity,
  Sparkles, ArrowRight, CheckCircle2, DollarSign, Target, Clock,
  Landmark, PieChart, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFluxAnalysis, useBalanceSheet, useIncomeStatement } from "@/hooks/data/use-reports";
import { useReconciliations } from "@/hooks/data/use-reconciliations";
import { useCloseTasks } from "@/hooks/data/use-close-tasks";
import { useCollections } from "@/hooks/data/use-collections";

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

const pctChange = (curr: number, prev: number) => prev !== 0 ? Math.round(((curr - prev) / Math.abs(prev)) * 100) : 0;

export function CAOHomeDashboard({ onToggleAI, aiActive }: Props) {
  const { data: fluxData } = useFluxAnalysis();
  const { data: isData } = useIncomeStatement();
  const { data: bsData } = useBalanceSheet();
  const reconHook = useReconciliations();
  const closeTasks = useCloseTasks({ page: 1, pageSize: 200 });
  const collectionsHook = useCollections();

  const recons = reconHook.data || [];
  const tasks = closeTasks.data || [];
  const collections = collectionsHook.data || [];

  // ── Income Statement metrics ──
  const pnl = useMemo(() => {
    const find = (id: string) => isData.find((d: any) => d.id === id);
    const val = (node: any, p: string) => node?.values?.[p] ?? 0;
    const revenue = val(find("IS-001"), "q4_2024");
    const revPrior = val(find("IS-001"), "q3_2024");
    const revPY = val(find("IS-001"), "q4_2023");
    const cogs = val(find("IS-005"), "q4_2024");
    const grossProfit = val(find("IS-008"), "q4_2024");
    const gpPrior = val(find("IS-008"), "q3_2024");
    const opEx = val(find("IS-009"), "q4_2024");
    const opExPrior = val(find("IS-009"), "q3_2024");
    const opIncome = val(find("IS-014"), "q4_2024");
    const opIncomePrior = val(find("IS-014"), "q3_2024");
    const netIncome = val(find("IS-021"), "q4_2024");
    const rAndD = val(find("IS-010"), "q4_2024");
    const snm = val(find("IS-011"), "q4_2024");
    const gna = val(find("IS-012"), "q4_2024");

    const grossMarginPct = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0;
    const opMarginPct = revenue > 0 ? Math.round((opIncome / revenue) * 100) : 0;

    return {
      revenue, revPrior, revPY, cogs, grossProfit, gpPrior, opEx, opExPrior,
      opIncome, opIncomePrior, netIncome, rAndD, snm, gna,
      grossMarginPct, opMarginPct,
    };
  }, [isData]);

  // ── Balance Sheet metrics ──
  const bs = useMemo(() => {
    const find = (id: string) => bsData.find((d: any) => d.id === id);
    const val = (node: any, p: string) => node?.values?.[p] ?? 0;
    const ar = val(find("BS-005"), "q4_2024");
    const arPrior = val(find("BS-005"), "q3_2024");
    const ap = val(find("BS-017"), "q4_2024");
    const inventory = val(find("BS-006"), "q4_2024");
    const deferredRev = val(find("BS-019"), "q4_2024");
    const dso = pnl.revenue > 0 ? Math.round((ar / (pnl.revenue / 90))) : 0;
    return { ar, arPrior, ap, inventory, deferredRev, dso };
  }, [bsData, pnl]);

  // ── Flux KPIs ──
  const fluxKpis = useMemo(() => {
    if (!fluxData.length) return null;
    const totalVariance = fluxData.reduce((sum, v) => sum + (v.varianceAmount || 0), 0);
    const material = fluxData.filter((v) => v.isSignificant).length;
    const reviewed = fluxData.filter((v) => v.status === "Reviewed").length;
    const reviewedPct = fluxData.length > 0 ? Math.round((reviewed / fluxData.length) * 100) : 0;
    const positive = fluxData.filter((v) => v.varianceAmount > 0).length;
    const negative = fluxData.filter((v) => v.varianceAmount < 0).length;
    return { totalVariance, material, reviewed, reviewedPct, total: fluxData.length, positive, negative };
  }, [fluxData]);

  const topIncreases = useMemo(() => [...fluxData].filter(v => v.varianceAmount > 0).sort((a, b) => b.varianceAmount - a.varianceAmount).slice(0, 5), [fluxData]);
  const topDecreases = useMemo(() => [...fluxData].filter(v => v.varianceAmount < 0).sort((a, b) => a.varianceAmount - b.varianceAmount).slice(0, 5), [fluxData]);
  const topMovers = useMemo(() => [...fluxData].sort((a, b) => Math.abs(b.varianceAmount) - Math.abs(a.varianceAmount)).slice(0, 8), [fluxData]);

  // ── Recon KPIs ──
  const reconKpis = useMemo(() => {
    const groups: Record<string, number> = {};
    recons.forEach((r: any) => { groups[r.status] = (groups[r.status] || 0) + 1; });
    const exceptions = recons.filter((r: any) => r.status === "Exceptions").length;
    const completed = recons.filter((r: any) => r.status === "Completed" || r.status === "Matched").length;
    const matchRate = recons.length > 0 ? Math.round((completed / recons.length) * 100) : 0;
    return { groups, exceptions, matchRate, total: recons.length };
  }, [recons]);

  // ── Close KPIs ──
  const closeKpis = useMemo(() => {
    if (!tasks.length) return null;
    const completed = tasks.filter((t: any) => t.status === "Completed").length;
    const blocked = tasks.filter((t: any) => t.status === "Blocked").length;
    const progressPct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    return { progressPct, blocked, total: tasks.length };
  }, [tasks]);

  // ── Collections ──
  const arHealth = useMemo(() => {
    const pastDue = collections.reduce((s: number, c: any) => s + (c.pastDueAmount || 0), 0);
    const critical = collections.filter((c: any) => c.severity === "Critical" || c.severity === "High").length;
    return { pastDue, critical };
  }, [collections]);

  // ── OpEx breakdown for chart ──
  const opExBreakdown = [
    { label: "R&D", value: pnl.rAndD, color: "#3b82f6" },
    { label: "S&M", value: pnl.snm, color: "#8b5cf6" },
    { label: "G&A", value: pnl.gna, color: "#f59e0b" },
  ];
  const opExTotal = opExBreakdown.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <div className="px-4 sm:px-6 py-4 space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-slate-900">CAO Dashboard</h1>
          <span className="text-xs text-slate-400">Q4 2024 · Variance Review</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded-md bg-white border border-slate-200">
            <span className="text-slate-500">Net Variance </span><span className="font-bold text-slate-900">{fluxKpis ? fmt(fluxKpis.totalVariance) : "—"}</span>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-white border border-slate-200">
            <span className="text-slate-500">Material </span><span className="font-bold text-amber-600">{fluxKpis?.material ?? 0}</span>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-white border border-slate-200">
            <span className="text-slate-500">Reviewed </span><span className="font-bold text-emerald-600">{fluxKpis?.reviewedPct ?? 0}%</span>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-white border border-slate-200">
            <span className="text-slate-500">Close </span><span className="font-bold text-primary">{closeKpis?.progressPct ?? 0}%</span>
          </div>
          <button onClick={onToggleAI} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors", aiActive ? "bg-primary/10 text-primary" : "text-slate-500 hover:text-primary hover:bg-slate-100")}>
            <Sparkles className="w-3.5 h-3.5" /> AI
          </button>
        </div>
      </div>

      {/* ── Row 1: P&L Performance (6 cards) ── */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">P&L Performance — Q4 2024</h3>
        <div className="grid grid-cols-6 gap-4">
          {[
            { label: "Revenue", value: fmt(pnl.revenue), change: pctChange(pnl.revenue, pnl.revPrior), sub: `vs PY: ${fmt(pnl.revPY)}`, link: "/reports/sec/income-statement" },
            { label: "Gross Profit", value: fmt(pnl.grossProfit), change: pctChange(pnl.grossProfit, pnl.gpPrior), sub: `Margin: ${pnl.grossMarginPct}%`, link: "/reports/analysis/flux-analysis" },
            { label: "Operating Exp", value: fmt(pnl.opEx), change: pctChange(pnl.opEx, pnl.opExPrior), sub: `${Math.round((pnl.opEx / (pnl.revenue || 1)) * 100)}% of revenue`, link: "/reports/sec/income-statement" },
            { label: "Operating Income", value: fmt(pnl.opIncome), change: pctChange(pnl.opIncome, pnl.opIncomePrior), sub: `Margin: ${pnl.opMarginPct}%`, link: "/reports/analysis/flux-analysis" },
            { label: "Net Income", value: fmt(pnl.netIncome), change: pctChange(pnl.netIncome, pnl.opIncomePrior), sub: `${Math.round((pnl.netIncome / (pnl.revenue || 1)) * 100)}% margin`, link: "/reports/sec/income-statement" },
            { label: "DSO", value: `${bs.dso} days`, change: bs.dso < 40 ? 5 : bs.dso > 45 ? -3 : 0, sub: `AR: ${fmt(bs.ar)}`, link: "/workbench/order-to-cash/collections" },
          ].map((m) => (
            <Link key={m.label} href={m.link} className="group rounded-lg border border-slate-100 p-3 hover:border-primary/20 hover:shadow-sm transition-all">
              <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">{m.label}</div>
              <div className="text-lg font-bold text-slate-900">{m.value}</div>
              {m.change !== 0 && (
                <div className={cn("flex items-center gap-0.5 text-[10px] font-medium mt-0.5", m.label === "Operating Exp" ? (m.change > 0 ? "text-red-600" : "text-emerald-600") : (m.change > 0 ? "text-emerald-600" : "text-red-600"))}>
                  {(m.label === "Operating Exp" ? m.change < 0 : m.change > 0) ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {m.change > 0 ? "+" : ""}{m.change}% QoQ
                </div>
              )}
              <div className="text-[10px] text-slate-400 mt-0.5">{m.sub}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Row 2: Variance Waterfall (full width) ── */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Variance Analysis — Top Movers</h3>
            <p className="text-xs text-slate-400 mt-0.5">Sorted by absolute dollar impact · {fluxKpis?.positive ?? 0} favorable, {fluxKpis?.negative ?? 0} unfavorable</p>
          </div>
          <Link href="/reports/analysis/flux-analysis" className="text-xs text-primary font-medium flex items-center gap-1">Full Analysis <ArrowRight className="w-3 h-3" /></Link>
        </div>
        <svg width="100%" height="160" viewBox="0 0 560 160">
          <line x1="25" y1="75" x2="555" y2="75" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4,4" />
          {topMovers.map((v, i) => {
            const maxAbs = Math.max(...topMovers.map(d => Math.abs(d.varianceAmount)), 1);
            const barH = (Math.abs(v.varianceAmount) / maxAbs) * 60;
            const isPos = v.varianceAmount >= 0;
            const x = i * 66 + 30;
            return (
              <g key={i}>
                <rect x={x} y={isPos ? 75 - barH : 75} width="50" height={barH} rx="4" fill={isPos ? "#10b981" : "#ef4444"} opacity="0.85" />
                <text x={x + 25} y={isPos ? 70 - barH : 90 + barH} textAnchor="middle" fill={isPos ? "#059669" : "#dc2626"} fontSize="9" fontWeight="600">
                  {v.varianceAmount >= 0 ? "+" : ""}{(v.varianceAmount / 1e6).toFixed(0)}M
                </text>
                <text x={x + 25} y="155" textAnchor="middle" fill="#64748b" fontSize="8">
                  {v.accountName.length > 10 ? v.accountName.substring(0, 10) + "…" : v.accountName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Row 3: Review Progress + OpEx Breakdown + Recon Status ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Review Progress */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Review Progress</h3>
            <Eye className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-center gap-5">
            <svg width="90" height="90" viewBox="0 0 100 100" className="shrink-0">
              {(() => {
                const reviewed = fluxKpis?.reviewed ?? 0;
                const total = fluxKpis?.total || 1;
                const angle = (reviewed / total) * 360;
                const r = 40, cx = 50, cy = 50;
                const x1 = cx + r * Math.cos((-90 * Math.PI) / 180);
                const y1 = cy + r * Math.sin((-90 * Math.PI) / 180);
                const end = -90 + angle;
                const x2 = cx + r * Math.cos((end * Math.PI) / 180);
                const y2 = cy + r * Math.sin((end * Math.PI) / 180);
                return (
                  <>
                    <circle cx={cx} cy={cy} r={r} fill="#f1f5f9" />
                    {reviewed > 0 && <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`} fill="#10b981" />}
                    <circle cx={cx} cy={cy} r="22" fill="white" />
                    <text x={cx} y="48" textAnchor="middle" fill="#0f172a" fontSize="18" fontWeight="700">{fluxKpis?.reviewedPct ?? 0}%</text>
                    <text x={cx} y="60" textAnchor="middle" fill="#94a3b8" fontSize="9">reviewed</text>
                  </>
                );
              })()}
            </svg>
            <div className="space-y-2 flex-1">
              <div className="flex justify-between text-xs"><span className="text-slate-600">Reviewed</span><span className="font-bold text-emerald-600">{fluxKpis?.reviewed ?? 0}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-600">Pending</span><span className="font-bold text-slate-500">{(fluxKpis?.total ?? 0) - (fluxKpis?.reviewed ?? 0)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-600">Material</span><span className="font-bold text-amber-600">{fluxKpis?.material ?? 0}</span></div>
              <div className="flex justify-between text-xs"><span className="text-emerald-600">Favorable</span><span className="font-bold text-emerald-600">{fluxKpis?.positive ?? 0}</span></div>
              <div className="flex justify-between text-xs"><span className="text-red-600">Unfavorable</span><span className="font-bold text-red-600">{fluxKpis?.negative ?? 0}</span></div>
            </div>
          </div>
        </div>

        {/* OpEx Breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">OpEx Breakdown</h3>
            <Link href="/reports/sec/income-statement" className="text-xs text-primary font-medium flex items-center gap-1">P&L <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {/* Stacked horizontal bar */}
          <div className="w-full h-8 rounded-lg overflow-hidden flex mb-4">
            {opExBreakdown.map((d) => (
              <div key={d.label} className="h-full flex items-center justify-center text-[9px] text-white font-bold" style={{ width: `${(d.value / opExTotal) * 100}%`, backgroundColor: d.color }}>
                {Math.round((d.value / opExTotal) * 100)}%
              </div>
            ))}
          </div>
          <div className="space-y-2.5">
            {opExBreakdown.map((d) => (
              <div key={d.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-700">{d.label}</span>
                  </div>
                  <span className="font-bold text-slate-900">{fmt(d.value)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${(d.value / opExTotal) * 100}%`, backgroundColor: d.color }} />
                </div>
              </div>
            ))}
            <div className="pt-1 border-t border-slate-100 flex justify-between text-xs">
              <span className="text-slate-600 font-medium">Total OpEx</span>
              <span className="font-bold text-slate-900">{fmt(pnl.opEx)}</span>
            </div>
          </div>
        </div>

        {/* Reconciliation + Working Capital */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Working Capital & Recon</h3>
            <Link href="/workbench/record-to-report/reconciliations" className="text-xs text-primary font-medium flex items-center gap-1">Recon <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2.5 rounded-lg bg-slate-50 text-center">
              <div className="text-sm font-bold text-slate-900">{fmt(bs.ar)}</div>
              <div className="text-[10px] text-slate-500">AR</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 text-center">
              <div className="text-sm font-bold text-slate-900">{fmt(bs.ap)}</div>
              <div className="text-[10px] text-slate-500">AP</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 text-center">
              <div className="text-sm font-bold text-slate-900">{fmt(bs.inventory)}</div>
              <div className="text-[10px] text-slate-500">Inventory</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 text-center">
              <div className="text-sm font-bold text-slate-900">{fmt(bs.deferredRev)}</div>
              <div className="text-[10px] text-slate-500">Deferred Rev</div>
            </div>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-xs"><span className="text-slate-600">DSO</span><span className={cn("font-bold", bs.dso > 45 ? "text-amber-600" : "text-emerald-600")}>{bs.dso} days</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-600">Recon Match Rate</span><span className={cn("font-bold", reconKpis.matchRate >= 80 ? "text-emerald-600" : "text-red-600")}>{reconKpis.matchRate}%</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-600">Exceptions</span><span className={cn("font-bold", reconKpis.exceptions > 0 ? "text-red-600" : "text-emerald-600")}>{reconKpis.exceptions}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-600">Past Due AR</span><span className={cn("font-bold", arHealth.pastDue > 0 ? "text-red-600" : "text-emerald-600")}>{fmt(arHealth.pastDue)}</span></div>
          </div>
        </div>
      </div>

      {/* ── Row 4: Top Increases + Top Decreases ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-slate-800">Top Favorable Variances</span>
          </div>
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">
              <th className="px-5 py-2.5 text-xs font-medium text-slate-500 text-left">Account</th>
              <th className="px-5 py-2.5 text-xs font-medium text-slate-500 text-right">Amount</th>
              <th className="px-5 py-2.5 text-xs font-medium text-slate-500 text-right">%</th>
              <th className="px-5 py-2.5 text-xs font-medium text-slate-500 text-right">Status</th>
            </tr></thead>
            <tbody>
              {topIncreases.map((v, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="px-5 py-2.5 text-xs text-slate-700">{v.accountName}</td>
                  <td className="px-5 py-2.5 text-xs font-bold text-emerald-600 text-right">{fmt(v.varianceAmount)}</td>
                  <td className="px-5 py-2.5 text-xs text-emerald-600 text-right">+{v.variancePercent}%</td>
                  <td className="px-5 py-2.5 text-right">
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", v.status === "Reviewed" ? "bg-emerald-50 text-emerald-700" : v.status === "InReview" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600")}>{v.status || "Pending"}</span>
                  </td>
                </tr>
              ))}
              {topIncreases.length === 0 && <tr><td colSpan={4} className="px-5 py-6 text-center text-xs text-slate-400">No favorable variances</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg border border-slate-200">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-slate-800">Top Unfavorable Variances</span>
          </div>
          <table className="w-full">
            <thead><tr className="border-b border-slate-100">
              <th className="px-5 py-2.5 text-xs font-medium text-slate-500 text-left">Account</th>
              <th className="px-5 py-2.5 text-xs font-medium text-slate-500 text-right">Amount</th>
              <th className="px-5 py-2.5 text-xs font-medium text-slate-500 text-right">%</th>
              <th className="px-5 py-2.5 text-xs font-medium text-slate-500 text-right">Status</th>
            </tr></thead>
            <tbody>
              {topDecreases.map((v, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="px-5 py-2.5 text-xs text-slate-700">{v.accountName}</td>
                  <td className="px-5 py-2.5 text-xs font-bold text-red-600 text-right">{fmt(v.varianceAmount)}</td>
                  <td className="px-5 py-2.5 text-xs text-red-600 text-right">{v.variancePercent}%</td>
                  <td className="px-5 py-2.5 text-right">
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", v.status === "Reviewed" ? "bg-emerald-50 text-emerald-700" : v.status === "InReview" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600")}>{v.status || "Pending"}</span>
                  </td>
                </tr>
              ))}
              {topDecreases.length === 0 && <tr><td colSpan={4} className="px-5 py-6 text-center text-xs text-slate-400">No unfavorable variances</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Row 5: AI Insights ── */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">AI Insights & Alerts</h3>
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">Revenue Growth</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">Revenue up {pctChange(pnl.revenue, pnl.revPrior)}% QoQ to {fmt(pnl.revenue)}. Gross margin stable at {pnl.grossMarginPct}%. Product revenue driving growth.</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-800">OpEx Pressure</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">OpEx grew {pctChange(pnl.opEx, pnl.opExPrior)}% to {fmt(pnl.opEx)} ({Math.round((pnl.opEx / (pnl.revenue || 1)) * 100)}% of revenue). R&D largest at {fmt(pnl.rAndD)}. Review S&M efficiency.</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">Working Capital</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">DSO at {bs.dso} days. AR grew {pctChange(bs.ar, bs.arPrior)}% to {fmt(bs.ar)}. {arHealth.critical} critical collection accounts. {reconKpis.exceptions} recon exceptions outstanding.</p>
          </div>
        </div>
      </div>

      {/* ── Close Intelligence ── */}
      <div data-tour-id="dashboard-ci">
        <div className="flex items-center gap-1.5 mb-2">
          <Activity className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Close Intelligence</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { title: "Standard Flux", desc: "AI-powered variance analysis — commentary, drivers, close workflow", icon: <Activity className="w-5 h-5" />, route: "/workbench/record-to-report/standard-flux", accent: "from-emerald-600 to-teal-700" },
            { title: "Close Workbench", desc: "Period-end close orchestration — tasks, dependencies, SLA tracking", icon: <CheckCircle2 className="w-5 h-5" />, route: "/workbench/record-to-report/close", accent: "from-blue-600 to-indigo-700" },
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

        {/* ── Decision Intelligence ── */}
        <div data-tour-id="dashboard-di" className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Decision Intelligence</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { title: "FluxPlus", desc: "Performance intelligence", icon: <BarChart3 className="w-4 h-4" />, route: "/workbench/custom-workbench/uberflux" },
            { title: "Flux Analysis", desc: "Variance drill-downs", icon: <TrendingUp className="w-4 h-4" />, route: "/reports/analysis/flux-analysis" },
            { title: "One-Click Variance", desc: "AI auto-identifies", icon: <Search className="w-4 h-4" />, route: "/reports/analysis/one-click-variance" },
            { title: "Income Statement", desc: "Full P&L detail", icon: <DollarSign className="w-4 h-4" />, route: "/reports/sec/income-statement" },
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
  );
}
