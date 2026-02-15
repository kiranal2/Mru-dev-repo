"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRevenueCases } from "@/hooks/data";
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
import { Search, Filter, AlertTriangle } from "lucide-react";
import type { RevenueCaseFilters } from "@/lib/data/types";

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
        <h2 className="text-lg font-semibold text-red-800">Error Loading Cases</h2>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </Card>
    </div>
  );
}

export default function RevenueAssuranceCasesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filters: RevenueCaseFilters = {
    ...(categoryFilter !== "all" && { category: [categoryFilter] }),
    ...(statusFilter !== "all" && { status: [statusFilter] }),
    ...(searchQuery && { search: searchQuery }),
    page,
    pageSize,
  };

  const { data, total, totalPages, loading, error } = useRevenueCases(filters);

  const filteredData = useMemo(() => {
    let result = data || [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.caseNumber.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q)
      );
    }
    if (tierFilter !== "all") {
      result = result.filter((c) => c.customerTier === tierFilter);
    }
    return result;
  }, [data, searchQuery, tierFilter]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Revenue Leakage Cases</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Investigate billing errors, pricing discrepancies, and contract violations
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search case #, title, customer..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9 w-[280px]"
          />
        </div>

        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            setPage(1);
          }}
        >
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

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["Open", "Investigating", "Confirmed", "Recovered", "Closed", "False Positive"].map(
              (status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        <Select
          value={tierFilter}
          onValueChange={(v) => {
            setTierFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue placeholder="Customer Tier" />
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
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm" style={{ minWidth: 1200 }}>
          <thead className="text-xs uppercase text-slate-200 bg-slate-800">
            <tr>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 120 }}>
                Case #
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 220 }}>
                Title
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 110 }}>
                Category
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 160 }}>
                Customer
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 90 }}>
                Risk
              </th>
              <th className="px-3 py-2.5 text-right whitespace-nowrap font-semibold" style={{ minWidth: 120 }}>
                Leakage ($)
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 110 }}>
                Status
              </th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap font-semibold" style={{ minWidth: 120 }}>
                Assigned To
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredData.map((item) => (
              <tr
                key={item.id}
                className="text-slate-800 hover:bg-blue-50/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/revenue-assurance/cases/${item.id}`)}
              >
                <td className="px-3 py-2.5 font-bold text-blue-700 whitespace-nowrap hover:underline">
                  {item.caseNumber}
                </td>
                <td className="px-3 py-2.5 font-medium text-slate-900 max-w-[280px] truncate">
                  {item.title}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${CATEGORY_COLORS[item.category] || "bg-slate-100 text-slate-700 border-slate-300"} whitespace-nowrap`}
                  >
                    {item.category}
                  </span>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <span className="font-medium">{item.customerName}</span>
                  <span
                    className={`ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold border ${TIER_BADGE[item.customerTier] || "bg-slate-100 text-slate-700 border-slate-300"}`}
                  >
                    {item.customerTier}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${RISK_BADGE[item.riskLevel]} whitespace-nowrap`}
                  >
                    {item.riskLevel}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-red-700 whitespace-nowrap">
                  {formatUSD(item.leakageAmountUsd)}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${STATUS_BADGE[item.status] || "bg-slate-500 text-white"} whitespace-nowrap`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap font-medium">
                  {item.assignedTo || (
                    <span className="text-slate-400 italic">Unassigned</span>
                  )}
                </td>
              </tr>
            ))}
            {!filteredData.length && (
              <tr>
                <td colSpan={8} className="text-center text-sm text-slate-500 py-8">
                  No cases match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-slate-600">
        <div>
          Showing {filteredData.length} of {total} cases
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={pageSize.toString()}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[90px] h-8">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}/page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Prev
          </Button>
          <span>
            Page {page} of {totalPages || 1}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage(Math.min(totalPages || 1, page + 1))}
            disabled={page === (totalPages || 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
