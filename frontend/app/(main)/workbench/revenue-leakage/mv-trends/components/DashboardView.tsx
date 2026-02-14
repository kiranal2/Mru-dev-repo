"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Eye, Filter, Search } from "lucide-react";
import { MVHotspotItem, MVSeverity } from "@/lib/revenue-leakage/types";
import { DrrTrendChart } from "./DrrTrendChart";
import { SeverityDonut } from "./SeverityDonut";
import {
  formatCurrency,
  formatShort,
  severityBadge,
  drrText,
  highlightIcons,
} from "../constants";
import type { SeverityDistributionItem, TopRule, TypeFilter, SortByOption } from "../types";

interface DashboardViewProps {
  dashboard: {
    total_hotspots: number;
    total_hotspots_change_pct: number;
    critical_hotspots: number;
    high_hotspots: number;
    medium_hotspots: number;
    watch_hotspots: number;
    affected_transactions: number;
    estimated_annual_loss: number;
    pct_in_hotspots: number;
    locations_monitored: number;
    quarterly_trend: { quarter: string; avg_drr: number; hotspot_count: number; loss: number }[];
    top_sros: { sro_code: string; sro_name: string; avg_drr: number; hotspots: number; loss: number }[];
    highlights: { icon: string; text: string }[];
  };
  severityDistribution: SeverityDistributionItem[];
  topRules: TopRule[];
  // Hotspot table props
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  severityFilters: MVSeverity[];
  setSeverityFilters: React.Dispatch<React.SetStateAction<MVSeverity[]>>;
  typeFilter: TypeFilter;
  setTypeFilter: (v: TypeFilter) => void;
  sortBy: SortByOption;
  setSortBy: (v: SortByOption) => void;
  setFilterOpen: (v: boolean) => void;
  paginatedHotspots: MVHotspotItem[];
  filteredHotspots: MVHotspotItem[];
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  setPageSize: (v: number) => void;
  totalPages: number;
  openHotspot: (item: MVHotspotItem) => void;
}

