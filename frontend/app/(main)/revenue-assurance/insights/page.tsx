"use client";

import { useState } from "react";
import { useRevenueDashboard } from "@/hooks/data";
import { formatUSD } from "@/lib/data/utils/format-currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Lightbulb,
  DollarSign,
  Users,
  Eye,
  Zap,
  Target,
  Shield,
} from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  Pricing: "bg-red-100 text-red-800 border-red-300",
  Billing: "bg-orange-100 text-orange-800 border-orange-300",
  Contract: "bg-blue-100 text-blue-800 border-blue-300",
  Discount: "bg-purple-100 text-purple-800 border-purple-300",
  Subscription: "bg-cyan-100 text-cyan-800 border-cyan-300",
  Commission: "bg-pink-100 text-pink-800 border-pink-300",
  Recognition: "bg-amber-100 text-amber-800 border-amber-300",
};

const PATTERN_STYLES: Record<
  string,
  { border: string; bg: string; icon: string; badge: string }
> = {
  pricing_drift: {
    border: "border-red-200",
    bg: "bg-red-50/60",
    icon: "text-red-600 bg-red-100",
    badge: "bg-red-100 text-red-700 border-red-200",
  },
  billing_anomaly: {
    border: "border-orange-200",
    bg: "bg-orange-50/60",
    icon: "text-orange-600 bg-orange-100",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
  },
  contract_deviation: {
    border: "border-blue-200",
    bg: "bg-blue-50/60",
    icon: "text-blue-600 bg-blue-100",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  discount_abuse: {
    border: "border-purple-200",
    bg: "bg-purple-50/60",
    icon: "text-purple-600 bg-purple-100",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
  },
  revenue_recognition: {
    border: "border-amber-200",
    bg: "bg-amber-50/60",
    icon: "text-amber-600 bg-amber-100",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
  },
};

const PATTERN_ICONS: Record<string, typeof TrendingUp> = {
  pricing_drift: TrendingUp,
  billing_anomaly: AlertTriangle,
  contract_deviation: Activity,
  discount_abuse: DollarSign,
  revenue_recognition: BarChart3,
};

const defaultStyle = {
  border: "border-slate-200",
  bg: "bg-slate-50/60",
  icon: "text-slate-600 bg-slate-100",
  badge: "bg-slate-100 text-slate-700 border-slate-200",
};

// Enterprise-specific patterns (seeded for display)
const ENTERPRISE_PATTERNS = [
  {
    id: "EP-001",
    type: "pricing_drift",
    title: "Volume Discount Miscalculation",
    category: "Pricing",
    description:
      "Detected systematic under-application of tiered volume discounts across 12 enterprise accounts. The billing engine appears to apply flat discount rates instead of volume-based tiers as specified in master service agreements.",
    impact: "Estimated $2.4M annual over-billing across affected accounts",
    affectedAccounts: 12,
    confidence: 0.94,
    detectedAt: "2026-02-10",
    recommendation:
      "Audit discount calculation engine. Cross-reference MSA terms with applied rates for all Enterprise-tier accounts.",
  },
  {
    id: "EP-002",
    type: "billing_anomaly",
    title: "Subscription Renewal Rate Mismatch",
    category: "Subscription",
    description:
      "Auto-renewal pricing for 8 Mid-Market accounts does not reflect negotiated renewal rates. Customers are being billed at list price instead of contracted renewal rates, creating compliance risk.",
    impact: "Estimated $890K in renewal rate leakage over past 6 months",
    affectedAccounts: 8,
    confidence: 0.88,
    detectedAt: "2026-02-08",
    recommendation:
      "Review CRM renewal rate fields against billing system configured rates. Implement automated rate validation at renewal trigger.",
  },
  {
    id: "EP-003",
    type: "contract_deviation",
    title: "SLA Credit Under-Application",
    category: "Contract",
    description:
      "Service level agreement breaches detected for 5 customers where contractual SLA credits were not applied to subsequent invoices. Monitoring data shows 23 qualifying SLA breach events without corresponding credits.",
    impact: "Estimated $340K in owed SLA credits",
    affectedAccounts: 5,
    confidence: 0.91,
    detectedAt: "2026-02-05",
    recommendation:
      "Integrate uptime monitoring with billing credit workflow. Implement automated SLA credit application for qualifying events.",
  },
  {
    id: "EP-004",
    type: "discount_abuse",
    title: "Promotional Pricing Extension",
    category: "Discount",
    description:
      "15 accounts continue to receive introductory promotional pricing beyond the contractual promotional period. Average promotional period overrun is 4.2 months.",
    impact: "Estimated $1.1M in foregone revenue from extended promotions",
    affectedAccounts: 15,
    confidence: 0.96,
    detectedAt: "2026-02-03",
    recommendation:
      "Implement automated promotional period expiry with billing rate reversion. Notify account managers 30 days prior to promo end.",
  },
  {
    id: "EP-005",
    type: "revenue_recognition",
    title: "Multi-Element Arrangement Allocation",
    category: "Recognition",
    description:
      "Revenue recognition for bundled SaaS + Professional Services contracts shows allocation anomalies. Stand-alone selling price (SSP) determinations appear stale for 7 contracts, affecting ASC 606 compliance.",
    impact: "$560K in potentially misallocated revenue across reporting periods",
    affectedAccounts: 7,
    confidence: 0.82,
    detectedAt: "2026-01-28",
    recommendation:
      "Update SSP tables for current fiscal period. Re-run allocation for affected multi-element arrangements.",
  },
  {
    id: "EP-006",
    type: "billing_anomaly",
    title: "Usage Metering Gaps",
    category: "Billing",
    description:
      "Consumption-based billing for cloud infrastructure services shows metering gaps for 3 enterprise accounts. Missing usage records correlate with platform maintenance windows, resulting in under-billing.",
    impact: "Estimated $430K in unbilled usage over past quarter",
    affectedAccounts: 3,
    confidence: 0.87,
    detectedAt: "2026-02-01",
    recommendation:
      "Implement metering backfill process for maintenance windows. Add usage completeness validation before invoice generation.",
  },
];

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 bg-slate-200 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="p-6">
      <Card className="p-6 text-center border-red-200 bg-red-50">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h2 className="text-lg font-semibold text-red-800">Error Loading Insights</h2>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </Card>
    </div>
  );
}

