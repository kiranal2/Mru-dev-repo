"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CashAppSubFilterChips } from "@/components/cash-app/CashAppSubFilterChips";
import { CashAppContextualSubFilters } from "@/components/cash-app/CashAppContextualSubFilters";
import { CashAppFilterRail, FilterState } from "@/components/cash-app/CashAppFilterRail";
import { CashAppEmptyState } from "@/components/cash-app/CashAppEmptyState";
import { WhyIndicator } from "@/components/cash-app/WhyIndicator";
import { PaymentQueuePagination } from "@/components/cash-app/PaymentQueuePagination";
import { KPISummaryStrip } from "@/components/cash-app/KPISummaryStrip";
import { SegmentedControl } from "@/components/cash-app/SegmentedControl";
import { ConfidenceMeter } from "@/components/cash-app/ConfidenceMeter";
import { TableRowActions } from "@/components/cash-app/TableRowActions";
import { PaymentDetailsDrawer } from "@/components/cash-app/PaymentDetailsDrawer";
import { BulkActionBar } from "@/components/cash-app/BulkActionBar";
import { TableSkeletonRows } from "@/components/cash-app/TableSkeletonRows";
import { DensityToggle } from "@/components/cash-app/DensityToggle";
import { DensityMode } from "@/components/cash-app/cash-app-theme";
import { cashAppStore } from "@/lib/cash-app-store";
import { Payment } from "@/lib/cash-app-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Mail,
  UserPlus,
  Ban,
  EyeOff,
  Download,
  X,
  Edit,
  Settings,
  Upload,
  FileText,
  Lightbulb,
  Clock,
  AlertCircle,
  Tag,
  PanelLeftClose,
  PanelLeft,
  Paperclip,
  Send,
  Info,
  Target,
  SlidersHorizontal,
  ArrowLeftRight,
  Eye,
  Split,
  BookOpen,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type RecipientScope = "payment" | "customer";
type EmailMode = "bulk" | "single";

type CustomerContact = {
  customerId: string;
  customerName: string;
  billToEmail?: string;
  arEmail?: string;
  remittanceEmail?: string;
  portalUserEmail?: string;
  ccList?: string[];
};

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  requiredVariables: string[];
  defaultAttachments?: string[];
};

type AttachmentOption = {
  id: string;
  label: string;
};

type EmailOutboxLog = {
  id: string;
  paymentId?: string;
  customerId?: string;
  templateId: string;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  status: "Queued" | "Skipped";
  timestamp: string;
};

const INTERNAL_CC_ALIAS = "ar-ops@meeru.ai";

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "missing-remittance",
    name: "Missing Remittance Request",
    subject: "Missing remittance for payment {{payment_number}}",
    body: "Hello {{customer_name}},\n\nWe received payment {{payment_number}} for {{payment_amount}} dated {{payment_date}} but did not receive remittance details.\n\nPlease provide remittance advice or invoice list ({{invoice_list}}) so we can apply this payment.\n\nThank you,\n{{analyst_name}}",
    requiredVariables: [
      "customer_name",
      "payment_number",
      "payment_amount",
      "payment_date",
      "invoice_list",
    ],
    defaultAttachments: ["remittance", "payment"],
  },
  {
    id: "duplicate-payment",
    name: "Duplicate Payment Clarification",
    subject: "Clarification needed for potential duplicate payment {{payment_number}}",
    body: "Hello {{customer_name}},\n\nWe noticed a potential duplicate payment for {{payment_amount}} dated {{payment_date}}.\n\nPlease confirm whether this is a duplicate or if it applies to invoices: {{invoice_list}}.\n\nThank you,\n{{analyst_name}}",
    requiredVariables: ["customer_name", "payment_amount", "payment_date", "invoice_list"],
    defaultAttachments: ["payment"],
  },
  {
    id: "short-pay",
    name: "Short Pay / Underpayment",
    subject: "Short payment detected for {{payment_number}}",
    body: "Hello {{customer_name}},\n\nWe received payment {{payment_number}} for {{payment_amount}}. The expected amount differs by {{difference_amount}}.\n\nPlease provide remittance details or reason code ({{reason_code}}) for the short pay.\n\nThank you,\n{{analyst_name}}",
    requiredVariables: ["customer_name", "payment_number", "payment_amount", "difference_amount"],
    defaultAttachments: ["payment"],
  },
  {
    id: "unapplied-cash",
    name: "Unapplied Cash / Need Allocation",
    subject: "Unapplied cash for {{payment_number}}",
    body: "Hello {{customer_name}},\n\nWe received payment {{payment_number}} for {{payment_amount}} but need allocation details to apply it to invoices.\n\nPlease share the invoice list or remittance details.\n\nThank you,\n{{analyst_name}}",
    requiredVariables: ["customer_name", "payment_number", "payment_amount"],
    defaultAttachments: ["payment"],
  },
  {
    id: "invoice-dispute",
    name: "Invoice Dispute / Deduction Explanation Needed",
    subject: "Deduction explanation needed for {{payment_number}}",
    body: "Hello {{customer_name}},\n\nWe identified a deduction on payment {{payment_number}}. Please provide dispute or deduction details for invoices: {{invoice_list}}.\n\nThank you,\n{{analyst_name}}",
    requiredVariables: ["customer_name", "payment_number", "invoice_list"],
    defaultAttachments: ["payment"],
  },
  {
    id: "generic-followup",
    name: "Generic Follow-up (blank)",
    subject: "Follow-up on payment {{payment_number}}",
    body: "Hello {{customer_name}},\n\nWe are following up on payment {{payment_number}}. Please provide any additional details or remittance information to help us apply it.\n\nThank you,\n{{analyst_name}}",
    requiredVariables: ["customer_name", "payment_number"],
    defaultAttachments: [],
  },
];

