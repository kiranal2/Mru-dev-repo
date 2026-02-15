"use client";

import { useState, useMemo } from "react";
import { useRevenueRules, useRevenueRuleMutation } from "@/hooks/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Search,
  ShieldCheck,
  ShieldOff,
  ShieldAlert,
  AlertTriangle,
  Code2,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import type { RevenueRule } from "@/lib/data/types";

const SEVERITY_BADGE: Record<string, string> = {
  Critical: "bg-red-700 text-white",
  High: "bg-red-600 text-white",
  Medium: "bg-amber-500 text-white",
  Low: "bg-emerald-600 text-white",
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

const CATEGORY_CHIP_STYLES: Record<string, { active: string; idle: string }> = {
  All: {
    active: "bg-slate-800 text-white border-slate-900",
    idle: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
  },
  Pricing: {
    active: "bg-red-600 text-white border-red-700",
    idle: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
  },
  Billing: {
    active: "bg-orange-600 text-white border-orange-700",
    idle: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
  },
  Contract: {
    active: "bg-blue-600 text-white border-blue-700",
    idle: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  },
  Discount: {
    active: "bg-purple-600 text-white border-purple-700",
    idle: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
  },
  Subscription: {
    active: "bg-cyan-600 text-white border-cyan-700",
    idle: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100",
  },
  Commission: {
    active: "bg-pink-600 text-white border-pink-700",
    idle: "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100",
  },
  Recognition: {
    active: "bg-amber-500 text-white border-amber-600",
    idle: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
};

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-96 bg-slate-200 rounded-lg animate-pulse" />
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="p-6">
      <Card className="p-6 text-center border-red-200 bg-red-50">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h2 className="text-lg font-semibold text-red-800">Error Loading Rules</h2>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </Card>
    </div>
  );
}

