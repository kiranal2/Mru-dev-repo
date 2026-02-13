"use client";

import { useEffect, useMemo, useState } from "react";
import { LeakageCase, RuleHit } from "@/lib/revenue-leakage/types";
import { revenueLeakageApi } from "@/lib/revenue-leakage/revenueLeakageApi";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertTriangle,
  FileDown,
  UserPlus,
  ArrowUpRight,
  Clock,
  Lightbulb,
  Shield,
  XCircle,
  StickyNote,
  Pencil,
  RotateCcw,
} from "lucide-react";

interface RevenueLeakageCaseDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseItem: LeakageCase | null;
  onUpdateCase: (caseId: string, updates: Partial<LeakageCase>) => Promise<void>;
  onAddNote: (caseId: string, note: string) => Promise<void>;
  onResetCase?: (caseId: string) => Promise<void>;
  isEdited?: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDocKey = (caseItem: LeakageCase) =>
  `${caseItem.document_key.SR_CODE}/${caseItem.document_key.BOOK_NO}/${caseItem.document_key.DOCT_NO}/${caseItem.document_key.REG_YEAR}`;

const owners = ["DIG", "DR", "Joint IG 1", "Joint IG 2", "Addl IG", "Audit DR"];

const riskStyles: Record<LeakageCase["risk_level"], string> = {
  High: "bg-red-600 text-white border-red-700",
  Medium: "bg-amber-500 text-white border-amber-600",
  Low: "bg-emerald-600 text-white border-emerald-700",
};

const statusStyles: Record<string, string> = {
  New: "bg-blue-600 text-white",
  "In Review": "bg-amber-500 text-white",
  Confirmed: "bg-orange-600 text-white",
  Resolved: "bg-emerald-600 text-white",
  Rejected: "bg-slate-500 text-white",
};

const payableLabels: Record<string, string> = {
  SD_PAYABLE: "Stamp Duty",
  TD_PAYABLE: "Transfer Duty",
  RF_PAYABLE: "Registration Fee",
  DSD_PAYABLE: "DSD Fee",
  OTHER_FEE: "Other Fees",
  FINAL_TAXABLE_VALUE: "Taxable Value",
};

const riskScoreColor = (score: number) => {
  if (score >= 80) return "bg-red-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-emerald-500";
};

