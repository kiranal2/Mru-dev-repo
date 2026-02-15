"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cashAppStore } from "@/lib/cash-app-store";
import { useCashMatching } from "@/hooks/data/use-cash-matching";
import { useCashPayments } from "@/hooks/data/use-cash-payments";
import { Payment, EnhancedARItem, MatchingContext } from "@/lib/cash-app-types";
import { CheckCircle2, Search, AlertCircle, X, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { MatchContextBanner } from "@/components/cash-app/match-context-banner";
import { EvidencePanel } from "@/components/cash-app/evidence-panel";
import { InvoiceSearchFilters } from "@/components/cash-app/invoice-search-filters";
import { EnhancedInvoiceCard } from "@/components/cash-app/enhanced-invoice-card";

export default function MatchingStudioPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams?.get("paymentId");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [allocationMap, setAllocationMap] = useState<Record<string, number>>({});
  const [remainderMode, setRemainderMode] = useState<
    "NONE" | "ON_ACCOUNT" | "ADJUSTMENT" | "CREDIT_MEMO"
  >("NONE");
  const [adjustmentType, setAdjustmentType] = useState<
    "DISCOUNT" | "SHORT_PAY" | "FX_DIFFERENCE" | "BANK_FEE" | ""
  >("");
  const [adjustmentMemo, setAdjustmentMemo] = useState("");
  const [allowOverAllocate, setAllowOverAllocate] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [allocationState, setAllocationState] = useState<"DRAFT" | "CONFIRMED">("DRAFT");
  const [searchPayment, setSearchPayment] = useState("");
  const [searchInvoice, setSearchInvoice] = useState("");
  const [paymentPage, setPaymentPage] = useState(1);
  const [invoicePage, setInvoicePage] = useState(1);
  const [showEvidencePanel, setShowEvidencePanel] = useState(false);
  const [evidenceScrollTo, setEvidenceScrollTo] = useState<string | undefined>(undefined);

  const [openOnly, setOpenOnly] = useState(true);
  const [sameEntity, setSameEntity] = useState(false);
  const [fromRemittance, setFromRemittance] = useState(false);
  const [likelyMatches, setLikelyMatches] = useState(false);

  // Bridge: data hooks for fetch lifecycle, store for rich Payment objects
  const { loading: paymentsLoading, error: paymentsError } = useCashPayments();
  const { loading: matchingLoading, error: matchingError } = useCashMatching(paymentId || undefined);

  const [payments, setPayments] = useState<Payment[]>(() =>
    cashAppStore
      .getPayments()
      .filter((p) => p.status === "New" || p.status === "Exception" || p.status === "AutoMatched")
  );

  useEffect(() => {
    if (paymentId) {
      const payment = cashAppStore.getPaymentById(paymentId);
      if (payment) {
        setSelectedPayment(payment);
        cashAppStore.setUiState({ lastPaymentId: payment.id, returnTo: "PAYMENT_DETAIL" });
        toast.info(`Preloaded payment: ${payment.paymentNumber}`);
      }
    }
  }, [paymentId]);

  useEffect(() => {
    setPaymentPage(1);
  }, [searchPayment]);

  useEffect(() => {
    setInvoicePage(1);
  }, [searchInvoice, openOnly, sameEntity, fromRemittance, likelyMatches, selectedPayment]);

  const generateMockMatchingContext = (payment: Payment): MatchingContext => {
    const isException = payment.status === "Exception";
    return {
      workstream:
        payment.status === "AutoMatched" ? "AutoMatched" : isException ? "Exception" : "Critical",
      match_type: isException ? "OUTSIDE" : payment.confidenceScore >= 95 ? "EXACT" : "TOLERANCE",
      confidence_score: payment.confidenceScore,
      tolerance_policy: {
        amount: 10,
        percent: 1,
        label: "Admin",
      },
      signals: {
        invoiceRefsFound: payment.confidenceScore > 70,
        remittanceLinked: payment.remittanceSource !== "None",
        amountAligns: payment.confidenceScore >= 90,
        toleranceApplied: payment.confidenceScore >= 85 && payment.confidenceScore < 95,
        multiEntityInvoices: false,
        jeRequired: isException,
        closedInvoicePresent: false,
      },
      reasons: [
        "Invoice ref found",
        "Amount mismatch",
        "Remittance missing",
        "Customer verification needed",
      ],
      multi_entity: false,
      evidence: {
        bank: {
          bankAccount: payment.bankAccount,
          currency: "USD",
          amount: payment.amount,
          paymentDate: payment.date,
          payerName: payment.payerNameRaw,
          memo: payment.memoReferenceRaw,
          traceId: `TRC-${Math.random().toString(36).substring(7).toUpperCase()}`,
        },
        remittance: {
          source: payment.remittanceSource !== "None" ? (payment.remittanceSource as any) : "None",
          parsedInvoices:
            payment.remittanceSource !== "None"
              ? [
                  { invoiceNumber: "INV-10001", amount: payment.amount * 0.6 },
                  { invoiceNumber: "INV-10002", amount: payment.amount * 0.4 },
                ]
              : undefined,
          parseStatus: payment.remittanceSource !== "None" ? "Success" : "None",
          filename: payment.remittanceSource === "Email" ? "remittance_email.pdf" : undefined,
        },
        netsuite: {
          entities: ["US Parent", "US Sub 1"],
          customerIds: [payment.customerNumber, `${payment.customerNumber}-ALT`],
          invoiceWarnings: isException
            ? [{ invoiceNumber: "INV-908771", warning: "Invoice is closed (write-off)" }]
            : undefined,
        },
      },
    };
  };

  const mockInvoices: EnhancedARItem[] = useMemo(() => {
    return payments.flatMap((p, i) => {
      const entities = ["US Parent", "US Sub 1", "UK Sub", "APAC"];
      const statuses = ["Open", "Open", "Open", "Closed", "Paid"];
      return Array.from({ length: 3 }, (_, j) => ({
        id: `inv-${i}-${j}`,
        invoiceNumber: `INV-${10000 + i * 3 + j}`,
        customerId: p.customerId,
        customerName: p.customerName,
        amount: Math.floor(p.amount / (Math.random() + 1)),
        openAmount: Math.floor(p.amount / (Math.random() + 1.2)),
        dueDate: p.date,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        entity: entities[Math.floor(Math.random() * entities.length)],
        createdAt: p.createdAt,
        is_from_remittance_candidate: j === 0 && p.remittanceSource !== "None",
        match_hint_score: j === 0 ? 95 : j === 1 ? 78 : 45,
      }));
    });
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter(
      (p) =>
        p.paymentNumber.toLowerCase().includes(searchPayment.toLowerCase()) ||
        p.customerName.toLowerCase().includes(searchPayment.toLowerCase())
    );
  }, [payments, searchPayment]);

  const paymentPageSize = 8;
  const paymentTotalPages = Math.max(1, Math.ceil(filteredPayments.length / paymentPageSize));
  const paginatedPayments = useMemo(() => {
    const start = (paymentPage - 1) * paymentPageSize;
    return filteredPayments.slice(start, start + paymentPageSize);
  }, [filteredPayments, paymentPage]);

  const filteredInvoices = useMemo(() => {
    let invoices = mockInvoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(searchInvoice.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchInvoice.toLowerCase()) ||
        (inv.entity && inv.entity.toLowerCase().includes(searchInvoice.toLowerCase()));

      if (!selectedPayment) return matchesSearch;

      let matchesFilters = matchesSearch;

      if (!sameEntity) {
        matchesFilters = matchesFilters && inv.customerId === selectedPayment.customerId;
      }

      if (openOnly) {
        matchesFilters = matchesFilters && inv.status === "Open";
      }

      if (fromRemittance) {
        matchesFilters = matchesFilters && inv.is_from_remittance_candidate === true;
      }

      if (likelyMatches) {
        matchesFilters = matchesFilters && (inv.match_hint_score || 0) >= 70;
      }

      return matchesFilters;
    });

    invoices.sort((a, b) => {
      if (fromRemittance && a.is_from_remittance_candidate !== b.is_from_remittance_candidate) {
        return a.is_from_remittance_candidate ? -1 : 1;
      }
      if (likelyMatches) {
        return (b.match_hint_score || 0) - (a.match_hint_score || 0);
      }
      return 0;
    });

    return invoices;
  }, [
    mockInvoices,
    selectedPayment,
    searchInvoice,
    openOnly,
    sameEntity,
    fromRemittance,
    likelyMatches,
  ]);

  const invoicePageSize = 6;
  const invoiceTotalPages = Math.max(1, Math.ceil(filteredInvoices.length / invoicePageSize));
  const paginatedInvoices = useMemo(() => {
    const start = (invoicePage - 1) * invoicePageSize;
    return filteredInvoices.slice(start, start + invoicePageSize);
  }, [filteredInvoices, invoicePage]);

  const matchingContext = useMemo(() => {
    if (!selectedPayment) return null;
    return generateMockMatchingContext(selectedPayment);
  }, [selectedPayment]);

  const invoiceById = useMemo(() => {
    const map = new Map<string, EnhancedARItem>();
    mockInvoices.forEach((invoice) => map.set(invoice.id, invoice));
    return map;
  }, [mockInvoices]);

  const selectedInvoiceItems = useMemo(() => {
    return selectedInvoices.map((id) => invoiceById.get(id)).filter(Boolean) as EnhancedARItem[];
  }, [selectedInvoices, invoiceById]);

  const remittanceAmountMap = useMemo(() => {
    if (!matchingContext?.evidence.remittance?.parsedInvoices) return new Map<string, number>();
    return new Map(
      matchingContext.evidence.remittance.parsedInvoices.map((inv) => [
        inv.invoiceNumber,
        inv.amount,
      ])
    );
  }, [matchingContext]);

  const totalAllocated = Object.values(allocationMap).reduce((sum, val) => sum + val, 0);
  const remainingAmount = selectedPayment ? selectedPayment.amount - totalAllocated : 0;
  const isFullyAllocated = selectedPayment && Math.abs(remainingAmount) < 1;
  const multiEntityDetected =
    selectedInvoiceItems.length > 0
      ? new Set(selectedInvoiceItems.map((inv) => inv.entity)).size > 1
      : false;
  const hasRemainder = selectedPayment ? Math.abs(remainingAmount) >= 1 : false;
  const remainderHandled = !hasRemainder || remainderMode !== "NONE";
  const hasAllocationErrors = validationErrors.length > 0;
  const canConfirm = selectedInvoices.length > 0 && remainderHandled && !hasAllocationErrors;

  useEffect(() => {
    if (!selectedPayment) return;
    const errors: string[] = [];
    selectedInvoiceItems.forEach((inv) => {
      const allocated = allocationMap[inv.id] || 0;
      if (allocated < 0) errors.push(`${inv.invoiceNumber}: allocation cannot be negative`);
      const maxAmount = inv.openAmount || inv.amount;
      if (allocated > maxAmount)
        errors.push(`${inv.invoiceNumber}: allocation exceeds open amount`);
    });
    if (totalAllocated > selectedPayment.amount) {
      errors.push("Total allocation exceeds payment amount");
    }
    setValidationErrors(errors);
  }, [selectedPayment, selectedInvoiceItems, allocationMap, totalAllocated]);

  const handlePaymentSelect = (payment: Payment) => {
    setSelectedPayment(payment);
    setSelectedInvoices([]);
    setAllocationMap({});
    setRemainderMode("NONE");
    setAdjustmentType("");
    setAdjustmentMemo("");
    setAllowOverAllocate(false);
    setAllocationState("DRAFT");
    cashAppStore.setUiState({ lastPaymentId: payment.id, returnTo: "PAYMENT_DETAIL" });
  };

  const handleInvoiceToggle = (invoiceId: string, invoice: EnhancedARItem) => {
    if (selectedInvoices.includes(invoiceId)) {
      setSelectedInvoices((prev) => prev.filter((id) => id !== invoiceId));
      setAllocationMap((prev) => {
        const newMap = { ...prev };
        delete newMap[invoiceId];
        return newMap;
      });
      setAllocationState("DRAFT");
    } else {
      setSelectedInvoices((prev) => [...prev, invoiceId]);
      const openAmount = invoice.openAmount || invoice.amount;
      const remainingBefore = selectedPayment
        ? selectedPayment.amount - totalAllocated
        : openAmount;
      const remittanceAmount = fromRemittance
        ? remittanceAmountMap.get(invoice.invoiceNumber)
        : undefined;
      const remittanceDefault = remittanceAmount
        ? Math.min(remittanceAmount, openAmount, remainingBefore)
        : undefined;
      const defaultAmount = remittanceDefault ?? Math.min(openAmount, Math.max(0, remainingBefore));
      setAllocationMap((prev) => ({ ...prev, [invoiceId]: defaultAmount }));
      setAllocationState("DRAFT");
    }
  };

  const handleAllocationChange = (invoiceId: string, amount: number, enforceCap = false) => {
    const invoice = invoiceById.get(invoiceId);
    if (!invoice) return;
    const maxAmount = invoice.openAmount || invoice.amount;
    let nextAmount = amount;
    if (nextAmount < 0) nextAmount = 0;
    if (enforceCap && nextAmount > maxAmount) {
      nextAmount = maxAmount;
    }
    setAllocationMap((prev) => ({ ...prev, [invoiceId]: nextAmount }));
    setAllocationState("DRAFT");
  };

  const appendTimelineEntry = (event: string, detail: string) => {
    if (!selectedPayment) return;
    const current = cashAppStore.getPaymentById(selectedPayment.id);
    if (!current) return;
    const nextTimeline = [...(current.activity_timeline || [])];
    nextTimeline.push({
      event,
      detail,
      actor: "User",
      ts: new Date().toISOString(),
    });
    cashAppStore.updatePayment(selectedPayment.id, { activity_timeline: nextTimeline });
  };

  const handleBackToPayment = () => {
    const uiState = cashAppStore.getUiState();
    const targetId = paymentId || uiState.lastPaymentId || selectedPayment?.id;
    if (!targetId) return;
    router.push(`/workbench/order-to-cash/cash-application/payments?paymentId=${targetId}`);
  };

  const handleConfirmMatch = () => {
    if (!selectedPayment) return;

    const hasRemainder = Math.abs(remainingAmount) >= 1;
    const remainderHandled = !hasRemainder || remainderMode !== "NONE";
    if (validationErrors.length > 0 || !remainderHandled) {
      toast.error("Resolve allocation issues before confirming");
      return;
    }

    const allocations = selectedInvoiceItems.map((inv) => ({
      invoice_id: inv.id,
      invoice_number: inv.invoiceNumber,
      entity: inv.entity || "Unknown",
      allocated_amount: allocationMap[inv.id] || 0,
    }));

    const confidenceAfterManual = Math.min(95, selectedPayment.confidenceScore + 10);
    const remainderValue = Math.max(0, remainingAmount);
    const matchResult = {
      payment_id: selectedPayment.id,
      allocations,
      remainder_amount: remainderValue,
      remainder_mode: hasRemainder ? remainderMode : "NONE",
      adjustment_type: remainderMode === "ADJUSTMENT" ? adjustmentType || undefined : undefined,
      confidence_after_manual: confidenceAfterManual,
      multi_entity: multiEntityDetected,
      je_required: multiEntityDetected,
    };

    let pendingState: Payment["pending_post_state"] = "READY";
    let suggestedAction = "Approve & Post";
    if (multiEntityDetected) {
      pendingState = "JE_APPROVAL_PENDING";
      suggestedAction = "Review JE & Post";
    } else if (remainderMode === "ON_ACCOUNT" || remainderMode === "ADJUSTMENT") {
      pendingState = "APPROVAL_NEEDED";
      suggestedAction = "Approve & Post";
    }

    cashAppStore.updatePayment(selectedPayment.id, {
      status: "PendingToPost",
      pending_post_state: pendingState,
      suggestedAction,
      confidenceScore: confidenceAfterManual,
      match_result: matchResult,
      allocation_state: "CONFIRMED",
      intercompany_flag: multiEntityDetected,
      je_required: multiEntityDetected,
    });

    cashAppStore.addActivityLog(selectedPayment.id, {
      timestamp: new Date().toISOString(),
      user: "Current User",
      action: "Manual Match",
      details: `Matched to ${selectedInvoices.length} invoice(s)`,
    });

    appendTimelineEntry(
      "Allocation Updated",
      `Allocated ${formatCurrency(totalAllocated)} across ${selectedInvoices.length} invoice(s)`
    );
    appendTimelineEntry("Match Confirmed", "Confirmed in Matching Studio");
    if (multiEntityDetected) {
      appendTimelineEntry("Intercompany Detected", "JE required for cross-entity allocation");
    }
    if (remainderMode !== "NONE" && hasRemainder) {
      appendTimelineEntry(
        "Remainder Handled",
        `Remainder set to ${remainderMode === "ON_ACCOUNT" ? "On Account" : remainderMode === "ADJUSTMENT" ? "Adjustment" : "Credit Memo"}`
      );
    }

    toast.success("Match confirmed. Payment updated in queue.");

    const updatedPayment = cashAppStore.getPaymentById(selectedPayment.id);
    if (updatedPayment) {
      setSelectedPayment(updatedPayment);
    }
    setPayments(
      cashAppStore
        .getPayments()
        .filter((p) => p.status === "New" || p.status === "Exception" || p.status === "AutoMatched")
    );
    setAllocationState("CONFIRMED");
  };

  const handleViewEvidence = (sectionId?: string) => {
    setEvidenceScrollTo(sectionId);
    setShowEvidencePanel(true);
  };

  const handleEvidenceViewed = () => {
    if (selectedPayment) {
      cashAppStore.addActivityLog(selectedPayment.id, {
        timestamp: new Date().toISOString(),
        user: "Current User",
        action: "Evidence Viewed",
        details: "Opened Evidence & Why panel",
      });
      toast.info("Evidence activity logged");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="border-b bg-white px-8 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Matching Studio</h1>
        <p className="text-sm text-gray-600 mt-1">Manually match payments to open invoices</p>
      </div>

      {selectedPayment && matchingContext && (
        <MatchContextBanner
          paymentNumber={selectedPayment.paymentNumber}
          workstream={matchingContext.workstream}
          matchType={matchingContext.match_type}
          confidence={matchingContext.confidence_score}
          tolerancePolicy={matchingContext.tolerance_policy}
          isMultiEntity={matchingContext.multi_entity}
          reasons={matchingContext.reasons}
          onViewEvidence={() => handleViewEvidence()}
          onBackToPayment={handleBackToPayment}
        />
      )}

      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-12 gap-6 h-full">
          <div className="col-span-4">
            <Card className="h-full flex flex-col">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900 mb-3">Select Payment</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search payments..."
                    value={searchPayment}
                    onChange={(e) => setSearchPayment(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-2">
                {paginatedPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPayment?.id === payment.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handlePaymentSelect(payment)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-sm text-gray-900">
                        {payment.paymentNumber}
                      </div>
                      <Badge variant={payment.status === "Exception" ? "destructive" : "outline"}>
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">{payment.customerName}</div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{payment.date}</div>
                  </div>
                ))}
              </div>
              <div className="border-t px-4 py-3 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Showing{" "}
                  {filteredPayments.length === 0 ? 0 : (paymentPage - 1) * paymentPageSize + 1}–
                  {Math.min(paymentPage * paymentPageSize, filteredPayments.length)} of{" "}
                  {filteredPayments.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentPage((prev) => Math.max(1, prev - 1))}
                    disabled={paymentPage <= 1}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentPage((prev) => Math.min(paymentTotalPages, prev + 1))}
                    disabled={paymentPage >= paymentTotalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="col-span-4">
            <Card className="h-full flex flex-col">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900 mb-3">Select Invoices</h2>
                {selectedPayment && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <div className="text-xs text-blue-700 font-medium mb-1">Customer</div>
                    <div className="text-sm font-semibold text-blue-900">
                      {selectedPayment.customerName}
                    </div>
                  </div>
                )}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search invoice #, customer, amount, entity..."
                    value={searchInvoice}
                    onChange={(e) => setSearchInvoice(e.target.value)}
                    className="pl-10"
                    disabled={!selectedPayment}
                  />
                </div>
                <InvoiceSearchFilters
                  openOnly={openOnly}
                  sameEntity={sameEntity}
                  fromRemittance={fromRemittance}
                  likelyMatches={likelyMatches}
                  onOpenOnlyChange={setOpenOnly}
                  onSameEntityChange={setSameEntity}
                  onFromRemittanceChange={setFromRemittance}
                  onLikelyMatchesChange={setLikelyMatches}
                  selectedPaymentEntity={selectedPayment?.bankAccount}
                />
                {selectedPayment && selectedInvoiceItems.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="text-xs font-semibold text-slate-700">Selected Invoices</div>
                    <div className="space-y-2">
                      {selectedInvoiceItems.map((invoice) => {
                        const openAmount = invoice.openAmount || invoice.amount;
                        const allocated = allocationMap[invoice.id] || 0;
                        const overAllocated = allocated > openAmount;
                        return (
                          <div key={invoice.id} className="border rounded-lg p-3 bg-white">
                            <div className="flex items-center justify-between">
                              <button className="text-sm font-semibold text-blue-600 hover:underline">
                                {invoice.invoiceNumber}
                              </button>
                              <button
                                onClick={() => handleInvoiceToggle(invoice.id, invoice)}
                                className="text-slate-400 hover:text-slate-600"
                                aria-label="Remove invoice"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="mt-2 grid grid-cols-4 gap-3 text-xs text-slate-600">
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-[10px]">
                                  {invoice.entity || "Entity"}
                                </Badge>
                              </div>
                              <div>
                                <div className="text-slate-500">Open</div>
                                <div className="font-medium text-slate-900">
                                  {formatCurrency(openAmount)}
                                </div>
                              </div>
                              <div className="col-span-2">
                                <div className="text-slate-500 mb-1">Allocated</div>
                                <Input
                                  type="number"
                                  value={allocated}
                                  onChange={(e) =>
                                    handleAllocationChange(
                                      invoice.id,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  onBlur={() => handleAllocationChange(invoice.id, allocated, true)}
                                  className={`h-8 ${overAllocated ? "border-red-400" : ""}`}
                                />
                                {overAllocated && (
                                  <div className="text-[11px] text-red-600 mt-1">
                                    Allocation exceeds open amount
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Checkbox
                        checked={allowOverAllocate}
                        onCheckedChange={(checked) => setAllowOverAllocate(Boolean(checked))}
                      />
                      <span>Allow Over-Allocate</span>
                    </div>

                    {totalAllocated > (selectedPayment?.amount || 0) && (
                      <div className="flex items-start gap-2 p-2 rounded-md border border-red-200 bg-red-50 text-xs text-red-700">
                        <AlertCircle className="w-4 h-4 mt-0.5" />
                        <span>Total allocated exceeds payment amount.</span>
                      </div>
                    )}

                    <div className="border-t pt-3">
                      {isFullyAllocated ? (
                        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-2">
                          Fully Allocated ✅
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">Remaining</span>
                            <span className="font-semibold text-slate-900">
                              {formatCurrency(remainingAmount)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(["ON_ACCOUNT", "ADJUSTMENT", "CREDIT_MEMO"] as const).map((mode) => (
                              <Button
                                key={mode}
                                size="sm"
                                variant="outline"
                                className={`h-7 px-3 text-xs ${
                                  remainderMode === mode ? "bg-slate-100 border-slate-400" : ""
                                }`}
                                onClick={() => setRemainderMode(mode)}
                              >
                                {mode === "ON_ACCOUNT"
                                  ? "Post On Account"
                                  : mode === "ADJUSTMENT"
                                    ? "Create Adjustment"
                                    : "Use Credit Memo"}
                              </Button>
                            ))}
                          </div>
                          {remainderMode === "ADJUSTMENT" && (
                            <div className="space-y-2 mt-2">
                              <Select
                                value={adjustmentType}
                                onValueChange={(value) =>
                                  setAdjustmentType(value as typeof adjustmentType)
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Select adjustment type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="DISCOUNT">Discount</SelectItem>
                                  <SelectItem value="SHORT_PAY">Short Pay</SelectItem>
                                  <SelectItem value="FX_DIFFERENCE">FX Difference</SelectItem>
                                  <SelectItem value="BANK_FEE">Bank Fee</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder="Adjustment memo (optional)"
                                value={adjustmentMemo}
                                onChange={(e) => setAdjustmentMemo(e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-2">
                {!selectedPayment ? (
                  <div className="text-center text-gray-500 text-sm py-12">
                    Select a payment first
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-12">No invoices found</div>
                ) : (
                  paginatedInvoices.map((invoice) => (
                    <EnhancedInvoiceCard
                      key={invoice.id}
                      invoice={invoice}
                      isSelected={selectedInvoices.includes(invoice.id)}
                      onClick={() => handleInvoiceToggle(invoice.id, invoice)}
                      formatCurrency={formatCurrency}
                    />
                  ))
                )}
              </div>
              {selectedPayment && filteredInvoices.length > 0 && (
                <div className="border-t px-4 py-3 flex items-center justify-between text-xs text-slate-600">
                  <span>
                    Showing{" "}
                    {filteredInvoices.length === 0 ? 0 : (invoicePage - 1) * invoicePageSize + 1}–
                    {Math.min(invoicePage * invoicePageSize, filteredInvoices.length)} of{" "}
                    {filteredInvoices.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInvoicePage((prev) => Math.max(1, prev - 1))}
                      disabled={invoicePage <= 1}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setInvoicePage((prev) => Math.min(invoiceTotalPages, prev + 1))
                      }
                      disabled={invoicePage >= invoiceTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="col-span-4">
            <Card className="h-full flex flex-col">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900">Match Summary</h2>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {!selectedPayment ? (
                  <div className="text-center text-gray-500 text-sm py-12">No payment selected</div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">Payment Amount</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(selectedPayment.amount)}
                      </div>
                    </div>

                    {selectedInvoices.length > 0 && (
                      <>
                        <div className="border-t pt-4 space-y-3">
                          <div className="text-xs font-medium text-gray-600">Summary</div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Payment Amount</span>
                              <span className="font-semibold">
                                {formatCurrency(selectedPayment.amount)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Allocated</span>
                              <span className="font-semibold">
                                {formatCurrency(totalAllocated)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Remaining</span>
                              <span
                                className={`font-semibold ${remainingAmount < 0 ? "text-red-600" : remainingAmount > 0 ? "text-amber-600" : "text-green-600"}`}
                              >
                                {formatCurrency(remainingAmount)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-4 space-y-2">
                          <div className="text-xs font-medium text-gray-600 mb-2">
                            Allocation Breakdown
                          </div>
                          <div className="space-y-2">
                            {selectedInvoiceItems.map((inv) => (
                              <div
                                key={inv.id}
                                className="flex items-center justify-between text-xs bg-gray-50 px-2.5 py-2 rounded"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">
                                    {inv.invoiceNumber}
                                  </span>
                                  <Badge variant="outline" className="text-[10px]">
                                    {inv.entity || "Entity"}
                                  </Badge>
                                </div>
                                <span className="font-semibold text-gray-900">
                                  {formatCurrency(allocationMap[inv.id] || 0)}
                                </span>
                              </div>
                            ))}
                          </div>
                          {multiEntityDetected && (
                            <div className="flex items-center justify-between text-xs bg-purple-50 border border-purple-200 rounded-md p-2">
                              <span className="text-purple-800">
                                Multi-Entity allocation detected
                              </span>
                              <button
                                className="text-purple-700 hover:underline"
                                onClick={() => handleViewEvidence("netsuite-evidence")}
                              >
                                Evidence
                              </button>
                            </div>
                          )}
                        </div>

                        {multiEntityDetected && (
                          <div className="border-t pt-4">
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>
                                Intercompany required — JE will be prepared after confirmation.
                              </span>
                            </div>
                          </div>
                        )}

                        {validationErrors.length > 0 && (
                          <div className="border-t pt-4">
                            <div className="flex flex-col gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                              {validationErrors.map((error, idx) => (
                                <span key={idx}>• {error}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="border-t pt-4 space-y-3">
                          <div className="text-xs font-medium text-gray-600">Action Readiness</div>
                          {hasAllocationErrors ? (
                            <div className="flex items-center gap-2 text-xs text-red-700">
                              ❌ Fix Errors
                            </div>
                          ) : !remainderHandled ? (
                            <div className="flex items-center gap-2 text-xs text-amber-700">
                              ⚠️ Needs Input
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-emerald-700">
                              ✅ Ready to Confirm
                            </div>
                          )}

                          {allocationState === "CONFIRMED" ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                                ✅ Confirmed
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleBackToPayment}
                                  className="flex-1"
                                >
                                  Back to Payment
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    router.push(
                                      "/workbench/order-to-cash/cash-application/payments"
                                    )
                                  }
                                  className="flex-1"
                                >
                                  Open in Queue
                                  <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              onClick={handleConfirmMatch}
                              disabled={!canConfirm}
                              className="w-full"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Confirm Match
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {selectedPayment && matchingContext && (
        <EvidencePanel
          isOpen={showEvidencePanel}
          onClose={() => {
            setShowEvidencePanel(false);
            setEvidenceScrollTo(undefined);
          }}
          whyNotAutoMatched={[
            "Payment amount does not fully allocate to selected invoices.",
            "Invoice INV-908771 is closed (write-off) → JE required.",
            "Customer verification needed due to amount variance.",
          ]}
          signals={matchingContext.signals}
          bankEvidence={matchingContext.evidence.bank}
          remittanceEvidence={matchingContext.evidence.remittance}
          netsuiteEvidence={matchingContext.evidence.netsuite}
          reasonCodes={[
            "Amount mismatch outside tolerance",
            "Closed invoice present in match set",
            "Multi-entity allocation required",
          ]}
          onEvidenceViewed={handleEvidenceViewed}
          scrollToSectionId={evidenceScrollTo}
        />
      )}
    </div>
  );
}
