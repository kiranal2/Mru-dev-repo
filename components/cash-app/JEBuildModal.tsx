"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Payment, JEDraftTemplateRecord, JEDraftTemplateLine } from "@/lib/cash-app-types";

interface JEBuildModalProps {
  open: boolean;
  payment: Payment;
  jeTypeCode: string;
  jeTypeLabel: string;
  onOpenChange: (open: boolean) => void;
  onChangeType: () => void;
  onSaveDraft: (draft: JEDraftTemplateRecord) => void;
  onSubmit: (draft: JEDraftTemplateRecord) => void;
}

const entityCode = "US01";

const templates = {
  BAD_DEBT: {
    code: "BAD_DEBT",
    label: "Bad Debt Recovery",
    requires_approval: true,
    requires_evidence: true,
    lines: [
      {
        dc: "DR",
        gl_account_id: "100100",
        gl_account_label: "Bank Clearing",
        amount_source: "PAYMENT_AMOUNT",
        memo_template: "Bad debt recovery for {{payment_id}}",
      },
      {
        dc: "CR",
        gl_account_id: "450900",
        gl_account_label: "Bad Debt Recovery",
        amount_source: "PAYMENT_AMOUNT",
        memo_template: "Bad debt recovery for {{payment_id}}",
      },
    ],
  },
  UNAPPLIED: {
    code: "UNAPPLIED",
    label: "Unapplied Cash",
    requires_approval: false,
    requires_evidence: false,
    lines: [
      {
        dc: "DR",
        gl_account_id: "100100",
        gl_account_label: "Bank Clearing",
        amount_source: "PAYMENT_AMOUNT",
        memo_template: "Unapplied cash for {{payment_id}}",
      },
      {
        dc: "CR",
        gl_account_id: "220200",
        gl_account_label: "Unapplied Cash",
        amount_source: "PAYMENT_AMOUNT",
        memo_template: "Unapplied cash for {{payment_id}}",
      },
    ],
  },
  ADVANCE: {
    code: "ADVANCE",
    label: "Customer Advance",
    requires_approval: false,
    requires_evidence: false,
    lines: [
      {
        dc: "DR",
        gl_account_id: "100100",
        gl_account_label: "Bank Clearing",
        amount_source: "PAYMENT_AMOUNT",
        memo_template: "Customer advance for {{payment_id}}",
      },
      {
        dc: "CR",
        gl_account_id: "220300",
        gl_account_label: "Customer Advances",
        amount_source: "PAYMENT_AMOUNT",
        memo_template: "Customer advance for {{payment_id}}",
      },
    ],
  },
  TEST_DEP: {
    code: "TEST_DEP",
    label: "Test Deposit",
    requires_approval: true,
    requires_evidence: false,
    lines: [
      {
        dc: "DR",
        gl_account_id: "100100",
        gl_account_label: "Bank Clearing",
        amount_source: "PAYMENT_AMOUNT",
        memo_template: "Test deposit for {{payment_id}}",
      },
      {
        dc: "CR",
        gl_account_id: "230500",
        gl_account_label: "Suspense / Test Deposits",
        amount_source: "PAYMENT_AMOUNT",
        memo_template: "Test deposit for {{payment_id}}",
      },
    ],
  },
  INTERCO: {
    code: "INTERCO",
    label: "Intercompany",
    requires_approval: true,
    requires_evidence: false,
    lines: [
      {
        dc: "DR",
        gl_account_id: "100100",
        gl_account_label: "Bank Clearing",
        amount_source: "PAYMENT_AMOUNT",
        memo_template: "Intercompany allocation for {{payment_id}}",
      },
      {
        dc: "CR",
        gl_account_id: "210800",
        gl_account_label: "Intercompany Payable",
        amount_source: "PAYMENT_AMOUNT",
        memo_template: "Intercompany allocation for {{payment_id}}",
      },
    ],
  },
  NON_AR: {
    code: "NON_AR",
    label: "Non-AR Cash",
    requires_approval: true,
    requires_evidence: true,
    lines: [
      {
        dc: "DR",
        gl_account_id: "100100",
        gl_account_label: "Bank Clearing",
        amount_source: "PAYMENT_AMOUNT",
        memo_template: "Non-AR cash for {{payment_id}}",
      },
      {
        dc: "CR",
        gl_account_id: "230000",
        gl_account_label: "Suspense / Other Receipts",
        amount_source: "PAYMENT_AMOUNT",
        memo_template: "Non-AR cash for {{payment_id}}",
      },
    ],
  },
} as const;

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export function JEBuildModal({
  open,
  payment,
  jeTypeCode,
  jeTypeLabel,
  onOpenChange,
  onChangeType,
  onSaveDraft,
  onSubmit,
}: JEBuildModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lines, setLines] = useState<JEDraftTemplateLine[]>([]);
  const [evidenceAttached, setEvidenceAttached] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<string[]>([]);
  const [balanceError, setBalanceError] = useState("");

  const template = templates[jeTypeCode as keyof typeof templates];
  const resolvedTemplate = template || templates.UNAPPLIED;

  const hydratedLines = useMemo(() => {
    const base = resolvedTemplate.lines.map((line) => ({
      dc: line.dc,
      gl_account_id: line.gl_account_id,
      gl_account_label: line.gl_account_label,
      amount: line.amount_source === "PAYMENT_AMOUNT" ? payment.amount : 0,
      memo: line.memo_template.replace("{{payment_id}}", payment.paymentNumber),
    }));
    return base;
  }, [resolvedTemplate, payment.amount, payment.paymentNumber]);

  useEffect(() => {
    if (!open) return;
    const existingDraft =
      payment.je_draft && "template_code" in payment.je_draft
        ? (payment.je_draft as JEDraftTemplateRecord)
        : null;
    if (existingDraft && existingDraft.template_code === resolvedTemplate.code) {
      setLines(existingDraft.lines);
      setEvidenceAttached(existingDraft.evidence_attached);
      setEvidenceFiles(existingDraft.evidence_files || []);
      return;
    }
    setLines(hydratedLines);
    setEvidenceAttached(false);
    setEvidenceFiles([]);
    setBalanceError("");
  }, [open, payment.je_draft, resolvedTemplate.code, hydratedLines]);

  const totalDr = (lines.length ? lines : hydratedLines)
    .filter((line) => line.dc === "DR")
    .reduce((sum, line) => sum + line.amount, 0);
  const totalCr = (lines.length ? lines : hydratedLines)
    .filter((line) => line.dc === "CR")
    .reduce((sum, line) => sum + line.amount, 0);
  const balanced = Math.abs(totalDr - totalCr) < 0.01;

  const requiresEvidence = resolvedTemplate.requires_evidence;
  const requiresApproval = resolvedTemplate.requires_approval;

  const draftLines = lines.length ? lines : hydratedLines;

  const handleMemoChange = (index: number, value: string) => {
    const next = [...draftLines];
    next[index] = { ...next[index], memo: value };
    setLines(next);
  };

  const handleUploadEvidence = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setEvidenceFiles((prev) => [...prev, file.name]);
    setEvidenceAttached(true);
  };

  const buildDraftRecord = (): JEDraftTemplateRecord => ({
    template_code: resolvedTemplate.code,
    template_label: resolvedTemplate.label,
    requires_approval: requiresApproval,
    requires_evidence: requiresEvidence,
    lines: draftLines,
    evidence_attached: evidenceAttached,
    evidence_files: evidenceFiles,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const handleSaveDraft = () => {
    if (!balanced) {
      setBalanceError("Debits and credits must balance before saving.");
      return;
    }
    setBalanceError("");
    onSaveDraft(buildDraftRecord());
  };

  const handleSubmit = () => {
    if (!balanced) {
      setBalanceError("Debits and credits must balance before submitting.");
      return;
    }
    if (requiresEvidence && !evidenceAttached) {
      setBalanceError("Evidence attachment required before submitting.");
      return;
    }
    setBalanceError("");
    onSubmit(buildDraftRecord());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>JE Builder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
            <div>
              <span className="text-slate-500">Payment ID:</span>{" "}
              <span className="font-medium">{payment.paymentNumber}</span>
            </div>
            <div>
              <span className="text-slate-500">Customer:</span>{" "}
              <span className="font-medium">{payment.customerName}</span>
            </div>
            <div>
              <span className="text-slate-500">Entity:</span>{" "}
              <span className="font-medium">{entityCode}</span>
            </div>
            <div>
              <span className="text-slate-500">Amount:</span>{" "}
              <span className="font-medium">{formatCurrency(payment.amount)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-sm text-slate-600">JE Type</Label>
              <Select value={jeTypeCode} disabled>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="JE Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={jeTypeCode}>{jeTypeLabel}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button
              onClick={onChangeType}
              className="text-xs text-blue-600 hover:underline ml-3 mt-6"
            >
              Change
            </button>
          </div>

          {requiresApproval && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Approval required before posting
            </div>
          )}
          {requiresEvidence && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Evidence attachment required
            </div>
          )}

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                    DR/CR
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                    GL Account
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Memo</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {draftLines.map((line, index) => (
                  <tr key={`${line.dc}-${line.gl_account_id}`} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-xs">
                        {line.dc}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      <div className="font-medium">{line.gl_account_label}</div>
                      <div className="text-slate-500">{line.gl_account_id}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Input
                        type="number"
                        value={line.amount}
                        disabled
                        className="h-8 text-right text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={line.memo}
                        onChange={(event) => handleMemoChange(index, event.target.value)}
                        className="h-8 text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {requiresEvidence && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={evidenceAttached}
                  onCheckedChange={(checked) => setEvidenceAttached(Boolean(checked))}
                />
                <Label className="text-sm">Evidence attached</Label>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={handleUploadEvidence}
                >
                  Upload evidence
                </Button>
                {evidenceFiles.map((file) => (
                  <Badge key={file} variant="outline" className="text-xs">
                    {file}
                  </Badge>
                ))}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}

          {balanceError && <div className="text-xs text-red-600">{balanceError}</div>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSaveDraft}>
            Save Draft
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!balanced || (requiresEvidence && !evidenceAttached)}
          >
            Submit for Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
