"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useJurisdictionFilteredCases } from "@/hooks/data/use-jurisdiction-filtered-cases";
import { useIGRSCaseMutation } from "@/hooks/data";
import { JurisdictionBadge } from "@/components/igrs/jurisdiction-badge";
import type {
  IGRSCase,
  IGRSCaseFilters,
  IGRSCaseNote,
  IGRSLeakageSignal,
  CashReconciliationEvidenceExtended,
  StampInventoryEvidenceExtended,
  ClassificationFraudEvidenceExtended,
} from "@/lib/data/types";
import { formatINR } from "@/lib/data/utils/format-currency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileDown,
  Filter,
  LayoutGrid,
  List,
  Search,
  StickyNote,
  UserPlus,
} from "lucide-react";

type SortMode = "risk" | "gap" | "newest";
type ViewMode = "table" | "compact";

type EscalateTarget =
  | "District Registrar"
  | "Joint Inspector General"
  | "Additional Inspector General"
  | "IG of Registration & Stamps";

const RISK_OPTIONS = ["High", "Medium", "Low"];
const STATUS_OPTIONS = ["New", "In Review", "Resolved"] as const;
const STATUS_NORMALIZATION: Record<string, (typeof STATUS_OPTIONS)[number]> = {
  Confirmed: "In Review",
  Rejected: "Resolved",
};
const SIGNAL_OPTIONS: Array<{ label: string; value: IGRSLeakageSignal }> = [
  { label: "Revenue Gap", value: "RevenueGap" },
  { label: "Challan Delay", value: "ChallanDelay" },
  { label: "Exemption Abuse", value: "ExemptionRisk" },
  { label: "Market Value", value: "MarketValueRisk" },
  { label: "Prohibited Land", value: "ProhibitedLand" },
  { label: "Data Integrity", value: "DataIntegrity" },
  { label: "Cash Recon", value: "CashReconciliation" },
  { label: "Stamp Inventory", value: "StampInventory" },
  { label: "Classification Fraud", value: "ClassificationFraud" },
];

const SIGNAL_BADGES: Record<IGRSLeakageSignal, string> = {
  RevenueGap: "bg-red-50 text-red-700 border-red-200",
  ChallanDelay: "bg-amber-50 text-amber-700 border-amber-200",
  ExemptionRisk: "bg-purple-50 text-purple-700 border-purple-200",
  MarketValueRisk: "bg-blue-50 text-blue-700 border-blue-200",
  ProhibitedLand: "bg-pink-50 text-pink-700 border-pink-200",
  DataIntegrity: "bg-slate-100 text-slate-700 border-slate-200",
  CashReconciliation: "bg-emerald-50 text-emerald-700 border-emerald-200",
  StampInventory: "bg-teal-50 text-teal-700 border-teal-200",
  ClassificationFraud: "bg-orange-50 text-orange-700 border-orange-200",
};

const SIGNAL_CHIP_STYLES: Record<
  IGRSLeakageSignal,
  { active: string; inactive: string }
