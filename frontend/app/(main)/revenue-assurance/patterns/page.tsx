"use client";

import { useState, useMemo } from "react";
import { useRevenuePatterns } from "@/hooks/data/use-revenue-patterns";
import { formatUSD } from "@/lib/data/utils/format-currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Target,
  Shield,
  Clock,
  Eye,
  Zap,
  Users,
  DollarSign,
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

interface BusinessPattern {
  id: string;
  type: "recurring" | "seasonal" | "anomaly" | "trend";
  category: string;
  title: string;
  description: string;
  affectedCustomers: number;
  estimatedImpact: number;
  confidence: number;
  detectedAt: string;
  period: string;
  severity: "Critical" | "High" | "Medium" | "Low";
}

const BUSINESS_PATTERNS: BusinessPattern[] = [
  {
    id: "BP-001",
    type: "recurring",
    category: "Billing",
    title: "Systematic Metering Gaps During Maintenance",
    description:
      "Cloud infrastructure usage metering consistently drops to zero during scheduled maintenance windows (2-4 AM UTC), resulting in 3-5 hours of unbilled consumption per maintenance event. Pattern repeats bi-weekly across all consumption-based contracts.",
    affectedCustomers: 14,
    estimatedImpact: 1240000,
    confidence: 0.95,
    detectedAt: "2026-02-12",
    period: "Bi-weekly recurring",
    severity: "High",
  },
  {
    id: "BP-002",
    type: "seasonal",
    category: "Pricing",
    title: "Quarter-End Discount Escalation",
    description:
      "Sales teams consistently approve deeper discounts in the final 10 days of each fiscal quarter, with average discount rates 8-12% higher than mid-quarter approvals. Many exceed authorized discount ceilings without proper approval chains.",
    affectedCustomers: 28,
    estimatedImpact: 2100000,
    confidence: 0.92,
    detectedAt: "2026-02-10",
    period: "Quarterly (last 10 days)",
    severity: "Critical",
  },
  {
    id: "BP-003",
    type: "anomaly",
    category: "Contract",
    title: "Expired Contract Billing Continuation",
    description:
      "9 contracts that reached their end dates continue to generate invoices at legacy rates without renewal documentation. Auto-renewal clauses either do not exist or were not properly configured in the billing system.",
    affectedCustomers: 9,
    estimatedImpact: 670000,
    confidence: 0.98,
    detectedAt: "2026-02-08",
    period: "Ongoing since expiry",
    severity: "High",
  },
  {
    id: "BP-004",
    type: "trend",
    category: "Subscription",
    title: "Downgrade Billing Delay",
    description:
      "When customers downgrade their subscription tier, the billing rate change takes an average of 18 days to reflect in invoices. Customers are systematically over-billed during the transition period. The delay correlates with manual provisioning queue backlogs.",
    affectedCustomers: 22,
    estimatedImpact: 890000,
    confidence: 0.89,
    detectedAt: "2026-02-06",
    period: "Per-downgrade event",
    severity: "Medium",
  },
  {
    id: "BP-005",
    type: "recurring",
    category: "Commission",
    title: "Multi-Year Prepay Commission Over-Calculation",
    description:
      "Commissions on multi-year prepaid contracts are being calculated on the full contract value at booking rather than spreading across the recognition period. This creates commission expense frontloading of 2-3x the correct monthly rate.",
    affectedCustomers: 6,
    estimatedImpact: 450000,
    confidence: 0.86,
    detectedAt: "2026-02-04",
    period: "At each multi-year booking",
    severity: "Medium",
  },
  {
    id: "BP-006",
    type: "anomaly",
    category: "Discount",
    title: "Channel Partner Discount Stacking",
    description:
      "Channel partner deals are receiving both the negotiated partner discount AND an additional end-customer promotional discount. The stacked discounts result in effective rates 15-20% below the intended floor price.",
    affectedCustomers: 11,
    estimatedImpact: 1560000,
    confidence: 0.93,
    detectedAt: "2026-02-02",
    period: "Ongoing for active partner deals",
    severity: "Critical",
  },
  {
    id: "BP-007",
    type: "seasonal",
    category: "Recognition",
    title: "Year-End Accelerated Recognition",
    description:
      "Professional services revenue is recognized at accelerated rates in December, with milestone completions spiking 3x compared to monthly averages. Audit sampling shows 40% of December completions lack supporting documentation.",
    affectedCustomers: 18,
    estimatedImpact: 980000,
    confidence: 0.84,
    detectedAt: "2026-01-30",
    period: "Annual (December)",
    severity: "High",
  },
  {
    id: "BP-008",
    type: "trend",
    category: "Pricing",
    title: "Currency Conversion Rate Staleness",
    description:
      "International contracts using non-USD currencies are invoiced with exchange rates that lag the actual rate by an average of 45 days. The stale rates favor the company in some months and the customer in others, creating inconsistent revenue recognition.",
    affectedCustomers: 19,
    estimatedImpact: 720000,
    confidence: 0.88,
    detectedAt: "2026-01-28",
    period: "Continuous",
    severity: "Medium",
  },
];

