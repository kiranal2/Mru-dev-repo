"use client";

import { useState } from "react";
import { useRevenueDashboard } from "@/hooks/data";
import { formatUSD } from "@/lib/data/utils/format-currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  BarChart3,
  ShieldCheck,
  Activity,
} from "lucide-react";

const RISK_BADGE: Record<string, string> = {
  Critical: "bg-red-700 text-white",
  High: "bg-red-600 text-white",
  Medium: "bg-amber-500 text-white",
  Low: "bg-emerald-600 text-white",
};

const STATUS_BADGE: Record<string, string> = {
  Open: "bg-blue-600 text-white",
  Investigating: "bg-amber-500 text-white",
  Confirmed: "bg-orange-600 text-white",
  Recovered: "bg-emerald-600 text-white",
  Closed: "bg-slate-500 text-white",
  "False Positive": "bg-slate-400 text-white",
};

const CATEGORY_COLORS: Record<string, string> = {
  Pricing: "bg-red-100 text-red-800 border-red-300",
  Billing: "bg-orange-100 text-orange-800 border-orange-300",
  Contract: "bg-blue-100 text-blue-800 border-blue-300",
  Discount: "bg-purple-100 text-purple-800 border-purple-300",
  Subscription: "bg-cyan-100 text-cyan-800 border-cyan-300",
  Commission: "bg-pink-100 text-pink-800 border-pink-300",
  Recognition: "bg-amber-100 text-amber-800 border-amber-300",
};

const TIER_BADGE: Record<string, string> = {
  Enterprise: "bg-indigo-100 text-indigo-800 border-indigo-300",
  "Mid-Market": "bg-blue-100 text-blue-800 border-blue-300",
  SMB: "bg-slate-100 text-slate-700 border-slate-300",
};

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-slate-200 rounded-lg animate-pulse" />
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="p-6">
      <Card className="p-6 text-center border-red-200 bg-red-50">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h2 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h2>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </Card>
    </div>
  );
}