const CONTACTS_STORE: CustomerContact[] = [
  {
    customerId: "CUST-ACME-LOG-001",
    customerName: "Acme Logistics",
    billToEmail: "billing@acmelogistics.com",
    arEmail: "ar@acmelogistics.com",
    remittanceEmail: "remit@acmelogistics.com",
    ccList: ["collections@acmelogistics.com"],
  },
  {
    customerId: "CUST-AMERGLASS-04050017234",
    customerName: "American Glass Dist.",
    billToEmail: "billing@amerglass.com",
    arEmail: "ar@amerglass.com",
    remittanceEmail: "remittance@amerglass.com",
    ccList: ["finance@amerglass.com"],
  },
  {
    customerId: "CUST-GLOBAL-RETAIL-001",
    customerName: "Global Retail Group",
    billToEmail: "billing@globalretail.com",
    arEmail: "ar@globalretail.com",
    remittanceEmail: "remit@globalretail.com",
    ccList: ["finance@globalretail.com"],
  },
  {
    customerId: "CUST-NS-2001",
    customerName: "Nova Services",
    billToEmail: "billing@novaservices.com",
    arEmail: "ar@novaservices.com",
    remittanceEmail: "remit@novaservices.com",
    ccList: ["collections@novaservices.com"],
  },
];

const VARIABLE_OPTIONS = [
  "{{customer_name}}",
  "{{payment_number}}",
  "{{payment_amount}}",
  "{{payment_date}}",
  "{{invoice_list}}",
  "{{difference_amount}}",
  "{{remittance_required}}",
  "{{reason_code}}",
  "{{analyst_name}}",
];

