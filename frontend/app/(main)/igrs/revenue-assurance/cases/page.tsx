"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIGRSCases } from "@/hooks/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatINR } from "@/lib/data/utils/format-currency";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, X } from "lucide-react";
import type { IGRSCaseFilters } from "@/lib/data/types";

const STATUS_OPTIONS = ["New", "In Review", "Confirmed", "Resolved", "Rejected"];
const RISK_OPTIONS = ["High", "Medium", "Low"];
const SIGNAL_OPTIONS = [
  { value: "RevenueGap", label: "Revenue Gap" },
  { value: "MarketValueRisk", label: "Market Value Risk" },
  { value: "ChallanDelay", label: "Challan Delay" },
  { value: "ExemptionRisk", label: "Exemption Risk" },
  { value: "DataIntegrity", label: "Data Integrity" },
  { value: "HolidayFee", label: "Holiday Fee" },
  { value: "ProhibitedLand", label: "Prohibited Land" },
];
const OFFICE_OPTIONS = [
  { value: "SR01", label: "SR01 - Vijayawada Central" },
  { value: "SR02", label: "SR02 - Guntur Main" },
  { value: "SR03", label: "SR03 - Tirupati Urban" },
  { value: "SR04", label: "SR04 - Kurnool Town" },
  { value: "SR05", label: "SR05 - Visakhapatnam Port" },
  { value: "SR06", label: "SR06 - Rajahmundry Central" },
  { value: "SR07", label: "SR07 - Eluru Town" },
  { value: "SR08", label: "SR08 - Ongole Main" },
  { value: "SR09", label: "SR09 - Nellore City" },
  { value: "SR10", label: "SR10 - Anantapur Main" },
];

type SortField = "caseId" | "riskLevel" | "gapInr" | "status" | "createdAt";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "New": return "outline";
    case "In Review": return "secondary";
    case "Confirmed": return "default";
    case "Resolved": return "default";
    case "Rejected": return "destructive";
    default: return "outline";
  }
}

function riskVariant(level: string): "default" | "secondary" | "destructive" | "outline" {
  switch (level) {
    case "High": return "destructive";
    case "Medium": return "secondary";
    case "Low": return "outline";
    default: return "outline";
  }
}

export default function CasesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [signalFilter, setSignalFilter] = useState<string>("all");
  const [officeFilter, setOfficeFilter] = useState<string>("all");
  const [minGap, setMinGap] = useState<string>("");
  const [maxGap, setMaxGap] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const filters: IGRSCaseFilters = {
    search: search || undefined,
    status: statusFilter !== "all" ? [statusFilter] : undefined,
    riskLevel: riskFilter !== "all" ? [riskFilter] : undefined,
    signals: signalFilter !== "all" ? [signalFilter] : undefined,
    office: officeFilter !== "all" ? [officeFilter] : undefined,
    minGap: minGap ? Number(minGap) : undefined,
    maxGap: maxGap ? Number(maxGap) : undefined,
    sortBy,
    sortOrder,
    page,
    pageSize: 20,
  };

  const { data, total, totalPages, loading, error, refetch } = useIGRSCases(filters);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1" />
    );
  };

  const activeFilterCount = [
    statusFilter !== "all",
    riskFilter !== "all",
    signalFilter !== "all",
    officeFilter !== "all",
    !!minGap,
    !!maxGap,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter("all");
    setRiskFilter("all");
    setSignalFilter("all");
    setOfficeFilter("all");
    setMinGap("");
    setMaxGap("");
    setSearch("");
    setPage(1);
  };

  if (loading)
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-10 bg-gray-200 rounded w-full" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button onClick={refetch} className="mt-2 text-sm text-red-600 underline">
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cases</h1>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            <X className="w-3 h-3 mr-1" />
            Clear {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col gap-3">
            {/* Row 1: Search + Status + Risk */}
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search case ID, SRO, doc type..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 w-[260px] h-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[150px] h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={(v) => { setRiskFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[150px] h-9 text-xs">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  {RISK_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Row 2: Signal + Office + Gap Range */}
            <div className="flex flex-wrap gap-2">
              <Select value={signalFilter} onValueChange={(v) => { setSignalFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <SelectValue placeholder="Signal Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Signals</SelectItem>
                  {SIGNAL_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={officeFilter} onValueChange={(v) => { setOfficeFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[210px] h-9 text-xs">
                  <SelectValue placeholder="SRO Office" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Offices</SelectItem>
                  {OFFICE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="Min gap"
                  value={minGap}
                  onChange={(e) => { setMinGap(e.target.value); setPage(1); }}
                  className="w-[110px] h-9 text-xs"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="number"
                  placeholder="Max gap"
                  value={maxGap}
                  onChange={(e) => { setMaxGap(e.target.value); setPage(1); }}
                  className="w-[110px] h-9 text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {total} case{total !== 1 ? "s" : ""} found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("caseId")}
                  >
                    <span className="inline-flex items-center">
                      Case ID <SortIcon field="caseId" />
                    </span>
                  </TableHead>
                  <TableHead>SRO</TableHead>
                  <TableHead>Doc Type</TableHead>
                  <TableHead>Signals</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("riskLevel")}
                  >
                    <span className="inline-flex items-center">
                      Risk <SortIcon field="riskLevel" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none"
                    onClick={() => handleSort("gapInr")}
                  >
                    <span className="inline-flex items-center justify-end w-full">
                      Gap <SortIcon field="gapInr" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("status")}
                  >
                    <span className="inline-flex items-center">
                      Status <SortIcon field="status" />
                    </span>
                  </TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort("createdAt")}
                  >
                    <span className="inline-flex items-center">
                      Created <SortIcon field="createdAt" />
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No cases match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/igrs/revenue-assurance/cases/${c.id}`)}
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        {c.caseId}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="font-mono text-xs">{c.office.srCode}</span>
                        <span className="text-muted-foreground ml-1 text-xs hidden lg:inline">
                          {c.office.srName}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate text-sm">
                        {c.docType.abDesc}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-0.5">
                          {c.leakageSignals.slice(0, 2).map((s) => (
                            <Badge key={s} variant="outline" className="text-[9px] px-1 py-0">
                              {s.replace(/([A-Z])/g, " $1").trim().split(" ").map(w => w[0]).join("")}
                            </Badge>
                          ))}
                          {c.leakageSignals.length > 2 && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                              +{c.leakageSignals.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={riskVariant(c.riskLevel)}>{c.riskLevel}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatINR(c.gapInr)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{c.assignedTo ?? "Unassigned"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