const TYPE_STYLES: Record<string, { border: string; bg: string; icon: string; badge: string }> = {
  recurring: {
    border: "border-blue-200",
    bg: "bg-blue-50/60",
    icon: "text-blue-600 bg-blue-100",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  seasonal: {
    border: "border-amber-200",
    bg: "bg-amber-50/60",
    icon: "text-amber-600 bg-amber-100",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
  },
  anomaly: {
    border: "border-red-200",
    bg: "bg-red-50/60",
    icon: "text-red-600 bg-red-100",
    badge: "bg-red-100 text-red-700 border-red-200",
  },
  trend: {
    border: "border-emerald-200",
    bg: "bg-emerald-50/60",
    icon: "text-emerald-600 bg-emerald-100",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
};

const TYPE_ICONS: Record<string, typeof TrendingUp> = {
  recurring: Activity,
  seasonal: BarChart3,
  anomaly: AlertTriangle,
  trend: TrendingUp,
};

const SEVERITY_BADGE: Record<string, string> = {
  Critical: "bg-red-700 text-white",
  High: "bg-red-600 text-white",
  Medium: "bg-amber-500 text-white",
  Low: "bg-emerald-600 text-white",
};

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
        <h2 className="text-lg font-semibold text-red-800">Error</h2>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </Card>
    </div>
  );
}

export default function RevenueAssurancePatternsPage() {
  const { data: patternsData, loading, error } = useRevenuePatterns();
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredPatterns = useMemo(() => {
    let result = BUSINESS_PATTERNS;
    if (typeFilter !== "all") {
      result = result.filter((p) => p.type === typeFilter);
    }
    if (categoryFilter !== "all") {
      result = result.filter((p) => p.category === categoryFilter);
    }
    return result;
  }, [typeFilter, categoryFilter]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Business Pattern Detection</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          AI-detected billing and pricing patterns across the enterprise customer portfolio
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Card className="p-3 bg-slate-50 border-slate-200">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <p className="text-[11px] font-medium text-slate-500">Patterns Detected</p>
          </div>
          <p className="text-xl font-bold text-slate-900">{BUSINESS_PATTERNS.length}</p>
        </Card>
        <Card className="p-3 bg-red-50 border-red-200">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <p className="text-[11px] font-medium text-red-600">Critical / High</p>
          </div>
          <p className="text-xl font-bold text-red-700">
            {BUSINESS_PATTERNS.filter((p) => p.severity === "Critical" || p.severity === "High").length}
          </p>
        </Card>
        <Card className="p-3 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-[11px] font-medium text-amber-600">Customers Affected</p>
          </div>
          <p className="text-xl font-bold text-amber-700">
            {BUSINESS_PATTERNS.reduce((sum, p) => sum + p.affectedCustomers, 0)}
          </p>
        </Card>
        <Card className="p-3 bg-red-50/60 border-red-200">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-red-500" />
            <p className="text-[11px] font-medium text-red-600">Est. Total Impact</p>
          </div>
          <p className="text-lg font-bold text-red-700">
            {formatUSD(
              BUSINESS_PATTERNS.reduce((sum, p) => sum + p.estimatedImpact, 0),
              true
            )}
          </p>
        </Card>
        <Card className="p-3 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            <p className="text-[11px] font-medium text-blue-600">Avg Confidence</p>
          </div>
          <p className="text-xl font-bold text-blue-700">
            {Math.round(
              (BUSINESS_PATTERNS.reduce((sum, p) => sum + p.confidence, 0) /
                BUSINESS_PATTERNS.length) *
                100
            )}
            %
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue placeholder="Pattern Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="recurring">Recurring</SelectItem>
            <SelectItem value="seasonal">Seasonal</SelectItem>
            <SelectItem value="anomaly">Anomaly</SelectItem>
            <SelectItem value="trend">Trend</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {["Pricing", "Billing", "Contract", "Discount", "Subscription", "Commission", "Recognition"].map(
              (cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <span className="text-xs text-slate-500">
          {filteredPatterns.length} of {BUSINESS_PATTERNS.length} patterns
        </span>
      </div>

      {/* Pattern Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPatterns.map((pattern) => {
          const style = TYPE_STYLES[pattern.type] || TYPE_STYLES.trend;
          const Icon = TYPE_ICONS[pattern.type] || Activity;

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
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {pattern.title}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${SEVERITY_BADGE[pattern.severity]} whitespace-nowrap`}
                        >
                          {pattern.severity}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${style.badge} capitalize whitespace-nowrap`}
                        >
                          {pattern.type}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${CATEGORY_COLORS[pattern.category] || "bg-slate-100 text-slate-700 border-slate-300"} mb-2`}
                    >
                      {pattern.category}
                    </span>

                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {pattern.affectedCustomers} accounts
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {Math.round(pattern.confidence * 100)}%
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {pattern.period}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {pattern.description}
                    </p>

                    <div className="mt-3 p-2 bg-white/60 rounded-md border border-slate-200/50">
                      <p className="text-xs font-bold text-red-700">
                        Estimated Impact: {formatUSD(pattern.estimatedImpact, true)}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatUSD(pattern.estimatedImpact)} | Detected{" "}
                        {new Date(pattern.detectedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {filteredPatterns.length === 0 && (
          <Card className="p-6 col-span-2 border-slate-200">
            <div className="text-center">
              <Eye className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-500">
                No patterns match the current filters.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting the type or category filters.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
