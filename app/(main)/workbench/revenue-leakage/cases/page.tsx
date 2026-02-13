"use client";

import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { RevenueLeakageShell } from "@/components/revenue-leakage/RevenueLeakageShell";
import { RevenueLeakageCaseDrawer } from "@/components/revenue-leakage/RevenueLeakageCaseDrawer";
import { CreateManualCaseSheet } from "@/components/revenue-leakage/CreateManualCaseSheet";
import { revenueLeakageApi } from "@/lib/revenue-leakage/revenueLeakageApi";
import {
  LeakageCase,
  LeakageSignal,
  CaseStatus,
  RiskLevel,
  LandNature,
  AgeingBucket,
} from "@/lib/revenue-leakage/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DensityToggle } from "@/components/cash-app/DensityToggle";
import { DensityMode } from "@/components/cash-app/cash-app-theme";
import { toast } from "sonner";
import { Filter, Search, FileDown, UserPlus, CheckCircle2, Plus } from "lucide-react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const riskBadge: Record<RiskLevel, string> = {
  High: "bg-red-600 text-white border-red-700",
  Medium: "bg-amber-500 text-white border-amber-600",
  Low: "bg-emerald-600 text-white border-emerald-700",
};

const signalLabels: Record<LeakageSignal, string> = {
  RevenueGap: "Revenue Gap",
  ChallanDelay: "Challan Delay",
  ExemptionRisk: "Exemption Risk",
  MarketValueRisk: "Market Value",
  ProhibitedLand: "Prohibited Land",
  DataIntegrity: "Data Integrity",
  HolidayFee: "Holiday Fee",
};

const signalColor: Record<LeakageSignal, string> = {
  RevenueGap: "bg-red-100 text-red-800 border-red-300",
  ChallanDelay: "bg-orange-100 text-orange-800 border-orange-300",
  ExemptionRisk: "bg-purple-100 text-purple-800 border-purple-300",
  MarketValueRisk: "bg-sky-100 text-sky-800 border-sky-300",
  ProhibitedLand: "bg-pink-100 text-pink-800 border-pink-300",
  DataIntegrity: "bg-slate-200 text-slate-800 border-slate-400",
  HolidayFee: "bg-amber-100 text-amber-800 border-amber-300",
};

const statusColor: Record<string, string> = {
  New: "bg-blue-600 text-white",
  "In Review": "bg-amber-500 text-white",
  Confirmed: "bg-orange-600 text-white",
  Resolved: "bg-emerald-600 text-white",
  Rejected: "bg-slate-500 text-white",
};

const confidenceColor = (pct: number) => {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 60) return "bg-amber-500";
  return "bg-red-500";
};

export default function RevenueLeakageCasesPage() {
  return (
    <Suspense
      fallback={
        <RevenueLeakageShell subtitle="Revenue leakage cases">
          <div className="flex items-center justify-center h-64 text-slate-400">
            Loading cases...
          </div>
        </RevenueLeakageShell>
      }
    >
      <RevenueLeakageCasesContent />
    </Suspense>
  );
}