export function RevenueLeakageCaseDrawer({
  open,
  onOpenChange,
  caseItem,
  onUpdateCase,
  onAddNote,
  onResetCase,
  isEdited,
}: RevenueLeakageCaseDrawerProps) {
  const [noteText, setNoteText] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escalateTo, setEscalateTo] = useState("");
  const [escalateReason, setEscalateReason] = useState("");
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<Partial<LeakageCase>>({});

  // Reset edit mode when drawer closes or case changes
  useEffect(() => {
    setEditing(false);
    setEditDraft({});
  }, [open, caseItem?.case_id]);

  const receiptsIncluded = caseItem?.evidence.included_receipts ?? [];
  const receiptsExcluded = caseItem?.evidence.excluded_receipts ?? [];

  const paidTotal = receiptsIncluded.reduce(
    (sum, receipt) => sum + receipt.cash_paid.reduce((lineSum, line) => lineSum + line.AMOUNT, 0),
    0
  );
  const gap = Math.max(0, (caseItem?.payable_total_inr ?? 0) - paidTotal);

  const delayRows = receiptsIncluded.map((receipt) => {
    if (!receipt.BANK_CHALLAN_DT || !receipt.RECEIPT_DATE) return { ...receipt, delayDays: null };
    const delayDays = Math.max(
      0,
      Math.round(
        (new Date(receipt.RECEIPT_DATE).getTime() - new Date(receipt.BANK_CHALLAN_DT).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    return { ...receipt, delayDays };
  });

  const avgDelay = useMemo(() => {
    const values = delayRows
      .map((row) => row.delayDays)
      .filter((value): value is number => value !== null);
    if (!values.length) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [delayRows]);

  const groupedParties = useMemo(() => {
    const parties = caseItem?.parties_summary ?? [];
    const buyers = parties.filter((p) => ["BUY", "PUR", "B"].includes(p.CODE));
    const sellers = parties.filter((p) => ["SEL", "S", "SLR"].includes(p.CODE));
    const others = parties.filter((p) => !buyers.includes(p) && !sellers.includes(p));
    return { buyers, sellers, others };
  }, [caseItem]);

  const enterEditMode = () => {
    if (!caseItem) return;
    setEditDraft({
      risk_level: caseItem.risk_level,
      risk_score: caseItem.risk_score,
      confidence: caseItem.confidence,
      impact_amount_inr: caseItem.impact_amount_inr,
      payable_total_inr: caseItem.payable_total_inr,
      paid_total_inr: caseItem.paid_total_inr,
      gap_inr: caseItem.gap_inr,
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditDraft({});
  };

  const saveEdits = async () => {
    if (!caseItem) return;
    const fieldLabels: Record<string, string> = {
      risk_level: "Risk Level",
      risk_score: "Risk Score",
      confidence: "Confidence",
      impact_amount_inr: "Impact Amount",
      payable_total_inr: "Payable Total",
      paid_total_inr: "Paid Total",
      gap_inr: "Gap",
    };
    const diffs: string[] = [];
    for (const key of Object.keys(fieldLabels) as (keyof typeof fieldLabels)[]) {
      const oldVal = (caseItem as unknown as Record<string, unknown>)[key];
      const newVal = (editDraft as unknown as Record<string, unknown>)[key];
      if (newVal !== undefined && newVal !== oldVal) {
        diffs.push(`${fieldLabels[key]}: ${oldVal} → ${newVal}`);
      }
    }
    if (diffs.length === 0) {
      setEditing(false);
      return;
    }
    const newEntry = {
      id: `log-${Date.now()}`,
      ts: new Date().toISOString(),
      actor: "Current User",
      action: "Fields edited",
      detail: diffs.join("; "),
      diff: diffs.join("; "),
    };
    await onUpdateCase(caseItem.case_id, {
      ...editDraft,
      activity_log: [newEntry, ...caseItem.activity_log],
    });
    toast.success("Case updated");
    setEditing(false);
    setEditDraft({});
  };

  if (!caseItem) return null;

  const topRuleHits = caseItem.evidence.triggered_rules.slice(0, 3);
  const mvEvidence = caseItem.evidence.mv_evidence;
  const exemptionEvidence = caseItem.evidence.exemption_evidence;
  const sla = caseItem.sla;
  const suggestedActions = caseItem.suggested_actions;

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      toast.error("Enter a note");
      return;
    }
    await onAddNote(caseItem.case_id, noteText.trim());
    toast.success("Note added");
    setNoteText("");
    setNoteOpen(false);
  };

  const handleExport = (type: string) => {
    toast.success(`Export queued (${type})`);
  };

  const handleAuditPack = async () => {
    await revenueLeakageApi.createAuditPack(caseItem.case_id, "Current User");
    toast.success("Audit Pack PDF queued for generation");
  };

  const handleEscalate = async () => {
    if (!escalateTo.trim() || !escalateReason.trim()) {
      toast.error("Fill in all fields");
      return;
    }
    await revenueLeakageApi.escalateCase(
      caseItem.case_id,
      "Current User",
      escalateTo.trim(),
      escalateReason.trim()
    );
    toast.success(`Case escalated to ${escalateTo}`);
    setEscalateTo("");
    setEscalateReason("");
    setEscalateOpen(false);
  };

  const ruleBadge = (rule: RuleHit) => (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
        rule.severity === "High"
          ? "bg-red-600 text-white"
          : rule.severity === "Medium"
            ? "bg-amber-500 text-white"
            : "bg-emerald-600 text-white"
      }`}
    >
      {rule.severity}
    </span>
  );

  const completenessChecklist = [
    { label: "Schedule present", ok: !!caseItem.property_summary },
    { label: "Parties present", ok: caseItem.parties_summary.length > 0 },
    { label: "Receipts linked", ok: receiptsIncluded.length > 0 },
    { label: "Prohibited check complete", ok: true },
    { label: "MV evidence available", ok: mvEvidence.status === "Available" },
    { label: "Exemption check complete", ok: exemptionEvidence.status !== "Placeholder" },
  ];

  const slaBadgeColor = sla?.sla_breached
    ? "bg-red-50 text-red-700 border-red-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[740px] sm:max-w-[740px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-5 pb-4 border-b bg-gradient-to-r from-slate-800 to-slate-700">
          {/* Row 1: Doc key + Case ID */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle className="text-xl font-bold text-white tracking-tight">
                {formatDocKey(caseItem)}
              </SheetTitle>
              <p className="text-xs text-slate-300 mt-1">Case ID {caseItem.case_id}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${riskStyles[caseItem.risk_level]}`}
              >
                {caseItem.risk_level} Risk
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${statusStyles[caseItem.case_status] || "bg-slate-500 text-white"}`}
              >
                {caseItem.case_status}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-white/15 text-white border border-white/20">
                {caseItem.confidence}% conf.
              </span>
            </div>
          </div>

          {/* Row 2: SLA strip (if applicable) */}
          {sla && (
            <div
              className={`mt-3 flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${sla.sla_breached ? "bg-red-500/20 text-red-200" : "bg-emerald-500/20 text-emerald-200"}`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {sla.ageing_days}d old — Bucket: {sla.ageing_bucket}
              </span>
              {sla.sla_breached && (
                <span className="ml-auto font-bold text-red-300">SLA BREACHED</span>
              )}
              {!sla.sla_breached && (
                <span className="ml-auto text-emerald-300">
                  Within SLA ({sla.sla_target_days}d target)
                </span>
              )}
            </div>
          )}

          {/* Row 3: Actions */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Select
              value={caseItem.case_status}
              onValueChange={(value) =>
                onUpdateCase(caseItem.case_id, { case_status: value as LeakageCase["case_status"] })
              }
            >
              <SelectTrigger className="h-8 w-[140px] text-xs bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {["New", "In Review", "Confirmed", "Resolved", "Rejected"].map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={caseItem.assigned_to || ""}
              onValueChange={(value) => onUpdateCase(caseItem.case_id, { assigned_to: value })}
            >
              <SelectTrigger className="h-8 w-[150px] text-xs bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Assign owner" />
              </SelectTrigger>
              <SelectContent>
                {owners.map((owner) => (
                  <SelectItem key={owner} value={owner}>
                    {owner}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {editing ? (
              <>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={saveEdits}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={cancelEdit}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                {/* Edit button hidden
                <Button size="sm" variant="outline" className="h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={enterEditMode}>
                  <Pencil className="w-3.5 h-3.5 mr-1" />
                  Edit
                </Button>
                */}
                {isEdited && onResetCase && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs bg-amber-500/20 border-amber-400/30 text-amber-200 hover:bg-amber-500/30"
                    onClick={() => onResetCase(caseItem.case_id)}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Reset
                  </Button>
                )}
              </>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => setEscalateOpen(true)}
              >
                <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                Escalate
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => setNoteOpen(true)}
              >
                <StickyNote className="w-3.5 h-3.5 mr-1" />
                Note
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <FileDown className="w-3.5 h-3.5 mr-1" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport("PDF")}>
                    Export PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("CSV")}>
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAuditPack}>Generate Audit Pack</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="summary" className="w-full">
            <div className="sticky top-0 z-10 bg-white border-b px-6 pt-3">
              <TabsList className="w-full justify-start overflow-x-auto h-9 gap-0 bg-slate-100 p-0.5 rounded-lg">
                <TabsTrigger
                  value="summary"
                  className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                >
                  Summary
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                >
                  Payments
                </TabsTrigger>
                <TabsTrigger
                  value="delay"
                  className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                >
                  Delay
                </TabsTrigger>
                <TabsTrigger
                  value="property"
                  className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                >
                  Property
                </TabsTrigger>
                <TabsTrigger
                  value="exemptions"
                  className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                >
                  Exemptions
                </TabsTrigger>
                <TabsTrigger
                  value="prohibited"
                  className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                >
                  Prohibited
                </TabsTrigger>
                <TabsTrigger
                  value="parties"
                  className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                >
                  Parties
                </TabsTrigger>
                <TabsTrigger
                  value="explainability"
                  className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                >
                  Explain
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                >
                  Activity
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ─── Summary Tab ─── */}
            <TabsContent value="summary" className="px-6 py-4 space-y-4">
              {/* Payable Breakdown — human-readable labels */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Payable Breakdown
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(caseItem.payable_breakdown).map(([key, value]) => (
                    <Card key={key} className="p-3 bg-slate-50 border-slate-200">
                      <p className="text-[11px] font-medium text-slate-500">
                        {payableLabels[key] || key}
                      </p>
                      <p className="text-base font-bold text-slate-900 mt-0.5">
                        {formatCurrency(value)}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Paid / Gap / Risk Score */}
              <div className="grid grid-cols-3 gap-2">
                <Card className="p-3 bg-blue-50 border-blue-200">
                  <p className="text-[11px] font-medium text-blue-600">Paid Total</p>
                  {editing ? (
                    <Input
                      type="number"
                      className="mt-1 h-8 text-sm"
                      value={editDraft.paid_total_inr ?? ""}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, paid_total_inr: Number(e.target.value) }))
                      }
                    />
                  ) : (
                    <p className="text-lg font-bold text-blue-900 mt-0.5">
                      {formatCurrency(paidTotal)}
                    </p>
                  )}
                </Card>
                <Card
                  className={`p-3 ${gap > 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}
                >
                  <p
                    className={`text-[11px] font-medium ${gap > 0 ? "text-red-600" : "text-emerald-600"}`}
                  >
                    Gap
                  </p>
                  {editing ? (
                    <Input
                      type="number"
                      className="mt-1 h-8 text-sm"
                      value={editDraft.gap_inr ?? ""}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, gap_inr: Number(e.target.value) }))
                      }
                    />
                  ) : (
                    <p
                      className={`text-lg font-bold mt-0.5 ${gap > 0 ? "text-red-700" : "text-emerald-700"}`}
                    >
                      {formatCurrency(gap)}
                    </p>
                  )}
                </Card>
                <Card className="p-3 bg-slate-50 border-slate-200">
                  <p className="text-[11px] font-medium text-slate-500">Risk Score</p>
                  {editing ? (
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="mt-1 h-8 text-sm"
                      value={editDraft.risk_score ?? ""}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, risk_score: Number(e.target.value) }))
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${riskScoreColor(caseItem.risk_score)}`}
                          style={{ width: `${caseItem.risk_score}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-800">
                        {caseItem.risk_score}
                      </span>
                    </div>
                  )}
                </Card>
              </div>

              {/* Editable override fields (visible in edit mode) */}
              {editing && (
                <Card className="p-4 border-blue-200 bg-blue-50/30">
                  <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3">
                    Override Fields
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-600">Risk Level</label>
                      <Select
                        value={editDraft.risk_level || caseItem.risk_level}
                        onValueChange={(v) =>
                          setEditDraft((d) => ({
                            ...d,
                            risk_level: v as LeakageCase["risk_level"],
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-600">
                        Confidence (%)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        className="mt-1 h-8 text-xs"
                        value={editDraft.confidence ?? ""}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, confidence: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-600">
                        Impact Amount (INR)
                      </label>
                      <Input
                        type="number"
                        className="mt-1 h-8 text-xs"
                        value={editDraft.impact_amount_inr ?? ""}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, impact_amount_inr: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-600">
                        Payable Total (INR)
                      </label>
                      <Input
                        type="number"
                        className="mt-1 h-8 text-xs"
                        value={editDraft.payable_total_inr ?? ""}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, payable_total_inr: Number(e.target.value) }))
                        }
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* Suggested Actions (Phase 2E) */}
              {suggestedActions && (
                <Card className="p-4 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                      <Lightbulb className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-sm font-bold text-blue-900">Suggested Next Steps</p>
                  </div>
                  <p className="text-sm text-blue-800 mb-2">{suggestedActions.likely_cause}</p>
                  <ul className="space-y-1.5">
                    {suggestedActions.recommended_checks.map((check, idx) => (
                      <li key={idx} className="text-xs text-blue-700 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-500" />
                        {check}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Why Flagged */}
              <Card className="p-4 border-amber-200 bg-amber-50/50">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Why Flagged
                </h4>
                <ul className="space-y-3">
                  {topRuleHits.map((rule) => (
                    <li key={rule.rule_id} className="flex items-start gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          rule.severity === "High"
                            ? "bg-red-100"
                            : rule.severity === "Medium"
                              ? "bg-amber-100"
                              : "bg-emerald-100"
                        }`}
                      >
                        <AlertTriangle
                          className={`w-3 h-3 ${
                            rule.severity === "High"
                              ? "text-red-600"
                              : rule.severity === "Medium"
                                ? "text-amber-600"
                                : "text-emerald-600"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{rule.rule_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{rule.explanation}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Data Completeness */}
              <Card className="p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                  Data Completeness
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {completenessChecklist.map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm ${item.ok ? "bg-emerald-50" : "bg-slate-50"}`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 ${item.ok ? "text-emerald-500" : "text-slate-300"}`}
                      />
                      <span
                        className={`text-xs font-medium ${item.ok ? "text-slate-700" : "text-slate-400"}`}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Escalation History */}
              {caseItem.escalations && caseItem.escalations.length > 0 && (
                <Card className="p-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                    Escalation History
                  </h4>
                  <div className="space-y-2.5">
                    {caseItem.escalations.map((esc) => (
                      <div key={esc.id} className="flex items-start gap-2.5 text-xs">
                        <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <ArrowUpRight className="w-3 h-3 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {esc.escalated_by} → {esc.escalated_to}
                          </p>
                          <p className="text-slate-500 mt-0.5">{esc.reason}</p>
                          <p className="text-slate-400 mt-0.5">
                            {new Date(esc.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* ─── Payments Tab ─── */}
            <TabsContent value="payments" className="px-6 py-4 space-y-4">
              <Card className="p-3 border-amber-300 bg-amber-50">
                <p className="text-xs text-amber-800 font-bold">Inclusion Rule (Locked)</p>
                <p className="text-xs text-amber-700 mt-1">
                  Include only receipts where CASH_DET.ACC_CANC = &apos;A&apos;. CASH_DET.STATUS is
                  null and not used.
                </p>
              </Card>
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Included Receipts
                </h4>
                <div className="overflow-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-slate-300 bg-slate-700">
                      <tr>
                        <th className="text-left py-2 px-3 font-semibold">Receipt</th>
                        <th className="text-left py-2 px-3 font-semibold">Receipt Date</th>
                        <th className="text-left py-2 px-3 font-semibold">Challan</th>
                        <th className="text-left py-2 px-3 font-semibold">Bank</th>
                        <th className="text-left py-2 px-3 font-semibold">Entry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {receiptsIncluded.map((receipt) => (
                        <tr key={receipt.C_RECEIPT_NO} className="text-slate-800 hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold">{receipt.C_RECEIPT_NO}</td>
                          <td className="py-2 px-3">{receipt.RECEIPT_DATE}</td>
                          <td className="py-2 px-3">{receipt.BANK_CHALLAN_NO || "—"}</td>
                          <td className="py-2 px-3">
                            {receipt.BANK_NAME || "—"}{" "}
                            {receipt.BANK_BRANCH ? `(${receipt.BANK_BRANCH})` : ""}
                          </td>
                          <td className="py-2 px-3">{receipt.ENTRY_DATE || "—"}</td>
                        </tr>
                      ))}
                      {!receiptsIncluded.length && (
                        <tr>
                          <td colSpan={5} className="py-3 px-3 text-xs text-slate-500">
                            No included receipts.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Excluded Receipts
                </h4>
                <div className="overflow-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-slate-300 bg-slate-700">
                      <tr>
                        <th className="text-left py-2 px-3 font-semibold">Receipt</th>
                        <th className="text-left py-2 px-3 font-semibold">Reason</th>
                        <th className="text-left py-2 px-3 font-semibold">Receipt Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {receiptsExcluded.map((receipt) => (
                        <tr key={receipt.C_RECEIPT_NO} className="text-slate-800 hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold">{receipt.C_RECEIPT_NO}</td>
                          <td className="py-2 px-3 text-red-600 font-medium">
                            {receipt.exclude_reason || "Excluded"}
                          </td>
                          <td className="py-2 px-3">{receipt.RECEIPT_DATE}</td>
                        </tr>
                      ))}
                      {!receiptsExcluded.length && (
                        <tr>
                          <td colSpan={3} className="py-3 px-3 text-xs text-slate-500">
                            No excluded receipts.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <Card className="p-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Payment Line Items
                </h4>
                <div className="overflow-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-slate-300 bg-slate-700">
                      <tr>
                        <th className="text-left py-2 px-3 font-semibold">Account Code</th>
                        <th className="text-left py-2 px-3 font-semibold">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {receiptsIncluded
                        .flatMap((receipt) => receipt.cash_paid)
                        .map((line, idx) => (
                          <tr
                            key={`${line.ACCOUNT_CODE}-${idx}`}
                            className="text-slate-800 hover:bg-slate-50"
                          >
                            <td className="py-2 px-3">{line.ACCOUNT_CODE}</td>
                            <td className="py-2 px-3 font-semibold">
                              {formatCurrency(line.AMOUNT)}
                            </td>
                          </tr>
                        ))}
                      {!receiptsIncluded.length && (
                        <tr>
                          <td colSpan={2} className="py-3 px-3 text-xs text-slate-500">
                            No payment lines.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
              <div className="grid grid-cols-2 gap-2">
                <Card className="p-3 bg-blue-50 border-blue-200">
                  <p className="text-[11px] font-medium text-blue-600">Paid Total</p>
                  <p className="text-lg font-bold text-blue-900">{formatCurrency(paidTotal)}</p>
                </Card>
                <Card
                  className={`p-3 ${gap > 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}
                >
                  <p
                    className={`text-[11px] font-medium ${gap > 0 ? "text-red-600" : "text-emerald-600"}`}
                  >
                    Gap
                  </p>
                  <p
                    className={`text-lg font-bold ${gap > 0 ? "text-red-700" : "text-emerald-700"}`}
                  >
                    {formatCurrency(gap)}
                  </p>
                </Card>
              </div>
            </TabsContent>

            {/* ─── Delay Tab ─── */}
            <TabsContent value="delay" className="px-6 py-4 space-y-4">
              <Card className="p-3 bg-slate-50">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Timeline Flow
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-white rounded border text-slate-700 font-medium">
                    Bank Challan
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2 py-1 bg-white rounded border text-slate-700 font-medium">
                    Receipt
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2 py-1 bg-white rounded border text-slate-700 font-medium">
                    Registration
                  </span>
                </div>
              </Card>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Receipt Delays
                  </h4>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${avgDelay > 7 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                  >
                    Avg {avgDelay} days
                  </span>
                </div>
                <div className="overflow-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-slate-300 bg-slate-700">
                      <tr>
                        <th className="text-left py-2 px-3 font-semibold">Receipt</th>
                        <th className="text-left py-2 px-3 font-semibold">Challan Date</th>
                        <th className="text-left py-2 px-3 font-semibold">Receipt Date</th>
                        <th className="text-left py-2 px-3 font-semibold">Delay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {delayRows.map((row) => (
                        <tr key={row.C_RECEIPT_NO} className="text-slate-800 hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold">{row.C_RECEIPT_NO}</td>
                          <td className="py-2 px-3">{row.BANK_CHALLAN_DT || "—"}</td>
                          <td className="py-2 px-3">{row.RECEIPT_DATE}</td>
                          <td className="py-2 px-3">
                            {row.delayDays != null ? (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${row.delayDays > 7 ? "bg-red-100 text-red-700" : row.delayDays > 3 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                              >
                                {row.delayDays}d
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                      {!delayRows.length && (
                        <tr>
                          <td colSpan={4} className="py-3 px-3 text-xs text-slate-500">
                            No receipts to compute delays.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* ─── Property & MV Tab (Phase 2A) ─── */}
            <TabsContent value="property" className="px-6 py-4 space-y-4">
              <Card className="p-3">
                <h4 className="text-sm font-semibold mb-2">Property Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Location Type</p>
                    <p>{caseItem.property_summary.is_urban ? "Urban" : "Rural"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Extent</p>
                    <p>
                      {caseItem.property_summary.extent} {caseItem.property_summary.unit}
                    </p>
                  </div>
                  {caseItem.property_summary.is_urban && caseItem.property_summary.urban && (
                    <>
                      <div>
                        <p className="text-xs text-slate-500">Ward / Block</p>
                        <p>
                          {caseItem.property_summary.urban.WARD_NO} /{" "}
                          {caseItem.property_summary.urban.BLOCK_NO}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Door No</p>
                        <p>{caseItem.property_summary.urban.DOOR_NO}</p>
                      </div>
                    </>
                  )}
                  {!caseItem.property_summary.is_urban && caseItem.property_summary.rural && (
                    <>
                      <div>
                        <p className="text-xs text-slate-500">Village / Survey</p>
                        <p>
                          {caseItem.property_summary.rural.VILLAGE_CODE} /{" "}
                          {caseItem.property_summary.rural.SURVEY_NO}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Plot</p>
                        <p>{caseItem.property_summary.rural.PLOT_NO}</p>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Market Value Evidence */}
              {mvEvidence.status === "Available" ? (
                <>
                  <Card
                    className={`p-3 ${mvEvidence.deviation_pct < -10 ? "border-red-200 bg-red-50" : mvEvidence.deviation_pct < 0 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold">Market Value Comparison</h4>
                      <Badge variant={mvEvidence.deviation_pct < -10 ? "destructive" : "secondary"}>
                        {mvEvidence.deviation_pct > 0 ? "+" : ""}
                        {mvEvidence.deviation_pct.toFixed(1)}% deviation
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Declared Value</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(mvEvidence.declared_value)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Expected Value (Rate Card)</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(mvEvidence.expected_value)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                      <div>
                        <p className="text-xs text-slate-500">Current Unit Rate</p>
                        <p className="font-medium">
                          {formatCurrency(mvEvidence.unit_rate_current)}/unit
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Previous Unit Rate</p>
                        <p className="font-medium">
                          {formatCurrency(mvEvidence.unit_rate_previous)}/unit
                        </p>
                      </div>
                    </div>
                    {mvEvidence.note && (
                      <p className="text-xs text-slate-500 mt-2">{mvEvidence.note}</p>
                    )}
                  </Card>
                  {mvEvidence.rate_card && (
                    <Card className="p-3">
                      <h4 className="text-sm font-semibold mb-2">Rate Card Details</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">Source</p>
                          <p className="font-medium">{mvEvidence.rate_card.source}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">SRO Code</p>
                          <p>{mvEvidence.rate_card.SRO_CODE}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Location Key</p>
                          <p>{mvEvidence.rate_card.location_key}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Effective From</p>
                          <p>{mvEvidence.rate_card.effective_from}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Unit Rate (Current)</p>
                          <p className="font-medium">
                            {formatCurrency(mvEvidence.rate_card.UNIT_RATE)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Revenue Rate</p>
                          <p className="font-medium">
                            {formatCurrency(mvEvidence.rate_card.REV_RATE)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Previous Revenue Rate</p>
                          <p className="font-medium">
                            {formatCurrency(mvEvidence.rate_card.PRE_REV_RATE)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </>
              ) : mvEvidence.status === "NotApplicable" ? (
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <p className="text-sm text-slate-600">
                      Market Value comparison not applicable for this document type.
                    </p>
                  </div>
                  {mvEvidence.note && (
                    <p className="text-xs text-slate-500 mt-1">{mvEvidence.note}</p>
                  )}
                </Card>
              ) : (
                <Card className="p-3 border border-dashed border-slate-200">
                  <h4 className="text-sm font-semibold mb-1">Expected Rate Card</h4>
                  <p className="text-xs text-slate-500">
                    Rate card data not yet available for this location.
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Pending
                  </Badge>
                </Card>
              )}
            </TabsContent>

            {/* ─── Exemptions Tab (Phase 2B) ─── */}
            <TabsContent value="exemptions" className="px-6 py-4 space-y-4">
              {exemptionEvidence.status === "Available" ? (
                <>
                  {exemptionEvidence.repeat_usage_flag && (
                    <Card className="p-3 border-red-200 bg-red-50">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <div>
                          <p className="text-sm font-semibold text-red-700">
                            Repeat Usage Detected
                          </p>
                          {exemptionEvidence.repeat_party_pan && (
                            <p className="text-xs text-red-600">
                              PAN: {exemptionEvidence.repeat_party_pan}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                      Exemption Entries
                    </h4>
                    <div className="overflow-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="text-xs uppercase text-slate-300 bg-slate-700">
                          <tr>
                            <th className="text-left py-2 px-3 font-semibold">Code</th>
                            <th className="text-left py-2 px-3 font-semibold">Reason</th>
                            <th className="text-left py-2 px-3 font-semibold">Amount (₹)</th>
                            <th className="text-left py-2 px-3 font-semibold">Eligibility</th>
                            <th className="text-left py-2 px-3 font-semibold">Flags</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {exemptionEvidence.entries.map((entry, idx) => (
                            <tr
                              key={`${entry.exemption_code}-${idx}`}
                              className="text-slate-800 hover:bg-slate-50"
                            >
                              <td className="py-2 px-3 font-semibold">{entry.exemption_code}</td>
                              <td className="py-2 px-3">{entry.exemption_reason}</td>
                              <td className="py-2 px-3 font-semibold">
                                {formatCurrency(entry.exemption_amount)}
                              </td>
                              <td className="py-2 px-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                    entry.eligibility_result === "Pass"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : entry.eligibility_result === "Fail"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {entry.eligibility_result}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex gap-1">
                                  {!entry.doc_type_eligible && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                                      Doc Type
                                    </span>
                                  )}
                                  {entry.cap_exceeded && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                                      Cap
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {!exemptionEvidence.entries.length && (
                            <tr>
                              <td colSpan={5} className="py-3 px-3 text-xs text-slate-500">
                                No exemption entries.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {exemptionEvidence.note && (
                    <Card className="p-3">
                      <p className="text-xs text-slate-500">{exemptionEvidence.note}</p>
                    </Card>
                  )}
                </>
              ) : exemptionEvidence.status === "NotApplicable" ? (
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <p className="text-sm text-slate-600">
                      No exemptions claimed for this document.
                    </p>
                  </div>
                  {exemptionEvidence.note && (
                    <p className="text-xs text-slate-500 mt-1">{exemptionEvidence.note}</p>
                  )}
                </Card>
              ) : (
                <Card className="p-3 border border-dashed border-slate-200">
                  <p className="text-sm text-slate-500">Exemption evidence not yet available.</p>
                  <Badge variant="secondary" className="mt-2">
                    Pending
                  </Badge>
                </Card>
              )}
            </TabsContent>

            {/* ─── Prohibited Land Tab ─── */}
            <TabsContent value="prohibited" className="px-6 py-4 space-y-3">
              {caseItem.evidence.prohibited_matches.length > 0 ? (
                caseItem.evidence.prohibited_matches.map((match) => (
                  <Card key={match.PROHIB_CD} className="p-3 border border-red-200 bg-red-50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-red-700">Match Found</p>
                      <Badge variant="destructive">Prohibited</Badge>
                    </div>
                    <div className="text-xs text-red-700 mt-2 space-y-1">
                      <p>PROHIB_CD: {match.PROHIB_CD}</p>
                      <p>
                        Notification: {match.NOTI_GAZ_NO} ({match.NOTI_GAZ_DT})
                      </p>
                      <p>Match level: {match.match_level}</p>
                      <p>Fields: {match.match_fields.join(", ")}</p>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-3">
                  <p className="text-sm text-slate-600">No prohibited land match found.</p>
                </Card>
              )}
            </TabsContent>

            {/* ─── Parties Tab ─── */}
            <TabsContent value="parties" className="px-6 py-4 space-y-3">
              <Card className="p-3">
                <h4 className="text-sm font-semibold mb-2">Buyers</h4>
                {groupedParties.buyers.length ? (
                  groupedParties.buyers.map((party) => (
                    <div key={party.NAME} className="text-sm text-slate-700 mb-2">
                      <p className="font-medium">{party.NAME}</p>
                      <p className="text-xs text-slate-500">
                        PAN: {party.PAN_NO || "—"} | Phone: {party.PHONE_NO || "—"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No buyers identified.</p>
                )}
              </Card>
              <Card className="p-3">
                <h4 className="text-sm font-semibold mb-2">Sellers</h4>
                {groupedParties.sellers.length ? (
                  groupedParties.sellers.map((party) => (
                    <div key={party.NAME} className="text-sm text-slate-700 mb-2">
                      <p className="font-medium">{party.NAME}</p>
                      <p className="text-xs text-slate-500">
                        PAN: {party.PAN_NO || "—"} | Phone: {party.PHONE_NO || "—"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No sellers identified.</p>
                )}
              </Card>
              {groupedParties.others.length > 0 && (
                <Card className="p-3">
                  <h4 className="text-sm font-semibold mb-2">Other Parties</h4>
                  {groupedParties.others.map((party) => (
                    <div key={party.NAME} className="text-sm text-slate-700 mb-2">
                      <p className="font-medium">{party.NAME}</p>
                      <p className="text-xs text-slate-500">Role: {party.CODE}</p>
                    </div>
                  ))}
                </Card>
              )}
            </TabsContent>

            {/* ─── Explainability Tab ─── */}
            <TabsContent value="explainability" className="px-6 py-4 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Triggered Rules
                </h4>
                <div className="overflow-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-slate-300 bg-slate-700">
                      <tr>
                        <th className="text-left py-2 px-3 font-semibold">Rule</th>
                        <th className="text-left py-2 px-3 font-semibold">Severity</th>
                        <th className="text-left py-2 px-3 font-semibold">Impact (₹)</th>
                        <th className="text-left py-2 px-3 font-semibold">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {caseItem.evidence.triggered_rules.map((rule) => (
                        <tr key={rule.rule_id} className="text-slate-800 hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium">
                            {rule.rule_id} · {rule.rule_name}
                          </td>
                          <td className="py-2 px-3">{ruleBadge(rule)}</td>
                          <td className="py-2 px-3 font-semibold">
                            {formatCurrency(rule.impact_inr)}
                          </td>
                          <td className="py-2 px-3">{rule.confidence}%</td>
                        </tr>
                      ))}
                      {!caseItem.evidence.triggered_rules.length && (
                        <tr>
                          <td colSpan={4} className="py-3 px-3 text-xs text-slate-500">
                            No rules triggered.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <Card className="p-4 bg-slate-50">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Decision Trace
                </h4>
                <div className="flex items-center gap-2 text-xs mb-3">
                  <span className="px-2 py-1 bg-white rounded border text-slate-700 font-medium">
                    Inputs
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2 py-1 bg-white rounded border text-slate-700 font-medium">
                    Rules
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2 py-1 bg-white rounded border text-slate-700 font-medium">
                    Signals
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2 py-1 bg-white rounded border text-slate-700 font-medium">
                    Risk Score
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1.5">
                  <p>
                    <span className="font-semibold text-slate-700">Inputs:</span> TRAN_MAJOR,
                    CASH_DET, CASH_PAID, TRAN_SCHED
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Rules:</span>{" "}
                    {caseItem.evidence.triggered_rules.map((rule) => rule.rule_id).join(", ") ||
                      "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Signals:</span>{" "}
                    {caseItem.leakage_signals.join(", ")}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Risk Score:</span>{" "}
                    {caseItem.risk_score}
                  </p>
                </div>
              </Card>

              <Accordion type="single" collapsible className="space-y-2">
                {caseItem.evidence.triggered_rules.map((rule) => (
                  <AccordionItem
                    key={rule.rule_id}
                    value={rule.rule_id}
                    className="border rounded-md"
                  >
                    <AccordionTrigger className="px-3 py-2 text-sm font-medium hover:no-underline">
                      {rule.rule_id} · {rule.rule_name}
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 text-xs text-slate-600 space-y-2">
                      <p>{rule.explanation}</p>
                      <div>
                        <p className="font-medium text-slate-500 mb-1">Fields used</p>
                        <ul className="list-disc ml-4 space-y-1">
                          {rule.fields_used.map((field) => (
                            <li key={field}>{field}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-slate-500 mb-1">Calculation snapshot</p>
                        <ul className="space-y-1">
                          {rule.calculations.map((calc) => (
                            <li key={calc.label}>
                              {calc.label}: {calc.value}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>

            {/* ─── Activity Log Tab ─── */}
            <TabsContent value="activity" className="px-6 py-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                  Activity Log
                </h4>
                <div className="space-y-0">
                  {caseItem.activity_log.map((entry, idx) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        {idx < caseItem.activity_log.length - 1 && (
                          <div className="w-0.5 flex-1 bg-slate-200 mt-1" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-[11px] text-slate-400">
                          {new Date(entry.ts).toLocaleString()}
                        </p>
                        <p className="text-sm font-semibold text-slate-900">{entry.action}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{entry.detail}</p>
                        {entry.diff && (
                          <p className="text-xs text-slate-400 mt-0.5 font-mono bg-slate-50 px-2 py-1 rounded">
                            Diff: {entry.diff}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {!caseItem.activity_log.length && (
                    <p className="text-xs text-slate-500">No activity yet.</p>
                  )}
                </div>
              </div>

              {/* Notes section */}
              {caseItem.notes.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                    Notes
                  </h4>
                  <div className="space-y-2">
                    {caseItem.notes.map((note) => (
                      <Card
                        key={note.id}
                        className="p-3 border-l-4 border-l-blue-500 bg-blue-50/30"
                      >
                        <p className="text-[11px] text-slate-400">
                          {note.author} · {new Date(note.created_at).toLocaleString()}
                        </p>
                        <p className="text-sm text-slate-800 mt-0.5">{note.note}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>

      {/* Add Note Dialog */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <textarea
            className="w-full h-28 border border-slate-200 rounded-md p-2 text-sm"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add context or next steps..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote}>Add Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate Dialog (Phase 2E) */}
      <Dialog open={escalateOpen} onOpenChange={setEscalateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate Case</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Escalate To</label>
              <Select value={escalateTo} onValueChange={setEscalateTo}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="District Registrar">District Registrar</SelectItem>
                  <SelectItem value="Zonal Inspector">Zonal Inspector</SelectItem>
                  <SelectItem value="Chief Commissioner">Chief Commissioner</SelectItem>
                  <SelectItem value="Revenue Audit Cell">Revenue Audit Cell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Reason</label>
              <textarea
                className="w-full h-20 border border-slate-200 rounded-md p-2 text-sm mt-1"
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                placeholder="Explain why this case needs escalation..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEscalate} className="bg-amber-600 hover:bg-amber-700">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              Escalate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
