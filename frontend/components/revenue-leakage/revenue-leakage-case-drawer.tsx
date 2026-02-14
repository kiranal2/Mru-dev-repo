"use client";

import { useEffect, useMemo, useState } from "react";
import { LeakageCase } from "@/lib/revenue-leakage/types";
import { revenueLeakageApi } from "@/lib/revenue-leakage/revenueLeakageApi";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { fieldLabels } from "./constants";
import { CaseDrawerHeader } from "./case-drawer-header";
import { CaseDrawerSummaryTab } from "./case-drawer-summary-tab";
import { CaseDrawerPaymentsTab } from "./case-drawer-payments-tab";
import { CaseDrawerDelayTab } from "./case-drawer-delay-tab";
import { CaseDrawerPropertyTab } from "./case-drawer-property-tab";
import { CaseDrawerExemptionsTab } from "./case-drawer-exemptions-tab";
import {
  CaseDrawerProhibitedTab,
  CaseDrawerPartiesTab,
  CaseDrawerExplainTab,
} from "./case-drawer-detail-tabs";
import { CaseDrawerActivityTab } from "./case-drawer-activity-tab";
import { NoteDialog, EscalateDialog } from "./case-drawer-dialogs";

interface RevenueLeakageCaseDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseItem: LeakageCase | null;
  onUpdateCase: (caseId: string, updates: Partial<LeakageCase>) => Promise<void>;
  onAddNote: (caseId: string, note: string) => Promise<void>;
  onResetCase?: (caseId: string) => Promise<void>;
  isEdited?: boolean;
}

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

  const cancelEdit = () => {
    setEditing(false);
    setEditDraft({});
  };

  const saveEdits = async () => {
    if (!caseItem) return;
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

  const mvEvidence = caseItem.evidence.mv_evidence;
  const exemptionEvidence = caseItem.evidence.exemption_evidence;

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

  const tabTriggerClass =
    "text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[740px] sm:max-w-[740px] p-0 flex flex-col">
        <CaseDrawerHeader
          caseItem={caseItem}
          editing={editing}
          isEdited={isEdited}
          onUpdateCase={onUpdateCase}
          onResetCase={onResetCase}
          onSaveEdits={saveEdits}
          onCancelEdit={cancelEdit}
          onEscalateOpen={() => setEscalateOpen(true)}
          onNoteOpen={() => setNoteOpen(true)}
          onExport={handleExport}
          onAuditPack={handleAuditPack}
        />

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="summary" className="w-full">
            <div className="sticky top-0 z-10 bg-white border-b px-6 pt-3">
              <TabsList className="w-full justify-start overflow-x-auto h-9 gap-0 bg-slate-100 p-0.5 rounded-lg">
                <TabsTrigger value="summary" className={tabTriggerClass}>Summary</TabsTrigger>
                <TabsTrigger value="payments" className={tabTriggerClass}>Payments</TabsTrigger>
                <TabsTrigger value="delay" className={tabTriggerClass}>Delay</TabsTrigger>
                <TabsTrigger value="property" className={tabTriggerClass}>Property</TabsTrigger>
                <TabsTrigger value="exemptions" className={tabTriggerClass}>Exemptions</TabsTrigger>
                <TabsTrigger value="prohibited" className={tabTriggerClass}>Prohibited</TabsTrigger>
                <TabsTrigger value="parties" className={tabTriggerClass}>Parties</TabsTrigger>
                <TabsTrigger value="explainability" className={tabTriggerClass}>Explain</TabsTrigger>
                <TabsTrigger value="activity" className={tabTriggerClass}>Activity</TabsTrigger>
              </TabsList>
            </div>

            <CaseDrawerSummaryTab
              caseItem={caseItem}
              editing={editing}
              editDraft={editDraft}
              setEditDraft={setEditDraft}
              paidTotal={paidTotal}
              gap={gap}
              receiptsIncluded={receiptsIncluded}
              mvEvidence={mvEvidence}
              exemptionEvidence={exemptionEvidence}
            />

            <CaseDrawerPaymentsTab
              receiptsIncluded={receiptsIncluded}
              receiptsExcluded={receiptsExcluded}
              paidTotal={paidTotal}
              gap={gap}
            />

            <CaseDrawerDelayTab delayRows={delayRows} avgDelay={avgDelay} />

            <CaseDrawerPropertyTab caseItem={caseItem} />

            <CaseDrawerExemptionsTab exemptionEvidence={exemptionEvidence} />

            <CaseDrawerProhibitedTab caseItem={caseItem} />

            <CaseDrawerPartiesTab groupedParties={groupedParties} />

            <CaseDrawerExplainTab caseItem={caseItem} />

            <CaseDrawerActivityTab caseItem={caseItem} />
          </Tabs>
        </div>
      </SheetContent>

      <NoteDialog
        open={noteOpen}
        onOpenChange={setNoteOpen}
        noteText={noteText}
        onNoteTextChange={setNoteText}
        onSubmit={handleAddNote}
      />

      <EscalateDialog
        open={escalateOpen}
        onOpenChange={setEscalateOpen}
        escalateTo={escalateTo}
        onEscalateToChange={setEscalateTo}
        escalateReason={escalateReason}
        onEscalateReasonChange={setEscalateReason}
        onSubmit={handleEscalate}
      />
    </Sheet>
  );
}