export default function RevenueAssuranceOverviewPage() {
  const { data, loading, error } = useRevenueDashboard();

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Enterprise Revenue Assurance</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Corporate billing, pricing, and contract compliance monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Detection Active
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
            <Activity className="w-3.5 h-3.5" />
            Last scan: Today
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Card className="p-4 border-red-200 bg-red-50/40">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-red-500" />
            <p className="text-[11px] font-medium text-red-600">Total Leakage Detected</p>
          </div>
          <p className="text-lg font-bold text-red-700">{formatUSD(data.totalLeakageDetected, true)}</p>
          <p className="text-[10px] text-red-500 mt-0.5">{formatUSD(data.totalLeakageDetected)}</p>
        </Card>

        <Card className="p-4 border-emerald-200 bg-emerald-50/40">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-[11px] font-medium text-emerald-600">Total Recovered</p>
          </div>
          <p className="text-lg font-bold text-emerald-700">{formatUSD(data.totalRecovered, true)}</p>
          <p className="text-[10px] text-emerald-500 mt-0.5">{formatUSD(data.totalRecovered)}</p>
        </Card>

        <Card className="p-4 border-blue-200 bg-blue-50/40">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
            <p className="text-[11px] font-medium text-blue-600">Recovery Rate</p>
          </div>
          <p className="text-lg font-bold text-blue-700">{data.recoveryRate.toFixed(1)}%</p>
          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${Math.min(data.recoveryRate, 100)}%` }}
            />
          </div>
        </Card>

        <Card className="p-4 border-amber-200 bg-amber-50/40">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-[11px] font-medium text-amber-600">Active Cases</p>
          </div>
          <p className="text-xl font-bold text-amber-700">{data.activeCases}</p>
        </Card>

        <Card className="p-4 border-slate-200 bg-slate-50/40">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <p className="text-[11px] font-medium text-slate-500">Avg Resolution</p>
          </div>
          <p className="text-xl font-bold text-slate-700">{data.avgResolutionDays} days</p>
        </Card>

        <Card className="p-4 border-violet-200 bg-violet-50/40">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-violet-500" />
            <p className="text-[11px] font-medium text-violet-600">Categories</p>
          </div>
          <p className="text-xl font-bold text-violet-700">{data.leakageByCategory.length}</p>
          <p className="text-[10px] text-violet-500 mt-0.5">Active leakage types</p>
        </Card>
      </div>

      {/* Leakage Breakdown by Category */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Leakage by Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {data.leakageByCategory.map((item) => (
            <Card key={item.category} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${CATEGORY_COLORS[item.category] || "bg-slate-100 text-slate-700 border-slate-300"}`}
                >
                  {item.category}
                </span>
                <span className="text-xs text-slate-500">{item.caseCount} cases</span>
              </div>
              <p className="text-lg font-bold text-slate-900">{formatUSD(item.amountUsd, true)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{formatUSD(item.amountUsd)}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Leakage by Customer Tier */}
      {data.leakageByTier && data.leakageByTier.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Leakage by Customer Tier
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.leakageByTier.map((item) => (
              <Card key={item.tier} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${TIER_BADGE[item.tier] || "bg-slate-100 text-slate-700 border-slate-300"}`}
                  >
                    {item.tier}
                  </span>
                  <span className="text-xs text-slate-500">{item.caseCount} cases</span>
                </div>
                <p className="text-lg font-bold text-slate-900">{formatUSD(item.amountUsd, true)}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Highlights */}
      {data.highlights && data.highlights.length > 0 && (
        <Card className="p-4 border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Key Highlights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.highlights.map((h, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 text-sm text-slate-800 bg-white/60 rounded-md px-3 py-2"
              >
                <span className="text-blue-500 mt-0.5">{h.icon}</span>
                <span className="text-xs leading-relaxed">{h.text}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Monthly Trends */}
        <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b">
            <h3 className="text-sm font-bold text-slate-900">Monthly Trends</h3>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-300 bg-slate-700">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold">Month</th>
                  <th className="text-right py-2 px-3 font-semibold">Leakage</th>
                  <th className="text-right py-2 px-3 font-semibold">Recovered</th>
                  <th className="text-right py-2 px-3 font-semibold">Cases</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(data.monthlyTrends || []).map((trend) => (
                  <tr
                    key={trend.month}
                    className="text-slate-800 hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="py-2 px-3 font-semibold text-slate-900">{trend.month}</td>
                    <td className="py-2 px-3 text-right font-bold text-red-700">
                      {formatUSD(trend.leakageUsd, true)}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-emerald-700">
                      {formatUSD(trend.recoveredUsd, true)}
                    </td>
                    <td className="py-2 px-3 text-right font-medium">{trend.caseCount}</td>
                  </tr>
                ))}
                {!data.monthlyTrends?.length && (
                  <tr>
                    <td colSpan={4} className="py-4 px-3 text-sm text-slate-500 text-center">
                      No trend data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Customers by Leakage */}
        <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b">
            <h3 className="text-sm font-bold text-slate-900">Top Customers by Leakage</h3>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-300 bg-slate-700">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold">Customer</th>
                  <th className="text-left py-2 px-3 font-semibold">Tier</th>
                  <th className="text-right py-2 px-3 font-semibold">Leakage</th>
                  <th className="text-right py-2 px-3 font-semibold">Cases</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(data.topCustomersByLeakage || []).map((customer) => (
                  <tr
                    key={customer.customerId}
                    className="text-slate-800 hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {customer.customerName}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${TIER_BADGE[customer.tier] || "bg-slate-100 text-slate-700 border-slate-300"}`}
                      >
                        {customer.tier}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-red-700">
                      {formatUSD(customer.leakageUsd, true)}
                    </td>
                    <td className="py-2 px-3 text-right font-medium">{customer.caseCount}</td>
                  </tr>
                ))}
                {!data.topCustomersByLeakage?.length && (
                  <tr>
                    <td colSpan={4} className="py-4 px-3 text-sm text-slate-500 text-center">
                      No customer data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Case Pipeline Status */}
      {data.casePipeline && data.casePipeline.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Case Pipeline
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {data.casePipeline.map((stage) => (
              <Card key={stage.status} className="p-4 text-center">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold ${STATUS_BADGE[stage.status] || "bg-slate-500 text-white"}`}
                >
                  {stage.status}
                </span>
                <p className="text-2xl font-bold text-slate-900 mt-2">{stage.count}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