export default function RevenueAssuranceInsightsPage() {
  const { data, loading, error } = useRevenueDashboard();

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">AI-Powered Revenue Insights</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Machine learning-detected patterns across enterprise billing, pricing, and contracts
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
        <Card className="p-3 bg-blue-50/40 border-blue-200">
          <div className="flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-blue-500" />
            <p className="text-[11px] font-medium text-blue-600">Patterns Found</p>
          </div>
          <p className="text-xl font-bold text-blue-700">{ENTERPRISE_PATTERNS.length}</p>
        </Card>
        <Card className="p-3 bg-red-50 border-red-200">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <p className="text-[11px] font-medium text-red-600">High Confidence</p>
          </div>
          <p className="text-xl font-bold text-red-700">
            {ENTERPRISE_PATTERNS.filter((p) => p.confidence >= 0.9).length}
          </p>
        </Card>
        <Card className="p-3 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-[11px] font-medium text-amber-600">Accounts Affected</p>
          </div>
          <p className="text-xl font-bold text-amber-700">
            {new Set(ENTERPRISE_PATTERNS.flatMap((p) => Array(p.affectedAccounts).fill(p.id))).size > 0
              ? ENTERPRISE_PATTERNS.reduce((sum, p) => sum + p.affectedAccounts, 0)
              : 0}
          </p>
        </Card>
        <Card className="p-3 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-[11px] font-medium text-emerald-600">Total Leakage</p>
          </div>
          <p className="text-lg font-bold text-emerald-700">
            {data ? formatUSD(data.totalLeakageDetected, true) : "--"}
          </p>
        </Card>
        <Card className="p-3 bg-slate-50 border-slate-200">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-[11px] font-medium text-slate-500">Categories</p>
          </div>
          <p className="text-xl font-bold text-slate-700">
            {new Set(ENTERPRISE_PATTERNS.map((p) => p.category)).size}
          </p>
        </Card>
        <Card className="p-3 bg-violet-50 border-violet-200">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-violet-500" />
            <p className="text-[11px] font-medium text-violet-600">Avg Confidence</p>
          </div>
          <p className="text-xl font-bold text-violet-700">
            {Math.round(
              (ENTERPRISE_PATTERNS.reduce((sum, p) => sum + p.confidence, 0) /
                ENTERPRISE_PATTERNS.length) *
                100
            )}
            %
          </p>
        </Card>
      </div>

      {/* Pattern Cards */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Detected Enterprise Patterns
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ENTERPRISE_PATTERNS.map((pattern) => {
            const style = PATTERN_STYLES[pattern.type] || defaultStyle;
            const Icon = PATTERN_ICONS[pattern.type] || Activity;

            return (
              <Card
                key={pattern.id}
                className={`p-0 overflow-hidden ${style.border} ${style.bg}`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${style.icon} flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {pattern.title}
                        </h4>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${CATEGORY_COLORS[pattern.category] || "bg-slate-100 text-slate-700 border-slate-300"} capitalize whitespace-nowrap`}
                        >
                          {pattern.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {pattern.affectedAccounts} accounts
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {Math.round(pattern.confidence * 100)}% confidence
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(pattern.detectedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {pattern.description}
                      </p>

                      <div className="mt-3 p-2 bg-white/60 rounded-md border border-slate-200/50">
                        <p className="text-xs font-semibold text-red-700">{pattern.impact}</p>
                      </div>

                      <div className="mt-2 p-2 bg-blue-50/50 rounded-md border border-blue-200/50">
                        <p className="text-[11px] font-medium text-blue-800">
                          <span className="font-bold">Recommendation:</span>{" "}
                          {pattern.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Dashboard Highlights */}
      {data?.highlights && data.highlights.length > 0 && (
        <Card className="p-4 border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" />
            Dashboard Highlights
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
    </div>
  );
}
