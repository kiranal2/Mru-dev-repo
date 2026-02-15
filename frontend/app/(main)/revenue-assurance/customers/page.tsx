"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRevenueCustomers } from "@/hooks/data";
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
import { Search, AlertTriangle, Building2, Users } from "lucide-react";

const TIER_BADGE: Record<string, string> = {
  Enterprise: "bg-indigo-100 text-indigo-800 border-indigo-300",
  "Mid-Market": "bg-blue-100 text-blue-800 border-blue-300",
  SMB: "bg-slate-100 text-slate-700 border-slate-300",
};

const riskColor = (score: number) => {
  if (score >= 70) return "text-red-700";
  if (score >= 40) return "text-amber-700";
  return "text-emerald-700";
};

const riskBarColor = (score: number) => {
  if (score >= 70) return "bg-red-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-emerald-500";
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
        <h2 className="text-lg font-semibold text-red-800">Error Loading Customers</h2>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </Card>
    </div>
  );
}

export default function RevenueAssuranceCustomersPage() {
  const router = useRouter();
  const { data: customers, loading, error } = useRevenueCustomers();
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");

  const regions = useMemo(
    () => Array.from(new Set((customers || []).map((c) => c.region).filter(Boolean))).sort(),
    [customers]
  );

  const filteredCustomers = useMemo(() => {
    let result = customers || [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q) ||
          c.accountManager.toLowerCase().includes(q)
      );
    }
    if (tierFilter !== "all") {
      result = result.filter((c) => c.tier === tierFilter);
    }
    if (regionFilter !== "all") {
      result = result.filter((c) => c.region === regionFilter);
    }
    return result.sort((a, b) => b.riskScore - a.riskScore);
  }, [customers, searchQuery, tierFilter, regionFilter]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Customer Accounts</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Enterprise customer portfolio with leakage risk profiles
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 bg-slate-50 border-slate-200">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <p className="text-[11px] font-medium text-slate-500">Total Customers</p>
          </div>
          <p className="text-xl font-bold text-slate-900">{(customers || []).length}</p>
        </Card>
        <Card className="p-3 bg-indigo-50 border-indigo-200">
          <p className="text-[11px] font-medium text-indigo-600">Enterprise</p>
          <p className="text-xl font-bold text-indigo-700">
            {(customers || []).filter((c) => c.tier === "Enterprise").length}
          </p>
        </Card>
        <Card className="p-3 bg-blue-50 border-blue-200">
          <p className="text-[11px] font-medium text-blue-600">Mid-Market</p>
          <p className="text-xl font-bold text-blue-700">
            {(customers || []).filter((c) => c.tier === "Mid-Market").length}
          </p>
        </Card>
        <Card className="p-3 bg-red-50 border-red-200">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <p className="text-[11px] font-medium text-red-600">High Risk</p>
          </div>
          <p className="text-xl font-bold text-red-700">
            {(customers || []).filter((c) => c.riskScore >= 70).length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search customer, industry, manager..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-[280px]"
          />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[150px] h-9 text-xs">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            {["Enterprise", "Mid-Market", "SMB"].map((tier) => (
              <SelectItem key={tier} value={tier}>
                {tier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-[150px] h-9 text-xs">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
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
                Customer Name
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 100 }}>
                Tier
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 130 }}>
                Industry
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 80 }}>
                Region
              </th>
              <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold" style={{ minWidth: 130 }}>
                Annual Revenue
              </th>
              <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold" style={{ minWidth: 100 }}>
                Active Cases
              </th>
              <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold" style={{ minWidth: 130 }}>
                Total Leakage
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 120 }}>
                Risk Score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredCustomers.map((customer) => (
              <tr
                key={customer.id}
                className="text-slate-800 hover:bg-blue-50/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/revenue-assurance/customers?id=${customer.id}`)}
              >
                <td className="px-3 py-2.5 font-semibold text-blue-700 hover:underline">
                  {customer.name}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${TIER_BADGE[customer.tier] || "bg-slate-100 text-slate-700 border-slate-300"} whitespace-nowrap`}
                  >
                    {customer.tier}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-slate-700">{customer.industry}</td>
                <td className="px-3 py-2.5 text-slate-600">{customer.region}</td>
                <td className="px-3 py-2.5 text-right font-medium">
                  {formatUSD(customer.annualRevenue, true)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  {customer.activeLeakageCases > 0 ? (
                    <span className="inline-flex items-center justify-center w-7 h-5 rounded text-xs font-bold bg-red-100 text-red-700">
                      {customer.activeLeakageCases}
                    </span>
                  ) : (
                    <span className="text-slate-400">0</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-red-700">
                  {formatUSD(customer.totalLeakageUsd, true)}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${riskBarColor(customer.riskScore)}`}
                        style={{ width: `${customer.riskScore}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold tabular-nums ${riskColor(customer.riskScore)}`}>
                      {customer.riskScore}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            {!filteredCustomers.length && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm text-slate-500">
                  No customers match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="text-sm text-slate-600">
        Showing {filteredCustomers.length} of {(customers || []).length} customers
      </div>
    </div>
  );
}
