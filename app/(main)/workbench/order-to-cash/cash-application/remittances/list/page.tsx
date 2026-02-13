"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { cashAppStore } from "@/lib/cash-app-store";
import type { Payment, Remittance, RemittanceValidationStatus } from "@/lib/cash-app-types";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Download,
  ExternalLink,
  FileText,
  Link2,
  Mail,
  MoreHorizontal,
  PencilLine,
  RotateCcw,
  XCircle,
} from "lucide-react";

const SOURCE_OPTIONS = ["All", "Email", "Upload", "EDI", "Bank Portal", "API"];
const EXTRACT_OPTIONS = ["All", "Not Extracted", "Extracted", "Partial", "Failed"];
const LINK_OPTIONS = ["All", "Linked", "Unlinked", "Multi-match"];
const DATE_OPTIONS = ["All Time", "Last 7 Days", "Last 30 Days", "Custom"];

const extractLabelMap = {
  NOT_EXTRACTED: "Not Extracted",
  EXTRACTED: "Extracted",
  PARTIAL: "Partial",
  FAILED: "Failed",
} as const;

const linkLabelMap = {
  LINKED: "Linked",
  UNLINKED: "Unlinked",
  MULTI_MATCH: "Multi-match",
} as const;

export default function RemittancesListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [remittances, setRemittances] = useState<Remittance[]>(cashAppStore.getRemittances());
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [extractFilter, setExtractFilter] = useState("All");
  const [linkFilter, setLinkFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRemittanceId, setSelectedRemittanceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"original" | "extracted">("original");
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editExtractOpen, setEditExtractOpen] = useState(false);
  const [linkSearch, setLinkSearch] = useState("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [editCustomer, setEditCustomer] = useState("");
  const [editReference, setEditReference] = useState("");
  const [editPaymentDate, setEditPaymentDate] = useState("");
  const [editLineItems, setEditLineItems] = useState<
    Array<{
      invoice_number: string;
      paid_amount: number;
    }>
  >([]);

  const payments = cashAppStore.getPayments();

  const updateRemittance = (id: string, updates: Partial<Remittance>) => {
    setRemittances((prev) =>
      prev.map((remittance) =>
        remittance.id === id || remittance.remittanceNumber === id
          ? { ...remittance, ...updates }
          : remittance
      )
    );
    cashAppStore.updateRemittance(id, updates);
  };

  const addActivity = (
    remittanceId: string,
    entry: { event: string; actor: string; ts: string; detail?: string }
  ) => {
    const remittance = remittances.find(
      (item) => item.id === remittanceId || item.remittanceNumber === remittanceId
    );
    if (!remittance) return;
    const activity_log = [...(remittance.activity_log || []), entry];
    updateRemittance(remittance.id, { activity_log });
    cashAppStore.addRemittanceActivity(remittance.id, entry);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "Email":
        return <Mail className="w-4 h-4" />;
      case "Bank Portal":
      case "EDI":
      case "API":
      case "Manual Upload":
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const normalizeRemittance = (remittance: Remittance) => {
    const extract_status =
      remittance.extract_status ||
      (remittance.status === "Failed"
        ? "FAILED"
        : remittance.status === "Partial"
          ? "PARTIAL"
          : remittance.status === "Parsed"
            ? "EXTRACTED"
            : "NOT_EXTRACTED");
    const link_status =
      remittance.link_status ||
      (remittance.linkStatus === "Linked"
        ? "LINKED"
        : remittance.linkStatus === "Unlinked"
          ? "UNLINKED"
          : remittance.linkStatus === "Partial"
            ? "MULTI_MATCH"
            : "UNLINKED");
    const invoices_found_count =
      remittance.invoices_found_count ??
      remittance.extractedReferencesDetailed?.length ??
      remittance.extractedReferences?.length ??
      0;
    const confidence_score = remittance.confidence_score ?? remittance.parserConfidence ?? null;
    const key_reference = remittance.key_reference || remittance.remittanceNumber;
    const extracted_line_items =
      remittance.extracted_line_items ||
      remittance.extractedReferencesDetailed?.map((ref) => ({
        invoice_number: ref.invoiceNumber,
        invoice_amount: ref.amount,
        paid_amount: ref.amount - (ref.discountAmount || 0),
        discount: ref.discountAmount || 0,
        credit_memo_ref: ref.reasonCode?.startsWith("CM") ? `CM-${ref.invoiceNumber}` : undefined,
      })) ||
      [];
    return {
      ...remittance,
      extract_status,
      link_status,
      invoices_found_count,
      confidence_score,
      key_reference,
      extracted_line_items,
    };
  };

  const normalizedRemittances = useMemo(() => remittances.map(normalizeRemittance), [remittances]);

  const selectedRemittance = useMemo(() => {
    const remittance =
      normalizedRemittances.find((item) => item.id === selectedRemittanceId) || null;
    return remittance ? normalizeRemittance(remittance) : null;
  }, [normalizedRemittances, selectedRemittanceId]);

  const filteredRemittances = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    const sourceValue = sourceFilter === "Upload" ? "Manual Upload" : sourceFilter;
    const today = new Date();
    const dateLimit =
      dateFilter === "Last 7 Days"
        ? new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        : dateFilter === "Last 30 Days"
          ? new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          : null;

    return normalizedRemittances.filter((remittance) => {
      const searchableText = [
        remittance.remittanceNumber,
        remittance.remittanceHeaderId,
        remittance.customerName,
        remittance.key_reference,
        remittance.extracted_fields?.reference,
        remittance.email_metadata?.subject,
        remittance.linked_payment_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (searchTerm && !searchableText.includes(searchTerm)) {
        return false;
      }

      if (sourceFilter !== "All" && remittance.source !== sourceValue) {
        return false;
      }

      if (extractFilter !== "All") {
        const extractStatusLabel =
          extractLabelMap[remittance.extract_status as keyof typeof extractLabelMap];
        if (extractFilter !== extractStatusLabel) {
          return false;
        }
      }

      if (linkFilter !== "All") {
        const linkStatusLabel = linkLabelMap[remittance.link_status as keyof typeof linkLabelMap];
        if (linkFilter !== linkStatusLabel) {
          return false;
        }
      }

      if (dateLimit) {
        const dateValue = new Date(
          remittance.receivedDate || remittance.effectiveDate || remittance.createdAt
        );
        if (dateValue < dateLimit) {
          return false;
        }
      }

      return true;
    });
  }, [normalizedRemittances, search, sourceFilter, extractFilter, linkFilter, dateFilter]);

  const totals = {
    total: normalizedRemittances.length,
    pending: normalizedRemittances.filter((remittance) => remittance.link_status !== "LINKED")
      .length,
    processed: normalizedRemittances.filter((remittance) => remittance.link_status === "LINKED")
      .length,
  };

  const handleOpenDrawer = (remittanceId: string, tab?: "original" | "extracted") => {
    setSelectedRemittanceId(remittanceId);
    setDrawerOpen(true);
    if (tab) {
      setActiveTab(tab);
    }
  };

  const openPayment = (remittance: Remittance) => {
    if (!remittance.linked_payment_id) return;
    router.push(
      `/workbench/order-to-cash/cash-application/payments?paymentId=${remittance.linked_payment_id}`
    );
  };

  const buildMockExtraction = (
    remittance: Remittance,
    extractStatus: Remittance["extract_status"]
  ) => {
    const invoicesFound =
      extractStatus === "FAILED" ? 0 : Math.max(1, remittance.invoices_found_count || 3);
    const keyReference = remittance.key_reference || remittance.remittanceNumber;
    const lineItems = Array.from({ length: invoicesFound }).map((_, idx) => ({
      invoice_number: `INV-${32000 + idx}`,
      invoice_amount: 12000 + idx * 3200,
      paid_amount: 12000 + idx * 3200,
      discount: extractStatus === "PARTIAL" && idx === 0 ? 675 : 0,
      credit_memo_ref: idx === 2 ? `CM-${1200 + idx}` : undefined,
      notes: idx === 1 ? "Short pay adjustment" : undefined,
    }));

    return {
      invoicesFound,
      keyReference,
      lineItems,
      extracted_fields: {
        customer: remittance.customerName,
        payment_date: remittance.effectiveDate || remittance.receivedDate || "",
        amount: remittance.remittanceAmount ?? remittance.totalAmount,
        currency: "USD",
        reference: keyReference,
        method: remittance.attachments?.[0]?.type?.includes("XLS") ? "OCR" : "AI",
      },
      validation_checks: [
        { status: "PASS" as RemittanceValidationStatus, label: "Invoices exist in NetSuite" },
        {
          status: (extractStatus === "PARTIAL" ? "WARN" : "PASS") as RemittanceValidationStatus,
          label: "Totals match",
          detail: extractStatus === "PARTIAL" ? "Difference: $675" : undefined,
        },
        { status: "PASS" as RemittanceValidationStatus, label: "Currency match" },
        { status: "WARN" as RemittanceValidationStatus, label: "Invoice closed" },
      ] as Array<{ status: RemittanceValidationStatus; label: string; detail?: string }>,
    };
  };

  const handleRerunExtract = (remittance: Remittance) => {
    setExtractingId(remittance.id);
    const attachmentType = remittance.attachments?.[0]?.type?.toUpperCase();
    const nextStatus =
      attachmentType === "PDF"
        ? "EXTRACTED"
        : attachmentType === "XLS" || attachmentType === "XLSX"
          ? "PARTIAL"
          : attachmentType === "CSV"
            ? "EXTRACTED"
            : Math.random() > 0.6
              ? "FAILED"
              : "PARTIAL";
    const confidence = nextStatus === "EXTRACTED" ? 92 : nextStatus === "PARTIAL" ? 67 : 35;

    window.setTimeout(() => {
      const mockExtraction = buildMockExtraction(remittance, nextStatus);
      updateRemittance(remittance.id, {
        extract_status: nextStatus,
        confidence_score: confidence,
        extract_reason:
          nextStatus === "FAILED"
            ? "PDF unreadable"
            : nextStatus === "PARTIAL"
              ? "No invoice numbers found"
              : undefined,
        invoices_found_count: mockExtraction.invoicesFound,
        key_reference: mockExtraction.keyReference,
        extracted_fields: mockExtraction.extracted_fields,
        extracted_line_items: mockExtraction.lineItems,
        validation_checks: mockExtraction.validation_checks,
      });
      addActivity(remittance.id, {
        event: "Re-run Extract",
        actor: "System",
        ts: new Date().toISOString(),
        detail: `Extracted with ${confidence}% confidence`,
      });
      setExtractingId(null);
    }, 650);
  };

  const openEditExtract = (remittance: Remittance) => {
    setEditCustomer(remittance.extracted_fields?.customer || remittance.customerName);
    setEditReference(
      remittance.extracted_fields?.reference ||
        remittance.key_reference ||
        remittance.remittanceNumber
    );
    setEditPaymentDate(
      remittance.extracted_fields?.payment_date ||
        remittance.effectiveDate ||
        remittance.receivedDate ||
        ""
    );
    setEditLineItems(
      (remittance.extracted_line_items || []).map((item) => ({
        invoice_number: item.invoice_number,
        paid_amount: item.paid_amount,
      }))
    );
    setEditExtractOpen(true);
  };

  const handleSaveExtractEdit = () => {
    if (!selectedRemittance) return;
    const updatedLineItems = (selectedRemittance.extracted_line_items || []).map((item, idx) => ({
      ...item,
      invoice_number: editLineItems[idx]?.invoice_number || item.invoice_number,
      paid_amount: editLineItems[idx]?.paid_amount ?? item.paid_amount,
    }));

    updateRemittance(selectedRemittance.id, {
      extracted_fields: {
        customer: editCustomer,
        payment_date: editPaymentDate,
        amount: selectedRemittance.remittanceAmount ?? selectedRemittance.totalAmount,
        currency: selectedRemittance.extracted_fields?.currency || "USD",
        reference: editReference,
        method: selectedRemittance.extracted_fields?.method || "AI",
      },
      extracted_line_items: updatedLineItems,
    });
    addActivity(selectedRemittance.id, {
      event: "Extract Edited",
      actor: "User",
      ts: new Date().toISOString(),
      detail: "Manual updates applied to extracted data",
    });
    setEditExtractOpen(false);
  };

  const handleLinkPayment = (remittance: Remittance, paymentId: string) => {
    const selectedPayment = payments.find(
      (payment) => payment.id === paymentId || payment.paymentNumber === paymentId
    );
    if (!selectedPayment) return;
    const amountMatches = payments.filter((payment) => payment.amount === selectedPayment.amount);
    if (amountMatches.length > 2 && linkSearch.trim()) {
      updateRemittance(remittance.id, {
        link_status: "MULTI_MATCH",
        link_reason: "Multiple payments match amount",
        linked_payment_id: null,
      });
      addActivity(remittance.id, {
        event: "Link Attempt",
        actor: "User",
        ts: new Date().toISOString(),
        detail: "Multiple payments match amount",
      });
      setLinkModalOpen(false);
      return;
    }

    updateRemittance(remittance.id, {
      link_status: "LINKED",
      link_reason: undefined,
      linked_payment_id: selectedPayment.paymentNumber,
    });
    addActivity(remittance.id, {
      event: "Linked to Payment",
      actor: "User",
      ts: new Date().toISOString(),
      detail: `Linked to ${selectedPayment.paymentNumber}`,
    });
    setLinkModalOpen(false);
  };

  const handleCreateException = (remittance: Remittance) => {
    const reason =
      remittance.extract_status === "FAILED" ? "Remittance Parse Failed" : "Remittance Unlinked";
    const exceptionPayment = cashAppStore.createExceptionPaymentFromRemittance(remittance, reason);
    addActivity(remittance.id, {
      event: "Exception Created",
      actor: "User",
      ts: new Date().toISOString(),
      detail: reason,
    });
    toast({
      title: "Exception created",
      description: `${reason} • ${exceptionPayment.paymentNumber}`,
      action: (
        <ToastAction
          altText="Open in Payments Queue"
          onClick={() =>
            router.push(
              `/workbench/order-to-cash/cash-application/payments?paymentId=${exceptionPayment.paymentNumber}`
            )
          }
        >
          Open in Payments Queue
        </ToastAction>
      ),
    });
  };

  const suggestedPayments = useMemo(() => {
    if (!selectedRemittance) return [];
    const key = selectedRemittance.customerName.split(" ")[0]?.toLowerCase();
    const matches = payments.filter((payment) => payment.customerName.toLowerCase().includes(key));
    const fallback = payments.filter((payment) => !matches.includes(payment));
    return [...matches, ...fallback].slice(0, 4);
  }, [payments, selectedRemittance]);

  const filteredPayments = useMemo(() => {
    if (!linkSearch.trim()) return payments.slice(0, 6);
    const term = linkSearch.toLowerCase();
    return payments
      .filter(
        (payment) =>
          payment.paymentNumber.toLowerCase().includes(term) ||
          payment.id.toLowerCase().includes(term) ||
          payment.customerName.toLowerCase().includes(term) ||
          payment.memoReferenceRaw.toLowerCase().includes(term)
      )
      .slice(0, 8);
  }, [linkSearch, payments]);

  const renderExtractBadge = (status: Remittance["extract_status"]) => {
    const classes =
      status === "EXTRACTED"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : status === "PARTIAL"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : status === "FAILED"
            ? "bg-rose-50 text-rose-700 border-rose-200"
            : "bg-slate-100 text-slate-700 border-slate-200";
    return (
      <Badge variant="outline" className={`text-[11px] px-2 py-0.5 ${classes}`}>
        {extractLabelMap[status as keyof typeof extractLabelMap]}
      </Badge>
    );
  };

  const renderLinkBadge = (status: Remittance["link_status"]) => {
    const classes =
      status === "LINKED"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : status === "MULTI_MATCH"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-slate-100 text-slate-700 border-slate-200";
    return (
      <Badge variant="outline" className={`text-[11px] px-2 py-0.5 ${classes}`}>
        {linkLabelMap[status as keyof typeof linkLabelMap]}
      </Badge>
    );
  };

  const renderConfidence = (score: number | null) => {
    if (score === null || score === undefined) {
      return <span className="text-sm text-slate-400">—</span>;
    }
    if (score >= 85) {
      return (
        <div className="flex items-center gap-1 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4" />
          {score}%
        </div>
      );
    }
    if (score >= 60) {
      return (
        <div className="flex items-center gap-1 text-sm text-amber-700">
          <Circle className="w-3 h-3 fill-amber-500 text-amber-500" />
          {score}%
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-sm text-rose-700">
        <XCircle className="w-4 h-4" />
        {score}%
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="border-b bg-white px-8 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Remittances List</h1>
        <p className="text-sm text-gray-600 mt-1">View all remittance documents</p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Remittances</p>
                <p className="text-2xl font-bold text-gray-900">{totals.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{totals.pending}</p>
              </div>
              <FileText className="w-8 h-8 text-amber-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processed</p>
                <p className="text-2xl font-bold text-green-600">{totals.processed}</p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>

        <Card>
          <div className="border-b bg-white">
            <div className="grid grid-cols-12 gap-3 p-4">
              <div className="col-span-4">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search remittance #, customer, reference, linked payment..."
                />
              </div>
              <div className="col-span-2">
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Select value={extractFilter} onValueChange={setExtractFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Extract" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXTRACT_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Select value={linkFilter} onValueChange={setLinkFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Link" />
                  </SelectTrigger>
                  <SelectContent>
                    {LINK_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Remittance #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Extract
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Link
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Key Ref
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Invoices
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRemittances.map((remittance) => {
                  const displayStatus =
                    remittance.link_status === "LINKED" ||
                    remittance.status === "Matched" ||
                    remittance.status === "Linked"
                      ? "Processed"
                      : "Pending";
                  const extractReason = remittance.extract_reason || "No invoice numbers found";
                  const linkReason = remittance.link_reason || "Missing payment reference";
                  return (
                    <tr key={remittance.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">
                        {remittance.remittanceHeaderId || remittance.remittanceNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {remittance.receivedDate || remittance.effectiveDate || ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{remittance.customerName}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {formatCurrency(remittance.remittanceAmount ?? remittance.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          {getSourceIcon(remittance.source)}
                          {remittance.source}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={displayStatus === "Processed" ? "default" : "outline"}>
                          {displayStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {renderExtractBadge(remittance.extract_status)}
                          {(remittance.extract_status === "FAILED" ||
                            remittance.extract_status === "PARTIAL") && (
                            <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
                              {extractReason}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {renderLinkBadge(remittance.link_status)}
                          {(remittance.link_status === "UNLINKED" ||
                            remittance.link_status === "MULTI_MATCH") && (
                            <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
                              {linkReason}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {renderConfidence(
                          remittance.extract_status === "NOT_EXTRACTED"
                            ? null
                            : remittance.confidence_score
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <span
                          className="block max-w-[140px] truncate"
                          title={remittance.key_reference}
                        >
                          {remittance.key_reference || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {remittance.extract_status === "NOT_EXTRACTED" ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <button
                            className="text-blue-600 hover:text-blue-700 font-medium"
                            onClick={() => handleOpenDrawer(remittance.id, "extracted")}
                          >
                            {remittance.invoices_found_count || 0} invoices
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDrawer(remittance.id)}
                          >
                            View
                          </Button>
                          {remittance.link_status === "LINKED" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPayment(remittance)}
                            >
                              Open Payment
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRemittanceId(remittance.id);
                                setLinkModalOpen(true);
                              }}
                            >
                              Link Payment
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRerunExtract(remittance)}>
                                Re-run Extract
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditExtract(remittance)}>
                                Edit Extract
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  toast({
                                    title: "Download started",
                                    description:
                                      remittance.inputFileUrl || "Original remittance file",
                                  })
                                }
                              >
                                Download Original
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  updateRemittance(remittance.id, {
                                    status: "Processed",
                                    exceptionDetails: "Invalid",
                                  });
                                  addActivity(remittance.id, {
                                    event: "Marked Invalid",
                                    actor: "User",
                                    ts: new Date().toISOString(),
                                    detail: "Remittance marked as invalid",
                                  });
                                }}
                              >
                                Mark Invalid
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCreateException(remittance)}>
                                Create Exception
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[720px] sm:max-w-[720px] p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b bg-slate-50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SheetTitle className="text-lg font-semibold text-slate-900">
                  Remittance: {selectedRemittance?.remittanceNumber || "—"}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {selectedRemittance && (
                    <>
                      <Badge variant="outline" className="text-[11px] px-2 py-0.5">
                        {selectedRemittance.source}
                      </Badge>
                      <Badge variant="outline" className="text-[11px] px-2 py-0.5">
                        {selectedRemittance.link_status === "LINKED" ? "Processed" : "Pending"}
                      </Badge>
                      {renderExtractBadge(selectedRemittance.extract_status)}
                      {renderLinkBadge(selectedRemittance.link_status)}
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    selectedRemittance &&
                    toast({
                      title: "Download started",
                      description: selectedRemittance.inputFileUrl || "Original remittance file",
                    })
                  }
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Original
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectedRemittance && handleRerunExtract(selectedRemittance)}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Re-run Extract
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectedRemittance && openEditExtract(selectedRemittance)}
                >
                  <PencilLine className="w-4 h-4 mr-2" />
                  Edit Extract
                </Button>
                {selectedRemittance?.link_status !== "LINKED" ? (
                  <Button size="sm" onClick={() => setLinkModalOpen(true)}>
                    <Link2 className="w-4 h-4 mr-2" />
                    Link Payment
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => selectedRemittance && openPayment(selectedRemittance)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Payment
                  </Button>
                )}
              </div>
            </div>
          </SheetHeader>

          {selectedRemittance && (
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as "original" | "extracted")}
              >
                <TabsList className="mb-4">
                  <TabsTrigger value="original">Original</TabsTrigger>
                  <TabsTrigger value="extracted">Extracted</TabsTrigger>
                </TabsList>

                <TabsContent value="original">
                  <div className="space-y-4">
                    {selectedRemittance.source === "Email" && selectedRemittance.email_metadata && (
                      <Card className="p-4 space-y-2">
                        <div className="text-sm font-semibold text-slate-900">Email Header</div>
                        <div className="text-sm text-slate-700 space-y-1">
                          <div>
                            <span className="text-slate-500">From:</span>{" "}
                            {selectedRemittance.email_metadata.from}
                          </div>
                          <div>
                            <span className="text-slate-500">To:</span>{" "}
                            {selectedRemittance.email_metadata.to}
                          </div>
                          <div>
                            <span className="text-slate-500">Subject:</span>{" "}
                            {selectedRemittance.email_metadata.subject}
                          </div>
                          <div>
                            <span className="text-slate-500">Received:</span>{" "}
                            {new Date(
                              selectedRemittance.email_metadata.received_ts
                            ).toLocaleString()}
                          </div>
                        </div>
                      </Card>
                    )}

                    {selectedRemittance.source === "Email" && selectedRemittance.email_metadata && (
                      <Card className="p-4 space-y-2">
                        <div className="text-sm font-semibold text-slate-900">
                          Email Body Preview
                        </div>
                        <div className="max-h-[160px] overflow-y-auto text-sm text-slate-700 whitespace-pre-wrap">
                          {selectedRemittance.email_metadata.body}
                        </div>
                      </Card>
                    )}

                    <Card className="p-4 space-y-3">
                      <div className="text-sm font-semibold text-slate-900">Attachments</div>
                      {(selectedRemittance.attachments || []).length === 0 && (
                        <div className="text-sm text-slate-500">No attachments</div>
                      )}
                      {(selectedRemittance.attachments || []).map((attachment) => (
                        <div
                          key={attachment.name}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                              {attachment.type}
                            </Badge>
                            <span className="text-slate-700">{attachment.name}</span>
                            <span className="text-xs text-slate-500">{attachment.size}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                toast({
                                  title: "Download started",
                                  description: attachment.url || attachment.name,
                                })
                              }
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                      {(selectedRemittance.attachments || []).some((att) => att.type === "PDF") && (
                        <div className="border border-dashed rounded-md p-4 text-sm text-slate-500">
                          Preview not available •{" "}
                          {
                            (selectedRemittance.attachments || []).find((att) => att.type === "PDF")
                              ?.name
                          }
                        </div>
                      )}
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="extracted">
                  <div className="space-y-4">
                    <Card className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
                        <div>
                          <div className="text-xs text-slate-500">Customer</div>
                          <div className="font-medium">
                            {selectedRemittance.extracted_fields?.customer ||
                              selectedRemittance.customerName}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Payment Date</div>
                          <div className="font-medium">
                            {selectedRemittance.extracted_fields?.payment_date ||
                              selectedRemittance.receivedDate}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Payment Amount</div>
                          <div className="font-medium">
                            {formatCurrency(
                              selectedRemittance.remittanceAmount ?? selectedRemittance.totalAmount
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Currency</div>
                          <div className="font-medium">
                            {selectedRemittance.extracted_fields?.currency || "USD"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Payment Reference</div>
                          <div className="font-medium">
                            {selectedRemittance.extracted_fields?.reference ||
                              selectedRemittance.key_reference}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Extract Method</div>
                          <div className="font-medium">
                            {selectedRemittance.extracted_fields?.method || "AI"}
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 space-y-2">
                      <div className="text-sm font-semibold text-slate-900">Validation Checks</div>
                      <div className="space-y-2 text-sm">
                        {(selectedRemittance.validation_checks || []).map((check, idx) => (
                          <div key={`${check.label}-${idx}`} className="flex items-start gap-2">
                            {check.status === "PASS" && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                            )}
                            {check.status === "WARN" && (
                              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                            )}
                            {check.status === "FAIL" && (
                              <XCircle className="w-4 h-4 text-rose-600 mt-0.5" />
                            )}
                            <div>
                              <div className="text-slate-700">{check.label}</div>
                              {check.detail && (
                                <div className="text-xs text-slate-500">{check.detail}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="text-sm font-semibold text-slate-900 mb-3">
                        Extracted Line Items
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b bg-slate-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">
                                Invoice #
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">
                                Invoice Amount
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">
                                Paid Amount
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">
                                Discount
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">
                                Credit Memo Ref
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">
                                Notes
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {(selectedRemittance.extracted_line_items || []).map((line, idx) => (
                              <tr key={`${line.invoice_number}-${idx}`}>
                                <td className="px-3 py-2">{line.invoice_number}</td>
                                <td className="px-3 py-2">{formatCurrency(line.invoice_amount)}</td>
                                <td className="px-3 py-2">{formatCurrency(line.paid_amount)}</td>
                                <td className="px-3 py-2">
                                  {line.discount ? formatCurrency(line.discount) : "—"}
                                </td>
                                <td className="px-3 py-2">{line.credit_memo_ref || "—"}</td>
                                <td className="px-3 py-2 text-slate-500">
                                  {("notes" in line ? line.notes : undefined) || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600 border-t mt-3 pt-3">
                        <span>Invoices Found: {selectedRemittance.invoices_found_count || 0}</span>
                        <span>
                          Total Paid:{" "}
                          {formatCurrency(
                            (selectedRemittance.extracted_line_items || []).reduce(
                              (sum, line) => sum + line.paid_amount,
                              0
                            )
                          )}
                        </span>
                        <span
                          className={
                            selectedRemittance.extract_status === "PARTIAL" ||
                            selectedRemittance.extract_status === "FAILED"
                              ? "text-amber-600 font-semibold"
                              : ""
                          }
                        >
                          Delta vs Remittance Amount:{" "}
                          {selectedRemittance.extract_status === "PARTIAL" ? "$675" : "$0"}
                        </span>
                      </div>
                    </Card>

                    {selectedRemittance.link_status !== "LINKED" && (
                      <Card className="p-4">
                        <div className="text-sm font-semibold text-slate-900 mb-3">
                          Suggested Payments
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="border-b bg-slate-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">
                                  Payment ID
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">
                                  Date
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">
                                  Amount
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">
                                  Bank Account
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">
                                  Confidence
                                </th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {suggestedPayments.map((payment) => (
                                <tr key={payment.id}>
                                  <td className="px-3 py-2 font-medium">{payment.paymentNumber}</td>
                                  <td className="px-3 py-2">{payment.date}</td>
                                  <td className="px-3 py-2">{formatCurrency(payment.amount)}</td>
                                  <td className="px-3 py-2">{payment.bankAccount}</td>
                                  <td className="px-3 py-2 text-emerald-700 font-medium">
                                    {Math.min(95, payment.confidenceScore + 4)}%
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleLinkPayment(selectedRemittance, payment.paymentNumber)
                                      }
                                    >
                                      Link
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Link Payment to Remittance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search payments by ID, amount, reference, customer"
              value={linkSearch}
              onChange={(event) => setLinkSearch(event.target.value)}
            />
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">
                      Payment ID
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">
                      Amount
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">
                      Payer
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">
                      Confidence
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className={`cursor-pointer ${selectedPaymentId === payment.paymentNumber ? "bg-slate-50" : ""}`}
                      onClick={() => setSelectedPaymentId(payment.paymentNumber)}
                    >
                      <td className="px-3 py-2 font-medium">{payment.paymentNumber}</td>
                      <td className="px-3 py-2">{payment.date}</td>
                      <td className="px-3 py-2">{formatCurrency(payment.amount)}</td>
                      <td className="px-3 py-2">{payment.customerName}</td>
                      <td className="px-3 py-2">{payment.status}</td>
                      <td className="px-3 py-2 text-emerald-700 font-medium">
                        {payment.confidenceScore}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedPaymentId && (
              <div className="text-xs text-slate-500">
                Selected Payment:{" "}
                <span className="font-semibold text-slate-700">{selectedPaymentId}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLinkModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedPaymentId || !selectedRemittance}
              onClick={() =>
                selectedRemittance &&
                selectedPaymentId &&
                handleLinkPayment(selectedRemittance, selectedPaymentId)
              }
            >
              Confirm Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editExtractOpen} onOpenChange={setEditExtractOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Extracted Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-slate-500 mb-1">Customer</div>
                <Input
                  value={editCustomer}
                  onChange={(event) => setEditCustomer(event.target.value)}
                />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Payment Reference</div>
                <Input
                  value={editReference}
                  onChange={(event) => setEditReference(event.target.value)}
                />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Payment Date</div>
                <Input
                  value={editPaymentDate}
                  onChange={(event) => setEditPaymentDate(event.target.value)}
                />
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 mb-2">Line Items</div>
              <div className="space-y-2">
                {editLineItems.map((item, idx) => (
                  <div key={`${item.invoice_number}-${idx}`} className="grid grid-cols-2 gap-3">
                    <Input
                      value={item.invoice_number}
                      onChange={(event) => {
                        const value = event.target.value;
                        setEditLineItems((prev) =>
                          prev.map((line, lineIdx) =>
                            lineIdx === idx ? { ...line, invoice_number: value } : line
                          )
                        );
                      }}
                    />
                    <Input
                      value={item.paid_amount}
                      onChange={(event) => {
                        const value = parseFloat(event.target.value || "0");
                        setEditLineItems((prev) =>
                          prev.map((line, lineIdx) =>
                            lineIdx === idx ? { ...line, paid_amount: value } : line
                          )
                        );
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditExtractOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveExtractEdit}>Save Updates</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