export default function PaymentsQueuePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [assignToUser, setAssignToUser] = useState<string>("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>("");
  const [jeType, setJeType] = useState<string>("");
  const [assignTo, setAssignTo] = useState<string>("");
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [density, setDensity] = useState<DensityMode>("compact");
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [activeSignalFilter, setActiveSignalFilter] = useState<string | null>(null);

  const payments = cashAppStore.getPayments();
  const stats = cashAppStore.getStats();
  const dataHealth = cashAppStore.getDataHealth();

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

  const selectedPayments = useMemo(() => {
    return payments.filter((payment) => selectedIds.includes(payment.id));
  }, [payments, selectedIds]);

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
    setRecipients: (values: string[]) => void
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const normalized = trimmed.replace(/,$/, "");
    if (!recipients.includes(normalized)) {
      setRecipients([...recipients, normalized]);
    }
  };

  const removeRecipient = (
    value: string,
    recipients: string[],
    setRecipients: (values: string[]) => void
  ) => {
    setRecipients(recipients.filter((recipient) => recipient !== value));
  };

  const buildInvoiceList = (paymentList: Payment[]) => {
    const refs = paymentList.flatMap(
      (payment) => payment.transformedLines?.map((line) => line.erpReference) || []
    );
    return Array.from(new Set(refs)).join(", ") || "N/A";
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
        // First, apply critical base filter (high priority or high value)
        const isCritical = payment.tags?.includes("High Priority") || payment.amount > 100000;
        if (!isCritical) {
          return false;
        }

        // Then apply specific critical sub-filters if active
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
      // Exception counts - using core type and reason codes
      missingRemittance: exceptionPayments.filter((p) => p.exception_core_type === "MISSING_REMIT")
        .length,
      invoiceIssue: exceptionPayments.filter((p) => p.exception_core_type === "INVOICE_ISSUE")
        .length,
      amountMismatch: exceptionPayments.filter((p) => p.exception_core_type === "AMOUNT_ISSUE")
        .length,
      multiEntity: exceptionPayments.filter((p) => p.exception_core_type === "INTERCOMPANY").length,
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

      // Critical counts - using tags and amount
      highValue: criticalPayments.filter((p) => p.amount > 100000).length,
      slaBreach: criticalPayments.filter((p) => p.tags?.includes("SLA Breach")).length,
      netSuiteSyncRisk: criticalPayments.filter((p) => p.tags?.includes("Sync Risk")).length,
      postingBlocked: criticalPayments.filter(
        (p) => p.postingHoldReasons && p.postingHoldReasons.length > 0
      ).length,
      customerEscalation: criticalPayments.filter((p) => p.tags?.includes("Escalated")).length,
      settlementRisk: criticalPayments.filter((p) => p.settlementStatus === "Failed").length,

      // Pending to Post counts - using postingRefs field
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

  const handleChipClick = (filter: string) => {
    setFilters((prev) => ({
      ...prev,
      status: filter === "critical" ? "all" : filter,
    }));
    if (filter === "AutoMatched") {
      setActiveSubFilter("exact");
    }
    // Track critical filter state
    setIsCriticalFilterActive(filter === "critical");
    // Clear contextual filter when switching status
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

  const getStatusBadge = (status: Payment["status"]) => {
    const variants: Record<Payment["status"], any> = {
      New: "outline",
      AutoMatched: "default",
      Exception: "destructive",
      SettlementPending: "secondary",
      PendingToPost: "secondary",
      Posted: "default",
      NonAR: "outline",
    };

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getMatchTypeBadge = (matchType?: string) => {
    if (!matchType) return null;

    const styles: Record<string, string> = {
      EXACT: "bg-green-100 text-green-800 border-green-200",
      TOLERANCE: "bg-blue-100 text-blue-800 border-blue-200",
      INTERCOMPANY: "bg-purple-100 text-purple-800 border-purple-200",
    };

    const labels: Record<string, string> = {
      EXACT: "Exact",
      TOLERANCE: "Tolerance",
      INTERCOMPANY: "Intercompany",
    };

    return (
      <Badge variant="outline" className={styles[matchType]}>
        {labels[matchType]}
      </Badge>
    );
  };

  const getBankMatchBadge = (payment: Payment) => {
    const status =
      payment.bank_match_status ||
      (payment.bank_match_ready === true
        ? "READY"
        : payment.bank_match_ready === false
          ? "RISK"
          : null);
    if (!status) {
      return <span className="text-xs text-slate-400">—</span>;
    }
    const styleMap: Record<string, string> = {
      READY: "bg-emerald-50 text-emerald-700 border-emerald-200",
      RISK: "bg-amber-50 text-amber-700 border-amber-200",
      PENDING: "bg-slate-100 text-slate-700 border-slate-300",
    };
    const label = status === "READY" ? "Ready" : status === "RISK" ? "Risk" : "Pending";
    return (
      <Badge variant="outline" className={`${styleMap[status] || styleMap.PENDING} text-xs`}>
        {label}
      </Badge>
    );
  };

  const getExceptionReasonBadge = (payment: Payment) => {
    const fallback = payment.exceptionType || payment.exception_core_type || null;
    const label = payment.exception_reason_label || payment.exception_reason_code || fallback;
    if (!label) return null;

    return (
      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        {label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="flex-1 overflow-auto">
        <div className="px-4 pt-2 pb-4">
          <KPISummaryStrip stats={stats} />

          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowFilterSidebar(!showFilterSidebar)}
                  className="h-[38px] border-slate-200 hover:bg-slate-100"
                >
                  {showFilterSidebar ? (
                    <PanelLeftClose className="w-4 h-4" />
                  ) : (
                    <PanelLeft className="w-4 h-4" />
                  )}
                </Button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search payments..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-9 w-64 h-[38px] bg-white"
                  />
                </div>
                <SegmentedControl
                  stats={stats}
                  activeSegment={activeSegment}
                  onSegmentChange={handleSegmentChange}
                  onClearFilter={handleClearSegmentFilter}
                />
              </div>
              <DensityToggle density={density} onDensityChange={setDensity} />
            </div>

            {/* Sub-filters row — compact, tightly coupled below the toolbar */}
            {(filters.status === "AutoMatched" ||
              filters.status === "Exception" ||
              isCriticalFilterActive ||
              filters.status === "PendingToPost" ||
              activeSignalFilter) && (
              <div className="flex items-center gap-2 pl-1">
                {activeSegment && (
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mr-0.5">
                    {activeSegment === "critical"
                      ? "Critical"
                      : filters.status === "AutoMatched"
                        ? "Match Type"
                        : filters.status === "Exception"
                          ? "Exception Type"
                          : "Post Status"}
                    :
                  </span>
                )}
                {filters.status === "AutoMatched" && (
                  <CashAppSubFilterChips
                    counts={subFilterCounts}
                    activeFilter={activeSubFilter}
                    onFilterClick={handleSubFilterClick}
                  />
                )}
                {filters.status === "Exception" && (
                  <CashAppContextualSubFilters
                    context="exceptions"
                    counts={contextualSubFilterCounts}
                    activeFilter={activeContextualFilter}
                    onFilterClick={handleContextualFilterClick}
                    onClearFilter={handleClearContextualFilter}
                  />
                )}
                {isCriticalFilterActive && (
                  <CashAppContextualSubFilters
                    context="critical"
                    counts={contextualSubFilterCounts}
                    activeFilter={activeContextualFilter}
                    onFilterClick={handleContextualFilterClick}
                    onClearFilter={handleClearContextualFilter}
                  />
                )}
                {filters.status === "PendingToPost" && (
                  <CashAppContextualSubFilters
                    context="pendingToPost"
                    counts={contextualSubFilterCounts}
                    activeFilter={activeContextualFilter}
                    onFilterClick={handleContextualFilterClick}
                    onClearFilter={handleClearContextualFilter}
                  />
                )}
                {activeSignalFilter && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs"
                  >
                    <span>Signal: {activeSignalFilter}</span>
                    <button onClick={handleClearSignalFilter} className="ml-0.5 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Active Filter Pills */}
          {(filters.bankAccount !== "all" ||
            filters.dateRange !== "all" ||
            filters.amountRange !== "all" ||
            filters.method !== "all" ||
            filters.remittanceSource !== "all" ||
            filters.assignedTo !== "all") && (
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="text-xs font-medium text-slate-500">Filters:</span>
              {filters.bankAccount !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200"
                >
                  Bank:{" "}
                  {filters.bankAccount === "us-bank"
                    ? "US Bank"
                    : filters.bankAccount === "chase"
                      ? "Chase"
                      : filters.bankAccount === "wells"
                        ? "Wells Fargo"
                        : filters.bankAccount === "boa"
                          ? "Bank of America"
                          : filters.bankAccount}
                  <button
                    onClick={() => setFilters({ ...filters, bankAccount: "all" })}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.dateRange !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200"
                >
                  Date:{" "}
                  {filters.dateRange === "today"
                    ? "Today"
                    : filters.dateRange === "week"
                      ? "This Week"
                      : filters.dateRange === "month"
                        ? "This Month"
                        : filters.dateRange === "quarter"
                          ? "This Quarter"
                          : filters.dateRange}
                  <button
                    onClick={() => setFilters({ ...filters, dateRange: "all" })}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.amountRange !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200"
                >
                  Amount: {filters.amountRange}
                  <button
                    onClick={() => setFilters({ ...filters, amountRange: "all" })}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.method !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200"
                >
                  Method: {filters.method}
                  <button
                    onClick={() => setFilters({ ...filters, method: "all" })}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.remittanceSource !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200"
                >
                  Source: {filters.remittanceSource}
                  <button
                    onClick={() => setFilters({ ...filters, remittanceSource: "all" })}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.assignedTo !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200"
                >
                  Assigned: {filters.assignedTo}
                  <button
                    onClick={() => setFilters({ ...filters, assignedTo: "all" })}
                    className="ml-0.5 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              <button
                onClick={() =>
                  setFilters({
                    ...filters,
                    bankAccount: "all",
                    dateRange: "all",
                    amountRange: "all",
                    method: "all",
                    remittanceSource: "all",
                    assignedTo: "all",
                  })
                }
                className="text-xs text-slate-500 hover:text-red-600 underline ml-1"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="flex gap-4">
            {showFilterSidebar && (
              <CashAppFilterRail filters={filters} onFilterChange={setFilters} />
            )}

            <div className="flex-1">
              {selectedIds.length > 0 && (
                <Card className="mb-4 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedIds.length} payment{selectedIds.length !== 1 ? "s" : ""} selected
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction("approve")}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve Auto-Matches
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction("reprocess")}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reprocess
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction("generate")}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Generate Output
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleBulkAction("email")}>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction("assign")}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Assign
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction("non-ar")}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Mark Non-AR
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction("ignore")}
                      >
                        <EyeOff className="w-4 h-4 mr-2" />
                        Ignore
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {filteredPayments.length === 0 ? (
                <CashAppEmptyState />
              ) : (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-slate-50 sticky top-0 z-10">
                        <tr>
                          <th
                            className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-left w-10`}
                          >
                            <Checkbox
                              checked={areAllOnPageSelected}
                              onCheckedChange={handleSelectAll}
                              className="border-slate-300"
                            />
                          </th>
                          <th
                            className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-left text-xs font-semibold text-slate-700 uppercase tracking-wider`}
                          >
                            Payment #
                          </th>
                          <th
                            className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-left text-xs font-semibold text-slate-700 uppercase tracking-wider`}
                          >
                            Date
                          </th>
                          <th
                            className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-left text-xs font-semibold text-slate-700 uppercase tracking-wider`}
                          >
                            Amount
                          </th>
                          <th
                            className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-left text-xs font-semibold text-slate-700 uppercase tracking-wider`}
                          >
                            Payer Name
                          </th>
                          <th
                            className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-left text-xs font-semibold text-slate-700 uppercase tracking-wider`}
                          >
                            Customer
                          </th>
                          <th
                            className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-left text-xs font-semibold text-slate-700 uppercase tracking-wider`}
                          >
                            Remittance
                          </th>
                          <th
                            className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-left text-xs font-semibold text-slate-700 uppercase tracking-wider`}
                          >
                            Status
                          </th>
                          <th
                            className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-left text-xs font-semibold text-slate-700 uppercase tracking-wider`}
                          >
                            Match Type
                          </th>
                          <th
                            className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-left text-xs font-semibold text-slate-700 uppercase tracking-wider`}
                          >
                            JE
                          </th>
                          <th
                            className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-left text-xs font-semibold text-slate-700 uppercase tracking-wider`}
                          >
                            Bank Match
                          </th>
                          <th
                            className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-left text-xs font-semibold text-slate-700 uppercase tracking-wider`}
                          >
                            Confidence
                          </th>
                          <th
                            className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-left text-xs font-semibold text-slate-700 uppercase tracking-wider`}
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {isLoading ? (
                          <TableSkeletonRows rowCount={pageSize} columnCount={13} />
                        ) : (
                          <>
                            {showSelectAllBanner && (
                              <tr className="bg-blue-50 border-b-2 border-blue-200">
                                <td
                                  colSpan={13}
                                  className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-blue-900">
                                      All{" "}
                                      <span className="font-semibold">
                                        {paginatedPayments.length}
                                      </span>{" "}
                                      payments on this page are selected.
                                    </span>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      onClick={handleSelectAllRecords}
                                      className="text-blue-700 hover:text-blue-900 font-semibold"
                                    >
                                      Select all {totalRecords} payments
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )}
                            {paginatedPayments.map((payment) => {
                              const isSelected = selectedIds.includes(payment.id);
                              const isHovered = hoveredRowId === payment.id;
                              const isCritical =
                                payment.tags?.includes("High Priority") || payment.amount > 100000;
                              return (
                                <tr
                                  key={payment.id}
                                  className={`
                                    relative cursor-pointer transition-all duration-150 ease-out
                                    ${isSelected ? "bg-blue-50" : isHovered ? "bg-slate-50" : "bg-white"}
                                    ${isCritical ? "border-l-2 border-l-red-500" : isSelected ? "border-l-2 border-l-blue-500" : ""}
                                  `}
                                  onMouseEnter={() => setHoveredRowId(payment.id)}
                                  onMouseLeave={() => setHoveredRowId(null)}
                                  onClick={(e) => {
                                    if ((e.target as HTMLElement).closest('input[type="checkbox"]'))
                                      return;
                                    if ((e.target as HTMLElement).closest("button")) return;
                                    handleRowClick(payment);
                                  }}
                                >
                                  <td
                                    className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {isCritical && (
                                        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                                      )}
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) =>
                                          handleSelectPayment(payment.id, checked as boolean)
                                        }
                                        onClick={(e) => e.stopPropagation()}
                                        className="border-slate-300"
                                      />
                                    </div>
                                  </td>
                                  <td
                                    className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-sm font-medium text-blue-600`}
                                  >
                                    {payment.paymentNumber}
                                  </td>
                                  <td
                                    className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-sm text-slate-700`}
                                  >
                                    {payment.date}
                                  </td>
                                  <td
                                    className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-sm font-semibold text-slate-900`}
                                  >
                                    {formatCurrency(payment.amount)}
                                  </td>
                                  <td
                                    className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-sm font-medium text-slate-800`}
                                  >
                                    {payment.payerNameRaw}
                                  </td>
                                  <td
                                    className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-sm text-slate-700`}
                                  >
                                    {payment.customerName}
                                  </td>
                                  <td
                                    className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"} text-sm text-slate-500`}
                                  >
                                    {payment.remittanceSource}
                                  </td>
                                  <td
                                    className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"}`}
                                  >
                                    <div className="flex flex-col gap-1">
                                      {getStatusBadge(
                                        payment.je_workflow_state === "POSTED"
                                          ? "Posted"
                                          : payment.status
                                      )}
                                      {payment.status === "Exception" &&
                                        getExceptionReasonBadge(payment)}
                                    </div>
                                  </td>
                                  <td
                                    className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"}`}
                                  >
                                    {payment.status === "AutoMatched" ? (
                                      <div className="flex items-center gap-1.5">
                                        {payment.match_type === "EXACT" && (
                                          <Target className="w-3.5 h-3.5 text-emerald-600" />
                                        )}
                                        {payment.match_type === "TOLERANCE" && (
                                          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                                        )}
                                        {payment.match_type === "INTERCOMPANY" && (
                                          <ArrowLeftRight className="w-3.5 h-3.5 text-amber-600" />
                                        )}
                                        {getMatchTypeBadge(payment.match_type)}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-slate-400">-</span>
                                    )}
                                  </td>
                                  <td
                                    className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"}`}
                                  >
                                    {payment.je_flow_state === "SUBMITTED" ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-amber-50 text-amber-700 border-amber-300 text-xs"
                                      >
                                        Pending
                                      </Badge>
                                    ) : payment.je_required ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-amber-50 text-amber-700 border-amber-300 text-xs"
                                      >
                                        <BookOpen className="w-3 h-3 mr-1" />
                                        JE
                                      </Badge>
                                    ) : (
                                      <span className="text-xs text-slate-400">-</span>
                                    )}
                                  </td>
                                  <td
                                    className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"}`}
                                  >
                                    {getBankMatchBadge(payment)}
                                  </td>
                                  <td
                                    className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <ConfidenceMeter confidence={payment.confidenceScore} />
                                      <WhyIndicator explainability={payment.explainability} />
                                    </div>
                                  </td>
                                  <td
                                    className={`${density === "compact" ? "px-3 py-2" : "px-4 py-3"}`}
                                  >
                                    <TableRowActions
                                      payment={payment}
                                      onViewDetails={handleRowClick}
                                      onAssign={handleAssignPayment}
                                      onSplit={handleSplitPayment}
                                      onCreateJE={handleCreateJE}
                                      onApprovePost={handleApprovePost}
                                      showPrimaryAction={
                                        payment.status === "AutoMatched" ||
                                        payment.status === "PendingToPost"
                                      }
                                      isHovered={isHovered}
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <PaymentQueuePagination
                    currentPage={validCurrentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalRecords={totalRecords}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    selectedCount={selectedIds.length}
                  />
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === "approve" && "Approve Auto-Matches"}
              {bulkAction === "reprocess" && "Reprocess Payments"}
              {bulkAction === "generate" && "Generate Output"}
              {bulkAction === "email" && "Send Email"}
              {bulkAction === "assign" && "Assign Payments"}
              {bulkAction === "non-ar" && "Mark as Non-AR"}
              {bulkAction === "ignore" && "Ignore Payments"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === "assign" ? (
                <div className="space-y-4">
                  <p>Select a user to assign {selectedIds.length} payments to:</p>
                  <Select value={assignToUser} onValueChange={setAssignToUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sarah Chen">Sarah Chen</SelectItem>
                      <SelectItem value="Michael Roberts">Michael Roberts</SelectItem>
                      <SelectItem value="Jessica Martinez">Jessica Martinez</SelectItem>
                      <SelectItem value="David Kim">David Kim</SelectItem>
                      <SelectItem value="Emily Taylor">Emily Taylor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                `Are you sure you want to perform this action on ${selectedIds.length} selected payment${selectedIds.length !== 1 ? "s" : ""}?`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBulkAction}
              disabled={bulkAction === "assign" && !assignToUser}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEmailComposer} onOpenChange={setShowEmailComposer}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              {emailMode === "single"
                ? `Payment ${selectedPayments[0]?.paymentNumber || ""}`
                : `${selectedPayments.length} payments selected`}{" "}
              • Template-driven email with auto-filled contacts
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600">Template</label>
                  <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_TEMPLATES.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {emailMode === "bulk" && (
                  <div>
                    <label className="text-xs text-gray-600">Recipient Scope</label>
                    <Select
                      value={recipientScope}
                      onValueChange={(value) => setRecipientScope(value as RecipientScope)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="payment">One email per payment</SelectItem>
                        <SelectItem value="customer">One email per customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-600">Subject</label>
                <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
              </div>

              <div>
                <label className="text-xs text-gray-600">To</label>
                <div className="flex flex-wrap items-center gap-2 border rounded-md px-2 py-1">
                  {toRecipients.map((email) => (
                    <Badge key={email} variant="secondary" className="flex items-center gap-1">
                      {email}
                      <button onClick={() => removeRecipient(email, toRecipients, setToRecipients)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  <input
                    className="flex-1 text-sm p-1 focus:outline-none"
                    placeholder="Add email..."
                    value={toInput}
                    onChange={(e) => setToInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addRecipient(toInput, toRecipients, setToRecipients);
                        setToInput("");
                      }
                    }}
                  />
                </div>
                {previewPayment &&
                  toRecipients.length === 0 &&
                  !getContactForCustomer(previewPayment.customerId) && (
                    <div className="text-xs text-amber-600 mt-2">
                      No contact found — add email manually
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="Add contact email"
                          value={manualContactInputs[previewPayment.customerId] || ""}
                          onChange={(e) =>
                            setManualContactInputs((prev) => ({
                              ...prev,
                              [previewPayment.customerId]: e.target.value,
                            }))
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const manual = manualContactInputs[previewPayment.customerId];
                            if (manual) {
                              setToRecipients([manual]);
                            }
                          }}
                        >
                          Add Contact
                        </Button>
                      </div>
                    </div>
                  )}
              </div>

              <div>
                <label className="text-xs text-gray-600">Cc</label>
                <div className="flex flex-wrap items-center gap-2 border rounded-md px-2 py-1">
                  {ccRecipients.map((email) => (
                    <Badge key={email} variant="secondary" className="flex items-center gap-1">
                      {email}
                      <button onClick={() => removeRecipient(email, ccRecipients, setCcRecipients)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  <input
                    className="flex-1 text-sm p-1 focus:outline-none"
                    placeholder="Add cc..."
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addRecipient(ccInput, ccRecipients, setCcRecipients);
                        setCcInput("");
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-600">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={saveRecipients}
                    onCheckedChange={(checked) => setSaveRecipients(Boolean(checked))}
                  />
                  Save these recipients as Customer Contacts
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={includeInternalCc}
                    onCheckedChange={(checked) => setIncludeInternalCc(Boolean(checked))}
                  />
                  Include internal CC
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-600">Body</label>
                  <Select onValueChange={(value) => setEmailBody((prev) => `${prev}\n${value}`)}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Insert variable" />
                    </SelectTrigger>
                    <SelectContent>
                      {VARIABLE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <textarea
                  className="w-full min-h-[220px] border rounded-md p-3 text-sm"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-gray-600">
                <Checkbox
                  checked={allowPersonalization}
                  onCheckedChange={(checked) => setAllowPersonalization(Boolean(checked))}
                />
                Allow minor per-email personalization (recommended)
              </label>
              {!allowPersonalization && (
                <div className="text-xs text-amber-600">
                  Sending the same static content to all recipients.
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-gray-900">Preview</div>
                  {emailMode === "bulk" && (
                    <Select
                      value={selectedPreviewPaymentId || ""}
                      onValueChange={setSelectedPreviewPaymentId}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Preview for" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedPayments.map((payment) => (
                          <SelectItem key={payment.id} value={payment.id}>
                            {payment.paymentNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {previewPayment ? (
                  <div className="text-xs text-gray-600 whitespace-pre-wrap">
                    <div className="font-semibold text-gray-900 mb-2">{emailSubject}</div>
                    {
                      resolveTemplateBody(
                        recipientScope === "customer"
                          ? emailGroups.find(
                              (group) => group.customerId === previewPayment.customerId
                            )?.payments || [previewPayment]
                          : [previewPayment],
                        allowPersonalization
                          ? previewPayment
                          : emailGroups[0]?.payments[0] || previewPayment
                      ).body
                    }
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">Select a payment to preview</div>
                )}
              </Card>

              <Card className="p-4">
                <div className="text-sm font-semibold text-gray-900 mb-3">Attachments</div>
                <div className="space-y-2">
                  {attachmentOptions.length === 0 && (
                    <div className="text-xs text-gray-500">No attachments available</div>
                  )}
                  {attachmentOptions.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <Checkbox
                        checked={attachmentSelections[option.id] || false}
                        onCheckedChange={(checked) =>
                          setAttachmentSelections((prev) => ({
                            ...prev,
                            [option.id]: Boolean(checked),
                          }))
                        }
                      />
                      <Paperclip className="w-4 h-4 text-gray-400" />
                      {option.label}
                    </label>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    const id = `attachment-${Date.now()}`;
                    setAttachmentOptions((prev) => [
                      ...prev,
                      { id, label: "Additional Attachment" },
                    ]);
                    setAttachmentSelections((prev) => ({ ...prev, [id]: true }));
                  }}
                >
                  Add attachment
                </Button>
              </Card>

              <Card className="p-4 space-y-2">
                <div className="text-sm font-semibold text-gray-900">Evidence Links</div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <Checkbox
                    checked={includePaymentSummaryLink}
                    onCheckedChange={(checked) => setIncludePaymentSummaryLink(Boolean(checked))}
                  />
                  Include payment summary link
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <Checkbox
                    checked={includeRemittanceUploadLink}
                    onCheckedChange={(checked) => setIncludeRemittanceUploadLink(Boolean(checked))}
                  />
                  Include remittance upload link
                </label>
              </Card>

              <Card className="p-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">Send Summary</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Emails to send: {emailCount}</div>
                  <div>Customers: {uniqueCustomersCount}</div>
                  <div>Missing contacts: {missingContactCount}</div>
                  <div>Template used: {getTemplateById(selectedTemplateId).name}</div>
                </div>
                {missingContactCount > 0 && (
                  <div className="mt-3 space-y-2">
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <Checkbox
                        checked={skipMissingContacts}
                        onCheckedChange={(checked) => setSkipMissingContacts(Boolean(checked))}
                      />
                      Skip missing-contact records
                    </label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.success("Missing-contact list downloaded")}
                    >
                      Download missing-contact list
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailComposer(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEmailOutbox((prev) => [
                  ...prev,
                  {
                    id: `draft-${Date.now()}`,
                    paymentId: selectedPayments[0]?.id,
                    customerId: selectedPayments[0]?.customerId,
                    templateId: selectedTemplateId,
                    to: toRecipients,
                    cc: ccRecipients,
                    subject: emailSubject,
                    body: emailBody,
                    status: "Queued",
                    timestamp: new Date().toISOString(),
                  },
                ]);
                toast.success("Draft saved");
              }}
            >
              Save Draft
            </Button>
            <Button onClick={handleSendEmails}>
              <Send className="w-4 h-4 mr-2" />
              {emailMode === "single" ? "Send Email" : "Send Emails"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={showPaymentDrawer} onOpenChange={setShowPaymentDrawer}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-4xl overflow-y-auto p-0"
          onClick={(e) => e.stopPropagation()}
        >
          {selectedPayment && (
            <div className="h-full flex flex-col">
              <SheetHeader className="px-6 py-4 border-b bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <SheetTitle className="text-xl">{selectedPayment.paymentNumber}</SheetTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={selectedPayment.status === "Exception" ? "destructive" : "default"}
                      >
                        {selectedPayment.status}
                      </Badge>
                      {selectedPayment.exceptionType && (
                        <Badge variant="outline">{selectedPayment.exceptionType}</Badge>
                      )}
                      {selectedPayment.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Mappings
                    </Button>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedPayment.originalPaymentFileUrl} download>
                        <Download className="w-4 h-4 mr-2" />
                        Original File
                      </a>
                    </Button>
                    {selectedPayment.linkedRemittanceFileUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedPayment.linkedRemittanceFileUrl} download>
                          <FileText className="w-4 h-4 mr-2" />
                          Remittance File
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-auto">
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Payment Number</div>
                            <div className="text-sm font-medium">
                              {selectedPayment.paymentNumber}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Payment Header ID</div>
                            <div className="text-sm font-medium">
                              {selectedPayment.paymentHeaderId}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Payment Amount</div>
                            <div className="text-sm font-semibold">
                              {formatCurrency(selectedPayment.amount)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Payment Date</div>
                            <div className="text-sm font-medium">{selectedPayment.date}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Customer Name</div>
                            <div className="text-sm font-medium">
                              {selectedPayment.customerName}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Customer Number</div>
                            <div className="text-sm font-medium">
                              {selectedPayment.customerNumber}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">
                              Identification Criteria
                            </div>
                            <div className="text-sm font-medium">
                              {selectedPayment.identificationCriteria}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Exception Status</div>
                            <div className="text-sm font-medium">
                              {selectedPayment.status === "Exception" ? "Exception" : "Success"}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Payer Name</div>
                            <div className="text-sm font-medium">
                              {selectedPayment.payerNameRaw}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 mb-1">Remittance Source</div>
                            <div className="text-sm font-medium">
                              {selectedPayment.remittanceSource}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-sm text-gray-600 mb-1">Notes</div>
                            <div className="text-sm font-medium">
                              {selectedPayment.memoReferenceRaw}
                            </div>
                          </div>
                        </div>
                      </Card>

                      <Tabs defaultValue="transformed" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="received">Received Data</TabsTrigger>
                          <TabsTrigger value="transformed">Transformed Data</TabsTrigger>
                        </TabsList>

                        <TabsContent value="received" className="mt-4">
                          <Card className="p-6">
                            <h3 className="text-sm font-semibold mb-4">Raw Payment Data</h3>
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-gray-600 mb-1">Memo/Reference</div>
                                <div className="text-sm font-mono bg-gray-50 p-2 rounded">
                                  {selectedPayment.memoReferenceRaw}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-600 mb-1">Payer</div>
                                <div className="text-sm font-mono bg-gray-50 p-2 rounded">
                                  {selectedPayment.payerNameRaw}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-600 mb-1">Bank Account</div>
                                <div className="text-sm font-mono bg-gray-50 p-2 rounded">
                                  {selectedPayment.bankAccount}
                                </div>
                              </div>
                              {selectedPayment.linkedRemittanceFileUrl && (
                                <div>
                                  <div className="text-xs text-gray-600 mb-1">Remittance Data</div>
                                  <div className="text-sm bg-blue-50 p-3 rounded border border-blue-200">
                                    <div className="font-medium mb-2">
                                      Remittance Advice Attached
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      Source: {selectedPayment.remittanceSource}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </Card>
                        </TabsContent>

                        <TabsContent value="transformed" className="mt-4">
                          <Card className="p-6">
                            <div className="mb-4">
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                  <div className="text-xs text-gray-600 mb-1">Payment Amount</div>
                                  <div className="text-lg font-semibold">
                                    {formatCurrency(selectedPayment.amount)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-600 mb-1">Net Amount</div>
                                  <div className="text-lg font-semibold">
                                    {formatCurrency(
                                      selectedPayment.transformedLines.reduce(
                                        (sum, line) => sum + line.paymentAmount,
                                        0
                                      )
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-600 mb-1">Difference</div>
                                  <div className="text-lg font-semibold text-green-600">
                                    {formatCurrency(
                                      selectedPayment.amount -
                                        selectedPayment.transformedLines.reduce(
                                          (sum, line) => sum + line.paymentAmount,
                                          0
                                        )
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <Separator className="my-4" />

                            <h3 className="text-sm font-semibold mb-3">Posting Lines</h3>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                      ERP Reference
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                      Reference Field
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">
                                      Discount Amount
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">
                                      Payment Amount
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                      Reason Code
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                      Reason Description
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                      Customer #
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {selectedPayment.transformedLines.map((line) => (
                                    <tr key={line.id} className="hover:bg-gray-50">
                                      <td className="px-3 py-2">{line.erpReference}</td>
                                      <td className="px-3 py-2 text-gray-600">
                                        {line.referenceField}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        {line.discountAmount < 0 && (
                                          <span className="text-red-600 font-medium">
                                            {formatCurrency(line.discountAmount)}
                                          </span>
                                        )}
                                        {line.discountAmount >= 0 &&
                                          formatCurrency(line.discountAmount)}
                                      </td>
                                      <td className="px-3 py-2 text-right font-medium">
                                        {formatCurrency(line.paymentAmount)}
                                      </td>
                                      <td className="px-3 py-2">{line.reasonCode}</td>
                                      <td className="px-3 py-2 text-gray-600">
                                        {line.reasonDescription}
                                      </td>
                                      <td className="px-3 py-2">{line.customerNumber}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </Card>
                        </TabsContent>
                      </Tabs>

                      <Card className="p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Activity Timeline
                        </h2>
                        <div className="space-y-4">
                          {selectedPayment.activityLog.map((log, index) => (
                            <div key={log.id} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                                {index !== selectedPayment.activityLog.length - 1 && (
                                  <div className="w-0.5 h-full bg-gray-200 mt-1"></div>
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="font-medium text-sm">{log.action}</div>
                                    <div className="text-xs text-gray-600 mt-1">{log.details}</div>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatDate(log.timestamp)}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">by {log.user}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>

                    <div className="space-y-6">
                      <Card className="p-6 sticky top-8">
                        <div className="flex items-start gap-3 mb-4">
                          <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-sm mb-1">AI Recommendation</h3>
                            <p className="text-sm text-gray-700">
                              {selectedPayment.aiRecommendation}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Confidence Score</span>
                            <span className="text-sm font-semibold">
                              {selectedPayment.confidenceScore}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                selectedPayment.confidenceScore >= 80
                                  ? "bg-green-500"
                                  : selectedPayment.confidenceScore >= 50
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${selectedPayment.confidenceScore}%` }}
                            ></div>
                          </div>
                        </div>

                        {selectedPayment.aiRationale && (
                          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded mb-4">
                            <div className="font-medium mb-1">Why?</div>
                            {selectedPayment.aiRationale}
                          </div>
                        )}

                        {selectedPayment.warnings && selectedPayment.warnings.length > 0 && (
                          <div className="mb-4">
                            {selectedPayment.warnings.map((warning, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-2 text-xs text-orange-700 bg-orange-50 p-2 rounded mb-2"
                              >
                                <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                <span>{warning}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <Separator className="my-4" />

                        <div className="space-y-2">
                          <Button className="w-full" onClick={() => handleAction("approve-post")}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve & Post
                          </Button>
                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => handleAction("approve")}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => handleAction("edit-match")}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Match
                          </Button>
                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => handleAction("missing-remittance")}
                          >
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Mark Missing Remittance
                          </Button>
                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => handleAction("duplicate")}
                          >
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Duplicate Payment
                          </Button>
                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => handleAction("je-type")}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Select JE Type
                          </Button>
                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => handleAction("assign")}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Assign / Tag
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={showActionModal} onOpenChange={setShowActionModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {currentAction === "je-type" && "Select JE Type"}
              {currentAction === "assign" && "Assign Payment"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {currentAction === "je-type" && (
                <div className="space-y-4">
                  <p>Select the journal entry type for this payment:</p>
                  <Select value={jeType} onValueChange={setJeType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select JE type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Cash Receipt</SelectItem>
                      <SelectItem value="unapplied">Unapplied Cash</SelectItem>
                      <SelectItem value="advance">Customer Advance</SelectItem>
                      <SelectItem value="intercompany">Intercompany</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {currentAction === "assign" && (
                <div className="space-y-4">
                  <p>Assign this payment to a team member:</p>
                  <Select value={assignTo} onValueChange={setAssignTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sarah Chen">Sarah Chen</SelectItem>
                      <SelectItem value="Michael Roberts">Michael Roberts</SelectItem>
                      <SelectItem value="Jessica Martinez">Jessica Martinez</SelectItem>
                      <SelectItem value="David Kim">David Kim</SelectItem>
                      <SelectItem value="Emily Taylor">Emily Taylor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeAction()}
              disabled={
                (currentAction === "je-type" && !jeType) ||
                (currentAction === "assign" && !assignTo)
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkActionBar
        selectedCount={selectedIds.length}
        onApprovePost={handleBulkApprovePost}
        onAssign={handleBulkAssign}
        onExport={handleBulkExport}
        onMarkReviewed={handleBulkMarkReviewed}
        onClearSelection={() => setSelectedIds([])}
        isVisible={selectedIds.length > 0}
      />
    </div>
  );
}
