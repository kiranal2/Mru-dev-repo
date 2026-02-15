"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FilterState } from "@/components/cash-app/cash-app-filter-rail";
import { DensityMode } from "@/components/cash-app/cash-app-theme";
import { cashAppStore } from "@/lib/cash-app-store";
import { useCashPayments } from "@/hooks/data/use-cash-payments";
import { Payment } from "@/lib/cash-app-types";
import { toast } from "sonner";
import type {
  RecipientScope,
  EmailMode,
  CustomerContact,
  AttachmentOption,
  EmailOutboxLog,
} from "../types";
import { EMAIL_TEMPLATES, CONTACTS_STORE, INTERNAL_CC_ALIAS } from "../constants";

export function usePaymentsQueue() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // --- Filter state ---
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    bankAccount: "all",
    dateRange: "all",
    amountRange: "all",
    method: "all",
    status: "all",
    remittanceSource: "all",
    assignedTo: "all",
  });

  const [activeSubFilter, setActiveSubFilter] = useState<string>("exact");
  const [activeContextualFilter, setActiveContextualFilter] = useState<string>("");
  const [isCriticalFilterActive, setIsCriticalFilterActive] = useState<boolean>(false);

  // --- Selection state ---
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [assignToUser, setAssignToUser] = useState<string>("");

  // --- Payment detail / action state ---
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>("");
  const [jeType, setJeType] = useState<string>("");
  const [assignTo, setAssignTo] = useState<string>("");

  // --- UI state ---
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [density, setDensity] = useState<DensityMode>("compact");
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [activeSignalFilter, setActiveSignalFilter] = useState<string | null>(null);

  // --- Email composer state ---
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailMode, setEmailMode] = useState<EmailMode>("bulk");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(EMAIL_TEMPLATES[0].id);
  const [emailSubject, setEmailSubject] = useState<string>(EMAIL_TEMPLATES[0].subject);
  const [emailBody, setEmailBody] = useState<string>(EMAIL_TEMPLATES[0].body);
  const [recipientScope, setRecipientScope] = useState<RecipientScope>("customer");
  const [toRecipients, setToRecipients] = useState<string[]>([]);
  const [ccRecipients, setCcRecipients] = useState<string[]>([]);
  const [toInput, setToInput] = useState("");
  const [ccInput, setCcInput] = useState("");
  const [saveRecipients, setSaveRecipients] = useState(false);
  const [includeInternalCc, setIncludeInternalCc] = useState(true);
  const [allowPersonalization, setAllowPersonalization] = useState(true);
  const [selectedPreviewPaymentId, setSelectedPreviewPaymentId] = useState<string | null>(null);
  const [attachmentOptions, setAttachmentOptions] = useState<AttachmentOption[]>([]);
  const [attachmentSelections, setAttachmentSelections] = useState<Record<string, boolean>>({});
  const [includePaymentSummaryLink, setIncludePaymentSummaryLink] = useState(true);
  const [includeRemittanceUploadLink, setIncludeRemittanceUploadLink] = useState(false);
  const [skipMissingContacts, setSkipMissingContacts] = useState(true);
  const [manualContactInputs, setManualContactInputs] = useState<Record<string, string>>({});
  const [customerContacts, setCustomerContacts] = useState<CustomerContact[]>(CONTACTS_STORE);
  const [emailOutbox, setEmailOutbox] = useState<EmailOutboxLog[]>([]);

  // --- Data (bridged: data hook for fetch lifecycle, store for rich Payment objects) ---
  const { loading: dataLoading, error: dataError, refetch: refetchPayments } = useCashPayments();
  const payments = cashAppStore.getPayments();
  const stats = cashAppStore.getStats();
  const dataHealth = cashAppStore.getDataHealth();

  // --- Effects ---
  useEffect(() => {
    setShowPaymentDrawer(false);
    setSelectedPayment(null);
  }, [pathname]);

  useEffect(() => {
    const paymentIdParam = searchParams?.get("paymentId");
    if (!paymentIdParam) return;
    const payment = cashAppStore.getPaymentById(paymentIdParam);
    if (payment) {
      setSelectedPayment(payment);
      setShowPaymentDrawer(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const segmentParam = searchParams?.get("segment");
    const statusParam = searchParams?.get("status");
    const contextParam = searchParams?.get("context");
    const subfilterParam = searchParams?.get("subfilter");
    const hasParams = segmentParam || statusParam || contextParam || subfilterParam;
    if (!hasParams) return;

    const resolvedStatus =
      (statusParam && statusParam !== "critical" ? statusParam : undefined) ||
      (segmentParam && segmentParam !== "critical" ? segmentParam : undefined);
    if (segmentParam || statusParam) {
      setActiveSegment(
        segmentParam || (resolvedStatus && resolvedStatus !== "all" ? resolvedStatus : null)
      );
    }
    if (resolvedStatus) {
      setFilters((prev) => ({
        ...prev,
        status: resolvedStatus,
      }));
    }
    if (segmentParam === "critical" || statusParam === "critical") {
      setIsCriticalFilterActive(true);
    } else if (segmentParam || statusParam) {
      setIsCriticalFilterActive(false);
    }
    if (contextParam !== null) {
      setActiveContextualFilter(contextParam || "");
    } else if (segmentParam || statusParam) {
      setActiveContextualFilter("");
    }
    if (subfilterParam !== null) {
      setActiveSubFilter(subfilterParam || "exact");
    } else if (resolvedStatus === "AutoMatched") {
      setActiveSubFilter("exact");
    }
  }, [searchParams]);

  useEffect(() => {
    const savedPageSize = localStorage.getItem("cashapp_payment_queue_pagesize");
    if (savedPageSize) {
      setPageSize(parseInt(savedPageSize));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cashapp_payment_queue_pagesize", pageSize.toString());
  }, [pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeSubFilter, activeContextualFilter, isCriticalFilterActive]);

  // --- Derived / memos ---
  const selectedPayments = useMemo(() => {
    return payments.filter((payment) => selectedIds.includes(payment.id));
  }, [payments, selectedIds]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !payment.customerName.toLowerCase().includes(searchLower) &&
          !payment.paymentNumber.toLowerCase().includes(searchLower) &&
          !payment.bankAccount.toLowerCase().includes(searchLower) &&
          !payment.customerNumber.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      if (filters.bankAccount !== "all" && !payment.bankAccount.includes(filters.bankAccount)) {
        return false;
      }

      if (filters.method !== "all" && payment.method !== filters.method) {
        return false;
      }

      if (filters.status !== "all" && payment.status !== filters.status) {
        return false;
      }

      if (
        filters.remittanceSource !== "all" &&
        payment.remittanceSource !== filters.remittanceSource
      ) {
        return false;
      }

      if (filters.assignedTo !== "all" && payment.assignedTo !== filters.assignedTo) {
        return false;
      }

      if (filters.amountRange !== "all") {
        const ranges: Record<string, [number, number]> = {
          "0-10k": [0, 10000],
          "10k-50k": [10000, 50000],
          "50k-100k": [50000, 100000],
          "100k+": [100000, Infinity],
        };
        const range = ranges[filters.amountRange];
        if (range && (payment.amount < range[0] || payment.amount >= range[1])) {
          return false;
        }
      }

      if (filters.status === "AutoMatched") {
        if (activeSubFilter === "exact" && payment.match_type !== "EXACT") {
          return false;
        }
        if (activeSubFilter === "tolerance" && payment.match_type !== "TOLERANCE") {
          return false;
        }
        if (activeSubFilter === "intercompany" && payment.match_type !== "INTERCOMPANY") {
          return false;
        }
        if (
          activeSubFilter === "warnings" &&
          (!payment.warnings || payment.warnings.length === 0)
        ) {
          return false;
        }
        if (
          activeSubFilter === "bulkReady" &&
          (payment.confidenceScore < 95 || payment.warnings?.length)
        ) {
          return false;
        }
      }

      // Apply contextual sub-filters for Exception status
      if (filters.status === "Exception" && activeContextualFilter) {
        if (
          activeContextualFilter === "MissingRemittance" &&
          payment.exception_core_type !== "MISSING_REMIT"
        ) {
          return false;
        }
        if (
          activeContextualFilter === "InvoiceIssue" &&
          payment.exception_core_type !== "INVOICE_ISSUE"
        ) {
          return false;
        }
        if (
          activeContextualFilter === "AmountMismatch" &&
          payment.exception_core_type !== "AMOUNT_ISSUE"
        ) {
          return false;
        }
        if (
          activeContextualFilter === "MultiEntity" &&
          payment.exception_core_type !== "INTERCOMPANY"
        ) {
          return false;
        }
        if (
          activeContextualFilter === "JERequired" &&
          payment.exception_core_type !== "JE_NEEDED"
        ) {
          return false;
        }
        if (
          activeContextualFilter === "DuplicateSuspected" &&
          payment.exception_core_type !== "DUPLICATE"
        ) {
          return false;
        }
        if (
          activeContextualFilter === "RemittanceParseError" &&
          payment.exception_reason_code !== "REMIT_PARSE_ERROR"
        ) {
          return false;
        }
        if (
          activeContextualFilter === "ACHFailure" &&
          payment.exception_reason_code !== "ACH_FAILED"
        ) {
          return false;
        }
        if (
          activeContextualFilter === "UnappliedOnAccount" &&
          payment.exception_reason_code !== "UNAPPLIED_CASH"
        ) {
          return false;
        }
      }

      // Apply contextual sub-filters for Critical items (based on tags/amount)
      if (isCriticalFilterActive) {
        const isCritical = payment.tags?.includes("High Priority") || payment.amount > 100000;
        if (!isCritical) {
          return false;
        }

        if (activeContextualFilter) {
          if (activeContextualFilter === "HighValue" && payment.amount <= 100000) {
            return false;
          }
          if (activeContextualFilter === "SLABreach" && !payment.tags?.includes("SLA Breach")) {
            return false;
          }
          if (
            activeContextualFilter === "NetSuiteSyncRisk" &&
            !payment.tags?.includes("Sync Risk")
          ) {
            return false;
          }
          if (
            activeContextualFilter === "PostingBlocked" &&
            (!payment.postingHoldReasons || payment.postingHoldReasons.length === 0)
          ) {
            return false;
          }
          if (
            activeContextualFilter === "CustomerEscalation" &&
            !payment.tags?.includes("Escalated")
          ) {
            return false;
          }
          if (
            activeContextualFilter === "SettlementRisk" &&
            payment.settlementStatus !== "Failed"
          ) {
            return false;
          }
        }
      }

      // Apply contextual sub-filters for PendingToPost status
      if (filters.status === "PendingToPost" && activeContextualFilter) {
        if (
          activeContextualFilter === "READY" &&
          payment.pending_post_state &&
          payment.pending_post_state !== "READY"
        ) {
          return false;
        }
        if (
          activeContextualFilter === "READY" &&
          !payment.pending_post_state &&
          payment.postingRefs?.postStatus !== "Ready"
        ) {
          return false;
        }
        if (
          activeContextualFilter === "APPROVAL_NEEDED" &&
          payment.pending_post_state &&
          payment.pending_post_state !== "APPROVAL_NEEDED"
        ) {
          return false;
        }
        if (
          activeContextualFilter === "APPROVAL_NEEDED" &&
          !payment.pending_post_state &&
          payment.postingRefs?.postStatus !== "NotPosted" &&
          payment.postingRefs?.postStatus !== undefined
        ) {
          return false;
        }
        if (
          activeContextualFilter === "JE_APPROVAL_PENDING" &&
          payment.pending_post_state &&
          payment.pending_post_state !== "JE_APPROVAL_PENDING"
        ) {
          return false;
        }
        if (
          activeContextualFilter === "JE_APPROVAL_PENDING" &&
          !payment.pending_post_state &&
          (!payment.je_required || payment.intercompanyJEDraft)
        ) {
          return false;
        }
        if (
          activeContextualFilter === "SYNC_PENDING" &&
          payment.pending_post_state &&
          payment.pending_post_state !== "SYNC_PENDING"
        ) {
          return false;
        }
        if (
          activeContextualFilter === "SYNC_PENDING" &&
          !payment.pending_post_state &&
          payment.postingRefs?.postStatus !== "NotPosted"
        ) {
          return false;
        }
        if (
          activeContextualFilter === "FAILED" &&
          payment.pending_post_state &&
          payment.pending_post_state !== "FAILED"
        ) {
          return false;
        }
        if (
          activeContextualFilter === "FAILED" &&
          !payment.pending_post_state &&
          payment.postingRefs?.postStatus !== "PostFailed"
        ) {
          return false;
        }
        if (
          activeContextualFilter === "BANK_MATCH_PENDING" &&
          payment.settlementStatus !== "Pending"
        ) {
          return false;
        }
      }

      return true;
    });
  }, [payments, filters, activeSubFilter, activeContextualFilter, isCriticalFilterActive]);

  // --- Pagination ---
  const totalRecords = filteredPayments.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPayments = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredPayments.slice(startIndex, endIndex);
  }, [filteredPayments, validCurrentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowLeft" && validCurrentPage > 1) {
        e.preventDefault();
        handlePageChange(validCurrentPage - 1);
      } else if (e.key === "ArrowRight" && validCurrentPage < totalPages) {
        e.preventDefault();
        handlePageChange(validCurrentPage + 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        handlePageChange(1);
      } else if (e.key === "End") {
        e.preventDefault();
        handlePageChange(totalPages);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [validCurrentPage, totalPages]);

  // --- Sub-filter counts ---
  const subFilterCounts = useMemo(() => {
    const autoMatchedPayments = payments.filter((p) => p.status === "AutoMatched");
    return {
      exact: autoMatchedPayments.filter((p) => p.match_type === "EXACT").length,
      tolerance: autoMatchedPayments.filter((p) => p.match_type === "TOLERANCE").length,
      intercompany: autoMatchedPayments.filter((p) => p.match_type === "INTERCOMPANY").length,
      warnings: autoMatchedPayments.filter((p) => p.warnings && p.warnings.length > 0).length,
      bulkReady: autoMatchedPayments.filter(
        (p) => p.confidenceScore >= 95 && (!p.warnings || p.warnings.length === 0)
      ).length,
    };
  }, [payments]);

  const contextualSubFilterCounts = useMemo(() => {
    const exceptionPayments = payments.filter((p) => p.status === "Exception");
    const criticalPayments = payments.filter(
      (p) => p.tags?.includes("High Priority") || p.amount > 100000
    );
    const pendingPayments = payments.filter((p) => p.status === "PendingToPost");

    return {
      // Exception counts
      missingRemittance: exceptionPayments.filter((p) => p.exception_core_type === "MISSING_REMIT")
        .length,
      invoiceIssue: exceptionPayments.filter((p) => p.exception_core_type === "INVOICE_ISSUE")
        .length,
      amountMismatch: exceptionPayments.filter((p) => p.exception_core_type === "AMOUNT_ISSUE")
        .length,
      multiEntity: exceptionPayments.filter((p) => p.exception_core_type === "INTERCOMPANY")
        .length,
      jeRequired: exceptionPayments.filter((p) => p.exception_core_type === "JE_NEEDED").length,
      duplicateSuspected: exceptionPayments.filter((p) => p.exception_core_type === "DUPLICATE")
        .length,
      remittanceParseError: exceptionPayments.filter(
        (p) => p.exception_reason_code === "REMIT_PARSE_ERROR"
      ).length,
      achFailure: exceptionPayments.filter((p) => p.exception_reason_code === "ACH_FAILED").length,
      unappliedOnAccount: exceptionPayments.filter(
        (p) => p.exception_reason_code === "UNAPPLIED_CASH"
      ).length,

      // Critical counts
      highValue: criticalPayments.filter((p) => p.amount > 100000).length,
      slaBreach: criticalPayments.filter((p) => p.tags?.includes("SLA Breach")).length,
      netSuiteSyncRisk: criticalPayments.filter((p) => p.tags?.includes("Sync Risk")).length,
      postingBlocked: criticalPayments.filter(
        (p) => p.postingHoldReasons && p.postingHoldReasons.length > 0
      ).length,
      customerEscalation: criticalPayments.filter((p) => p.tags?.includes("Escalated")).length,
      settlementRisk: criticalPayments.filter((p) => p.settlementStatus === "Failed").length,

      // Pending to Post counts
      readyToPost: pendingPayments.filter((p) => p.postingRefs?.postStatus === "Ready").length,
      approvalNeeded: pendingPayments.filter(
        (p) => !p.postingRefs?.postStatus || p.postingRefs?.postStatus === "NotPosted"
      ).length,
      jeApprovalPending: pendingPayments.filter(
        (p) => p.pending_post_state === "JE_APPROVAL_PENDING"
      ).length,
      syncPending: pendingPayments.filter((p) => p.postingRefs?.postStatus === "NotPosted").length,
      postingFailed: pendingPayments.filter((p) => p.postingRefs?.postStatus === "PostFailed")
        .length,
      bankMatchPending: pendingPayments.filter((p) => p.settlementStatus === "Pending").length,
    };
  }, [payments]);

  // --- Email helpers ---
  const getTemplateById = (templateId: string) => {
    return EMAIL_TEMPLATES.find((template) => template.id === templateId) || EMAIL_TEMPLATES[0];
  };

  const getContactForCustomer = (customerId: string) => {
    return customerContacts.find((contact) => contact.customerId === customerId);
  };

  const buildAttachmentOptions = (payment?: Payment): AttachmentOption[] => {
    const options: AttachmentOption[] = [];
    if (payment?.linkedRemittanceFileUrl) {
      options.push({ id: "remittance", label: "Remittance PDF" });
    }
    if (payment?.originalPaymentFileUrl) {
      options.push({ id: "payment", label: "Payment File" });
    }
    if (payment?.transformedLines?.length) {
      options.push({ id: "invoice", label: "Invoice PDFs" });
    }
    return options;
  };

  const resetEmailComposer = (paymentsToEmail: Payment[]) => {
    const template = getTemplateById(selectedTemplateId);
    const defaultScope: RecipientScope = paymentsToEmail.every((payment) => payment.customerId)
      ? "customer"
      : "payment";
    const previewPayment = paymentsToEmail[0] || null;
    const attachments = buildAttachmentOptions(previewPayment || undefined);

    setEmailSubject(template.subject);
    setEmailBody(template.body);
    setRecipientScope(defaultScope);
    setSelectedPreviewPaymentId(previewPayment?.id || null);
    setAttachmentOptions(attachments);
    setAttachmentSelections(
      attachments.reduce(
        (acc, option) => {
          acc[option.id] = template.defaultAttachments?.includes(option.id) ?? false;
          return acc;
        },
        {} as Record<string, boolean>
      )
    );

    const contact = previewPayment ? getContactForCustomer(previewPayment.customerId) : undefined;
    const defaultTo = contact?.remittanceEmail || contact?.arEmail || contact?.billToEmail || "";
    const defaultCc = contact?.ccList || [];
    setToRecipients(defaultTo ? [defaultTo] : []);
    setCcRecipients(defaultCc);
    setToInput("");
    setCcInput("");
    setSaveRecipients(false);
    setIncludeInternalCc(true);
    setAllowPersonalization(true);
    setIncludePaymentSummaryLink(true);
    setIncludeRemittanceUploadLink(false);
    setSkipMissingContacts(true);
  };

  const openEmailComposer = () => {
    if (selectedPayments.length === 0) return;
    setEmailMode(selectedPayments.length === 1 ? "single" : "bulk");
    resetEmailComposer(selectedPayments);
    setShowEmailComposer(true);
    selectedPayments.forEach((payment) => {
      cashAppStore.addActivityLog(payment.id, {
        timestamp: new Date().toISOString(),
        user: "System",
        action: "Email Draft Opened",
        details: "Email composer opened",
      });
    });
  };

  const addRecipient = (
    value: string,
    recipients: string[],
    setRecipientsFn: (values: string[]) => void
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const normalized = trimmed.replace(/,$/, "");
    if (!recipients.includes(normalized)) {
      setRecipientsFn([...recipients, normalized]);
    }
  };

  const removeRecipient = (
    value: string,
    recipients: string[],
    setRecipientsFn: (values: string[]) => void
  ) => {
    setRecipientsFn(recipients.filter((recipient) => recipient !== value));
  };

  const buildInvoiceList = (paymentList: Payment[]) => {
    const refs = paymentList.flatMap(
      (payment) => payment.transformedLines?.map((line) => line.erpReference) || []
    );
    return Array.from(new Set(refs)).join(", ") || "N/A";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const resolveTemplateBody = (paymentList: Payment[], payment: Payment) => {
    const primary = paymentList[0] || payment;
    const totalApplied = payment.transformedLines.reduce(
      (sum, line) => sum + line.paymentAmount,
      0
    );
    const difference = payment.amount - totalApplied;
    const reasonCode =
      payment.transformedLines[0]?.reasonCode ||
      payment.exception_reason_label ||
      payment.exception_reason_code ||
      payment.exceptionType ||
      "N/A";

    const variables: Record<string, string> = {
      "{{customer_name}}": payment.customerName,
      "{{payment_number}}": payment.paymentNumber,
      "{{payment_amount}}": formatCurrency(payment.amount),
      "{{payment_date}}": payment.date,
      "{{invoice_list}}":
        recipientScope === "customer" ? buildInvoiceList(paymentList) : buildInvoiceList([payment]),
      "{{difference_amount}}": formatCurrency(difference),
      "{{remittance_required}}": payment.exceptionType === "MissingRemittance" ? "Yes" : "No",
      "{{reason_code}}": reasonCode,
      "{{analyst_name}}": "Current User",
    };

    let body = emailBody;
    Object.entries(variables).forEach(([key, value]) => {
      body = body.replaceAll(key, value);
    });

    if (includePaymentSummaryLink || includeRemittanceUploadLink) {
      body += "\n\n---\n";
      if (includePaymentSummaryLink) {
        body += `Payment summary: https://meeru.ai/payments/${payment.paymentNumber}\n`;
      }
      if (includeRemittanceUploadLink) {
        body += `Remittance upload: https://meeru.ai/remittances/upload\n`;
      }
    }

    return { body, primary, variables };
  };

  const buildEmailGroups = () => {
    if (recipientScope === "payment") {
      return selectedPayments.map((payment) => ({
        id: payment.id,
        customerId: payment.customerId,
        customerName: payment.customerName,
        payments: [payment],
      }));
    }

    const grouped = new Map<
      string,
      { customerId: string; customerName: string; payments: Payment[] }
    >();
    selectedPayments.forEach((payment) => {
      const existing = grouped.get(payment.customerId);
      if (existing) {
        existing.payments.push(payment);
      } else {
        grouped.set(payment.customerId, {
          customerId: payment.customerId,
          customerName: payment.customerName,
          payments: [payment],
        });
      }
    });
    return Array.from(grouped.values()).map((group) => ({
      id: group.customerId,
      customerId: group.customerId,
      customerName: group.customerName,
      payments: group.payments,
    }));
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = getTemplateById(templateId);
    setEmailSubject(template.subject);
    setEmailBody(template.body);
    const attachments =
      attachmentOptions.length > 0
        ? attachmentOptions
        : buildAttachmentOptions(selectedPayments[0]);
    setAttachmentSelections(
      attachments.reduce(
        (acc, option) => {
          acc[option.id] = template.defaultAttachments?.includes(option.id) ?? false;
          return acc;
        },
        {} as Record<string, boolean>
      )
    );
  };

  const handleSendEmails = () => {
    const template = getTemplateById(selectedTemplateId);
    const groups = buildEmailGroups();
    let sentCount = 0;
    let skippedCount = 0;

    const updatedOutbox: EmailOutboxLog[] = [];

    groups.forEach((group) => {
      const contact = getContactForCustomer(group.customerId);
      const manualContact = manualContactInputs[group.customerId];
      const fallbackTo = manualContact
        ? [manualContact]
        : contact?.remittanceEmail
          ? [contact.remittanceEmail]
          : contact?.arEmail
            ? [contact.arEmail]
            : contact?.billToEmail
              ? [contact.billToEmail]
              : [];
      const toList = toRecipients.length > 0 ? toRecipients : fallbackTo;
      const ccList = [
        ...ccRecipients,
        ...(contact?.ccList || []),
        ...(includeInternalCc ? [INTERNAL_CC_ALIAS] : []),
      ].filter((value, index, self) => value && self.indexOf(value) === index);

      if (toList.length === 0) {
        skippedCount += group.payments.length;
        if (!skipMissingContacts) {
          skippedCount += 0;
        }
        group.payments.forEach((payment) => {
          cashAppStore.addActivityLog(payment.id, {
            timestamp: new Date().toISOString(),
            user: "System",
            action: "Email Skipped",
            details: "No contact found (Artifacts: Missing Contact)",
          });
        });
        updatedOutbox.push({
          id: `outbox-${Date.now()}-${group.id}`,
          paymentId: group.payments[0]?.id,
          customerId: group.customerId,
          templateId: template.id,
          to: [],
          cc: [],
          subject: emailSubject,
          body: emailBody,
          status: "Skipped",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (skipMissingContacts === false && toList.length === 0) {
        return;
      }

      group.payments.forEach((payment) => {
        const previewContext = allowPersonalization ? payment : group.payments[0];
        const resolved = resolveTemplateBody(group.payments, previewContext);
        cashAppStore.addActivityLog(payment.id, {
          timestamp: new Date().toISOString(),
          user: "System",
          action: "Email Sent",
          details: `Template ${template.name} sent to ${toList.join(", ")} (Artifacts: Email, Template)`,
        });
        updatedOutbox.push({
          id: `outbox-${Date.now()}-${payment.id}`,
          paymentId: payment.id,
          customerId: payment.customerId,
          templateId: template.id,
          to: toList,
          cc: ccList,
          subject: emailSubject,
          body: resolved.body,
          status: "Queued",
          timestamp: new Date().toISOString(),
        });
        sentCount += 1;
      });

      if (saveRecipients && contact) {
        const updatedContacts = customerContacts.map((existing) =>
          existing.customerId === contact.customerId
            ? { ...existing, arEmail: toList[0], ccList: ccList }
            : existing
        );
        setCustomerContacts(updatedContacts);
      }
    });

    setEmailOutbox((prev) => [...prev, ...updatedOutbox]);
    toast.success(`Emails queued: ${sentCount}, skipped: ${skippedCount}`);
    setShowEmailComposer(false);
    setSelectedIds([]);
  };

  // --- Email derived values ---
  const emailGroups = useMemo(() => buildEmailGroups(), [selectedPayments, recipientScope]);
  const uniqueCustomersCount = new Set(selectedPayments.map((payment) => payment.customerId)).size;
  const emailCount = recipientScope === "customer" ? emailGroups.length : selectedPayments.length;
  const missingContactCount = emailGroups.filter((group) => {
    const contact = getContactForCustomer(group.customerId);
    const manualContact = manualContactInputs[group.customerId];
    const contactEmail =
      manualContact || contact?.remittanceEmail || contact?.arEmail || contact?.billToEmail || "";
    return !contactEmail && toRecipients.length === 0;
  }).length;
  const previewPayment =
    selectedPayments.find((payment) => payment.id === selectedPreviewPaymentId) ||
    selectedPayments[0];

  // --- Event handlers ---
  const handleChipClick = (filter: string) => {
    setFilters((prev) => ({
      ...prev,
      status: filter === "critical" ? "all" : filter,
    }));
    if (filter === "AutoMatched") {
      setActiveSubFilter("exact");
    }
    setIsCriticalFilterActive(filter === "critical");
    setActiveContextualFilter("");
  };

  const handleSubFilterClick = (filter: string) => {
    setActiveSubFilter(filter);
  };

  const handleContextualFilterClick = (filter: string) => {
    setActiveContextualFilter(filter);
  };

  const handleClearContextualFilter = () => {
    setActiveContextualFilter("");
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      bankAccount: "all",
      dateRange: "all",
      amountRange: "all",
      method: "all",
      status: "all",
      remittanceSource: "all",
      assignedTo: "all",
    });
    setActiveSubFilter("exact");
    setActiveContextualFilter("");
    setIsCriticalFilterActive(false);
    setSelectedIds([]);
  };

  const handleSignalClick = (signal: string) => {
    const signalFilters: Record<string, Partial<FilterState>> = {
      MissingRemittance: { status: "Exception" },
      DuplicateSuspected: { status: "Exception" },
      MultiEntity: { status: "Exception" },
      HighValue: { amountRange: "100k+" },
      SettlementPending: { status: "SettlementPending" },
    };

    const newFilters = signalFilters[signal];
    if (newFilters) {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedPayments.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectAllRecords = () => {
    setSelectedIds(filteredPayments.map((p) => p.id));
  };

  const areAllOnPageSelected =
    paginatedPayments.length > 0 && paginatedPayments.every((p) => selectedIds.includes(p.id));
  const areSomeSelected = selectedIds.length > 0;
  const showSelectAllBanner = areAllOnPageSelected && selectedIds.length < totalRecords;

  const handleSelectPayment = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((pId) => pId !== id));
    }
  };

  const handleBulkAction = (action: string) => {
    setBulkAction(action);
    if (action === "assign") {
      setAssignToUser("");
    }
    if (action === "email") {
      openEmailComposer();
      return;
    }
    setShowBulkModal(true);
  };

  const executeBulkAction = () => {
    const actionMap: Record<string, { status?: Payment["status"]; tag?: string; message: string }> =
      {
        approve: { status: "PendingToPost", message: "Approved for posting" },
        reprocess: { message: "Reprocessing payments" },
        generate: { message: "Generating output files" },
        "non-ar": { status: "NonAR", message: "Marked as Non-AR" },
        ignore: { tag: "Ignored", message: "Marked as ignored" },
      };

    if (bulkAction === "assign" && assignToUser) {
      selectedIds.forEach((id) => {
        cashAppStore.updatePayment(id, { assignedTo: assignToUser });
        cashAppStore.addActivityLog(id, {
          timestamp: new Date().toISOString(),
          user: "Current User",
          action: "Assigned",
          details: `Assigned to ${assignToUser}`,
        });
      });
      toast.success(`Assigned ${selectedIds.length} payments to ${assignToUser}`);
    } else {
      const action = actionMap[bulkAction];
      if (action) {
        const updates: Partial<Payment> = {};
        if (action.status) updates.status = action.status;
        if (action.tag) {
          selectedIds.forEach((id) => {
            const payment = cashAppStore.getPaymentById(id);
            if (payment) {
              updates.tags = [...payment.tags, action.tag!];
            }
          });
        }

        selectedIds.forEach((id) => {
          cashAppStore.updatePayment(id, updates);
          cashAppStore.addActivityLog(id, {
            timestamp: new Date().toISOString(),
            user: "Current User",
            action: bulkAction,
            details: action.message,
          });
        });

        toast.success(`${action.message} for ${selectedIds.length} payments`);
      }
    }

    setSelectedIds([]);
    setShowBulkModal(false);
    setBulkAction("");
  };

  const handleRowClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowPaymentDrawer(true);
  };

  const handleAction = (action: string) => {
    setCurrentAction(action);
    if (action === "je-type" || action === "assign") {
      setShowActionModal(true);
    } else {
      executeAction(action);
    }
  };

  const executeAction = (action?: string) => {
    if (!selectedPayment) return;

    const actionToExecute = action || currentAction;
    const actionMap: Record<string, { status?: Payment["status"]; message: string }> = {
      "approve-post": { status: "Posted", message: "Payment approved and posted" },
      approve: { status: "PendingToPost", message: "Payment approved" },
      "missing-remittance": { message: "Marked as missing remittance" },
      duplicate: { message: "Marked as duplicate" },
    };

    if (actionToExecute === "assign" && assignTo) {
      cashAppStore.updatePayment(selectedPayment.id, { assignedTo: assignTo });
      cashAppStore.addActivityLog(selectedPayment.id, {
        timestamp: new Date().toISOString(),
        user: "Current User",
        action: "Assigned",
        details: `Assigned to ${assignTo}`,
      });
      toast.success(`Assigned to ${assignTo}`);
      const updatedPayment = cashAppStore.getPaymentById(selectedPayment.id);
      if (updatedPayment) setSelectedPayment(updatedPayment);
      setShowActionModal(false);
    } else if (actionToExecute === "je-type" && jeType) {
      cashAppStore.addActivityLog(selectedPayment.id, {
        timestamp: new Date().toISOString(),
        user: "Current User",
        action: "JE Type Selected",
        details: `Selected JE type: ${jeType}`,
      });
      toast.success(`JE type set to ${jeType}`);
      setShowActionModal(false);
    } else if (actionToExecute === "edit-match") {
      toast.info("Edit match functionality coming soon");
    } else {
      const mappedAction = actionMap[actionToExecute];
      if (mappedAction) {
        const updates: Partial<Payment> = {};
        if (mappedAction.status) updates.status = mappedAction.status;

        if (actionToExecute === "missing-remittance") {
          updates.exceptionType = "MissingRemittance";
          updates.status = "Exception";
        } else if (actionToExecute === "duplicate") {
          updates.exceptionType = "DuplicateSuspected";
          updates.status = "Exception";
        }

        cashAppStore.updatePayment(selectedPayment.id, updates);
        cashAppStore.addActivityLog(selectedPayment.id, {
          timestamp: new Date().toISOString(),
          user: "Current User",
          action: actionToExecute,
          details: mappedAction.message,
        });

        toast.success(mappedAction.message);
        const updatedPayment = cashAppStore.getPaymentById(selectedPayment.id);
        if (updatedPayment) setSelectedPayment(updatedPayment);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSegmentChange = (segment: string) => {
    setActiveSegment(segment);
    handleChipClick(segment);
  };

  const handleEnhancedSignalClick = (signal: string) => {
    setActiveSignalFilter(signal);
    handleSignalClick(signal);
  };

  const handleClearSignalFilter = () => {
    setActiveSignalFilter(null);
    handleClearFilters();
  };

  const handleClearSegmentFilter = () => {
    setActiveSegment(null);
    handleClearFilters();
  };

  const handleApprovePost = (payment: Payment) => {
    if (payment.settlement_state === "PENDING") {
      toast.error("Final settlement not confirmed. Posting blocked.");
      return;
    }
    toast.success(`Payment ${payment.paymentNumber} approved and posted`);
  };

  const handleMarkReviewed = (payment: Payment) => {
    toast.success(`Payment ${payment.paymentNumber} marked as reviewed`);
  };

  const handleAssignPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setBulkAction("assign");
    setShowBulkModal(true);
  };

  const handleSplitPayment = (payment: Payment) => {
    toast.info("Split payment functionality coming soon");
  };

  const handleCreateJE = (payment: Payment) => {
    toast.info("Journal entry creation coming soon");
  };

  const handleBulkApprovePost = () => {
    toast.success(`${selectedIds.length} payments approved and posted`);
    setSelectedIds([]);
  };

  const handleBulkAssign = () => {
    setBulkAction("assign");
    setShowBulkModal(true);
  };

  const handleBulkExport = () => {
    toast.success(`Exporting ${selectedIds.length} payments`);
  };

  const handleBulkMarkReviewed = () => {
    toast.success(`${selectedIds.length} payments marked as reviewed`);
    setSelectedIds([]);
  };

  return {
    // Data
    payments,
    stats,
    dataHealth,
    filteredPayments,
    paginatedPayments,
    selectedPayments,
    dataLoading,
    dataError,
    refetchPayments,

    // Filters
    filters,
    setFilters,
    activeSubFilter,
    activeContextualFilter,
    isCriticalFilterActive,
    activeSegment,
    activeSignalFilter,
    subFilterCounts,
    contextualSubFilterCounts,

    // Selection
    selectedIds,
    setSelectedIds,
    areAllOnPageSelected,
    areSomeSelected,
    showSelectAllBanner,

    // Pagination
    currentPage,
    pageSize,
    totalPages,
    totalRecords,
    validCurrentPage,

    // UI state
    density,
    setDensity,
    isLoading,
    hoveredRowId,
    setHoveredRowId,
    showFilterSidebar,
    setShowFilterSidebar,
    showBulkModal,
    setShowBulkModal,
    bulkAction,
    assignToUser,
    setAssignToUser,

    // Payment detail
    selectedPayment,
    setSelectedPayment,
    showPaymentDrawer,
    setShowPaymentDrawer,
    showActionModal,
    setShowActionModal,
    currentAction,
    jeType,
    setJeType,
    assignTo,
    setAssignTo,

    // Email composer
    showEmailComposer,
    setShowEmailComposer,
    emailMode,
    selectedTemplateId,
    emailSubject,
    setEmailSubject,
    emailBody,
    setEmailBody,
    recipientScope,
    setRecipientScope,
    toRecipients,
    setToRecipients,
    ccRecipients,
    setCcRecipients,
    toInput,
    setToInput,
    ccInput,
    setCcInput,
    saveRecipients,
    setSaveRecipients,
    includeInternalCc,
    setIncludeInternalCc,
    allowPersonalization,
    setAllowPersonalization,
    selectedPreviewPaymentId,
    setSelectedPreviewPaymentId,
    attachmentOptions,
    setAttachmentOptions,
    attachmentSelections,
    setAttachmentSelections,
    includePaymentSummaryLink,
    setIncludePaymentSummaryLink,
    includeRemittanceUploadLink,
    setIncludeRemittanceUploadLink,
    skipMissingContacts,
    setSkipMissingContacts,
    manualContactInputs,
    setManualContactInputs,
    emailOutbox,
    setEmailOutbox,
    emailGroups,
    uniqueCustomersCount,
    emailCount,
    missingContactCount,
    previewPayment,

    // Handlers
    handlePageChange,
    handlePageSizeChange,
    handleChipClick,
    handleSubFilterClick,
    handleContextualFilterClick,
    handleClearContextualFilter,
    handleClearFilters,
    handleSignalClick,
    handleSelectAll,
    handleSelectAllRecords,
    handleSelectPayment,
    handleBulkAction,
    executeBulkAction,
    handleRowClick,
    handleAction,
    executeAction,
    handleSegmentChange,
    handleEnhancedSignalClick,
    handleClearSignalFilter,
    handleClearSegmentFilter,
    handleApprovePost,
    handleMarkReviewed,
    handleAssignPayment,
    handleSplitPayment,
    handleCreateJE,
    handleBulkApprovePost,
    handleBulkAssign,
    handleBulkExport,
    handleBulkMarkReviewed,
    handleTemplateChange,
    handleSendEmails,

    // Utilities
    formatDate,
    formatCurrency,
    getTemplateById,
    getContactForCustomer,
    addRecipient,
    removeRecipient,
    resolveTemplateBody,
    buildEmailGroups,
  };
}
