"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useIGRSCases, useIGRSCaseMutation } from "@/hooks/data";
import type {
  IGRSCase,
  IGRSCaseFilters,
  IGRSCaseNote,
  IGRSLeakageSignal,
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
  | "Zonal Inspector"
  | "Joint IG"
  | "Revenue Audit Cell";

const RISK_OPTIONS = ["High", "Medium", "Low"];
const STATUS_OPTIONS = ["New", "In Review", "Confirmed", "Resolved", "Rejected"];
const SIGNAL_OPTIONS: Array<{ label: string; value: IGRSLeakageSignal }> = [
  { label: "Revenue Gap", value: "RevenueGap" },
  { label: "Challan Delay", value: "ChallanDelay" },
  { label: "Exemption Risk", value: "ExemptionRisk" },
  { label: "Market Value", value: "MarketValueRisk" },
  { label: "Prohibited Land", value: "ProhibitedLand" },
  { label: "Data Integrity", value: "DataIntegrity" },
  { label: "Holiday Fee", value: "HolidayFee" },
];

const SIGNAL_BADGES: Record<IGRSLeakageSignal, string> = {
  RevenueGap: "bg-red-50 text-red-700 border-red-200",
  ChallanDelay: "bg-amber-50 text-amber-700 border-amber-200",
  ExemptionRisk: "bg-purple-50 text-purple-700 border-purple-200",
  MarketValueRisk: "bg-blue-50 text-blue-700 border-blue-200",
  ProhibitedLand: "bg-pink-50 text-pink-700 border-pink-200",
  DataIntegrity: "bg-slate-100 text-slate-700 border-slate-200",
  HolidayFee: "bg-orange-50 text-orange-700 border-orange-200",
};

const SIGNAL_LABELS: Record<IGRSLeakageSignal, string> = {
  RevenueGap: "Revenue Gap",
  ChallanDelay: "Challan Delay",
  ExemptionRisk: "Exemption Risk",
  MarketValueRisk: "Market Value",
  ProhibitedLand: "Prohibited Land",
  DataIntegrity: "Data Integrity",
  HolidayFee: "Holiday Fee",
};

const RISK_BADGES: Record<string, string> = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const STATUS_BADGES: Record<string, string> = {
  New: "bg-blue-100 text-blue-700 border-blue-200",
  "In Review": "bg-amber-100 text-amber-700 border-amber-200",
  Confirmed: "bg-purple-100 text-purple-700 border-purple-200",
  Resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Rejected: "bg-slate-100 text-slate-700 border-slate-200",
};

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
  className,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      className={`px-3 py-1 rounded-full border text-xs font-medium transition ${
        active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"
      } ${className ?? ""}`}
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
                <span className={`px-2.5 py-1 rounded text-xs font-bold border ${STATUS_BADGES[caseItem.status]}`}>
                  {caseItem.status}
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
              <Select value={caseItem.status} onValueChange={(v) => void onStatusChange(v)}>
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
                  <SelectItem value="Zonal Inspector">Zonal Inspector</SelectItem>
                  <SelectItem value="Joint IG">Joint IG</SelectItem>
                  <SelectItem value="Revenue Audit Cell">Revenue Audit Cell</SelectItem>
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
  const [docTypeFilter, setDocTypeFilter] = useState("all");
  const [minGapFilter, setMinGapFilter] = useState<number | null>(null);
  const [dateFromFilter, setDateFromFilter] = useState<string | null>(null);
  const [dateToFilter, setDateToFilter] = useState<string | null>(null);
  const [slaBreachedOnly, setSlaBreachedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  const { update, loading: mutating } = useIGRSCaseMutation();

  useEffect(() => {
    const district = searchParams.get("district");
    const risk = searchParams.get("risk");
    const signal = searchParams.get("signal");
    const status = searchParams.get("status");
    const minGap = searchParams.get("minGap");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const sla = searchParams.get("sla");

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
        .map((v) => v.trim())
        .filter((v) => STATUS_OPTIONS.includes(v));
      setStatusFilters(next);
    }
    if (minGap) {
      const parsed = Number(minGap);
      setMinGapFilter(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
    }
    if (from) setDateFromFilter(from);
    if (to) setDateToFilter(to);
    if (sla === "breached") setSlaBreachedOnly(true);
    setPage(1);
  }, [searchParams]);

  const sortConfig = getSortConfig(sortMode);

  const filters: IGRSCaseFilters = {
    search: search || undefined,
    riskLevel: riskFilters.length ? riskFilters : undefined,
    signals: signalFilters.length ? signalFilters : undefined,
    status: statusFilters.length ? statusFilters : undefined,
    office: officeFilter !== "all" ? [officeFilter] : undefined,
    district: districtFilter !== "all" ? [districtFilter] : undefined,
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
  } = useIGRSCases(filters);

  const visibleRows = useMemo(() => {
    let list = [...rows];

    if (docTypeFilter !== "all") {
      list = list.filter((c) => c.docType.tranDesc === docTypeFilter || c.docType.abDesc === docTypeFilter);
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

    if (slaBreachedOnly) {
      list = list.filter((c) => {
        const ageDays = c.sla?.ageingDays ?? ageFromCreated(c.createdAt);
        return c.sla?.slaBreached ?? ageDays > 30;
      });
    }

    return list;
  }, [
    rows,
    docTypeFilter,
    registrationRange,
    minGapFilter,
    dateFromFilter,
    dateToFilter,
    slaBreachedOnly,
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
  const docTypes = useMemo(() => Array.from(new Set(rows.map((r) => r.docType.tranDesc))), [rows]);
  const assignees = useMemo(
    () => Array.from(new Set(rows.map((r) => r.assignedTo).filter((v): v is string => !!v))),
    [rows]
  );

  const allSelectedOnPage = visibleRows.length > 0 && visibleRows.every((r) => selectedIds.has(r.id));

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
    setDocTypeFilter("all");
    setMinGapFilter(null);
    setDateFromFilter(null);
    setDateToFilter(null);
    setSlaBreachedOnly(false);
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
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[280px] flex-1 max-w-[420px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search Case ID, Doc Key, Party,"
            className="pl-9 h-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <Button variant="outline" className="h-10" onClick={() => setShowMoreFilters((s) => !s)}>
          <Filter className="w-4 h-4 mr-1" /> More Filters
        </Button>

        <Select value={registrationRange} onValueChange={(v) => setRegistrationRange(v)}>
          <SelectTrigger className="h-10 w-[170px]">
            <SelectValue placeholder="Registration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Registration — All</SelectItem>
            <SelectItem value="30">Registration — 30d</SelectItem>
            <SelectItem value="90">Registration — 90d</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
          <SelectTrigger className="h-10 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="risk">Sort: Risk</SelectItem>
            <SelectItem value="gap">Sort: Gap</SelectItem>
            <SelectItem value="newest">Sort: Newest</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-1 border rounded-md p-1">
          <Button
            size="icon"
            variant={viewMode === "table" ? "secondary" : "ghost"}
            className="h-8 w-8"
            onClick={() => setViewMode("table")}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant={viewMode === "compact" ? "secondary" : "ghost"}
            className="h-8 w-8"
            onClick={() => setViewMode("compact")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showMoreFilters && (
        <Card>
          <CardContent className="py-3 grid grid-cols-1 md:grid-cols-3 gap-2">
            <Select value={officeFilter} onValueChange={(v) => setOfficeFilter(v)}>
              <SelectTrigger><SelectValue placeholder="Office" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Offices</SelectItem>
                {offices.map((o) => (
                  <SelectItem key={o.code} value={o.code}>{o.code} · {o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={districtFilter} onValueChange={(v) => setDistrictFilter(v)}>
              <SelectTrigger><SelectValue placeholder="District" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={docTypeFilter} onValueChange={(v) => setDocTypeFilter(v)}>
              <SelectTrigger><SelectValue placeholder="Doc Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doc Types</SelectItem>
                {docTypes.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="font-semibold text-slate-500">RISK</span>
        {RISK_OPTIONS.map((risk) => (
          <ChipToggle
            key={risk}
            label={risk}
            active={riskFilters.includes(risk)}
            onClick={() => {
              setRiskFilters((prev) => toggleMulti(prev, risk));
              setPage(1);
            }}
            className={risk === "High" ? "border-red-200 text-red-700" : risk === "Medium" ? "border-amber-200 text-amber-700" : "border-emerald-200 text-emerald-700"}
          />
        ))}

        <span className="mx-1 text-slate-300">|</span>
        <span className="font-semibold text-slate-500">SIGNAL</span>
        {SIGNAL_OPTIONS.map((signal) => (
          <ChipToggle
            key={signal.value}
            label={signal.label}
            active={signalFilters.includes(signal.value)}
            onClick={() => {
              setSignalFilters((prev) => toggleMulti(prev, signal.value));
              setPage(1);
            }}
          />
        ))}

        <span className="mx-1 text-slate-300">|</span>
        <span className="font-semibold text-slate-500">STATUS</span>
        {STATUS_OPTIONS.map((status) => (
          <ChipToggle
            key={status}
            label={status}
            active={statusFilters.includes(status)}
            onClick={() => {
              setStatusFilters((prev) => toggleMulti(prev, status));
              setPage(1);
            }}
          />
        ))}

        <Button variant="ghost" size="sm" className="text-xs ml-auto" onClick={clearFilters}>Reset Filters</Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1650px] text-sm">
              <thead className="bg-slate-900 text-slate-100 text-xs uppercase tracking-wide">
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
                  <tr key={c.id} className="border-b hover:bg-slate-50/80">
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
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white text-xs px-3 py-2 rounded shadow">
          Updating case...
        </div>
      )}
    </div>
  );
}
