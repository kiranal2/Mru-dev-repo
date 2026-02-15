"use client";

import { useState, useMemo } from "react";
import { useRevenueContracts } from "@/hooks/data";
import { formatUSD } from "@/lib/data/utils/format-currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  Active: "bg-emerald-600 text-white",
  Expiring: "bg-amber-500 text-white",
  Expired: "bg-red-600 text-white",
  Renewed: "bg-blue-600 text-white",
};

const complianceColor = (score: number) => {
  if (score >= 90) return "text-emerald-700";
  if (score >= 70) return "text-amber-700";
  return "text-red-700";
};

const complianceBarColor = (score: number) => {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 70) return "bg-amber-500";
  return "bg-red-500";
};

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
      <div className="h-10 w-full bg-slate-200 rounded animate-pulse" />
      <div className="h-96 bg-slate-200 rounded-lg animate-pulse" />
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="p-6">
      <Card className="p-6 text-center border-red-200 bg-red-50">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h2 className="text-lg font-semibold text-red-800">Error Loading Contracts</h2>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </Card>
    </div>
  );
}

export default function RevenueAssuranceContractsPage() {
  const { data: contracts, loading, error } = useRevenueContracts();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const contractTypes = useMemo(
    () => Array.from(new Set((contracts || []).map((c) => c.type).filter(Boolean))).sort(),
    [contracts]
  );

  const filteredContracts = useMemo(() => {
    let result = contracts || [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (typeFilter !== "all") {
      result = result.filter((c) => c.type === typeFilter);
    }
    return result;
  }, [contracts, searchQuery, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const all = contracts || [];
    return {
      total: all.length,
      active: all.filter((c) => c.status === "Active").length,
      expiring: all.filter((c) => c.status === "Expiring").length,
      totalValue: all.reduce((sum, c) => sum + c.totalValue, 0),
      avgCompliance: all.length
        ? Math.round(all.reduce((sum, c) => sum + c.complianceScore, 0) / all.length)
        : 0,
    };
  }, [contracts]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Contract Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Monitor customer contracts, billing compliance, and pricing adherence
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3 bg-slate-50 border-slate-200">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <p className="text-[11px] font-medium text-slate-500">Total Contracts</p>
          </div>
          <p className="text-xl font-bold text-slate-900">{stats.total}</p>
        </Card>
        <Card className="p-3 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-[11px] font-medium text-emerald-600">Active</p>
          </div>
          <p className="text-xl font-bold text-emerald-700">{stats.active}</p>
        </Card>
        <Card className="p-3 bg-amber-50 border-amber-200">
          <p className="text-[11px] font-medium text-amber-600">Expiring Soon</p>
          <p className="text-xl font-bold text-amber-700">{stats.expiring}</p>
        </Card>
        <Card className="p-3 bg-blue-50 border-blue-200">
          <p className="text-[11px] font-medium text-blue-600">Total Value</p>
          <p className="text-lg font-bold text-blue-700">{formatUSD(stats.totalValue, true)}</p>
        </Card>
        <Card className="p-3 bg-violet-50 border-violet-200">
          <p className="text-[11px] font-medium text-violet-600">Avg Compliance</p>
          <p className="text-xl font-bold text-violet-700">{stats.avgCompliance}%</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search contract, customer, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-[280px]"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-9 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["Active", "Expiring", "Expired", "Renewed"].map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {contractTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm" style={{ minWidth: 1100 }}>
          <thead className="text-xs uppercase text-slate-200 bg-slate-800">
            <tr>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 200 }}>
                Contract Name
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 160 }}>
                Customer
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 120 }}>
                Type
              </th>
              <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold" style={{ minWidth: 120 }}>
                Total Value
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 110 }}>
                Billing
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 120 }}>
                Compliance
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 100 }}>
                Status
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 100 }}>
                End Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredContracts.map((contract) => (
              <tr
                key={contract.id}
                className="text-slate-800 hover:bg-blue-50/50 transition-colors"
              >
                <td className="px-3 py-2.5 font-semibold text-slate-900">
                  {contract.name}
                </td>
                <td className="px-3 py-2.5 text-slate-700">{contract.customerName}</td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {contract.type}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-bold">
                  {formatUSD(contract.totalValue, true)}
                </td>
                <td className="px-3 py-2.5 text-slate-600">{contract.billingFrequency}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${complianceBarColor(contract.complianceScore)}`}
                        style={{ width: `${contract.complianceScore}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-bold tabular-nums ${complianceColor(contract.complianceScore)}`}
                    >
                      {contract.complianceScore}%
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${STATUS_BADGE[contract.status] || "bg-slate-500 text-white"} whitespace-nowrap`}
                  >
                    {contract.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-600">
                  {new Date(contract.endDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {!filteredContracts.length && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm text-slate-500">
                  No contracts match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="text-sm text-slate-600">
        Showing {filteredContracts.length} of {(contracts || []).length} contracts
      </div>
    </div>
  );
}
