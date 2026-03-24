"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  GitBranch,
  Paperclip,
  Sparkles,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ─── Types ─── */

interface AuditEntry {
  timestamp: string;
  action: string;
  actor: string;
  detail: string;
}

interface ExceptionItem {
  id: string;
  type: string;
  customer: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceDueDate: string;
  receiptAmount: number;
  glAmount: number;
  subledgerAmount: number;
  receiptDate: string | null;
  receiptRef: string | null;
  exceptionReason: string;
  suggestedAction: string;
  confidence: number;
  supportingDocs: string[];
  auditTrail: AuditEntry[];
}

interface ExceptionTransactionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reconName: string;
  exceptions: ExceptionItem[];
}

/* ─── Helpers ─── */

function fmtCurrency(n: number) {
  if (n === 0) return "$0";
  return "$" + n.toLocaleString();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtTimestamp(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
}

/* ─── Component ─── */

export function ExceptionTransactions({
  open,
  onOpenChange,
  reconName,
  exceptions,
}: ExceptionTransactionsProps) {
  const [selectedExc, setSelectedExc] = useState<ExceptionItem | null>(null);

  const totalAmount = exceptions.reduce(
    (s, e) => s + Math.max(e.receiptAmount, e.glAmount, e.subledgerAmount),
    0
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl p-0">
        {/* Header */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <SheetHeader className="pb-0">
            <SheetTitle className="text-lg font-bold text-slate-900">
              Exception Details
            </SheetTitle>
            <p className="text-sm text-slate-500">{reconName}</p>
          </SheetHeader>
          <div className="mt-3 flex items-center gap-3">
            <Badge className="border border-red-200 bg-red-50 text-xs text-red-700">
              {exceptions.length} Exception{exceptions.length !== 1 ? "s" : ""}
            </Badge>
            <Badge className="border border-slate-200 bg-white text-xs text-slate-700">
              Total: {fmtCurrency(totalAmount)}
            </Badge>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Exception List */}
          {!selectedExc ? (
            <>
              {exceptions.map((exc) => {
                const amount = Math.max(exc.receiptAmount, exc.glAmount, exc.subledgerAmount);
                return (
                  <button
                    key={exc.id}
                    onClick={() => setSelectedExc(exc)}
                    className="w-full text-left rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50 hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                          <span className="text-sm font-semibold text-slate-900">{exc.type}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {exc.customer} &middot; {exc.invoiceNumber}
                        </div>
                        <p className="mt-2 text-xs text-slate-600 line-clamp-2">
                          {exc.exceptionReason}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-red-600">{fmtCurrency(amount)}</div>
                        <div className="mt-1 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-primary" />
                          <span className="text-[11px] text-primary font-medium">{exc.confidence}% confidence</span>
                        </div>
                      </div>
                    </div>

                    {/* Suggested action preview */}
                    <div className="mt-3 rounded-md bg-blue-50 border border-blue-100 p-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">Suggested Action</div>
                      <div className="mt-0.5 text-xs text-blue-800 line-clamp-1">{exc.suggestedAction}</div>
                    </div>
                  </button>
                );
              })}
            </>
          ) : (
            /* Exception Detail View */
            <>
              <button
                onClick={() => setSelectedExc(null)}
                className="text-xs font-medium text-primary hover:underline"
              >
                &larr; Back to all exceptions
              </button>

              <div className="rounded-lg border border-slate-200 overflow-hidden">
                {/* Exception Header */}
                <div className="border-b border-slate-200 bg-red-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-bold text-red-800">{selectedExc.type}</span>
                  </div>
                  <p className="mt-1 text-xs text-red-700">{selectedExc.customer} &middot; {selectedExc.invoiceNumber}</p>
                </div>

                {/* Transaction Details Grid */}
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Transaction Details</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded border border-slate-100 p-2">
                        <div className="text-[10px] text-slate-400">Customer</div>
                        <div className="text-xs font-semibold text-slate-800">{selectedExc.customer}</div>
                      </div>
                      <div className="rounded border border-slate-100 p-2">
                        <div className="text-[10px] text-slate-400">Invoice #</div>
                        <div className="text-xs font-semibold text-slate-800">{selectedExc.invoiceNumber}</div>
                      </div>
                      <div className="rounded border border-slate-100 p-2">
                        <div className="text-[10px] text-slate-400">Invoice Date</div>
                        <div className="text-xs font-semibold text-slate-800">{fmtDate(selectedExc.invoiceDate)}</div>
                      </div>
                      <div className="rounded border border-slate-100 p-2">
                        <div className="text-[10px] text-slate-400">Due Date</div>
                        <div className="text-xs font-semibold text-slate-800">{fmtDate(selectedExc.invoiceDueDate)}</div>
                      </div>
                      {selectedExc.receiptDate && (
                        <div className="rounded border border-slate-100 p-2">
                          <div className="text-[10px] text-slate-400">Receipt Date</div>
                          <div className="text-xs font-semibold text-slate-800">{fmtDate(selectedExc.receiptDate)}</div>
                        </div>
                      )}
                      {selectedExc.receiptRef && (
                        <div className="rounded border border-slate-100 p-2">
                          <div className="text-[10px] text-slate-400">Receipt Ref</div>
                          <div className="text-xs font-semibold text-slate-800">{selectedExc.receiptRef}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Amount Comparison */}
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Amount Comparison</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className={cn("rounded-lg border p-3 text-center", selectedExc.receiptAmount > 0 ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50")}>
                        <div className="text-[10px] text-slate-400">Receipt</div>
                        <div className={cn("mt-1 text-sm font-bold", selectedExc.receiptAmount > 0 ? "text-emerald-700" : "text-slate-400")}>
                          {fmtCurrency(selectedExc.receiptAmount)}
                        </div>
                      </div>
                      <div className={cn("rounded-lg border p-3 text-center", selectedExc.glAmount > 0 ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50")}>
                        <div className="text-[10px] text-slate-400">GL Amount</div>
                        <div className={cn("mt-1 text-sm font-bold", selectedExc.glAmount > 0 ? "text-blue-700" : "text-slate-400")}>
                          {fmtCurrency(selectedExc.glAmount)}
                        </div>
                      </div>
                      <div className={cn("rounded-lg border p-3 text-center", selectedExc.subledgerAmount > 0 ? "border-purple-200 bg-purple-50" : "border-slate-200 bg-slate-50")}>
                        <div className="text-[10px] text-slate-400">Subledger</div>
                        <div className={cn("mt-1 text-sm font-bold", selectedExc.subledgerAmount > 0 ? "text-purple-700" : "text-slate-400")}>
                          {fmtCurrency(selectedExc.subledgerAmount)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Exception Reason */}
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Exception Reason</h4>
                    <p className="text-xs leading-5 text-slate-700">{selectedExc.exceptionReason}</p>
                  </div>

                  {/* AI Suggested Action */}
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                      <h4 className="text-[11px] font-semibold text-blue-800">AI Suggested Action</h4>
                      <Badge className="ml-auto border border-blue-200 bg-blue-100 text-[10px] text-blue-700">
                        {selectedExc.confidence}% confidence
                      </Badge>
                    </div>
                    <p className="text-xs leading-5 text-blue-800">{selectedExc.suggestedAction}</p>
                  </div>

                  {/* Supporting Documents */}
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Supporting Documents</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedExc.supportingDocs.map((doc) => (
                        <span
                          key={doc}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600"
                        >
                          <Paperclip className="h-3 w-3" />
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Audit Trail */}
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Audit Trail</h4>
                    <div className="space-y-2">
                      {selectedExc.auditTrail.map((entry, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              "h-2 w-2 rounded-full mt-1.5",
                              i === 0 ? "bg-blue-500" : "bg-slate-300"
                            )} />
                            {i < selectedExc.auditTrail.length - 1 && (
                              <div className="w-px flex-1 bg-slate-200" />
                            )}
                          </div>
                          <div className="pb-3">
                            <div className="text-xs font-semibold text-slate-700">{entry.action}</div>
                            <div className="text-[11px] text-slate-500">{entry.detail}</div>
                            <div className="mt-0.5 text-[10px] text-slate-400">
                              {entry.actor} &middot; {fmtTimestamp(entry.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs justify-start gap-2"
                        onClick={() => toast.success("Sent to Cash Application for matching")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Match Manually
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs justify-start gap-2"
                        onClick={() => toast.success("Reclassification initiated")}
                      >
                        <GitBranch className="h-3.5 w-3.5 text-blue-600" />
                        Reclassify
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs justify-start gap-2"
                        onClick={() => toast.success("Adjusting journal entry created")}
                      >
                        <FileText className="h-3.5 w-3.5 text-purple-600" />
                        Create Adjusting JE
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs justify-start gap-2"
                        onClick={() => toast.success("Marked as timing difference")}
                      >
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        Timing Difference
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs justify-start gap-2 col-span-2"
                        onClick={() => toast.info("Sent to Cash Application team")}
                      >
                        <Upload className="h-3.5 w-3.5 text-slate-600" />
                        Send to Cash Application Team
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