export function DashboardView({
  dashboard,
  severityDistribution,
  topRules,
  searchQuery,
  setSearchQuery,
  severityFilters,
  setSeverityFilters,
  typeFilter,
  setTypeFilter,
  sortBy,
  setSortBy,
  setFilterOpen,
  paginatedHotspots,
  filteredHotspots,
  page,
  setPage,
  pageSize,
  setPageSize,
  totalPages,
  openHotspot,
}: DashboardViewProps) {
  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-2">
        {[
          {
            label: "Total Hotspots",
            value: dashboard.total_hotspots,
            delta: `+${dashboard.total_hotspots_change_pct}%`,
            accent: "border-t-red-600",
          },
          {
            label: "Critical",
            value: dashboard.critical_hotspots,
            delta: "+3 vs last quarter",
            accent: "border-t-[#7f1d1d]",
          },
          {
            label: "Affected Transactions",
            value: dashboard.affected_transactions,
            delta: "Hotspot zones",
            accent: "border-t-orange-500",
          },
          {
            label: "Estimated Annual Loss",
            value: formatShort(dashboard.estimated_annual_loss),
            delta: "+18.5%",
            accent: "border-t-red-600",
          },
          {
            label: "% Registrations in Hotspots",
            value: `${dashboard.pct_in_hotspots}%`,
            delta: "Share of all sale deeds",
            accent: "border-t-[#3ABEF9]",
          },
          {
            label: "Locations Monitored",
            value: dashboard.locations_monitored.toLocaleString("en-IN"),
            delta: "Active locations",
            accent: "border-t-slate-700",
          },
        ].map((kpi) => (
          <Card key={kpi.label} className={`p-3 border ${kpi.accent}`}>
            <p className="text-[11px] font-medium text-slate-500">{kpi.label}</p>
            <p className="text-lg font-bold text-slate-900">{kpi.value}</p>
            <p className="text-[11px] text-slate-500 mt-1">{kpi.delta}</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Drivers & Trends
        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <DrrTrendChart data={dashboard.quarterly_trend} />
          <SeverityDonut data={severityDistribution} />
        </div>
      </div>

      {/* Highlights */}
      <Card className="p-4 border-amber-200 bg-gradient-to-r from-amber-50/60 to-yellow-50/60">
        <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-3 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5" />
          MV Trend Highlights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {dashboard.highlights.map((item, idx) => {
            const Icon = highlightIcons[item.icon] || AlertTriangle;
            return (
              <div
                key={idx}
                className="flex items-start gap-2.5 text-sm text-slate-800 bg-white/70 rounded-md px-3 py-2"
              >
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <span className="text-xs leading-relaxed">{item.text}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Operational tables */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Operational Drilldowns
        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {/* Top SROs */}
          <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b">
              <h3 className="text-sm font-bold text-slate-900">Top 10 SROs by Estimated Loss</h3>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#1B2A4A] text-xs text-slate-200 uppercase">
                  <tr>
                    <th className="text-left py-2 px-3">SRO</th>
                    <th className="text-center py-2 px-3">Avg DRR</th>
                    <th className="text-center py-2 px-3">Hotspots</th>
                    <th className="text-center py-2 px-3">Txns</th>
                    <th className="text-right py-2 px-3">Est. Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dashboard.top_sros.map((sro) => (
                    <tr key={sro.sro_code} className="hover:bg-blue-50/40">
                      <td className="px-3 py-2 text-slate-700">
                        <span className="font-bold text-slate-900">{sro.sro_code}</span>
                        <span className="text-slate-400 ml-1 text-xs">{sro.sro_name}</span>
                      </td>
                      <td className={`px-3 py-2 text-center font-semibold ${drrText(sro.avg_drr)}`}>
                        {sro.avg_drr.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-center">{sro.hotspots}</td>
                      <td className="px-3 py-2 text-center">{sro.hotspots * 12}</td>
                      <td className="px-3 py-2 text-right font-semibold text-emerald-600">
                        {formatShort(sro.loss)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Rules */}
          <div className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b">
              <h3 className="text-sm font-bold text-slate-900">Top Rules Triggered</h3>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#1B2A4A] text-xs text-slate-200 uppercase">
                  <tr>
                    <th className="text-left py-2 px-3">Rule</th>
                    <th className="text-center py-2 px-3">Triggers</th>
                    <th className="text-right py-2 px-3">Impact</th>
                    <th className="text-right py-2 px-3">Avg DRR</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topRules.map((rule) => (
                    <tr key={rule.rule_id} className="hover:bg-blue-50/40">
                      <td className="px-3 py-2 text-slate-700">
                        <span className="font-bold text-slate-900">{rule.rule_id}</span>
                        <span className="text-slate-400 ml-1 text-xs">{rule.rule_name}</span>
                      </td>
                      <td className="px-3 py-2 text-center">{rule.count}</td>
                      <td className="px-3 py-2 text-right font-semibold text-emerald-600">
                        {formatShort(rule.impact)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`text-xs font-semibold ${drrText(rule.avg_drr)}`}>
                            {rule.avg_drr.toFixed(2)}
                          </span>
                          <div className="w-14 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${rule.avg_drr < 0.7 ? "bg-red-500" : rule.avg_drr < 0.85 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${Math.min(rule.avg_drr * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Hotspot table */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Undervaluation Hotspots
        </h2>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location, SRO..."
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {(["Critical", "High", "Medium", "Watch"] as MVSeverity[]).map((severity) => (
              <button
                key={severity}
                onClick={() =>
                  setSeverityFilters((prev) =>
                    prev.includes(severity)
                      ? prev.filter((s) => s !== severity)
                      : [...prev, severity]
                  )
                }
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                  severityFilters.includes(severity)
                    ? `${severityBadge[severity]} shadow-sm`
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {severity}
              </button>
            ))}
          </div>
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as TypeFilter)}
          >
            <SelectTrigger className="w-[120px] h-9 text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="RURAL">Rural</SelectItem>
              <SelectItem value="URBAN">Urban</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-9 text-xs" onClick={() => setFilterOpen(true)}>
            <Filter className="w-4 h-4 mr-1" /> More Filters
          </Button>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortByOption)}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="loss">Sort: Est. Loss</SelectItem>
              <SelectItem value="drr">Sort: DRR</SelectItem>
              <SelectItem value="transactions">Sort: Transactions</SelectItem>
              <SelectItem value="severity">Sort: Severity</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#1B2A4A] text-xs text-slate-200 uppercase">
              <tr>
                <th className="text-center px-2 py-2 w-[40px]">#</th>
                <th className="text-left px-3 py-2">Location</th>
                <th className="text-center px-3 py-2">Type</th>
                <th className="text-left px-3 py-2">SRO</th>
                <th className="text-center px-3 py-2">Txns</th>
                <th className="text-right px-3 py-2">Rate Card</th>
                <th className="text-right px-3 py-2">Declared</th>
                <th className="text-center px-3 py-2">DRR</th>
                <th className="text-center px-3 py-2">Severity</th>
                <th className="text-right px-3 py-2">Est. Loss</th>
                <th className="text-center px-3 py-2">Quarters</th>
                <th className="text-center px-3 py-2">Status</th>
                <th className="text-center px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedHotspots.map((item, idx) => (
                <tr
                  key={item.case_id}
                  className="hover:bg-blue-50/40 cursor-pointer"
                  onClick={() => openHotspot(item)}
                >
                  <td className="text-center px-2 py-2 text-slate-500">
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{item.location_label}</td>
                  <td className="px-3 py-2 text-center text-slate-600">
                    {item.location_type === "RURAL" ? "Rural" : "Urban"}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {item.sro_code} - {item.sro_name}
                  </td>
                  <td className="px-3 py-2 text-center">{item.transaction_count}</td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(item.rate_card_unit_rate)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-red-600">
                    {formatCurrency(item.median_declared)}
                  </td>
                  <td className={`px-3 py-2 text-center font-bold ${drrText(item.drr)}`}>
                    {item.drr.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${severityBadge[item.severity]}`}
                    >
                      {item.severity}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-emerald-600">
                    {formatShort(item.estimated_loss)}
                  </td>
                  <td className="px-3 py-2 text-center">{item.consecutive_quarters}</td>
                  <td className="px-3 py-2 text-center text-slate-600">{item.status}</td>
                  <td className="px-3 py-2 text-center">
                    <Button size="icon" variant="outline" className="h-7 w-7">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!paginatedHotspots.length && (
                <tr>
                  <td colSpan={13} className="text-center text-sm text-slate-500 py-6">
                    No hotspots match the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm text-slate-600 mt-2">
          <div>
            Showing {paginatedHotspots.length} of {filteredHotspots.length} hotspots
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[90px] h-8">
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent>
                {[10, 12, 20].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}/page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
