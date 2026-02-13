"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Link2,
  Mail,
  Paperclip,
} from "lucide-react";
import { cashAppStore } from "@/lib/cash-app-store";
import { EmailExtraction, RawEmailMessage } from "@/lib/cash-app-types";

const ANALYSTS = ["Sarah Chen", "Michael Roberts", "Jessica Martinez", "David Kim", "Emily Taylor"];
const LABELS = ["Dispute", "Escalation", "Follow-up"];

export default function EmailInboxPage() {
  const router = useRouter();
  const [emails, setEmails] = useState<RawEmailMessage[]>(cashAppStore.getEmailInboxMessages());
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [extractingEmailId, setExtractingEmailId] = useState<string | null>(null);
  const [extractionModalOpen, setExtractionModalOpen] = useState(false);
  const [activeExtractionEmailId, setActiveExtractionEmailId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [bodyExpandedId, setBodyExpandedId] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{ name: string } | null>(null);

  const payments = cashAppStore.getPayments();

  const selectedPayment = useMemo(() => {
    if (!selectedPaymentId) return null;
    return cashAppStore.getPaymentById(selectedPaymentId) || null;
  }, [selectedPaymentId]);

  const selectedEmail = useMemo(() => {
    return emails.find((email) => email.id === selectedEmailId) || null;
  }, [emails, selectedEmailId]);

  const activeExtractionEmail = useMemo(() => {
    return emails.find((email) => email.id === activeExtractionEmailId) || null;
  }, [emails, activeExtractionEmailId]);

  const updateEmail = (emailId: string, updates: Partial<RawEmailMessage>) => {
    setEmails((prev) =>
      prev.map((email) => (email.id === emailId ? { ...email, ...updates } : email))
    );
    cashAppStore.updateEmailMessage(emailId, updates);
  };

  const appendTimeline = (
    emailId: string,
    entry: { event: string; detail?: string; actor: "System" | "User"; ts: string }
  ) => {
    setEmails((prev) =>
      prev.map((email) =>
        email.id === emailId
          ? { ...email, activity_timeline: [...(email.activity_timeline || []), entry] }
          : email
      )
    );
    cashAppStore.addEmailTimelineEntry(emailId, entry);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statusLabel = (status: RawEmailMessage["status"]) => {
    const map: Record<RawEmailMessage["status"], string> = {
      NEW: "New",
      EXTRACTED: "Extracted",
      PARTIAL: "Partial",
      FAILED: "Failed",
      PROCESSED: "Processed",
    };
    return map[status];
  };

  const statusBadge = (status: RawEmailMessage["status"]) => {
    const colors: Record<RawEmailMessage["status"], string> = {
      NEW: "bg-blue-50 text-blue-700 border-blue-200",
      EXTRACTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
      PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
      FAILED: "bg-rose-50 text-rose-700 border-rose-200",
      PROCESSED: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return (
      <Badge variant="outline" className={`${colors[status]} font-medium`}>
        {statusLabel(status)}
      </Badge>
    );
  };

  const extractButtonLabel = (status: RawEmailMessage["status"]) => {
    if (status === "NEW") return "Extract";
    if (status === "EXTRACTED" || status === "PROCESSED") return "View";
    return status === "PARTIAL" ? "Fix" : "Retry";
  };

  const buildMockExtraction = (email: RawEmailMessage): EmailExtraction => {
    const invoiceNumbers = email.attachments.length
      ? email.attachments
          .slice(0, 3)
          .map((_, idx) => `INV-${20000 + idx + parseInt(email.id.slice(-3), 10)}`)
      : ["INV-20180"];
    const baseConfidence = email.attachments.length ? 82 : 54;
    const amountTotal = email.attachments.length ? 56000 : 39800;
    const errors = email.attachments.length
      ? undefined
      : ["Attachment missing or unreadable: remittance.pdf"];
    return {
      payer: email.candidateCustomerName || email.fromName,
      customer: email.candidateCustomerName,
      amount_total: amountTotal,
      currency: "USD",
      payment_date: email.receivedAt.split("T")[0],
      invoice_numbers: invoiceNumbers,
      confidence_overall: baseConfidence,
      confidence_sections: {
        header: Math.min(98, baseConfidence + 6),
        invoices: Math.max(35, baseConfidence - 8),
        amounts: Math.max(30, baseConfidence - 12),
      },
      errors,
    };
  };

  const handleExtract = (email: RawEmailMessage) => {
    const shouldRun =
      email.status === "NEW" || email.status === "FAILED" || email.status === "PARTIAL";
    if (!shouldRun) {
      setActiveExtractionEmailId(email.id);
      setExtractionModalOpen(true);
      setSelectedPaymentId(email.linked_payment_id || null);
      return;
    }
    setExtractingEmailId(email.id);
    const delay = 500 + Math.floor(Math.random() * 700);
    window.setTimeout(() => {
      const isRetry = email.status === "FAILED" || email.status === "PARTIAL";
      const extraction = buildMockExtraction(email);
      updateEmail(email.id, {
        extraction,
        status: "EXTRACTED",
      });
      appendTimeline(email.id, {
        event: isRetry ? "Extraction Retried" : "Extraction Run",
        detail: isRetry ? "Retry extraction completed" : "Extraction completed",
        actor: "System",
        ts: new Date().toISOString(),
      });
      setActiveExtractionEmailId(email.id);
      setSelectedPaymentId(email.linked_payment_id || null);
      setExtractionModalOpen(true);
      setExtractingEmailId(null);
    }, delay);
  };

  const handleConfirmLink = () => {
    if (!activeExtractionEmail) return;
    const remittanceId = `REM-${Date.now()}`;
    const linkedPaymentId = selectedPaymentId || undefined;

    updateEmail(activeExtractionEmail.id, {
      status: "PROCESSED",
      linked_payment_id: linkedPaymentId,
    });

    cashAppStore.addRemittanceRecord({
      remittance_id: remittanceId,
      email_id: activeExtractionEmail.id,
      linked_payment_id: linkedPaymentId,
      extracted_fields:
        activeExtractionEmail.extraction || buildMockExtraction(activeExtractionEmail),
      created_at: new Date().toISOString(),
    });

    appendTimeline(activeExtractionEmail.id, {
      event: "Extraction Completed",
      detail: "Extraction confirmed and saved",
      actor: "User",
      ts: new Date().toISOString(),
    });

    if (linkedPaymentId) {
      const payment = cashAppStore.getPaymentById(linkedPaymentId);
      if (payment) {
        const paymentTimeline = payment.activity_timeline || [];
        cashAppStore.updatePayment(payment.id, {
          remittanceSource: "Email",
          remittance_status: "Linked",
          confidenceScore: Math.min(99, payment.confidenceScore + 2),
          activity_timeline: [
            ...paymentTimeline,
            {
              event: "Remittance Linked (Email Inbox)",
              detail: `Linked from email ${activeExtractionEmail.subject}`,
              actor: "User",
              ts: new Date().toISOString(),
            },
          ],
        });
      }
      appendTimeline(activeExtractionEmail.id, {
        event: "Linked to Payment",
        detail: `Linked to ${linkedPaymentId}`,
        actor: "User",
        ts: new Date().toISOString(),
      });
    }

    setExtractionModalOpen(false);
  };

  const handleSaveDraft = () => {
    if (!activeExtractionEmail) return;
    updateEmail(activeExtractionEmail.id, {
      extraction: activeExtractionEmail.extraction || buildMockExtraction(activeExtractionEmail),
    });
    appendTimeline(activeExtractionEmail.id, {
      event: "Extraction Saved",
      detail: "Saved as draft",
      actor: "User",
      ts: new Date().toISOString(),
    });
    setExtractionModalOpen(false);
  };

  const markPartial = () => {
    if (!activeExtractionEmail) return;
    updateEmail(activeExtractionEmail.id, { status: "PARTIAL" });
    appendTimeline(activeExtractionEmail.id, {
      event: "Marked Partial",
      detail: "Low confidence extraction",
      actor: "User",
      ts: new Date().toISOString(),
    });
  };

  const handleMarkProcessed = (email: RawEmailMessage) => {
    updateEmail(email.id, { status: "PROCESSED" });
    appendTimeline(email.id, {
      event: "Marked Processed",
      detail: "Manual review completed",
      actor: "User",
      ts: new Date().toISOString(),
    });
  };

  const toggleLabel = (email: RawEmailMessage, label: string) => {
    const labels = email.labels.includes(label)
      ? email.labels.filter((item) => item !== label)
      : [...email.labels, label];
    updateEmail(email.id, { labels });
  };

  const suggestedPayments = useMemo(() => {
    if (!activeExtractionEmail) return [];
    const key = (
      activeExtractionEmail.candidateCustomerName ||
      activeExtractionEmail.fromName ||
      ""
    )
      .split(" ")[0]
      ?.toLowerCase();
    const matches = payments.filter((payment) => payment.customerName.toLowerCase().includes(key));
    const fallback = payments.filter((payment) => !matches.includes(payment));
    return [...matches, ...fallback].slice(0, 3);
  }, [activeExtractionEmail, payments]);

  const filteredPayments = useMemo(() => {
    if (!paymentSearch) return suggestedPayments;
    const term = paymentSearch.toLowerCase();
    return suggestedPayments.filter(
      (payment) =>
        payment.paymentNumber.toLowerCase().includes(term) ||
        payment.id.toLowerCase().includes(term)
    );
  }, [paymentSearch, suggestedPayments]);

  const openPaymentFromDrawer = () => {
    if (!selectedEmail?.linked_payment_id) return;
    const payment = cashAppStore.getPaymentById(selectedEmail.linked_payment_id);
    const paymentIdParam = payment?.paymentNumber || selectedEmail.linked_payment_id;
    router.push(`/workbench/order-to-cash/cash-application/payments?paymentId=${paymentIdParam}`);
  };

  const totals = {
    total: emails.length,
    new: emails.filter((email) => email.status === "NEW").length,
    processed: emails.filter((email) => email.status === "PROCESSED").length,
    partial: emails.filter((email) => email.status === "PARTIAL").length,
    failed: emails.filter((email) => email.status === "FAILED").length,
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="border-b bg-white px-8 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Email Inbox</h1>
        <p className="text-sm text-gray-600 mt-1">Process remittance emails and attachments</p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Emails</p>
                <p className="text-2xl font-bold text-gray-900">{totals.total}</p>
              </div>
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New</p>
                <p className="text-2xl font-bold text-blue-600">{totals.new}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processed</p>
                <p className="text-2xl font-bold text-green-600">{totals.processed}</p>
              </div>
              <Download className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-rose-600">{totals.failed}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Partial</p>
                <p className="text-2xl font-bold text-amber-600">{totals.partial}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
          </Card>
        </div>

        <Card>
          <div className="divide-y divide-gray-200">
            {emails.map((email) => (
              <div
                key={email.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedEmailId(email.id);
                  setDrawerOpen(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {email.fromName} &lt;{email.fromEmail}&gt;
                        </span>
                        {statusBadge(email.status)}
                        {email.attachments.length > 0 && (
                          <Paperclip className="w-4 h-4 text-gray-400" />
                        )}
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                          {email.mailbox}
                        </Badge>
                        {email.linked_payment_id && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200"
                          >
                            Linked
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-900 mb-1">{email.subject}</div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{new Date(email.receivedAt).toLocaleString()}</span>
                        {email.extraction?.amount_total ? (
                          <span className="font-semibold">
                            {formatCurrency(email.extraction.amount_total)}
                          </span>
                        ) : (
                          <span className="font-semibold">--</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={extractingEmailId === email.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleExtract(email);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {extractingEmailId === email.id
                      ? "Extracting..."
                      : extractButtonLabel(email.status)}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[520px] sm:max-w-[520px] p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b bg-slate-50">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-lg font-semibold text-slate-900">
                  Email Detail
                </SheetTitle>
                <p className="text-xs text-slate-500 mt-1">Remittance intake workbench</p>
              </div>
              {selectedEmail && statusBadge(selectedEmail.status)}
            </div>
          </SheetHeader>
          {selectedEmail && (
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <Card className="p-4 space-y-3">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-900">
                    {selectedEmail.subject}
                  </div>
                  <div className="text-xs text-slate-600">
                    From: {selectedEmail.fromName} &lt;{selectedEmail.fromEmail}&gt;
                  </div>
                  <div className="text-xs text-slate-600">
                    Received: {new Date(selectedEmail.receivedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                    {selectedEmail.mailbox}
                  </Badge>
                  {selectedEmail.labels.map((label) => (
                    <Badge key={label} variant="secondary" className="text-[10px] px-2 py-0.5">
                      {label}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => handleExtract(selectedEmail)}>
                    {extractButtonLabel(selectedEmail.status)}
                  </Button>
                  {(selectedEmail.status === "EXTRACTED" || selectedEmail.status === "PARTIAL") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkProcessed(selectedEmail)}
                    >
                      Mark Processed
                    </Button>
                  )}
                  <Select
                    value={selectedEmail.assigned_to || ""}
                    onValueChange={(value) => updateEmail(selectedEmail.id, { assigned_to: value })}
                  >
                    <SelectTrigger className="h-8 w-[160px] text-xs">
                      <SelectValue placeholder="Assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {ANALYSTS.map((analyst) => (
                        <SelectItem key={analyst} value={analyst}>
                          {analyst}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        Add Label
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {LABELS.map((label) => (
                        <DropdownMenuCheckboxItem
                          key={label}
                          checked={selectedEmail.labels.includes(label)}
                          onCheckedChange={() => toggleLabel(selectedEmail, label)}
                        >
                          {label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>

              <Card className="p-4 space-y-2">
                <div className="text-sm font-semibold text-slate-900">Email Body Preview</div>
                <p className="text-sm text-slate-700">
                  {bodyExpandedId === selectedEmail.id
                    ? selectedEmail.bodyText
                    : `${selectedEmail.bodyText.slice(0, 160)}${selectedEmail.bodyText.length > 160 ? "..." : ""}`}
                </p>
                {selectedEmail.bodyText.length > 160 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setBodyExpandedId(
                        bodyExpandedId === selectedEmail.id ? null : selectedEmail.id
                      )
                    }
                  >
                    {bodyExpandedId === selectedEmail.id ? "Show less" : "Show more"}
                  </Button>
                )}
              </Card>

              <Card className="p-4 space-y-3">
                <div className="text-sm font-semibold text-slate-900">Attachments</div>
                {selectedEmail.attachments.length === 0 && (
                  <p className="text-sm text-slate-500">No attachments</p>
                )}
                {selectedEmail.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                        {attachment.type}
                      </Badge>
                      <span className="text-slate-700">{attachment.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewAttachment({ name: attachment.name })}
                      >
                        Preview
                      </Button>
                      <Button size="sm" variant="ghost">
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </Card>

              <Card className="p-4 space-y-2">
                <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  AI Summary
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                    Generated
                  </Badge>
                </div>
                <ul className="text-sm text-slate-700 list-disc ml-5 space-y-1">
                  <li>Payment advice indicates full settlement for listed invoices.</li>
                  <li>Remittance includes discount column for early payment.</li>
                  <li>Mailbox route suggests AR remit workflow.</li>
                  <li>Suggested match found with high confidence.</li>
                </ul>
                <div className="text-xs text-slate-500">
                  Generated {new Date(selectedEmail.receivedAt).toLocaleString()}
                </div>
              </Card>

              <Card className="p-4 space-y-3">
                <div className="text-sm font-semibold text-slate-900">Extracted Data</div>
                {selectedEmail.extraction ? (
                  <div className="space-y-2 text-sm text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payer</span>
                      <span>{selectedEmail.extraction.payer}</span>
                    </div>
                    {selectedEmail.extraction.customer && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Customer</span>
                        <span>{selectedEmail.extraction.customer}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Invoice Count</span>
                      <span>{selectedEmail.extraction.invoice_numbers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sample Invoices</span>
                      <span>{selectedEmail.extraction.invoice_numbers.slice(0, 3).join(", ")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount Total</span>
                      <span>{formatCurrency(selectedEmail.extraction.amount_total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Currency</span>
                      <span>{selectedEmail.extraction.currency}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Extract Confidence</span>
                        <span>{selectedEmail.extraction.confidence_overall}%</span>
                      </div>
                      <Progress
                        value={selectedEmail.extraction.confidence_overall}
                        className="h-2"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Extraction not run yet.</p>
                )}
              </Card>

              <Card className="p-4 space-y-3">
                <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  Suggested Links
                  <Link2 className="w-4 h-4 text-slate-500" />
                </div>
                {selectedEmail.linked_payment_id ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-md p-3 text-sm">
                    <div>
                      <div className="text-emerald-700 font-semibold">
                        Linked Payment:{" "}
                        {cashAppStore.getPaymentById(selectedEmail.linked_payment_id)
                          ?.paymentNumber || selectedEmail.linked_payment_id}
                      </div>
                      <div className="text-xs text-emerald-600">Status: Open</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={openPaymentFromDrawer}>
                      Open Payment
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {suggestedPayments.map((payment, index) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between text-sm border border-slate-200 rounded-md p-3"
                      >
                        <div>
                          <div className="font-semibold">{payment.paymentNumber}</div>
                          <div className="text-xs text-slate-500">
                            {formatCurrency(payment.amount)} • {payment.date}
                          </div>
                          <div className="text-xs text-slate-500">
                            Match score: {Math.max(75, 94 - index * 7)}%
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            updateEmail(selectedEmail.id, { linked_payment_id: payment.id });
                            appendTimeline(selectedEmail.id, {
                              event: "Linked to Payment",
                              detail: `Linked to ${payment.paymentNumber}`,
                              actor: "User",
                              ts: new Date().toISOString(),
                            });
                            const paymentTimeline = payment.activity_timeline || [];
                            cashAppStore.updatePayment(payment.id, {
                              remittanceSource: "Email",
                              remittance_status: "Linked",
                              activity_timeline: [
                                ...paymentTimeline,
                                {
                                  event: "Remittance Linked (Email Inbox)",
                                  detail: `Linked from email ${selectedEmail.subject}`,
                                  actor: "User",
                                  ts: new Date().toISOString(),
                                },
                              ],
                            });
                          }}
                        >
                          Link
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-4 space-y-3">
                <div className="text-sm font-semibold text-slate-900">Activity Timeline</div>
                <div className="space-y-3">
                  {(selectedEmail.activity_timeline || []).map((entry, idx) => (
                    <div key={`${entry.event}-${idx}`} className="flex items-start gap-3 text-sm">
                      <div className="mt-1">
                        {entry.actor === "System" ? (
                          <CheckCircle2 className="w-4 h-4 text-blue-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{entry.event}</div>
                        {entry.detail && (
                          <div className="text-xs text-slate-500">{entry.detail}</div>
                        )}
                        <div className="text-xs text-slate-400">
                          {new Date(entry.ts).toLocaleString()} • {entry.actor}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={extractionModalOpen} onOpenChange={setExtractionModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Extraction Review</DialogTitle>
          </DialogHeader>
          {activeExtractionEmail && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4 space-y-3">
                <div className="text-sm font-semibold text-slate-900">Extracted Fields</div>
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payer Name</span>
                    <span>
                      {activeExtractionEmail.extraction?.payer || activeExtractionEmail.fromName}
                    </span>
                  </div>
                  {activeExtractionEmail.extraction?.customer && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer</span>
                      <span>{activeExtractionEmail.extraction.customer}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Amount(s)</span>
                    <span>
                      {activeExtractionEmail.extraction
                        ? formatCurrency(activeExtractionEmail.extraction.amount_total)
                        : "--"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Currency</span>
                    <span>{activeExtractionEmail.extraction?.currency || "USD"}</span>
                  </div>
                  {activeExtractionEmail.extraction?.payment_date && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Date</span>
                      <span>{activeExtractionEmail.extraction.payment_date}</span>
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-slate-500 text-xs">Invoice Numbers</span>
                    <div className="text-sm">
                      {(activeExtractionEmail.extraction?.invoice_numbers || [])
                        .slice(0, 10)
                        .join(", ") || "N/A"}
                      {(activeExtractionEmail?.extraction?.invoice_numbers?.length || 0) > 10 &&
                        ` +${(activeExtractionEmail?.extraction?.invoice_numbers?.length || 0) - 10} more`}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    Notes/Discount indicators: Early payment discounts detected
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                <Card className="p-4 space-y-3">
                  <div className="text-sm font-semibold text-slate-900">Confidence</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Overall</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {activeExtractionEmail.extraction?.confidence_overall || 0}%
                    </span>
                  </div>
                  <Progress
                    value={activeExtractionEmail.extraction?.confidence_overall || 0}
                    className="h-2"
                  />
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">
                      Header {activeExtractionEmail.extraction?.confidence_sections.header || 0}%
                    </Badge>
                    <Badge variant="outline">
                      Invoices {activeExtractionEmail.extraction?.confidence_sections.invoices || 0}
                      %
                    </Badge>
                    <Badge variant="outline">
                      Amounts {activeExtractionEmail.extraction?.confidence_sections.amounts || 0}%
                    </Badge>
                  </div>
                </Card>

                {(activeExtractionEmail.extraction?.confidence_overall || 0) < 60 ||
                activeExtractionEmail.extraction?.errors?.length ? (
                  <Card className="p-4 space-y-2 border-amber-200 bg-amber-50">
                    <div className="text-sm font-semibold text-amber-700">Parse Issues</div>
                    <div className="text-xs text-amber-700 space-y-1">
                      {(activeExtractionEmail.extraction?.confidence_overall || 0) < 60 && (
                        <div>Low confidence in invoice extraction</div>
                      )}
                      {(activeExtractionEmail.extraction?.errors || []).map((error, idx) => (
                        <div key={`${error}-${idx}`}>{error}</div>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" onClick={markPartial}>
                      Mark as Partial
                    </Button>
                  </Card>
                ) : null}

                <Card className="p-4 space-y-3">
                  <div className="text-sm font-semibold text-slate-900">Link to Payment</div>
                  <Input
                    placeholder="Search Payment ID"
                    value={paymentSearch}
                    onChange={(event) => setPaymentSearch(event.target.value)}
                  />
                  <div className="space-y-2">
                    {filteredPayments.map((payment, index) => {
                      const matchScore = Math.max(72, 92 - index * 6);
                      return (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between text-sm border border-slate-200 rounded-md p-3"
                        >
                          <div>
                            <div className="font-semibold">{payment.paymentNumber}</div>
                            <div className="text-xs text-slate-500">
                              {formatCurrency(payment.amount)} • {payment.date}
                            </div>
                            <div className="text-xs text-slate-500">Match score: {matchScore}%</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPaymentId(payment.id)}
                          >
                            Select
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  {selectedPaymentId && (
                    <div className="text-xs text-slate-600">
                      Selected Payment:{" "}
                      <span className="font-semibold">
                        {selectedPayment?.paymentNumber || selectedPaymentId}
                      </span>
                      <div>Link will update payment’s Remittance Source = Email</div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setExtractionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleSaveDraft}>
              Save as Draft
            </Button>
            <Button onClick={handleConfirmLink}>Confirm &amp; Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!previewAttachment}
        onOpenChange={(open) => setPreviewAttachment(open ? previewAttachment : null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Attachment Preview</DialogTitle>
          </DialogHeader>
          <div className="border border-dashed rounded-md p-6 text-center text-sm text-slate-500">
            Preview placeholder for {previewAttachment?.name}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