function RevenueLeakageCasesContent() {
  const [cases, setCases] = useState<LeakageCase[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawerCase, setDrawerCase] = useState<LeakageCase | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [confirmResolveOpen, setConfirmResolveOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilters, setRiskFilters] = useState<RiskLevel[]>([]);
  const [signalFilters, setSignalFilters] = useState<LeakageSignal[]>([]);
  const [statusFilters, setStatusFilters] = useState<CaseStatus[]>([]);
  const [dateRange, setDateRange] = useState("all");
  const [dateField, setDateField] = useState<"P_DATE" | "R_DATE">("R_DATE");
  const [sortBy, setSortBy] = useState("risk");
  const [officeFilter, setOfficeFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [minGap, setMinGap] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [docTypeFilter, setDocTypeFilter] = useState("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<"all" | "urban" | "rural">("all");
  const [landNatureFilter, setLandNatureFilter] = useState<"all" | LandNature>("all");
  const [minConfidence, setMinConfidence] = useState("");
  const [minImpact, setMinImpact] = useState("");
  const [slaFilter, setSlaFilter] = useState<"all" | "breached" | "within">("all");
  const [ageingFilter, setAgeingFilter] = useState<"all" | AgeingBucket>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [density, setDensity] = useState<DensityMode>("compact");
  const [editedCaseIds, setEditedCaseIds] = useState<Set<string>>(new Set());
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const searchParams = useSearchParams();

  // Read URL query params (from AI Chat "Expand" action)
  useEffect(() => {
    const zone = searchParams.get("zone");
    const district = searchParams.get("district");
    const risk = searchParams.get("risk");
    const signal = searchParams.get("signal");
    const minGapParam = searchParams.get("minGap");
    const sla = searchParams.get("sla");
    const status = searchParams.get("status");

    if (zone) setZoneFilter(zone);
    if (district) setDistrictFilter(district);
    if (risk) setRiskFilters(risk.split(",") as RiskLevel[]);
    if (signal) setSignalFilters(signal.split(",") as LeakageSignal[]);
    if (minGapParam) setMinGap(minGapParam);
    if (sla) setSlaFilter(sla as "all" | "breached" | "within");
    if (status) setStatusFilters(status.split(",") as CaseStatus[]);
  }, [searchParams]);

  useEffect(() => {
    revenueLeakageApi.getCases().then((data) => {
      setCases(data);
      const edited = new Set<string>();
      data.forEach((c) => {
        if (revenueLeakageApi.caseHasOverrides(c.case_id)) edited.add(c.case_id);
      });
      setEditedCaseIds(edited);
    });
  }, []);

  const refetchCases = () => {
    revenueLeakageApi.getCases().then((data) => {
      setCases(data);
      const edited = new Set<string>();
      data.forEach((c) => {
        if (revenueLeakageApi.caseHasOverrides(c.case_id)) edited.add(c.case_id);
      });
      setEditedCaseIds(edited);
    });
  };

  const handleOpenCase = (item: LeakageCase) => {
    setDrawerCase(item);
    setDrawerOpen(true);
  };

  const addNote = async (caseId: string, note: string) => {
    await revenueLeakageApi.addNote(caseId, note, "Current User");
    const updated = await revenueLeakageApi.getCases();
    setCases(updated);
    if (drawerCase?.case_id === caseId) {
      const latest = updated.find((item) => item.case_id === caseId) || null;
      setDrawerCase(latest);
    }
  };

  const resetCase = async (caseId: string) => {
    await revenueLeakageApi.resetCase(caseId);
    const updated = await revenueLeakageApi.getCases();
    setCases(updated);
    setEditedCaseIds((prev) => {
      const next = new Set(prev);
      next.delete(caseId);
      return next;
    });
    if (drawerCase?.case_id === caseId) {
      const latest = updated.find((item) => item.case_id === caseId) || null;
      setDrawerCase(latest);
    }
    toast.success("Case reset to original");
  };

  // Re-sync editedCaseIds after any case update
  const updateCase = async (caseId: string, updates: Partial<LeakageCase>) => {
    await revenueLeakageApi.updateCase(caseId, updates);
    const updated = await revenueLeakageApi.getCases();
    setCases(updated);
    if (drawerCase?.case_id === caseId) {
      const latest = updated.find((item) => item.case_id === caseId) || null;
      setDrawerCase(latest);
    }
    if (revenueLeakageApi.caseHasOverrides(caseId)) {
      setEditedCaseIds((prev) => new Set(prev).add(caseId));
    }
  };

  const toggleFilter = <T extends string>(value: T, list: T[], setter: (next: T[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else {
      setter([...list, value]);
    }
  };

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setPage(1);
  }, [
    searchQuery,
    riskFilters,
    signalFilters,
    statusFilters,
    officeFilter,
    ownerFilter,
    minGap,
    districtFilter,
    zoneFilter,
    docTypeFilter,
    propertyTypeFilter,
    landNatureFilter,
    minConfidence,
    minImpact,
    slaFilter,
    ageingFilter,
    dateRange,
    dateField,
    sortBy,
  ]);

  const filteredCases = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return cases
      .filter((item) => {
        if (searchQuery) {
          const caseIdMatch = item.case_id.toLowerCase().includes(searchLower);
          const docKey = `${item.document_key.SR_CODE}/${item.document_key.BOOK_NO}/${item.document_key.DOCT_NO}/${item.document_key.REG_YEAR}`;
          const partyMatch = item.parties_summary.some((p) =>
            p.NAME.toLowerCase().includes(searchLower)
          );
          const propertyMatch = item.property_summary.is_urban
            ? item.property_summary.urban?.DOOR_NO?.toLowerCase().includes(searchLower)
            : item.property_summary.rural?.SURVEY_NO?.toLowerCase().includes(searchLower);
          if (
            !caseIdMatch &&
            !docKey.toLowerCase().includes(searchLower) &&
            !partyMatch &&
            !propertyMatch
          ) {
            return false;
          }
        }
        if (riskFilters.length && !riskFilters.includes(item.risk_level)) return false;
        if (
          signalFilters.length &&
          !signalFilters.some((signal) => item.leakage_signals.includes(signal))
        )
          return false;
        if (statusFilters.length && !statusFilters.includes(item.case_status)) return false;
        if (officeFilter !== "all" && item.office.SR_CODE !== officeFilter) return false;
        if (ownerFilter !== "all" && (item.assigned_to || "Unassigned") !== ownerFilter)
          return false;
        if (minGap && item.gap_inr < Number(minGap)) return false;
        if (districtFilter !== "all" && item.office.district !== districtFilter) return false;
        if (zoneFilter !== "all" && item.office.zone !== zoneFilter) return false;
        if (docTypeFilter !== "all" && item.doc_type.TRAN_DESC !== docTypeFilter) return false;
        if (propertyTypeFilter !== "all") {
          if (propertyTypeFilter === "urban" && !item.property_summary.is_urban) return false;
          if (propertyTypeFilter === "rural" && item.property_summary.is_urban) return false;
        }
        if (landNatureFilter !== "all" && item.property_summary.land_nature !== landNatureFilter)
          return false;
        if (minConfidence && item.confidence < Number(minConfidence)) return false;
        if (minImpact && item.impact_amount_inr < Number(minImpact)) return false;
        if (slaFilter !== "all" && item.sla) {
          if (slaFilter === "breached" && !item.sla.sla_breached) return false;
          if (slaFilter === "within" && item.sla.sla_breached) return false;
        }
        if (ageingFilter !== "all" && item.sla?.ageing_bucket !== ageingFilter) return false;

        if (dateRange !== "all") {
          const dateToCheck = dateField === "P_DATE" ? item.dates.P_DATE : item.dates.R_DATE;
          const diffDays = (Date.now() - new Date(dateToCheck).getTime()) / (1000 * 60 * 60 * 24);
          const maxDays = dateRange === "30" ? 30 : dateRange === "90" ? 90 : 180;
          if (diffDays > maxDays) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "impact") return b.impact_amount_inr - a.impact_amount_inr;
        if (sortBy === "newest") return b.created_at.localeCompare(a.created_at);
        if (sortBy === "delay") {
          const delayA = a.evidence.included_receipts.reduce((sum, receipt) => {
            if (!receipt.BANK_CHALLAN_DT || !receipt.RECEIPT_DATE) return sum;
            return (
              sum +
              Math.max(
                0,
                (new Date(receipt.RECEIPT_DATE).getTime() -
                  new Date(receipt.BANK_CHALLAN_DT).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            );
          }, 0);
          const delayB = b.evidence.included_receipts.reduce((sum, receipt) => {
            if (!receipt.BANK_CHALLAN_DT || !receipt.RECEIPT_DATE) return sum;
            return (
              sum +
              Math.max(
                0,
                (new Date(receipt.RECEIPT_DATE).getTime() -
                  new Date(receipt.BANK_CHALLAN_DT).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            );
          }, 0);
          return delayB - delayA;
        }
        return b.risk_score - a.risk_score;
      });
  }, [
    cases,
    searchQuery,
    riskFilters,
    signalFilters,
    statusFilters,
    officeFilter,
    ownerFilter,
    minGap,
    districtFilter,
    zoneFilter,
    docTypeFilter,
    propertyTypeFilter,
    landNatureFilter,
    minConfidence,
    minImpact,
    slaFilter,
    ageingFilter,
    dateRange,
    dateField,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / pageSize));
  const paginatedCases = filteredCases.slice((page - 1) * pageSize, page * pageSize);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedCases.map((item) => item.case_id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleCaseSelect = (caseId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, caseId]);
    } else {
      setSelectedIds(selectedIds.filter((id) => id !== caseId));
    }
  };

  const bulkAssign = async () => {
    await Promise.all(
      selectedIds.map((id) => revenueLeakageApi.updateCase(id, { assigned_to: "Current User" }))
    );
    toast.success(`Assigned ${selectedIds.length} cases`);
    const updated = await revenueLeakageApi.getCases();
    setCases(updated);
    setSelectedIds([]);
  };

  const bulkMarkInReview = async () => {
    await Promise.all(
      selectedIds.map((id) => revenueLeakageApi.updateCase(id, { case_status: "In Review" }))
    );
    toast.success(`Marked ${selectedIds.length} cases In Review`);
    const updated = await revenueLeakageApi.getCases();
    setCases(updated);
    setSelectedIds([]);
  };

  const bulkExport = () => {
    toast.success(`Export queued for ${selectedIds.length} cases`);
    setSelectedIds([]);
  };

  const bulkResolve = async () => {
    await Promise.all(
      selectedIds.map((id) => revenueLeakageApi.updateCase(id, { case_status: "Resolved" }))
    );
    toast.success(`Resolved ${selectedIds.length} cases`);
    const updated = await revenueLeakageApi.getCases();
    setCases(updated);
    setSelectedIds([]);
    setConfirmResolveOpen(false);
  };

  const officeOptions = Array.from(new Set(cases.map((item) => item.office.SR_CODE)));
  const ownerOptions = Array.from(new Set(cases.map((item) => item.assigned_to || "Unassigned")));
  const districtOptions = Array.from(
    new Set(cases.map((item) => item.office.district).filter(Boolean))
  ).sort();
  const zoneOptions = Array.from(
    new Set(cases.map((item) => item.office.zone).filter((z) => z && z !== "—"))
  ).sort();
  const docTypeOptions = Array.from(
    new Set(cases.map((item) => item.doc_type.TRAN_DESC).filter(Boolean))
  ).sort();
  const landNatureOptions = Array.from(
    new Set(cases.map((item) => item.property_summary.land_nature).filter(Boolean))
  ) as LandNature[];
  const ageingBucketOptions = Array.from(
    new Set(cases.map((item) => item.sla?.ageing_bucket).filter(Boolean))
  ) as AgeingBucket[];

  const moreFilterCount = [
    officeFilter !== "all",
    ownerFilter !== "all",
    minGap !== "",
    districtFilter !== "all",
    zoneFilter !== "all",
    docTypeFilter !== "all",
    propertyTypeFilter !== "all",
    landNatureFilter !== "all",
    minConfidence !== "",
    minImpact !== "",
    slaFilter !== "all",
    ageingFilter !== "all",
  ].filter(Boolean).length;

  return (
    <RevenueLeakageShell subtitle="Operational leakage cases with evidence-backed explainability">
      <div className="px-6 py-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search Case ID, Doc Key, Party, Property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[260px]"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterOpen(true)}
            className={moreFilterCount > 0 ? "border-blue-500 text-blue-700 bg-blue-50" : ""}
          >
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            More Filters
            {moreFilterCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                {moreFilterCount}
              </span>
            )}
          </Button>
          {/* Create Case button hidden
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setCreateSheetOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Case
          </Button>
          */}
          <Select
            value={`${dateField}:${dateRange}`}
            onValueChange={(v) => {
              const [f, r] = v.split(":");
              setDateField(f as "P_DATE" | "R_DATE");
              setDateRange(r);
            }}
          >
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="R_DATE:all">Registration — All</SelectItem>
              <SelectItem value="R_DATE:30">Registration — 30 days</SelectItem>
              <SelectItem value="R_DATE:90">Registration — 90 days</SelectItem>
              <SelectItem value="R_DATE:180">Registration — 180 days</SelectItem>
              <SelectItem value="P_DATE:all">Presentation — All</SelectItem>
              <SelectItem value="P_DATE:30">Presentation — 30 days</SelectItem>
              <SelectItem value="P_DATE:90">Presentation — 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="risk">Sort: Risk</SelectItem>
              <SelectItem value="impact">Sort: Impact</SelectItem>
              <SelectItem value="newest">Sort: Newest</SelectItem>
              <SelectItem value="delay">Sort: Delay</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto">
            <DensityToggle density={density} onDensityChange={setDensity} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 py-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide mr-0.5">
            Risk
          </span>
          {[
            {
              key: "High" as RiskLevel,
              active: "bg-red-600 text-white border-red-700 shadow-sm",
              idle: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
            },
            {
              key: "Medium" as RiskLevel,
              active: "bg-amber-500 text-white border-amber-600 shadow-sm",
              idle: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
            },
            {
              key: "Low" as RiskLevel,
              active: "bg-emerald-600 text-white border-emerald-700 shadow-sm",
              idle: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
            },
          ].map(({ key, active, idle }) => (
            <button
              key={key}
              onClick={() => toggleFilter(key, riskFilters, setRiskFilters)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${riskFilters.includes(key) ? active : idle}`}
            >
              {key}
            </button>
          ))}

          <span className="text-slate-300 mx-1.5">|</span>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide mr-0.5">
            Signal
          </span>
          {(Object.keys(signalLabels) as LeakageSignal[]).map((signal) => (
            <button
              key={signal}
              onClick={() => toggleFilter(signal, signalFilters, setSignalFilters)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                signalFilters.includes(signal)
                  ? signalColor[signal] + " shadow-sm ring-1 ring-offset-1 ring-current"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {signalLabels[signal]}
            </button>
          ))}

          <span className="text-slate-300 mx-1.5">|</span>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide mr-0.5">
            Status
          </span>
          {(["New", "In Review", "Confirmed", "Resolved", "Rejected"] as CaseStatus[]).map(
            (status) => (
              <button
                key={status}
                onClick={() => toggleFilter(status, statusFilters, setStatusFilters)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                  statusFilters.includes(status)
                    ? (statusColor[status] || "bg-slate-600 text-white") +
                      " border-transparent shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {status}
              </button>
            )
          )}
        </div>

        {selectedIds.length > 0 && (
          <Card className="p-3 flex items-center justify-between">
            <p className="text-sm text-slate-600">{selectedIds.length} cases selected</p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={bulkAssign}>
                <UserPlus className="w-4 h-4 mr-2" />
                Assign
              </Button>
              <Button size="sm" variant="outline" onClick={bulkMarkInReview}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark In Review
              </Button>
              <Button size="sm" variant="outline" onClick={bulkExport}>
                <FileDown className="w-4 h-4 mr-2" />
                Export Selected
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setConfirmResolveOpen(true)}>
                Resolve Selected
              </Button>
            </div>
          </Card>
        )}

        <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-sm">
          <table className="text-sm" style={{ minWidth: 1600 }}>
            <thead className="text-xs uppercase text-slate-200 bg-slate-800">
              <tr>
                <th
                  className="px-3 py-2.5 text-left sticky left-0 bg-slate-800 z-10"
                  style={{ minWidth: 40 }}
                >
                  <Checkbox
                    checked={
                      selectedIds.length === paginatedCases.length && paginatedCases.length > 0
                    }
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                </th>
                <th
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                  style={{ minWidth: 110 }}
                >
                  Case ID
                </th>
                <th
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                  style={{ minWidth: 180 }}
                >
                  Document
                </th>
                <th
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                  style={{ minWidth: 100 }}
                >
                  Reg Date
                </th>
                <th
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                  style={{ minWidth: 120 }}
                >
                  Doc Type
                </th>
                <th
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                  style={{ minWidth: 160 }}
                >
                  Office
                </th>
                <th
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                  style={{ minWidth: 180 }}
                >
                  Property
                </th>
                <th
                  className="px-3 py-2.5 text-right whitespace-nowrap font-semibold"
                  style={{ minWidth: 100 }}
                >
                  Payable
                </th>
                <th
                  className="px-3 py-2.5 text-right whitespace-nowrap font-semibold"
                  style={{ minWidth: 100 }}
                >
                  Paid
                </th>
                <th
                  className="px-3 py-2.5 text-right whitespace-nowrap font-semibold"
                  style={{ minWidth: 100 }}
                >
                  Gap
                </th>
                <th
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                  style={{ minWidth: 160 }}
                >
                  Signals
                </th>
                <th
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                  style={{ minWidth: 80 }}
                >
                  Risk
                </th>
                <th
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                  style={{ minWidth: 110 }}
                >
                  Confidence
                </th>
                <th
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                  style={{ minWidth: 90 }}
                >
                  Status
                </th>
                <th
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                  style={{ minWidth: 110 }}
                >
                  Owner
                </th>
                <th
                  className="px-3 py-2.5 text-left whitespace-nowrap font-semibold"
                  style={{ minWidth: 80 }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedCases.map((item) => {
                const py = density === "compact" ? "py-2.5" : "py-3.5";
                return (
                  <tr
                    key={item.case_id}
                    className="text-slate-800 hover:bg-blue-50/50 transition-colors"
                  >
                    <td className={`px-3 ${py} sticky left-0 bg-white z-10`}>
                      <Checkbox
                        checked={selectedIds.includes(item.case_id)}
                        onCheckedChange={(checked) => toggleCaseSelect(item.case_id, !!checked)}
                      />
                    </td>
                    <td className={`px-3 ${py} font-semibold text-slate-900 whitespace-nowrap`}>
                      {item.case_id}
                      {editedCaseIds.has(item.case_id) && (
                        <span
                          className="inline-block w-2 h-2 rounded-full bg-amber-400 ml-1.5 align-middle"
                          title="Locally edited"
                        />
                      )}
                    </td>
                    <td
                      className={`px-3 ${py} text-blue-700 font-semibold cursor-pointer whitespace-nowrap hover:underline`}
                      onClick={() => handleOpenCase(item)}
                    >
                      {item.document_key.SR_CODE}/{item.document_key.BOOK_NO}/
                      {item.document_key.DOCT_NO}/{item.document_key.REG_YEAR}
                    </td>
                    <td className={`px-3 ${py} whitespace-nowrap`}>{item.dates.R_DATE}</td>
                    <td className={`px-3 ${py} whitespace-nowrap`}>{item.doc_type.TRAN_DESC}</td>
                    <td className={`px-3 ${py} whitespace-nowrap`}>
                      {item.office.SR_CODE} · {item.office.SR_NAME}
                    </td>
                    <td className={`px-3 ${py} whitespace-nowrap`}>
                      {item.property_summary.is_urban
                        ? `Ward ${item.property_summary.urban?.WARD_NO} / Door ${item.property_summary.urban?.DOOR_NO}`
                        : `Village ${item.property_summary.rural?.VILLAGE_CODE} / Survey ${item.property_summary.rural?.SURVEY_NO}`}
                    </td>
                    <td className={`px-3 ${py} text-right font-medium whitespace-nowrap`}>
                      {formatCurrency(item.payable_total_inr)}
                    </td>
                    <td className={`px-3 ${py} text-right font-medium whitespace-nowrap`}>
                      {formatCurrency(item.paid_total_inr)}
                    </td>
                    <td
                      className={`px-3 ${py} text-right font-bold whitespace-nowrap ${item.gap_inr > 10000 ? "text-red-600" : item.gap_inr > 0 ? "text-amber-600" : "text-emerald-600"}`}
                    >
                      {formatCurrency(item.gap_inr)}
                    </td>
                    <td className={`px-3 ${py}`}>
                      <div className="flex flex-nowrap gap-1">
                        {item.leakage_signals.map((signal) => (
                          <span
                            key={signal}
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${signalColor[signal]} whitespace-nowrap`}
                          >
                            {signalLabels[signal]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={`px-3 ${py}`}>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${riskBadge[item.risk_level]} whitespace-nowrap`}
                      >
                        {item.risk_level}
                      </span>
                    </td>
                    <td className={`px-3 ${py}`}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${confidenceColor(item.confidence)}`}
                            style={{ width: `${item.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                          {item.confidence}%
                        </span>
                      </div>
                    </td>
                    <td className={`px-3 ${py}`}>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${statusColor[item.case_status] || "bg-slate-500 text-white"} whitespace-nowrap`}
                      >
                        {item.case_status}
                      </span>
                    </td>
                    <td className={`px-3 ${py} whitespace-nowrap font-medium`}>
                      {item.assigned_to || (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className={`px-3 ${py}`}>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleOpenCase(item)}
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {!paginatedCases.length && (
                <tr>
                  <td colSpan={16} className="text-center text-sm text-slate-500 py-6">
                    No cases match the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-600">
          <div>
            Showing {paginatedCases.length} of {filteredCases.length} cases
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
                {[10, 15, 25].map((size) => (
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
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent className="w-[400px] sm:max-w-[400px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Filters{" "}
              {moreFilterCount > 0 && (
                <span className="text-sm font-normal text-slate-500">
                  ({moreFilterCount} active)
                </span>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-5">
            {/* ── Location ── */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-2">
                Location
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500">Office</label>
                  <Select value={officeFilter} onValueChange={setOfficeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Offices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Offices</SelectItem>
                      {officeOptions.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">District</label>
                  <Select value={districtFilter} onValueChange={setDistrictFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Districts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Districts</SelectItem>
                      {districtOptions.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Zone</label>
                  <Select value={zoneFilter} onValueChange={setZoneFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Zones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Zones</SelectItem>
                      {zoneOptions.map((z) => (
                        <SelectItem key={z} value={z}>
                          {z}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* ── Document & Property ── */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-2">
                Document & Property
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500">Document Type</label>
                  <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Doc Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Doc Types</SelectItem>
                      {docTypeOptions.map((dt) => (
                        <SelectItem key={dt} value={dt}>
                          {dt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Property Type</label>
                  <Select
                    value={propertyTypeFilter}
                    onValueChange={(v) => setPropertyTypeFilter(v as "all" | "urban" | "rural")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="urban">Urban</SelectItem>
                      <SelectItem value="rural">Rural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Land Nature</label>
                  <Select
                    value={landNatureFilter}
                    onValueChange={(v) => setLandNatureFilter(v as "all" | LandNature)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {landNatureOptions.map((ln) => (
                        <SelectItem key={ln} value={ln}>
                          {ln}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* ── Assignment ── */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-2">
                Assignment
              </p>
              <div>
                <label className="text-xs text-slate-500">Owner</label>
                <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Owners" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Owners</SelectItem>
                    {ownerOptions.map((owner) => (
                      <SelectItem key={owner} value={owner}>
                        {owner}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Amounts ── */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-2">
                Amounts
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">Min Gap (₹)</label>
                  <Input
                    value={minGap}
                    onChange={(e) => setMinGap(e.target.value)}
                    placeholder="e.g. 10000"
                    type="number"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Min Impact (₹)</label>
                  <Input
                    value={minImpact}
                    onChange={(e) => setMinImpact(e.target.value)}
                    placeholder="e.g. 50000"
                    type="number"
                  />
                </div>
              </div>
            </div>

            {/* ── Confidence ── */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-2">
                Confidence
              </p>
              <div>
                <label className="text-xs text-slate-500">Min Confidence (%)</label>
                <Input
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(e.target.value)}
                  placeholder="e.g. 70"
                  type="number"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            {/* ── SLA & Ageing ── */}
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-2">
                SLA & Ageing
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500">SLA Status</label>
                  <Select
                    value={slaFilter}
                    onValueChange={(v) => setSlaFilter(v as "all" | "breached" | "within")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="breached">SLA Breached</SelectItem>
                      <SelectItem value="within">Within SLA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Ageing Bucket</label>
                  <Select
                    value={ageingFilter}
                    onValueChange={(v) => setAgeingFilter(v as "all" | AgeingBucket)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {ageingBucketOptions.map((bucket) => (
                        <SelectItem key={bucket} value={bucket}>
                          {bucket}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setOfficeFilter("all");
                  setOwnerFilter("all");
                  setMinGap("");
                  setDistrictFilter("all");
                  setZoneFilter("all");
                  setDocTypeFilter("all");
                  setPropertyTypeFilter("all");
                  setLandNatureFilter("all");
                  setMinConfidence("");
                  setMinImpact("");
                  setSlaFilter("all");
                  setAgeingFilter("all");
                }}
              >
                Reset All
              </Button>
              <Button onClick={() => setFilterOpen(false)}>Apply</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={confirmResolveOpen} onOpenChange={setConfirmResolveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Selected Cases</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">This will mark selected cases as Resolved.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmResolveOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={bulkResolve}>
              Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RevenueLeakageCaseDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        caseItem={drawerCase}
        onUpdateCase={updateCase}
        onAddNote={addNote}
        onResetCase={resetCase}
        isEdited={drawerCase ? editedCaseIds.has(drawerCase.case_id) : false}
      />

      <CreateManualCaseSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        onCaseCreated={refetchCases}
      />
    </RevenueLeakageShell>
  );
}