> = {
  RevenueGap: {
    active: "bg-red-100 text-red-700 border-red-300",
    inactive: "bg-red-50 text-red-700 border-red-200",
  },
  ChallanDelay: {
    active: "bg-amber-100 text-amber-700 border-amber-300",
    inactive: "bg-amber-50 text-amber-700 border-amber-200",
  },
  ExemptionRisk: {
    active: "bg-purple-100 text-purple-700 border-purple-300",
    inactive: "bg-purple-50 text-purple-700 border-purple-200",
  },
  MarketValueRisk: {
    active: "bg-blue-100 text-blue-700 border-blue-300",
    inactive: "bg-blue-50 text-blue-700 border-blue-200",
  },
  ProhibitedLand: {
    active: "bg-pink-100 text-pink-700 border-pink-300",
    inactive: "bg-pink-50 text-pink-700 border-pink-200",
  },
  DataIntegrity: {
    active: "bg-slate-200 text-slate-700 border-slate-300",
    inactive: "bg-slate-100 text-slate-700 border-slate-200",
  },
  CashReconciliation: {
    active: "bg-emerald-100 text-emerald-700 border-emerald-300",
    inactive: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  StampInventory: {
    active: "bg-teal-100 text-teal-700 border-teal-300",
    inactive: "bg-teal-50 text-teal-700 border-teal-200",
  },
  ClassificationFraud: {
    active: "bg-orange-100 text-orange-700 border-orange-300",
    inactive: "bg-orange-50 text-orange-700 border-orange-200",
  },
};

const SIGNAL_LABELS: Record<IGRSLeakageSignal, string> = {
  RevenueGap: "Revenue Gap",
  ChallanDelay: "Challan Delay",
  ExemptionRisk: "Exemption Abuse",
  MarketValueRisk: "Market Value",
  ProhibitedLand: "Prohibited Land",
  DataIntegrity: "Data Integrity",
  CashReconciliation: "Cash Recon",
  StampInventory: "Stamp Inventory",
  ClassificationFraud: "Classification Fraud",
};

const RISK_BADGES: Record<string, string> = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const STATUS_BADGES: Record<string, string> = {
  New: "bg-blue-100 text-blue-700 border-blue-200",
  "In Review": "bg-amber-100 text-amber-700 border-amber-200",
  Resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function normalizeAuditStatus(status: string): (typeof STATUS_OPTIONS)[number] {
  return STATUS_NORMALIZATION[status] ?? (status as (typeof STATUS_OPTIONS)[number]);
}

function expandAuditStatuses(statuses: string[]): string[] {
  const raw = new Set<string>();
  for (const status of statuses) {
    if (status === "In Review") {
      raw.add("In Review");
      raw.add("Confirmed");
      continue;
    }
    if (status === "Resolved") {
      raw.add("Resolved");
      raw.add("Rejected");
      continue;
    }
    raw.add(status);
  }
  return Array.from(raw);
}

function formatDocKey(caseItem: IGRSCase): string {
  return `${caseItem.documentKey.srCode}/${caseItem.documentKey.bookNo}/${caseItem.documentKey.doctNo}/${caseItem.documentKey.regYear}`;
}

function toConfidencePct(value: number): number {
  if (value <= 1) return Math.round(value * 100);
  return Math.round(value);
}

function safeNote(raw: unknown): IGRSCaseNote {
  const now = new Date().toISOString();
  const note = raw as Partial<IGRSCaseNote> & { ts?: string; text?: string };
  return {
    id: note.id ?? `n-${Date.now()}`,
    author: note.author ?? "System",
    createdAt: note.createdAt ?? note.ts ?? now,
    note: note.note ?? note.text ?? "",
  };
}

function ageFromCreated(createdAt: string): number {
  const start = new Date(createdAt).getTime();
  const now = Date.now();
  if (Number.isNaN(start)) return 0;
  return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
}

function getSortConfig(mode: SortMode): { sortBy: string; sortOrder: "asc" | "desc" } {
  switch (mode) {
    case "risk":
      return { sortBy: "riskScore", sortOrder: "desc" };
    case "gap":
      return { sortBy: "gapInr", sortOrder: "desc" };
    case "newest":
    default:
      return { sortBy: "createdAt", sortOrder: "desc" };
  }
}

function ChipToggle({
  active,
  label,
  onClick,
  activeClassName,
  inactiveClassName,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  activeClassName?: string;
  inactiveClassName?: string;
}) {
  return (
    <button
      className={`px-2 py-0.5 rounded-full border text-[11px] font-medium transition-colors ${
        active
          ? (activeClassName ?? "bg-slate-100 text-slate-800 border-slate-300 shadow-sm")
          : (inactiveClassName ?? "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function CaseDrawer({
  open,
  onOpenChange,
  caseItem,
  assigneeOptions,
  onStatusChange,
  onAssigneeChange,
  onAddNote,
  onEscalate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseItem: IGRSCase | null;
  assigneeOptions: string[];
  onStatusChange: (status: string) => Promise<void>;
  onAssigneeChange: (assignee: string) => Promise<void>;
  onAddNote: (note: string) => Promise<void>;
  onEscalate: (target: EscalateTarget, reason: string) => Promise<void>;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [escalateTarget, setEscalateTarget] = useState<EscalateTarget>("District Registrar");
  const [escalateReason, setEscalateReason] = useState("");

  if (!caseItem) return null;

  const confidence = toConfidencePct(caseItem.confidence);
  const auditStatus = normalizeAuditStatus(caseItem.status);
  const ageDays = caseItem.sla?.ageingDays ?? ageFromCreated(caseItem.createdAt);
  const ageBucket = caseItem.sla?.ageingBucket ?? (ageDays > 30 ? "30d+" : ageDays > 14 ? "15-30d" : ageDays > 7 ? "8-14d" : "0-7d");
  const slaBreached = caseItem.sla?.slaBreached ?? ageDays > 30;

  const completenessChecklist = [
    { label: "Schedule present", ok: !!caseItem.docType.tranDesc },
    { label: "Parties present", ok: caseItem.partiesSummary.length > 0 },
    { label: "Receipts linked", ok: caseItem.evidence.receiptCount > 0 },
    { label: "Prohibited check complete", ok: true },
    { label: "MV evidence available", ok: caseItem.evidence.mvDeviationPct >= 0 },
    { label: "Exemption check complete", ok: caseItem.evidence.exemptionCount >= 0 },
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[760px] sm:max-w-[760px] p-0 flex flex-col">
          <SheetHeader className="px-6 pt-5 pb-4 border-b bg-gradient-to-r from-slate-800 to-slate-700 text-left">
            <div className="flex items-start justify-between gap-3">
              <div>
                <SheetTitle className="text-4 text-white font-bold tracking-tight">
                  {formatDocKey(caseItem)}
                </SheetTitle>
                <p className="text-xs text-slate-300 mt-1">Case ID {caseItem.caseId}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded text-xs font-bold border ${RISK_BADGES[caseItem.riskLevel]}`}>
                  {caseItem.riskLevel} Risk
                </span>
                <span className={`px-2.5 py-1 rounded text-xs font-bold border ${STATUS_BADGES[auditStatus]}`}>
                  {auditStatus}
                </span>
                <span className="px-2.5 py-1 rounded text-xs font-semibold bg-white/10 text-white border border-white/20">
                  {confidence}% conf.
                </span>
              </div>
            </div>

            <div
              className={`mt-3 flex items-center gap-2 px-3 py-1.5 rounded text-xs ${
                slaBreached ? "bg-red-500/20 text-red-200" : "bg-emerald-500/20 text-emerald-200"
              }`}
            >
              <Clock3 className="w-3.5 h-3.5" />
              <span>{ageDays}d old — Bucket: {ageBucket}</span>
              <span className="ml-auto font-bold">{slaBreached ? "SLA BREACHED" : "WITHIN SLA"}</span>
            </div>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Select value={auditStatus} onValueChange={(v) => void onStatusChange(v)}>
                <SelectTrigger className="h-8 w-[150px] text-xs bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={caseItem.assignedTo ?? "UNASSIGNED"}
                onValueChange={(v) => void onAssigneeChange(v === "UNASSIGNED" ? "" : v)}
              >
                <SelectTrigger className="h-8 w-[170px] text-xs bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Assign owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                  {assigneeOptions.map((owner) => (
                    <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="ml-auto flex items-center gap-1.5">
                <Button size="sm" variant="outline" className="h-8 text-xs bg-white/10 border-white/20 text-white" onClick={() => setEscalateOpen(true)}>
                  <UserPlus className="w-3.5 h-3.5 mr-1" /> Escalate
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs bg-white/10 border-white/20 text-white" onClick={() => setNoteOpen(true)}>
                  <StickyNote className="w-3.5 h-3.5 mr-1" /> Note
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs bg-white/10 border-white/20 text-white" onClick={() => toast.success("Export queued") }>
                  <FileDown className="w-3.5 h-3.5 mr-1" /> Export
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="summary" className="w-full">
              <div className="sticky top-0 z-10 bg-white border-b px-6 pt-3">
                <TabsList className="w-full justify-start overflow-x-auto h-9 gap-0 bg-slate-100 p-0.5 rounded-lg">
                  <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
                  <TabsTrigger value="payments" className="text-xs">Payments</TabsTrigger>
                  <TabsTrigger value="delay" className="text-xs">Delay</TabsTrigger>
                  <TabsTrigger value="property" className="text-xs">Property</TabsTrigger>
                  <TabsTrigger value="exemptions" className="text-xs">Exemptions</TabsTrigger>
                  <TabsTrigger value="prohibited" className="text-xs">Prohibited</TabsTrigger>
                  <TabsTrigger value="parties" className="text-xs">Parties</TabsTrigger>
                  <TabsTrigger value="explain" className="text-xs">Explain</TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
                  {caseItem.leakageSignals.includes("CashReconciliation") && (
                    <TabsTrigger value="cash-recon" className="text-xs">Cash Recon</TabsTrigger>
                  )}
                  {caseItem.leakageSignals.includes("StampInventory") && (
                    <TabsTrigger value="stamp-intel" className="text-xs">Stamp Intel</TabsTrigger>
                  )}
                  {caseItem.leakageSignals.includes("ClassificationFraud") && (
                    <TabsTrigger value="classification" className="text-xs">Classification</TabsTrigger>
                  )}
                </TabsList>
              </div>

              <TabsContent value="summary" className="px-6 py-4 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Payable Breakdown</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <Card className="p-3"><p className="text-xs text-slate-500">Stamp Duty</p><p className="text-3 font-bold">{formatINR(caseItem.payableBreakdown.sdPayable)}</p></Card>
                    <Card className="p-3"><p className="text-xs text-slate-500">Transfer Duty</p><p className="text-3 font-bold">{formatINR(caseItem.payableBreakdown.tdPayable)}</p></Card>
                    <Card className="p-3"><p className="text-xs text-slate-500">Registration Fee</p><p className="text-3 font-bold">{formatINR(caseItem.payableBreakdown.rfPayable)}</p></Card>
                    <Card className="p-3"><p className="text-xs text-slate-500">DSD Fee</p><p className="text-3 font-bold">{formatINR(caseItem.payableBreakdown.dsdPayable)}</p></Card>
                    <Card className="p-3"><p className="text-xs text-slate-500">Other Fees</p><p className="text-3 font-bold">{formatINR(caseItem.payableBreakdown.otherFee)}</p></Card>
                    <Card className="p-3"><p className="text-xs text-slate-500">Taxable Value</p><p className="text-3 font-bold">{formatINR(caseItem.payableBreakdown.finalTaxableValue)}</p></Card>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Card className="p-3 bg-blue-50 border-blue-200"><p className="text-xs text-blue-700">Paid Total</p><p className="text-2xl font-bold text-blue-900">{formatINR(caseItem.paidTotalInr)}</p></Card>
                  <Card className="p-3 bg-red-50 border-red-200"><p className="text-xs text-red-700">Gap</p><p className="text-2xl font-bold text-red-700">{formatINR(caseItem.gapInr)}</p></Card>
                  <Card className="p-3"><p className="text-xs text-slate-500">Risk Score</p><div className="flex items-center gap-2 mt-2"><div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-red-500" style={{ width: `${caseItem.riskScore}%` }} /></div><span className="font-bold">{caseItem.riskScore}</span></div></Card>
                </div>

                <Card className="p-4 border-amber-200 bg-amber-50/50">
                  <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Why Flagged</h4>
                  <div className="space-y-2">
                    {caseItem.evidence.triggeredRules.slice(0, 5).map((r) => (
                      <div key={r.ruleId}>
                        <p className="text-sm font-semibold text-slate-800">{r.ruleName}</p>
                        <p className="text-sm text-slate-600">{r.explanation}</p>
                      </div>
                    ))}
                    {!caseItem.evidence.triggeredRules.length && (
                      <p className="text-sm text-slate-500">No trigger details available.</p>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Data Completeness</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {completenessChecklist.map((item) => (
                      <div key={item.label} className={`px-3 py-2 rounded border text-sm ${item.ok ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-700"}`}>
                        {item.ok ? "✓" : "!"} {item.label}
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="payments" className="px-6 py-4">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <Card className="p-3"><p className="text-xs text-slate-500">Payable</p><p className="text-lg font-bold">{formatINR(caseItem.payableTotalInr)}</p></Card>
                  <Card className="p-3"><p className="text-xs text-slate-500">Paid</p><p className="text-lg font-bold">{formatINR(caseItem.paidTotalInr)}</p></Card>
                  <Card className="p-3"><p className="text-xs text-slate-500">Gap</p><p className="text-lg font-bold text-red-600">{formatINR(caseItem.gapInr)}</p></Card>
                </div>
                <Card className="p-4">
                  <p className="text-sm text-slate-600">Receipt links and payment-line evidence are limited in current dataset. Use this section for payable/paid audit in the next data upgrade.</p>
                </Card>
              </TabsContent>

              <TabsContent value="delay" className="px-6 py-4">
                <Card className="p-4">
                  <h4 className="text-sm font-semibold mb-3">Delay Timeline</h4>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div><p className="text-slate-500">Presentation</p><p className="font-medium">{caseItem.dates.pDate}</p></div>
                    <div><p className="text-slate-500">Execution</p><p className="font-medium">{caseItem.dates.eDate}</p></div>
                    <div><p className="text-slate-500">Registration</p><p className="font-medium">{caseItem.dates.rDate}</p></div>
                  </div>
                  <div className="mt-4 text-sm text-slate-600">Lead time from presentation to registration: <span className="font-semibold">{Math.max(0, Math.round((new Date(caseItem.dates.rDate).getTime() - new Date(caseItem.dates.pDate).getTime()) / (1000 * 60 * 60 * 24)))} days</span></div>
                </Card>
              </TabsContent>

              <TabsContent value="property" className="px-6 py-4">
                <Card className="p-4">
                  <h4 className="text-sm font-semibold mb-3">Property Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-slate-500">Classification</p><p className="font-medium">{caseItem.propertySummary.isUrban ? "Urban" : "Rural"}</p></div>
                    <div><p className="text-slate-500">Land Nature</p><p className="font-medium">{caseItem.propertySummary.landNature ?? "NA"}</p></div>
                    <div><p className="text-slate-500">Extent</p><p className="font-medium">{caseItem.propertySummary.extent}</p></div>
                    <div><p className="text-slate-500">Unit</p><p className="font-medium">{caseItem.propertySummary.unit}</p></div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="exemptions" className="px-6 py-4">
                <Card className="p-4">
                  <h4 className="text-sm font-semibold mb-2">Exemption Review</h4>
                  <p className="text-sm text-slate-600">Exemption entries detected: <span className="font-semibold">{caseItem.evidence.exemptionCount}</span></p>
                  <p className="text-sm text-slate-600 mt-1">Signal present: <span className="font-semibold">{caseItem.leakageSignals.includes("ExemptionRisk") ? "Yes" : "No"}</span></p>
                </Card>
              </TabsContent>

              <TabsContent value="prohibited" className="px-6 py-4">
                <Card className={`p-4 ${caseItem.leakageSignals.includes("ProhibitedLand") ? "border-red-200 bg-red-50/50" : ""}`}>
                  <h4 className="text-sm font-semibold mb-2">Prohibited Land Check</h4>
                  <p className="text-sm text-slate-600">Matches detected: <span className="font-semibold">{caseItem.evidence.prohibitedMatchCount}</span></p>
                  <p className="text-sm text-slate-600 mt-1">Status: <span className="font-semibold">{caseItem.leakageSignals.includes("ProhibitedLand") ? "Flagged" : "Clear"}</span></p>
                </Card>
              </TabsContent>

              <TabsContent value="parties" className="px-6 py-4">
                <Card className="p-4">
                  <h4 className="text-sm font-semibold mb-3">Parties</h4>
                  <div className="space-y-2">
                    {caseItem.partiesSummary.map((p) => (
                      <div key={`${p.code}-${p.name}`} className="border rounded p-2 text-sm">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-slate-500">Role: {p.code}{p.panNo ? ` | PAN: ${p.panNo}` : ""}</p>
                      </div>
                    ))}
                    {!caseItem.partiesSummary.length && (
                      <p className="text-sm text-slate-500">No party details.</p>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="explain" className="px-6 py-4">
                <Card className="p-4">
                  <h4 className="text-sm font-semibold mb-3">Explainability</h4>
                  <div className="space-y-2">
                    {caseItem.evidence.triggeredRules.map((rule) => (
                      <div key={rule.ruleId} className="border rounded p-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm">{rule.ruleId} · {rule.ruleName}</p>
                          <Badge variant="outline" className="text-xs">{rule.severity}</Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{rule.explanation}</p>
                        <p className="text-xs text-slate-500 mt-1">Impact: {formatINR(rule.impactInr)} | Confidence: {toConfidencePct(rule.confidence)}%</p>
                      </div>
                    ))}
                    {!caseItem.evidence.triggeredRules.length && (
                      <p className="text-sm text-slate-500">No explainability trace available.</p>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="px-6 py-4">
                <Card className="p-4">
                  <h4 className="text-sm font-semibold mb-3">Activity</h4>
                  <div className="space-y-2">
                    {caseItem.activityLog.map((entry) => (
                      <div key={entry.id} className="border-l-2 border-slate-200 pl-3 py-1">
                        <p className="text-sm font-medium">{entry.action} <span className="text-slate-500">· {entry.actor}</span></p>
                        <p className="text-sm text-slate-600">{entry.detail}</p>
                        <p className="text-xs text-slate-400">{new Date(entry.ts).toLocaleString()}</p>
                      </div>
                    ))}
                    {!caseItem.activityLog.length && (
                      <p className="text-sm text-slate-500">No activity yet.</p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <h5 className="text-sm font-semibold mb-2">Notes</h5>
                    <div className="space-y-2">
                      {caseItem.notes.map((n) => {
                        const note = safeNote(n);
                        return (
                          <div key={note.id} className="border rounded p-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{note.author}</p>
                              <p className="text-xs text-slate-400">{new Date(note.createdAt).toLocaleString()}</p>
                            </div>
                            <p className="text-sm text-slate-700 mt-1">{note.note}</p>
                          </div>
                        );
                      })}
                      {!caseItem.notes.length && <p className="text-sm text-slate-500">No notes yet.</p>}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {caseItem.leakageSignals.includes("CashReconciliation") && (
                <TabsContent value="cash-recon" className="px-6 py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Cash Reconciliation Evidence</h4>
                    <Badge variant="destructive" className="text-xs">
                      {caseItem.evidence.triggeredRules.filter(r => r.ruleId.startsWith("R-CR")).length} rule{caseItem.evidence.triggeredRules.filter(r => r.ruleId.startsWith("R-CR")).length !== 1 ? "s" : ""} triggered
                    </Badge>
                  </div>

                  {/* Collection vs Deposit */}
                  <Card className="p-4">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Collection vs Deposit</h5>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 rounded p-3">
                        <p className="text-xs text-blue-600">Collected</p>
                        <p className="text-xl font-bold text-blue-800">{formatINR(caseItem.cashReconciliationEvidence?.dailyCashSummary.cashCollected ?? caseItem.payableTotalInr)}</p>
                      </div>
                      <div className="bg-emerald-50 rounded p-3">
                        <p className="text-xs text-emerald-600">Deposited</p>
                        <p className="text-xl font-bold text-emerald-800">{formatINR(caseItem.cashReconciliationEvidence?.dailyCashSummary.misRemittance ?? caseItem.paidTotalInr)}</p>
                      </div>
                      <div className="bg-red-50 rounded p-3">
                        <p className="text-xs text-red-600">Variance</p>
                        <p className="text-xl font-bold text-red-700">{formatINR(caseItem.cashReconciliationEvidence?.dailyCashSummary.variance ?? caseItem.gapInr)}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Challan Timeline */}
                  {caseItem.cashReconciliationEvidence?.challanTimeline && (
                    <Card className="p-4">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Challan Timeline</h5>
                      <div className="space-y-0">
                        {caseItem.cashReconciliationEvidence.challanTimeline.map((evt, i) => (
                          <div key={i} className="flex items-start gap-3 relative">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full border-2 ${evt.status === "critical" ? "bg-red-500 border-red-600" : evt.status === "warning" ? "bg-amber-400 border-amber-500" : "bg-emerald-400 border-emerald-500"}`} />
                              {i < caseItem.cashReconciliationEvidence!.challanTimeline.length - 1 && (
                                <div className="w-0.5 h-10 bg-slate-200" />
                              )}
                            </div>
                            <div className="pb-4 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold">{evt.event}</p>
                                {evt.amount > 0 && <span className="text-xs font-medium text-slate-600">{formatINR(evt.amount)}</span>}
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5">{evt.detail}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{new Date(evt.date).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* CFMS Comparison */}
                  {caseItem.cashReconciliationEvidence?.cfmsComparison && (
                    <Card className="p-4">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">CFMS Cross-Reference</h5>
                      <div className="space-y-1">
                        {caseItem.cashReconciliationEvidence.cfmsComparison.map((row, i) => (
                          <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${row.mismatch ? "bg-red-50 border border-red-200" : "bg-slate-50"}`}>
                            <span className="w-40 text-slate-500 text-xs">{row.field}</span>
                            <span className="flex-1 font-mono text-xs">{row.challanValue}</span>
                            <span className="text-[10px] text-slate-400">vs</span>
                            <span className={`flex-1 font-mono text-xs ${row.mismatch ? "text-red-700 font-bold" : ""}`}>{row.cfmsValue}</span>
                            {row.mismatch && <span className="text-red-500 text-[10px] font-bold">MISMATCH</span>}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Daily Cash Summary */}
                  {caseItem.cashReconciliationEvidence && (
                    <Card className="p-4 bg-slate-50">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Officer & Office Details</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-slate-500">Officer:</span> <span className="font-medium">{caseItem.cashReconciliationEvidence.officerName}</span></div>
                        <div><span className="text-slate-500">Officer ID:</span> <span className="font-medium font-mono text-xs">{caseItem.cashReconciliationEvidence.officerId}</span></div>
                        <div><span className="text-slate-500">Challan:</span> <span className="font-medium font-mono text-xs">{caseItem.cashReconciliationEvidence.challanId}</span></div>
                        <div><span className="text-slate-500">Status:</span> <span className="font-medium">{caseItem.cashReconciliationEvidence.challanStatus}</span></div>
                        <div><span className="text-slate-500">Office:</span> <span className="font-medium">{caseItem.office.srName}</span></div>
                        <div><span className="text-slate-500">District:</span> <span className="font-medium">{caseItem.office.district}</span></div>
                        <div><span className="text-slate-500">Cash Risk Score:</span> <span className="font-bold">{caseItem.cashReconciliationEvidence.cashRiskScore}/100</span></div>
                        <div><span className="text-slate-500">Office Date:</span> <span className="font-medium">{caseItem.cashReconciliationEvidence.dailyCashSummary.officeDate}</span></div>
                      </div>
                    </Card>
                  )}

                  {/* Challan Reuse Detection */}
                  {caseItem.cashReconciliationEvidence?.cashReconSubtype === "challanReuse" && caseItem.cashReconciliationEvidence.challanReuseEvidence && (() => {
                    const re = caseItem.cashReconciliationEvidence.challanReuseEvidence;
                    return (
                      <Card className="p-4 border-amber-200">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Challan Reuse Detection</h5>
                          <div className="flex items-center gap-2">
                            <Badge variant={re.reuseSeverity === "critical" ? "destructive" : "secondary"} className="text-[10px]">
                              {re.reuseSeverity === "critical" ? "Critical" : "Warning"}
                            </Badge>
                            {re.crossHOA && (
                              <Badge variant="destructive" className="text-[10px] bg-red-100 text-red-700 border-red-300">Cross-HOA</Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="bg-amber-50 rounded p-3">
                            <p className="text-xs text-amber-600">Reused Challan</p>
                            <p className="text-sm font-bold text-amber-800 font-mono">{re.reusedChallanId}</p>
                          </div>
                          <div className="bg-orange-50 rounded p-3">
                            <p className="text-xs text-orange-600">Reuse Count</p>
                            <p className="text-xl font-bold text-orange-800">{re.reuseCount}x</p>
                          </div>
                          <div className="bg-red-50 rounded p-3">
                            <p className="text-xs text-red-600">Total Amount</p>
                            <p className="text-xl font-bold text-red-700">{formatINR(re.totalAmountInvolvedInr)}</p>
                          </div>
                        </div>
                        <div className="border rounded">
                          <div className="bg-slate-50 px-3 py-2 border-b">
                            <p className="text-xs font-bold text-slate-500 uppercase">Linked Documents</p>
                          </div>
                          <div className="divide-y">
                            {re.linkedDocuments.map((doc, i) => (
                              <div key={doc.documentId} className={`px-3 py-2 text-sm flex items-center gap-3 ${i === 0 ? "bg-amber-50" : ""} ${re.crossHOA && i > 0 && doc.hoaCode !== re.linkedDocuments[0].hoaCode ? "border-l-2 border-red-400" : ""}`}>
                                <span className="w-36 font-mono text-xs text-slate-600">{doc.documentId}</span>
                                <span className="w-32 text-xs">{doc.documentKey}</span>
                                <span className="w-24 text-xs text-slate-500">{doc.registrationDate}</span>
                                <span className={`flex-1 text-xs ${re.crossHOA && i > 0 && doc.hoaCode !== re.linkedDocuments[0].hoaCode ? "text-red-700 font-semibold" : "text-slate-600"}`}>{doc.hoaDescription}</span>
                                <span className="w-20 text-right font-medium text-xs">{formatINR(doc.amountInr)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    );
                  })()}

                  {/* Failed Challan Detection */}
                  {caseItem.cashReconciliationEvidence?.cashReconSubtype === "failedChallan" && caseItem.cashReconciliationEvidence.failedChallanEvidence && (() => {
                    const fe = caseItem.cashReconciliationEvidence.failedChallanEvidence;
                    return (
                      <Card className="p-4 border-rose-200">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Failed Challan Detection</h5>
                          <div className="flex items-center gap-2">
                            <Badge variant={fe.failureSeverity === "critical" ? "destructive" : "secondary"} className="text-[10px]">
                              {fe.failureSeverity === "critical" ? "Critical" : "Warning"}
                            </Badge>
                            <Badge variant="destructive" className="text-[10px]">{fe.cfmsStatus}</Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="bg-rose-50 rounded p-3">
                            <p className="text-xs text-rose-600">Challan Amount</p>
                            <p className="text-xl font-bold text-rose-800">{formatINR(fe.challanAmountInr)}</p>
                          </div>
                          <div className="bg-orange-50 rounded p-3">
                            <p className="text-xs text-orange-600">Time Gap</p>
                            <p className="text-xl font-bold text-orange-800">{fe.timeGapDays} days</p>
                          </div>
                          <div className="bg-slate-50 rounded p-3">
                            <p className="text-xs text-slate-600">Registration</p>
                            <p className="text-lg font-bold text-slate-800">{fe.registrationCompleted ? "Completed" : "Pending"}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-50 rounded p-3">
                            <p className="text-xs text-slate-500">Failed Challan ID</p>
                            <p className="text-sm font-medium font-mono">{fe.failedChallanId}</p>
                          </div>
                          <div className="bg-slate-50 rounded p-3">
                            <p className="text-xs text-slate-500">CFMS Status</p>
                            <p className="text-sm font-medium text-red-700">{fe.cfmsStatus}</p>
                          </div>
                          <div className="bg-slate-50 rounded p-3">
                            <p className="text-xs text-slate-500">Rejection Date</p>
                            <p className="text-sm font-medium">{fe.cfmsRejectionDate}</p>
                          </div>
                          <div className="bg-slate-50 rounded p-3">
                            <p className="text-xs text-slate-500">Registration Date</p>
                            <p className="text-sm font-medium">{fe.registrationDate}</p>
                          </div>
                          <div className="bg-slate-50 rounded p-3 col-span-2">
                            <p className="text-xs text-slate-500">Failure Reason</p>
                            <p className="text-sm text-slate-700">{fe.failureReason}</p>
                          </div>
                          <div className="bg-slate-50 rounded p-3 col-span-2">
                            <p className="text-xs text-slate-500">Registration Document ID</p>
                            <p className="text-sm font-medium font-mono">{fe.registrationDocumentId}</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })()}

                  {/* MIS Remittance Mismatch Detection */}
                  {caseItem.cashReconciliationEvidence?.cashReconSubtype === "misRemittance" && caseItem.cashReconciliationEvidence.misRemittanceEvidence && (() => {
                    const me = caseItem.cashReconciliationEvidence.misRemittanceEvidence;
                    return (
                      <Card className="p-4 border-indigo-200">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide">MIS Remittance Mismatch</h5>
                          <div className="flex items-center gap-2">
                            <Badge variant={me.remittanceSeverity === "critical" ? "destructive" : "secondary"} className="text-[10px]">
                              {me.remittanceSeverity === "critical" ? "Critical" : "Warning"}
                            </Badge>
                            {me.delayDays > 1 && (
                              <Badge variant="destructive" className="text-[10px] bg-orange-100 text-orange-700 border-orange-300">{me.delayDays - 1}d Late</Badge>
                            )}
                            {me.receiptCountMismatch && (
                              <Badge variant="destructive" className="text-[10px] bg-red-100 text-red-700 border-red-300">Receipt Mismatch</Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-3 mb-4">
                          <div className="bg-blue-50 rounded p-3">
                            <p className="text-xs text-blue-600">Day-1 Collection</p>
                            <p className="text-lg font-bold text-blue-800">{formatINR(me.collectionAmountInr)}</p>
                            <p className="text-[10px] text-blue-500">{me.receiptCount} receipts</p>
                          </div>
                          <div className="bg-indigo-50 rounded p-3">
                            <p className="text-xs text-indigo-600">MIS Reported</p>
                            <p className="text-lg font-bold text-indigo-800">{formatINR(me.misReportedAmountInr)}</p>
                            <p className="text-[10px] text-indigo-500">{me.misReportedReceiptCount} receipts</p>
                          </div>
                          <div className="bg-red-50 rounded p-3">
                            <p className="text-xs text-red-600">Variance</p>
                            <p className="text-lg font-bold text-red-700">{formatINR(me.varianceInr)}</p>
                            <p className="text-[10px] text-red-500">{me.variancePercent.toFixed(1)}%</p>
                          </div>
                          <div className="bg-amber-50 rounded p-3">
                            <p className="text-xs text-amber-600">Submission Delay</p>
                            <p className="text-lg font-bold text-amber-800">{me.delayDays} day{me.delayDays !== 1 ? "s" : ""}</p>
                            <p className="text-[10px] text-amber-500">{me.delayDays <= 1 ? "On time" : `${me.delayDays - 1}d late`}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-50 rounded p-3">
                            <p className="text-xs text-slate-500">Collection Date</p>
                            <p className="text-sm font-medium">{me.collectionDate}</p>
                          </div>
                          <div className="bg-slate-50 rounded p-3">
                            <p className="text-xs text-slate-500">MIS Submission Date</p>
                            <p className="text-sm font-medium">{me.misSubmissionDate}</p>
                            <p className="text-[10px] text-slate-400">Expected: {me.expectedSubmissionDate}</p>
                          </div>
                          <div className="bg-slate-50 rounded p-3">
                            <p className="text-xs text-slate-500">MIS Report ID</p>
                            <p className="text-sm font-medium font-mono">{me.misReportId}</p>
                          </div>
                          <div className="bg-slate-50 rounded p-3">
                            <p className="text-xs text-slate-500">Receipt Count Check</p>
                            <p className={`text-sm font-medium ${me.receiptCountMismatch ? "text-red-700" : "text-emerald-700"}`}>
                              {me.receiptCountMismatch ? `Mismatch: ${me.receiptCount} vs ${me.misReportedReceiptCount}` : `Match: ${me.receiptCount} receipts`}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })()}

                  {/* Triggered Rules */}
                  <Card className="p-4">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Triggered Rules</h5>
                    <div className="space-y-2">
                      {caseItem.evidence.triggeredRules.filter(r => r.ruleId.startsWith("R-CR")).map(r => (
                        <div key={r.ruleId} className="border-l-2 border-emerald-300 pl-3 py-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{r.ruleName}</p>
                            <Badge variant={r.severity === "High" ? "destructive" : "secondary"} className="text-[10px]">{r.severity}</Badge>
                          </div>
                          <p className="text-sm text-slate-600 mt-0.5">{r.explanation}</p>
                          {r.impactInr > 0 && <p className="text-xs text-red-600 mt-0.5">Impact: {formatINR(r.impactInr)}</p>}
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>
              )}

              {caseItem.leakageSignals.includes("StampInventory") && (
                <TabsContent value="stamp-intel" className="px-6 py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Stamp Inventory Evidence</h4>
                    <Badge variant="destructive" className="text-xs">
                      {caseItem.evidence.triggeredRules.filter(r => r.ruleId.startsWith("R-SI")).length} rule{caseItem.evidence.triggeredRules.filter(r => r.ruleId.startsWith("R-SI")).length !== 1 ? "s" : ""} triggered
                    </Badge>
                  </div>

                  {/* Inventory KPIs */}
                  <Card className="p-4">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Inventory Variance</h5>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 rounded p-3">
                        <p className="text-xs text-blue-600">Impact Amount</p>
                        <p className="text-xl font-bold text-blue-800">{formatINR(caseItem.impactAmountInr)}</p>
                      </div>
                      <div className="bg-red-50 rounded p-3">
                        <p className="text-xs text-red-600">Inventory Gap</p>
                        <p className="text-xl font-bold text-red-700">{formatINR(caseItem.gapInr)}</p>
                      </div>
                      {caseItem.stampInventoryEvidence && (
                        <div className="bg-amber-50 rounded p-3">
                          <p className="text-xs text-amber-600">Vendor Risk Score</p>
                          <p className="text-xl font-bold text-amber-800">{caseItem.stampInventoryEvidence.vendorRiskScore}/100</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Vendor Details */}
                  {caseItem.stampInventoryEvidence && (
                    <Card className="p-4">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Vendor Profile</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-slate-500">Vendor:</span> <span className="font-medium">{caseItem.stampInventoryEvidence.vendorName}</span></div>
                        <div><span className="text-slate-500">Vendor ID:</span> <span className="font-medium font-mono text-xs">{caseItem.stampInventoryEvidence.vendorId}</span></div>
                        <div><span className="text-slate-500">Jurisdiction:</span> <span className="font-medium">{caseItem.stampInventoryEvidence.jurisdiction}</span></div>
                        <div><span className="text-slate-500">Stamp Type:</span> <span className="font-medium">{caseItem.stampInventoryEvidence.stampType}</span></div>
                        <div><span className="text-slate-500">Usage:</span> <span className="font-medium">{caseItem.stampInventoryEvidence.usageCount} / {caseItem.stampInventoryEvidence.expectedUsage} expected</span></div>
                        <div><span className="text-slate-500">Deviation:</span> <span className={`font-bold ${caseItem.stampInventoryEvidence.deviationPercent < 0 ? "text-red-600" : "text-emerald-600"}`}>{caseItem.stampInventoryEvidence.deviationPercent > 0 ? "+" : ""}{caseItem.stampInventoryEvidence.deviationPercent}%</span></div>
                      </div>
                    </Card>
                  )}

                  {/* Usage Trend Sparkline */}
                  {caseItem.stampInventoryEvidence?.monthlyUsage && (
                    <Card className="p-4">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Monthly Usage Trend</h5>
                      <div className="overflow-x-auto">
                        <svg viewBox="0 0 400 100" className="w-full h-[100px]">
                          {caseItem.stampInventoryEvidence.monthlyUsage.map((pt, i, arr) => {
                            const maxVal = Math.max(...arr.map((p) => Math.max(p.count, p.expected)));
                            const x = 30 + (i * ((340) / (arr.length - 1)));
                            const yActual = 85 - ((pt.count / maxVal) * 70);
                            const yExpected = 85 - ((pt.expected / maxVal) * 70);
                            return (
                              <g key={pt.month}>
                                {i > 0 && (
                                  <>
                                    <line x1={30 + ((i - 1) * (340 / (arr.length - 1)))} y1={85 - ((arr[i - 1].count / maxVal) * 70)} x2={x} y2={yActual} stroke="#3b82f6" strokeWidth={2} />
                                    <line x1={30 + ((i - 1) * (340 / (arr.length - 1)))} y1={85 - ((arr[i - 1].expected / maxVal) * 70)} x2={x} y2={yExpected} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 2" />
                                  </>
                                )}
                                <circle cx={x} cy={yActual} r={3} fill="#3b82f6" />
                                <circle cx={x} cy={yExpected} r={2} fill="#94a3b8" />
                                <text x={x} y={97} textAnchor="middle" className="text-[8px] fill-slate-400">{pt.month.slice(5)}</text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="w-3 h-1 rounded bg-blue-500" /> Actual</span>
                        <span className="flex items-center gap-1"><span className="w-6 h-0 border-t border-dashed border-slate-400" /> Expected</span>
                      </div>
                    </Card>
                  )}

                  {/* Peer Comparison */}
                  {caseItem.stampInventoryEvidence?.peerVendors && caseItem.stampInventoryEvidence.peerVendors.length > 0 && (
                    <Card className="p-4">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Peer Vendor Comparison</h5>
                      <div className="space-y-2">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded text-sm bg-amber-50 border border-amber-200`}>
                          <span className="w-40 font-medium text-amber-800">{caseItem.stampInventoryEvidence.vendorName}</span>
                          <span className="flex-1 text-xs">Usage: {caseItem.stampInventoryEvidence.usageCount}</span>
                          <span className="text-xs font-bold text-red-600">{caseItem.stampInventoryEvidence.deviationPercent > 0 ? "+" : ""}{caseItem.stampInventoryEvidence.deviationPercent}%</span>
                          <span className="text-xs font-bold">Risk: {caseItem.stampInventoryEvidence.vendorRiskScore}</span>
                        </div>
                        {caseItem.stampInventoryEvidence.peerVendors.map((peer) => (
                          <div key={peer.vendorId} className="flex items-center gap-2 px-3 py-2 rounded text-sm bg-slate-50">
                            <span className="w-40 font-medium">{peer.vendorName}</span>
                            <span className="flex-1 text-xs">Usage: {peer.usage}</span>
                            <span className={`text-xs font-medium ${peer.deviation < 0 ? "text-red-600" : "text-emerald-600"}`}>{peer.deviation > 0 ? "+" : ""}{peer.deviation}%</span>
                            <span className="text-xs">Risk: {peer.riskScore}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Stamp Type Distribution */}
                  {caseItem.stampInventoryEvidence?.stampTypeDistribution && (
                    <Card className="p-4">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Stamp Type Distribution</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-2">This Vendor</p>
                          {caseItem.stampInventoryEvidence.stampTypeDistribution.vendor.map((d) => (
                            <div key={d.type} className="flex items-center gap-2 mb-1">
                              <span className="w-12 text-xs text-slate-500">{d.type}</span>
                              <div className="flex-1 h-3 bg-slate-100 rounded overflow-hidden">
                                <div className="h-full bg-blue-400" style={{ width: `${d.percent}%` }} />
                              </div>
                              <span className="text-xs w-8 text-right">{d.percent}%</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-2">Jurisdiction Average</p>
                          {caseItem.stampInventoryEvidence.stampTypeDistribution.jurisdictionAvg.map((d) => (
                            <div key={d.type} className="flex items-center gap-2 mb-1">
                              <span className="w-12 text-xs text-slate-500">{d.type}</span>
                              <div className="flex-1 h-3 bg-slate-100 rounded overflow-hidden">
                                <div className="h-full bg-slate-400" style={{ width: `${d.percent}%` }} />
                              </div>
                              <span className="text-xs w-8 text-right">{d.percent}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Triggered Rules */}
                  <Card className="p-4">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Triggered Rules</h5>
                    <div className="space-y-2">
                      {caseItem.evidence.triggeredRules.filter(r => r.ruleId.startsWith("R-SI")).map(r => (
                        <div key={r.ruleId} className="border-l-2 border-teal-300 pl-3 py-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{r.ruleName}</p>
                            <Badge variant={r.severity === "High" ? "destructive" : "secondary"} className="text-[10px]">{r.severity}</Badge>
                          </div>
                          <p className="text-sm text-slate-600 mt-0.5">{r.explanation}</p>
                          {r.impactInr > 0 && <p className="text-xs text-red-600 mt-0.5">Impact: {formatINR(r.impactInr)}</p>}
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>
              )}

              {caseItem.leakageSignals.includes("ClassificationFraud") && (
                <TabsContent value="classification" className="px-6 py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Classification Fraud Evidence</h4>
                    <Badge variant="destructive" className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                      {caseItem.evidence.triggeredRules.filter(r => r.ruleId.startsWith("R-CF")).length} rule{caseItem.evidence.triggeredRules.filter(r => r.ruleId.startsWith("R-CF")).length !== 1 ? "s" : ""} triggered
                    </Badge>
                  </div>

                  {/* Section 1: Mismatch Summary */}
                  <Card className="p-4">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Classification Mismatch Summary</h5>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-orange-50 rounded p-3">
                        <p className="text-xs text-orange-600">Declared</p>
                        <p className="text-lg font-bold text-orange-800">{caseItem.classificationFraudEvidence?.declaredClassification ?? "—"}</p>
                      </div>
                      <div className="bg-blue-50 rounded p-3">
                        <p className="text-xs text-blue-600">Actual (Webland)</p>
                        <p className="text-lg font-bold text-blue-800">{caseItem.classificationFraudEvidence?.weblandClassification ?? "—"}</p>
                      </div>
                      <div className="bg-red-50 rounded p-3">
                        <p className="text-xs text-red-600">Risk Score</p>
                        <p className="text-xl font-bold text-red-700">{caseItem.classificationFraudEvidence?.classificationRiskScore ?? 0}/100</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="bg-slate-50 rounded p-3">
                        <p className="text-xs text-slate-500">Form 1</p>
                        <p className="text-sm font-medium">{caseItem.classificationFraudEvidence?.form1Classification ?? "—"}</p>
                      </div>
                      <div className="bg-slate-50 rounded p-3">
                        <p className="text-xs text-slate-500">Form 2</p>
                        <p className="text-sm font-medium">{caseItem.classificationFraudEvidence?.form2Classification ?? "—"}</p>
                      </div>
                      <div className="bg-slate-50 rounded p-3">
                        <p className="text-xs text-slate-500">Webland</p>
                        <p className="text-sm font-medium">{caseItem.classificationFraudEvidence?.weblandClassification ?? "—"}</p>
                      </div>
                    </div>
                    {caseItem.classificationFraudEvidence && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-xs text-red-600">Estimated Duty Loss</p>
                        <p className="text-xl font-bold text-red-700">{formatINR(caseItem.classificationFraudEvidence.estimatedDutyLoss)}</p>
                      </div>
                    )}
                  </Card>

                  {/* Section 2: Form Cross-Verification */}
                  {caseItem.classificationFraudEvidence?.crossVerification && (
                    <Card className="p-4">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Form Cross-Verification</h5>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 px-3 py-2 rounded text-xs font-bold text-slate-500 bg-slate-50">
                          <span className="w-32">Field</span>
                          <span className="flex-1">Form 1</span>
                          <span className="flex-1">Form 2</span>
                          <span className="flex-1">Webland</span>
                          <span className="w-20 text-center">Status</span>
                        </div>
                        {caseItem.classificationFraudEvidence.crossVerification.map((row, i) => (
                          <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${row.mismatch ? "bg-red-50 border border-red-200" : "bg-slate-50"}`}>
                            <span className="w-32 text-xs text-slate-500">{row.field}</span>
                            <span className="flex-1 font-mono text-xs">{row.form1Value}</span>
                            <span className={`flex-1 font-mono text-xs ${row.mismatch ? "text-red-700 font-bold" : ""}`}>{row.form2Value}</span>
                            <span className={`flex-1 font-mono text-xs ${row.mismatch ? "text-red-700 font-bold" : ""}`}>{row.weblandValue}</span>
                            <span className="w-20 text-center">
                              {row.mismatch ? <span className="text-red-500 text-[10px] font-bold">MISMATCH</span> : <span className="text-emerald-500 text-[10px] font-bold">OK</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Section 3: Conversion History */}
                  {caseItem.classificationFraudEvidence?.conversionHistory && caseItem.classificationFraudEvidence.conversionHistory.length > 0 && (
                    <Card className="p-4">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Conversion History</h5>
                      <div className="space-y-0">
                        {caseItem.classificationFraudEvidence.conversionHistory.map((entry, i) => (
                          <div key={i} className="flex items-start gap-3 relative">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full border-2 ${entry.suspicious ? "bg-red-500 border-red-600" : "bg-emerald-400 border-emerald-500"}`} />
                              {i < caseItem.classificationFraudEvidence!.conversionHistory.length - 1 && (
                                <div className="w-0.5 h-10 bg-slate-200" />
                              )}
                            </div>
                            <div className="pb-4 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{entry.fromClassification}</span>
                                <span className="text-xs text-slate-400">→</span>
                                <span className={`text-sm font-semibold ${entry.suspicious ? "text-red-700" : ""}`}>{entry.toClassification}</span>
                                {entry.suspicious && <Badge variant="destructive" className="text-[10px]">Suspicious</Badge>}
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5">By: {entry.registeredBy} | Doc: <span className="font-mono">{entry.documentId}</span></p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{new Date(entry.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Section 4: Duty Impact Analysis */}
                  {caseItem.classificationFraudEvidence?.dutyImpact && (() => {
                    const di = caseItem.classificationFraudEvidence.dutyImpact;
                    const maxRate = Math.max(di.declaredDutyRate, di.correctDutyRate);
                    return (
                      <Card className="p-4">
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Duty Impact Analysis</h5>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-amber-50 rounded p-3">
                            <p className="text-xs text-amber-600">Declared Duty Rate</p>
                            <p className="text-xl font-bold text-amber-800">{di.declaredDutyRate}%</p>
                          </div>
                          <div className="bg-blue-50 rounded p-3">
                            <p className="text-xs text-blue-600">Correct Duty Rate</p>
                            <p className="text-xl font-bold text-blue-800">{di.correctDutyRate}%</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="bg-slate-50 rounded p-3">
                            <p className="text-xs text-slate-500">Duty Paid</p>
                            <p className="text-lg font-bold">{formatINR(di.dutyPaid)}</p>
                          </div>
                          <div className="bg-slate-50 rounded p-3">
                            <p className="text-xs text-slate-500">Duty Owed</p>
                            <p className="text-lg font-bold">{formatINR(di.dutyOwed)}</p>
                          </div>
                          <div className="bg-red-50 rounded p-3 border border-red-200">
                            <p className="text-xs text-red-600">Duty Gap</p>
                            <p className="text-lg font-bold text-red-700">{formatINR(di.dutyGap)}</p>
                          </div>
                        </div>
                        {/* Visual rate comparison bars */}
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-amber-600">Declared Rate</span>
                              <span className="font-medium">{di.declaredDutyRate}%</span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-amber-400" style={{ width: `${maxRate > 0 ? (di.declaredDutyRate / maxRate) * 100 : 0}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-blue-600">Correct Rate</span>
                              <span className="font-medium">{di.correctDutyRate}%</span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-blue-500" style={{ width: `${maxRate > 0 ? (di.correctDutyRate / maxRate) * 100 : 0}%` }} />
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })()}

                  {/* Section 5: Triggered Rules */}
                  <Card className="p-4">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Triggered Rules</h5>
                    <div className="space-y-2">
                      {caseItem.evidence.triggeredRules.filter(r => r.ruleId.startsWith("R-CF")).map(r => (
                        <div key={r.ruleId} className="border-l-2 border-orange-300 pl-3 py-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{r.ruleName}</p>
                            <Badge variant={r.severity === "High" ? "destructive" : "secondary"} className="text-[10px]">{r.severity}</Badge>
                          </div>
                          <p className="text-sm text-slate-600 mt-0.5">{r.explanation}</p>
                          {r.impactInr > 0 && <p className="text-xs text-red-600 mt-0.5">Impact: {formatINR(r.impactInr)}</p>}
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>
              )}

            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add context or next steps..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!noteText.trim()) return;
              await onAddNote(noteText.trim());
              setNoteText("");
              setNoteOpen(false);
            }}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={escalateOpen} onOpenChange={setEscalateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate Case</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Escalate To</label>
              <Select value={escalateTarget} onValueChange={(v) => setEscalateTarget(v as EscalateTarget)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="District Registrar">District Registrar</SelectItem>
                  <SelectItem value="Joint Inspector General">Joint Inspector General</SelectItem>
                  <SelectItem value="Additional Inspector General">Additional Inspector General</SelectItem>
                  <SelectItem value="IG of Registration & Stamps">IG of Registration & Stamps</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)} placeholder="Explain escalation reason..." className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!escalateReason.trim()) return;
              await onEscalate(escalateTarget, escalateReason.trim());
              setEscalateReason("");
              setEscalateOpen(false);
            }}>Escalate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function IGRSCasesPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [registrationRange, setRegistrationRange] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("risk");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [riskFilters, setRiskFilters] = useState<string[]>([]);
  const [signalFilters, setSignalFilters] = useState<IGRSLeakageSignal[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [officeFilter, setOfficeFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [docTypeFilter, setDocTypeFilter] = useState("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<"all" | "urban" | "rural">("all");
  const [landNatureFilter, setLandNatureFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [minGapFilter, setMinGapFilter] = useState<number | null>(null);
  const [minImpactFilter, setMinImpactFilter] = useState<number | null>(null);
  const [minConfidenceFilter, setMinConfidenceFilter] = useState<number | null>(null);
  const [dateFromFilter, setDateFromFilter] = useState<string | null>(null);
  const [dateToFilter, setDateToFilter] = useState<string | null>(null);
  const [slaStatusFilter, setSlaStatusFilter] = useState<"all" | "breached" | "within">("all");
  const [ageingBucketFilter, setAgeingBucketFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  const { update, loading: mutating } = useIGRSCaseMutation();

  useEffect(() => {
    const zone = searchParams.get("zone");
    const district = searchParams.get("district");
    const risk = searchParams.get("risk");
    const signal = searchParams.get("signal");
    const status = searchParams.get("status");
    const assignedTo = searchParams.get("assignedTo") ?? searchParams.get("owner");
    const minGap = searchParams.get("minGap");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const sla = searchParams.get("sla");

    if (zone) setZoneFilter(zone);
    if (district) setDistrictFilter(district);
    if (risk) {
      const next = risk
        .split(",")
        .map((v) => v.trim())
        .filter((v) => RISK_OPTIONS.includes(v));
      setRiskFilters(next);
    }
    if (signal) {
      const allowed = new Set(SIGNAL_OPTIONS.map((opt) => opt.value));
      const next = signal
        .split(",")
        .map((v) => v.trim())
        .filter((v): v is IGRSLeakageSignal => allowed.has(v as IGRSLeakageSignal));
      setSignalFilters(next);
    }
    if (status) {
      const next = status
        .split(",")
        .map((v) => normalizeAuditStatus(v.trim()))
        .filter((v) => STATUS_OPTIONS.includes(v));
      setStatusFilters(Array.from(new Set(next)));
    }
    if (assignedTo) setOwnerFilter(assignedTo);
    if (minGap) {
      const parsed = Number(minGap);
      setMinGapFilter(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
    }
    if (from) setDateFromFilter(from);
    if (to) setDateToFilter(to);
    if (sla === "breached" || sla === "within") setSlaStatusFilter(sla);
    setPage(1);
  }, [searchParams]);

  const sortConfig = getSortConfig(sortMode);

  const filters: IGRSCaseFilters = {
    search: search || undefined,
    riskLevel: riskFilters.length ? riskFilters : undefined,
    signals: signalFilters.length ? signalFilters : undefined,
    status: statusFilters.length ? expandAuditStatuses(statusFilters) : undefined,
    office: officeFilter !== "all" ? [officeFilter] : undefined,
    district: districtFilter !== "all" ? [districtFilter] : undefined,
    assignedTo:
      ownerFilter !== "all" && ownerFilter !== "UNASSIGNED" ? ownerFilter : undefined,
    minGap: minGapFilter ?? undefined,
    dateFrom: dateFromFilter ?? undefined,
    dateTo: dateToFilter ?? undefined,
    ...sortConfig,
    page,
    pageSize,
  };

  const {
    data: rows,
    total,
    totalPages,
    loading,
    error,
    refetch,
  } = useJurisdictionFilteredCases(filters);

  const visibleRows = useMemo(() => {
    let list = [...rows];

    if (docTypeFilter !== "all") {
      list = list.filter((c) => c.docType.tranDesc === docTypeFilter || c.docType.abDesc === docTypeFilter);
    }

    if (zoneFilter !== "all") {
      list = list.filter((c) => c.office.zone === zoneFilter);
    }

    if (ownerFilter !== "all") {
      list = list.filter((c) => (c.assignedTo ?? "UNASSIGNED") === ownerFilter);
    }

    if (propertyTypeFilter !== "all") {
      const expectUrban = propertyTypeFilter === "urban";
      list = list.filter((c) => c.propertySummary.isUrban === expectUrban);
    }

    if (landNatureFilter !== "all") {
      list = list.filter((c) => (c.propertySummary.landNature ?? "Unknown") === landNatureFilter);
    }

    if (registrationRange !== "all") {
      const now = Date.now();
      const days = registrationRange === "30" ? 30 : 90;
      list = list.filter((c) => {
        const dt = new Date(c.dates.rDate).getTime();
        return Number.isFinite(dt) && (now - dt) / (1000 * 60 * 60 * 24) <= days;
      });
    }

    if (minGapFilter != null) {
      list = list.filter((c) => c.gapInr >= minGapFilter);
    }

    if (minImpactFilter != null) {
      list = list.filter((c) => c.impactAmountInr >= minImpactFilter);
    }

    if (minConfidenceFilter != null) {
      list = list.filter((c) => toConfidencePct(c.confidence) >= minConfidenceFilter);
    }

    if (dateFromFilter) {
      const from = new Date(dateFromFilter).getTime();
      if (Number.isFinite(from)) {
        list = list.filter((c) => {
          const dt = new Date(c.dates.rDate).getTime();
          return Number.isFinite(dt) && dt >= from;
        });
      }
    }

    if (dateToFilter) {
      const to = new Date(dateToFilter).getTime();
      if (Number.isFinite(to)) {
        list = list.filter((c) => {
          const dt = new Date(c.dates.rDate).getTime();
          return Number.isFinite(dt) && dt <= to;
        });
      }
    }

    if (slaStatusFilter !== "all") {
      list = list.filter((c) => {
        const ageDays = c.sla?.ageingDays ?? ageFromCreated(c.createdAt);
        const breached = c.sla?.slaBreached ?? ageDays > 30;
        return slaStatusFilter === "breached" ? breached : !breached;
      });
    }

    if (ageingBucketFilter !== "all") {
      list = list.filter((c) => {
        const ageDays = c.sla?.ageingDays ?? ageFromCreated(c.createdAt);
        const bucket =
          c.sla?.ageingBucket ??
          (ageDays > 30 ? "30d+" : ageDays > 14 ? "15-30d" : ageDays > 7 ? "8-14d" : "0-7d");
        return bucket === ageingBucketFilter;
      });
    }

    return list;
  }, [
    rows,
    docTypeFilter,
    zoneFilter,
    ownerFilter,
    propertyTypeFilter,
    landNatureFilter,
    registrationRange,
    minGapFilter,
    minImpactFilter,
    minConfidenceFilter,
    dateFromFilter,
    dateToFilter,
    slaStatusFilter,
    ageingBucketFilter,
  ]);

  const activeCase = useMemo(
    () => visibleRows.find((row) => row.id === activeCaseId) ?? null,
    [visibleRows, activeCaseId]
  );

  const offices = useMemo(() => {
    const set = new Map<string, string>();
    for (const c of rows) set.set(c.office.srCode, c.office.srName);
    return Array.from(set.entries()).map(([code, name]) => ({ code, name }));
  }, [rows]);

  const districts = useMemo(() => Array.from(new Set(rows.map((r) => r.office.district))), [rows]);
  const zones = useMemo(() => Array.from(new Set(rows.map((r) => r.office.zone))), [rows]);
  const docTypes = useMemo(() => Array.from(new Set(rows.map((r) => r.docType.tranDesc))), [rows]);
  const assignees = useMemo(
    () => Array.from(new Set(rows.map((r) => r.assignedTo).filter((v): v is string => !!v))),
    [rows]
  );
  const landNatures = useMemo(
    () => Array.from(new Set(rows.map((r) => r.propertySummary.landNature ?? "Unknown"))),
    [rows]
  );
  const ageingBuckets = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const ageDays = r.sla?.ageingDays ?? ageFromCreated(r.createdAt);
      const bucket =
        r.sla?.ageingBucket ??
        (ageDays > 30 ? "30d+" : ageDays > 14 ? "15-30d" : ageDays > 7 ? "8-14d" : "0-7d");
      set.add(bucket);
    }
    return Array.from(set);
  }, [rows]);

  const allSelectedOnPage = visibleRows.length > 0 && visibleRows.every((r) => selectedIds.has(r.id));
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count += 1;
    if (registrationRange !== "all") count += 1;
    if (riskFilters.length) count += riskFilters.length;
    if (signalFilters.length) count += signalFilters.length;
    if (statusFilters.length) count += statusFilters.length;
    if (officeFilter !== "all") count += 1;
    if (districtFilter !== "all") count += 1;
    if (zoneFilter !== "all") count += 1;
    if (docTypeFilter !== "all") count += 1;
    if (propertyTypeFilter !== "all") count += 1;
    if (landNatureFilter !== "all") count += 1;
    if (ownerFilter !== "all") count += 1;
    if (minGapFilter != null) count += 1;
    if (minImpactFilter != null) count += 1;
    if (minConfidenceFilter != null) count += 1;
    if (dateFromFilter) count += 1;
    if (dateToFilter) count += 1;
    if (slaStatusFilter !== "all") count += 1;
    if (ageingBucketFilter !== "all") count += 1;
    return count;
  }, [
    search,
    registrationRange,
    riskFilters,
    signalFilters,
    statusFilters,
    officeFilter,
    districtFilter,
    zoneFilter,
    docTypeFilter,
    propertyTypeFilter,
    landNatureFilter,
    ownerFilter,
    minGapFilter,
    minImpactFilter,
    minConfidenceFilter,
    dateFromFilter,
    dateToFilter,
    slaStatusFilter,
    ageingBucketFilter,
  ]);

  const toggleMulti = <T extends string>(current: T[], value: T): T[] =>
    current.includes(value) ? current.filter((v) => v !== value) : [...current, value];

  const clearFilters = () => {
    setSearch("");
    setRegistrationRange("all");
    setSortMode("risk");
    setRiskFilters([]);
    setSignalFilters([]);
    setStatusFilters([]);
    setOfficeFilter("all");
    setDistrictFilter("all");
    setZoneFilter("all");
    setDocTypeFilter("all");
    setPropertyTypeFilter("all");
    setLandNatureFilter("all");
    setOwnerFilter("all");
    setMinGapFilter(null);
    setMinImpactFilter(null);
    setMinConfidenceFilter(null);
    setDateFromFilter(null);
    setDateToFilter(null);
    setSlaStatusFilter("all");
    setAgeingBucketFilter("all");
    setPage(1);
  };

  const onRowOpen = (c: IGRSCase) => {
    setActiveCaseId(c.id);
  };

  const updateCaseAndRefresh = async (id: string, updates: Partial<IGRSCase>) => {
    await update(id, updates);
    await refetch();
  };

  const handleStatusChange = async (status: string) => {
    if (!activeCase) return;
    await updateCaseAndRefresh(activeCase.id, {
      status: status as IGRSCase["status"],
      activityLog: [
        {
          id: `log-${Date.now()}`,
          ts: new Date().toISOString(),
          actor: "Current User",
          action: "Status updated",
          detail: `Status changed to ${status}`,
        },
        ...activeCase.activityLog,
      ],
    });
    setActiveCaseId(activeCase.id);
    toast.success("Status updated");
  };

  const handleAssigneeChange = async (assignee: string) => {
    if (!activeCase) return;
    await updateCaseAndRefresh(activeCase.id, {
      assignedTo: assignee || null,
      activityLog: [
        {
          id: `log-${Date.now()}`,
          ts: new Date().toISOString(),
          actor: "Current User",
          action: "Owner assigned",
          detail: assignee ? `Assigned to ${assignee}` : "Unassigned",
        },
        ...activeCase.activityLog,
      ],
    });
    setActiveCaseId(activeCase.id);
    toast.success("Owner updated");
  };

  const handleAddNote = async (note: string) => {
    if (!activeCase) return;
    const normalized = activeCase.notes.map(safeNote);
    const newNote: IGRSCaseNote = {
      id: `note-${Date.now()}`,
      author: "Current User",
      createdAt: new Date().toISOString(),
      note,
    };
    await updateCaseAndRefresh(activeCase.id, {
      notes: [...normalized, newNote],
      activityLog: [
        {
          id: `log-${Date.now()}`,
          ts: new Date().toISOString(),
          actor: "Current User",
          action: "Note added",
          detail: note,
        },
        ...activeCase.activityLog,
      ],
    });
    setActiveCaseId(activeCase.id);
    toast.success("Note added");
  };

  const handleEscalate = async (target: EscalateTarget, reason: string) => {
    if (!activeCase) return;
    await updateCaseAndRefresh(activeCase.id, {
      activityLog: [
        {
          id: `log-${Date.now()}`,
          ts: new Date().toISOString(),
          actor: "Current User",
          action: "Escalated",
          detail: `Escalated to ${target}: ${reason}`,
        },
        ...activeCase.activityLog,
      ],
    });
    setActiveCaseId(activeCase.id);
    toast.success(`Case escalated to ${target}`);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-10 bg-slate-200 rounded animate-pulse" />
        <div className="h-16 bg-slate-200 rounded animate-pulse" />
        <div className="h-96 bg-slate-200 rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-5">
            <p className="text-sm text-red-700">{error}</p>
            <Button className="mt-3" size="sm" variant="outline" onClick={refetch}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-5 space-y-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold">Cases</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Leakage cases — filter, review, and resolve flagged documents
            </p>
          </div>
          <JurisdictionBadge />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="relative min-w-[260px] flex-1 max-w-[420px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search Case ID, Doc Key, Party..."
              className="pl-8 h-8 text-sm bg-white"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <Button
            variant="outline"
            className="h-8 text-xs border-slate-300 bg-white"
            onClick={() => setShowMoreFilters((s) => !s)}
          >
            <Filter className="w-3.5 h-3.5 mr-1" /> More Filters
            {activeFilterCount > 0 && (
              <span className="ml-1.5 min-w-5 h-5 px-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] leading-5 text-center">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <Select value={registrationRange} onValueChange={(v) => setRegistrationRange(v)}>
            <SelectTrigger className="h-8 w-[160px] text-xs bg-white">
              <SelectValue placeholder="Registration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Registration — All</SelectItem>
              <SelectItem value="30">Registration — 30d</SelectItem>
              <SelectItem value="90">Registration — 90d</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <SelectTrigger className="h-8 w-[128px] text-xs bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="risk">Sort: Risk</SelectItem>
              <SelectItem value="gap">Sort: Gap</SelectItem>
              <SelectItem value="newest">Sort: Newest</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-1">
            <Button
              size="icon"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              className="h-8 w-8"
              onClick={() => setViewMode("table")}
            >
              <List className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant={viewMode === "compact" ? "secondary" : "ghost"}
              className="h-8 w-8"
              onClick={() => setViewMode("compact")}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={showMoreFilters} onOpenChange={setShowMoreFilters}>
        <SheetContent side="right" className="w-[360px] sm:max-w-[360px] p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b">
            <SheetTitle className="text-2xl font-semibold">Filters</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            <section className="space-y-2.5">
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Location</p>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Office</label>
                <Select value={officeFilter} onValueChange={(v) => setOfficeFilter(v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Office" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Offices</SelectItem>
                    {offices.map((o) => (
                      <SelectItem key={o.code} value={o.code}>{o.code} · {o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">District</label>
                <Select value={districtFilter} onValueChange={(v) => setDistrictFilter(v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="District" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Districts</SelectItem>
                    {districts.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Zone</label>
                <Select value={zoneFilter} onValueChange={(v) => setZoneFilter(v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Zone" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Zones</SelectItem>
                    {zones.map((z) => (
                      <SelectItem key={z} value={z}>{z}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="space-y-2.5">
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Document & Property</p>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Document Type</label>
                <Select value={docTypeFilter} onValueChange={(v) => setDocTypeFilter(v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Doc Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Doc Types</SelectItem>
                    {docTypes.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Property Type</label>
                <Select value={propertyTypeFilter} onValueChange={(v) => setPropertyTypeFilter(v as "all" | "urban" | "rural")}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="urban">Urban</SelectItem>
                    <SelectItem value="rural">Rural</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Land Nature</label>
                <Select value={landNatureFilter} onValueChange={(v) => setLandNatureFilter(v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {landNatures.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="space-y-2.5">
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Assignment</p>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Owner</label>
                <Select value={ownerFilter} onValueChange={(v) => setOwnerFilter(v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Owner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Owners</SelectItem>
                    <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                    {assignees.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="space-y-2.5">
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Workflow</p>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Status</label>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {STATUS_OPTIONS.map((status) => (
                    <ChipToggle
                      key={status}
                      label={status}
                      active={statusFilters.includes(status)}
                      onClick={() => {
                        setStatusFilters((prev) => toggleMulti(prev, status));
                        setPage(1);
                      }}
                      activeClassName={
                        status === "New"
                          ? "bg-blue-100 text-blue-700 border-blue-300"
                          : status === "In Review"
                            ? "bg-amber-100 text-amber-700 border-amber-300"
                            : "bg-emerald-100 text-emerald-700 border-emerald-300"
                      }
                      inactiveClassName={
                        status === "New"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : status === "In Review"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-2.5">
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Amounts</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Min Gap (₹)</label>
                  <Input
                    type="number"
                    className="h-9 text-sm"
                    placeholder="e.g. 10000"
                    value={minGapFilter ?? ""}
                    onChange={(e) => setMinGapFilter(e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Min Impact (₹)</label>
                  <Input
                    type="number"
                    className="h-9 text-sm"
                    placeholder="e.g. 50000"
                    value={minImpactFilter ?? ""}
                    onChange={(e) => setMinImpactFilter(e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-2.5">
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Confidence</p>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Min Confidence (%)</label>
                <Input
                  type="number"
                  className="h-9 text-sm"
                  placeholder="e.g. 70"
                  value={minConfidenceFilter ?? ""}
                  onChange={(e) => setMinConfidenceFilter(e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </section>

            <section className="space-y-2.5">
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">SLA & Ageing</p>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">SLA Status</label>
                <Select value={slaStatusFilter} onValueChange={(v) => setSlaStatusFilter(v as "all" | "breached" | "within")}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="breached">Breached</SelectItem>
                    <SelectItem value="within">Within SLA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Ageing Bucket</label>
                <Select value={ageingBucketFilter} onValueChange={(v) => setAgeingBucketFilter(v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {ageingBuckets.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>
          </div>

          <div className="border-t px-5 py-3 flex items-center justify-end gap-2 bg-white">
            <Button variant="outline" className="h-9" onClick={clearFilters}>
              Reset All
            </Button>
            <Button className="h-9 bg-blue-600 hover:bg-blue-700" onClick={() => setShowMoreFilters(false)}>
              Apply
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="font-semibold text-[10px] tracking-wide text-slate-500">RISK</span>
        {RISK_OPTIONS.map((risk) => (
          <ChipToggle
            key={risk}
            label={risk}
            active={riskFilters.includes(risk)}
            onClick={() => {
              setRiskFilters((prev) => toggleMulti(prev, risk));
              setPage(1);
            }}
            activeClassName={
              risk === "High"
                ? "bg-red-100 text-red-700 border-red-300"
                : risk === "Medium"
                  ? "bg-amber-100 text-amber-700 border-amber-300"
                  : "bg-emerald-100 text-emerald-700 border-emerald-300"
            }
            inactiveClassName={
              risk === "High"
                ? "bg-red-50 text-red-600 border-red-200"
                : risk === "Medium"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }
          />
        ))}

        <span className="ml-2 font-semibold text-[10px] tracking-wide text-slate-500">SIGNAL</span>
        {SIGNAL_OPTIONS.map((signal) => (
          <ChipToggle
            key={signal.value}
            label={signal.label}
            active={signalFilters.includes(signal.value)}
            onClick={() => {
              setSignalFilters((prev) => toggleMulti(prev, signal.value));
              setPage(1);
            }}
            activeClassName={SIGNAL_CHIP_STYLES[signal.value].active}
            inactiveClassName={SIGNAL_CHIP_STYLES[signal.value].inactive}
          />
        ))}

        <Button variant="ghost" size="sm" className="h-7 text-[11px] ml-auto px-2 text-slate-600" onClick={clearFilters}>Reset Filters</Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1650px] text-sm">
              <thead className="bg-slate-50 border-b-2 border-slate-200 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="py-2 px-3 w-[36px] text-left">
                    <input
                      type="checkbox"
                      checked={allSelectedOnPage}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          for (const row of visibleRows) {
                            if (checked) next.add(row.id);
                            else next.delete(row.id);
                          }
                          return next;
                        });
                      }}
                    />
                  </th>
                  <th className="py-2 px-3 text-left">Case ID</th>
                  <th className="py-2 px-3 text-left">Document</th>
                  <th className="py-2 px-3 text-left">Reg Date</th>
                  <th className="py-2 px-3 text-left">Doc Type</th>
                  <th className="py-2 px-3 text-left">Office</th>
                  <th className="py-2 px-3 text-left">Property</th>
                  <th className="py-2 px-3 text-right">Payable</th>
                  <th className="py-2 px-3 text-right">Paid</th>
                  <th className="py-2 px-3 text-right">Gap</th>
                  <th className="py-2 px-3 text-left">Signals</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center text-slate-500 py-10">No cases match the current filters.</td>
                  </tr>
                )}
                {visibleRows.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-blue-50/40">
                    <td className="py-2 px-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (checked) next.add(c.id);
                            else next.delete(c.id);
                            return next;
                          });
                        }}
                      />
                    </td>
                    <td className="py-2 px-3 font-semibold whitespace-nowrap">{c.caseId}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <button className="text-blue-700 font-semibold hover:underline" onClick={() => onRowOpen(c)} type="button">
                        {formatDocKey(c)}
                      </button>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">{c.dates.rDate}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{c.docType.tranDesc}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{c.office.srCode} · {c.office.srName}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{c.propertySummary.isUrban ? "Urban" : "Rural"} · {c.propertySummary.extent}</td>
                    <td className="py-2 px-3 text-right whitespace-nowrap font-medium">{formatINR(c.payableTotalInr)}</td>
                    <td className="py-2 px-3 text-right whitespace-nowrap font-medium">{formatINR(c.paidTotalInr)}</td>
                    <td className="py-2 px-3 text-right whitespace-nowrap font-bold text-red-600">{formatINR(c.gapInr)}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex flex-nowrap gap-1 overflow-hidden">
                        {c.leakageSignals.slice(0, 2).map((s) => (
                          <span key={`${c.id}-${s}`} className={`px-2 py-0 rounded border text-[11px] font-medium whitespace-nowrap ${SIGNAL_BADGES[s]}`}>
                            {SIGNAL_LABELS[s]}
                          </span>
                        ))}
                        {c.leakageSignals.length > 2 && (
                          <span className="px-2 py-0 rounded border text-[11px] text-slate-600 border-slate-200 whitespace-nowrap">+{c.leakageSignals.length - 2}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t bg-slate-50/70">
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold">{visibleRows.length}</span> of <span className="font-semibold">{total}</span> cases
              {selectedIds.size > 0 ? ` · ${selectedIds.size} selected` : ""}
            </p>
            <div className="flex items-center gap-2">
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-9 w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15/page</SelectItem>
                  <SelectItem value="25">25/page</SelectItem>
                  <SelectItem value="50">50/page</SelectItem>
                </SelectContent>
              </Select>

              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <span className="text-sm text-slate-600">Page {page} of {Math.max(1, totalPages)}</span>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <CaseDrawer
        open={!!activeCase}
        onOpenChange={(open) => {
          if (!open) setActiveCaseId(null);
        }}
        caseItem={activeCase}
        assigneeOptions={assignees}
        onStatusChange={handleStatusChange}
        onAssigneeChange={handleAssigneeChange}
        onAddNote={handleAddNote}
        onEscalate={handleEscalate}
      />

      {mutating && (
        <div className="fixed bottom-4 right-4 bg-slate-700 text-white text-xs px-3 py-2 rounded shadow">
          Updating case...
        </div>
      )}
    </div>
  );
}