export default function RevenueAssuranceRulesPage() {
  const { data: rules, loading, error, refetch } = useRevenueRules();
  const { toggleRule } = useRevenueRuleMutation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedRule, setSelectedRule] = useState<RevenueRule | null>(null);

  const categories = ["All", "Pricing", "Billing", "Contract", "Discount", "Subscription", "Commission", "Recognition"];

  const filteredRules = useMemo(() => {
    let result = rules || [];
    if (activeCategory !== "All") {
      result = result.filter((r) => r.category === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [rules, activeCategory, searchQuery]);

  const stats = useMemo(() => {
    const all = rules || [];
    return {
      total: all.length,
      enabled: all.filter((r) => r.enabled).length,
      disabled: all.filter((r) => !r.enabled).length,
      critical: all.filter((r) => r.severity === "Critical").length,
      high: all.filter((r) => r.severity === "High").length,
      medium: all.filter((r) => r.severity === "Medium").length,
    };
  }, [rules]);

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await toggleRule(ruleId, enabled);
      toast.success(`Rule ${ruleId} ${enabled ? "enabled" : "disabled"}`);
      refetch();
    } catch {
      toast.error("Failed to toggle rule");
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Business Rules Engine</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure and manage revenue leakage detection rules
        </p>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-6 gap-2">
        <Card className="p-3 bg-slate-50 border-slate-200">
          <p className="text-[11px] font-medium text-slate-500">Total Rules</p>
          <p className="text-xl font-bold text-slate-900">{stats.total}</p>
        </Card>
        <Card className="p-3 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <p className="text-[11px] font-medium text-emerald-600">Enabled</p>
          </div>
          <p className="text-xl font-bold text-emerald-700">{stats.enabled}</p>
        </Card>
        <Card className="p-3 bg-slate-50 border-slate-200">
          <div className="flex items-center gap-1.5">
            <ShieldOff className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-[11px] font-medium text-slate-500">Disabled</p>
          </div>
          <p className="text-xl font-bold text-slate-600">{stats.disabled}</p>
        </Card>
        <Card className="p-3 bg-red-50 border-red-200">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            <p className="text-[11px] font-medium text-red-600">Critical</p>
          </div>
          <p className="text-xl font-bold text-red-700">{stats.critical}</p>
        </Card>
        <Card className="p-3 bg-red-50/60 border-red-200">
          <p className="text-[11px] font-medium text-red-600">High</p>
          <p className="text-xl font-bold text-red-600">{stats.high}</p>
        </Card>
        <Card className="p-3 bg-amber-50 border-amber-200">
          <p className="text-[11px] font-medium text-amber-600">Medium</p>
          <p className="text-xl font-bold text-amber-700">{stats.medium}</p>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-[240px] h-8 text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const styles = CATEGORY_CHIP_STYLES[cat] || CATEGORY_CHIP_STYLES.All;
            const count =
              cat === "All"
                ? (rules || []).length
                : (rules || []).filter((r) => r.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                  activeCategory === cat ? styles.active + " shadow-sm" : styles.idle
                }`}
              >
                {cat}
                <span className="ml-1 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rules Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm" style={{ minWidth: 1000 }}>
          <thead className="text-xs uppercase text-slate-200 bg-slate-800">
            <tr>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 90 }}>
                Rule ID
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 110 }}>
                Category
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 200 }}>
                Name
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 80 }}>
                Severity
              </th>
              <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold" style={{ minWidth: 100 }}>
                Triggers
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 120 }}>
                Last Triggered
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 80 }}>
                Enabled
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 80 }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredRules.map((rule) => (
              <tr
                key={rule.id}
                className="text-slate-800 hover:bg-blue-50/50 transition-colors"
              >
                <td className="px-3 py-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                  {rule.id}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${CATEGORY_COLORS[rule.category] || "bg-slate-100 text-slate-700 border-slate-300"} whitespace-nowrap`}
                  >
                    {rule.category}
                  </span>
                </td>
                <td className="px-3 py-2.5 font-semibold text-slate-900">{rule.name}</td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${SEVERITY_BADGE[rule.severity]} whitespace-nowrap`}
                  >
                    {rule.severity}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-bold">{rule.triggerCount}</td>
                <td className="px-3 py-2.5 text-xs text-slate-600">
                  {rule.lastTriggered
                    ? new Date(rule.lastTriggered).toLocaleDateString()
                    : "Never"}
                </td>
                <td className="px-3 py-2.5">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs"
                    onClick={() => setSelectedRule(rule)}
                  >
                    Details
                  </Button>
                </td>
              </tr>
            ))}
            {!filteredRules.length && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-sm text-slate-500">
                  No rules match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          Showing {filteredRules.length} of {(rules || []).length} rules
        </span>
      </div>

      {/* Rule Details Drawer */}
      <Sheet open={!!selectedRule} onOpenChange={() => setSelectedRule(null)}>
        <SheetContent className="w-[520px] sm:max-w-[520px] p-0 flex flex-col">
          {selectedRule && (
            <>
              <SheetHeader className="px-6 pt-5 pb-4 border-b bg-gradient-to-r from-slate-800 to-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <SheetTitle className="text-lg font-bold text-white tracking-tight">
                      {selectedRule.name}
                    </SheetTitle>
                    <p className="text-xs text-slate-300 mt-1 font-mono">{selectedRule.id}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${SEVERITY_BADGE[selectedRule.severity]}`}
                    >
                      {selectedRule.severity}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${selectedRule.enabled ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/20 text-red-200"}`}
                    >
                      {selectedRule.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${CATEGORY_COLORS[selectedRule.category] || "bg-slate-100 text-slate-700 border-slate-300"} mb-2`}
                  >
                    {selectedRule.category}
                  </span>
                  <p className="text-sm text-slate-700 mt-1">{selectedRule.description}</p>
                </div>

                <Card className="p-4 bg-slate-50 border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Code2 className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Detection Logic
                    </h4>
                  </div>
                  <p className="text-sm text-slate-800 font-mono bg-white px-3 py-2 rounded border">
                    {selectedRule.logic}
                  </p>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                      Threshold
                    </h4>
                    <p className="text-lg font-bold text-slate-900">{selectedRule.threshold}</p>
                  </Card>
                  <Card className="p-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                      Total Triggers
                    </h4>
                    <p className="text-lg font-bold text-slate-900">{selectedRule.triggerCount}</p>
                  </Card>
                </div>

                <Card className="p-4 border-blue-200 bg-blue-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                      Rule Details
                    </h4>
                  </div>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p>
                      <span className="font-semibold">Last triggered:</span>{" "}
                      {selectedRule.lastTriggered
                        ? new Date(selectedRule.lastTriggered).toLocaleString()
                        : "Never"}
                    </p>
                    <p>
                      <span className="font-semibold">Category:</span> {selectedRule.category}
                    </p>
                    <p>
                      <span className="font-semibold">Severity:</span> {selectedRule.severity}
                    </p>
                  </div>
                </Card>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
