"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CreditCard,
  Building2,
  User,
  FileText,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  BookOpen,
  UserPlus,
  X,
  ShieldAlert,
} from "lucide-react";
import { Payment } from "@/lib/cash-app-types";
import { ConfidenceMeter } from "./confidence-meter";

interface PaymentDetailsDrawerProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprovePost?: (payment: Payment) => void;
  onMarkReviewed?: (payment: Payment) => void;
  onAssign?: (payment: Payment) => void;
}

export function PaymentDetailsDrawer({
  payment,
  open,
  onOpenChange,
  onApprovePost,
  onMarkReviewed,
  onAssign,
}: PaymentDetailsDrawerProps) {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState(["payment-details", "matching-summary"]);
  const [showBankWhy, setShowBankWhy] = useState(false);

  if (!payment) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
      AutoMatched: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
      Exception: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
      PendingToPost: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
      Posted: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
      New: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
    };
    const config = statusConfig[status] || statusConfig.New;
    return (
      <Badge
        variant="outline"
        className={`${config.bg} ${config.text} ${config.border} font-medium`}
      >
        {status === "AutoMatched"
          ? "Auto-Matched"
          : status === "PendingToPost"
            ? "Pending to Post"
            : status}
      </Badge>
    );
  };

  const getBankMatchStatus = () => {
    if (payment.bank_match_status) return payment.bank_match_status;
    if (payment.bank_match_ready === true) return "READY";
    if (payment.posted_status && payment.posted_status !== "POSTED") return "PENDING";
    return "PENDING";
  };

  const bankMatchStatus = getBankMatchStatus();
  const bankMatchBadgeStyle: Record<string, string> = {
    READY: "bg-emerald-50 text-emerald-700 border-emerald-200",
    RISK: "bg-amber-50 text-amber-700 border-amber-200",
    PENDING: "bg-slate-100 text-slate-700 border-slate-300",
  };

  const bankMatchReasons = () => {
    if (payment.bank_match_risk_reason) return [payment.bank_match_risk_reason];
    const reasons: string[] = [];
    if (!payment.bank_txn_ref) reasons.push("Missing trace ID");
    if (!payment.clearing_gl) reasons.push("Wrong clearing GL");
    if (payment.posted_status !== "POSTED") reasons.push("Not posted yet");
    if (payment.settlement_status === "FAILED") reasons.push("Date mismatch risk");
    if (reasons.length === 0 && bankMatchStatus !== "READY") {
      reasons.push("Amount mismatch");
    }
    return reasons;
  };

  const timelineEvents = payment.timeline || [
    {
      ts: payment.createdAt,
      title: "Payment Received",
      actor: "System",
      details: "Bank feed ingestion",
    },
    {
      ts: payment.autoMatchedAt || payment.createdAt,
      title: "Auto-Matched",
      actor: "Meeru AI",
      details: `Confidence: ${payment.confidenceScore}%`,
    },
    ...(payment.status === "PendingToPost"
      ? [
          {
            ts: new Date().toISOString(),
            title: "Pending Review",
            actor: "System",
            details: "Awaiting approval",
          },
        ]
      : []),
    ...(payment.je_workflow_state === "POSTED"
      ? [
          {
            ts: payment.postingRefs?.postedAt || new Date().toISOString(),
            title: "Posted to NetSuite",
            actor: "System",
            details: `Payment ID: ${payment.postingRefs?.nsPaymentId || "N/A"}`,
          },
        ]
      : []),
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] sm:max-w-[520px] p-0 flex flex-col">
        <SheetHeader className="px-5 py-3 border-b bg-slate-50">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-lg font-semibold text-slate-900">
                {payment.paymentNumber}
              </SheetTitle>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {formatCurrency(payment.amount)}
                </span>
                <span>{payment.date}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(payment.je_workflow_state === "POSTED" ? "Posted" : payment.status)}
            </div>
          </div>
          <div className="mt-2">
            <ConfidenceMeter confidence={payment.confidenceScore} size="md" />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          <Accordion
            type="multiple"
            value={expandedSections}
            onValueChange={setExpandedSections}
            className="space-y-2"
          >
            <AccordionItem value="payment-details" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-slate-50 [&[data-state=open]]:bg-slate-50">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CreditCard className="w-4 h-4 text-slate-500" />
                  Payment Details
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Bank Account</p>
                      <p className="font-medium text-slate-900">{payment.bankAccount}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Method</p>
                      <p className="font-medium text-slate-900">{payment.method}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Payer</p>
                      <p className="font-medium text-slate-900">{payment.payerNameRaw}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Customer</p>
                      <p className="font-medium text-slate-900">{payment.customerName}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500 text-xs mb-0.5">Reference</p>
                      <p className="font-medium text-slate-900 text-xs">
                        {payment.memoReferenceRaw || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="remittance" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-slate-50 [&[data-state=open]]:bg-slate-50">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="w-4 h-4 text-slate-500" />
                  Remittance
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                {payment.remittanceSource !== "None" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {payment.remittanceSource}
                      </Badge>
                      {payment.linkedRemittanceFileUrl && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-blue-600"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Attachment
                        </Button>
                      )}
                    </div>
                    {payment.transformedLines && payment.transformedLines.length > 0 && (
                      <div className="bg-slate-50 rounded p-2 text-xs">
                        <p className="text-slate-600 mb-2">
                          {payment.transformedLines.length} invoice(s) referenced
                        </p>
                        <div className="space-y-1">
                          {payment.transformedLines.slice(0, 3).map((line, idx) => (
                            <div key={idx} className="flex justify-between text-slate-700">
                              <span>{line.erpReference}</span>
                              <span className="font-medium">
                                {formatCurrency(line.paymentAmount)}
                              </span>
                            </div>
                          ))}
                          {payment.transformedLines.length > 3 && (
                            <p className="text-slate-500">
                              +{payment.transformedLines.length - 3} more...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <AlertCircle className="w-4 h-4" />
                    No remittance attached
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="matching-summary" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-slate-50 [&[data-state=open]]:bg-slate-50">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="w-4 h-4 text-slate-500" />
                  Matching Summary
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                {payment.transformedLines && payment.transformedLines.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      {payment.match_type && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            payment.match_type === "EXACT"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : payment.match_type === "TOLERANCE"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {payment.match_type}
                        </Badge>
                      )}
                      {payment.tolerance_applied && (
                        <Badge variant="outline" className="text-xs bg-slate-50">
                          Tolerance Applied
                        </Badge>
                      )}
                    </div>
                    <div className="border rounded-md divide-y">
                      {payment.transformedLines.map((line, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 text-sm">
                          <div>
                            <p className="font-medium text-slate-900">{line.erpReference}</p>
                            {line.reasonCode && (
                              <p className="text-xs text-slate-500">
                                {line.reasonDescription || line.reasonCode}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-slate-900">
                              {formatCurrency(line.paymentAmount)}
                            </p>
                            {line.discountAmount > 0 && (
                              <p className="text-xs text-emerald-600">
                                -{formatCurrency(line.discountAmount)} discount
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <AlertCircle className="w-4 h-4" />
                    No matched invoices
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="bank-match-readiness"
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-slate-50 [&[data-state=open]]:bg-slate-50">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ShieldAlert className="w-4 h-4 text-slate-500" />
                  Bank Match Readiness
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Bank Txn Ref</p>
                      <p className="font-medium text-slate-900">{payment.bank_txn_ref || "—"}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-0.5">Clearing GL</p>
                      <p className="font-medium text-slate-900">{payment.clearing_gl || "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500 text-xs mb-0.5">NetSuite Match Status</p>
                      <Badge
                        variant="outline"
                        className={`${bankMatchBadgeStyle[bankMatchStatus]} text-xs font-medium`}
                      >
                        {bankMatchStatus === "READY"
                          ? "Ready"
                          : bankMatchStatus === "RISK"
                            ? "Risk"
                            : "Pending"}
                      </Badge>
                    </div>
                  </div>

                  {bankMatchStatus !== "READY" && (
                    <div className="text-xs text-slate-600 space-y-2">
                      <button
                        type="button"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        onClick={() => setShowBankWhy((prev) => !prev)}
                      >
                        Why?
                        <ArrowRight
                          className={`w-3 h-3 transition-transform ${showBankWhy ? "rotate-90" : ""}`}
                        />
                      </button>
                      {showBankWhy && (
                        <ul className="list-disc ml-4 text-slate-600 space-y-1">
                          {bankMatchReasons().map((reason, idx) => (
                            <li key={`${reason}-${idx}`}>{reason}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {bankMatchStatus !== "READY" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/workbench/order-to-cash/cash-application/bank-reconcillation?paymentId=${payment.id}`
                        )
                      }
                    >
                      View in Bank Rec
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="journal-entry" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-slate-50 [&[data-state=open]]:bg-slate-50">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  Journal Entry
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                {payment.je_required || payment.je_type ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                      >
                        {payment.je_type || "JE Required"}
                      </Badge>
                      {payment.je_workflow_state && (
                        <Badge variant="outline" className="text-xs">
                          {payment.je_workflow_state}
                        </Badge>
                      )}
                    </div>
                    {payment.intercompanyJEDraft && (
                      <div className="bg-slate-50 rounded p-2 text-xs">
                        <p className="text-slate-600 mb-1">
                          Entities: {payment.intercompanyJEDraft.entities.join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    No journal entry required
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="activity-timeline" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-slate-50 [&[data-state=open]]:bg-slate-50">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="w-4 h-4 text-slate-500" />
                  Activity Timeline
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <div className="relative pl-4">
                  <div className="absolute left-1.5 top-2 bottom-2 w-px bg-slate-200" />
                  <div className="space-y-2.5">
                    {timelineEvents.map((event, idx) => (
                      <div key={idx} className="relative">
                        <div
                          className={`absolute -left-4 top-1.5 w-3 h-3 rounded-full border-2 ${
                            idx === timelineEvents.length - 1
                              ? "bg-blue-500 border-blue-500"
                              : "bg-white border-slate-300"
                          }`}
                        />
                        <div className="pl-2">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-900">{event.title}</p>
                            <span className="text-xs text-slate-400">{event.actor}</span>
                          </div>
                          {event.details && (
                            <p className="text-xs text-slate-500 mt-0.5">{event.details}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(event.ts).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="border-t bg-slate-50 px-5 py-3">
          <div className="flex flex-col gap-2">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => onApprovePost?.(payment)}
              disabled={payment.je_workflow_state === "POSTED"}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve & Post
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onMarkReviewed?.(payment)}
              >
                Mark Reviewed
              </Button>
              <Button variant="outline" size="icon" onClick={() => onAssign?.(payment)}>
                <UserPlus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
