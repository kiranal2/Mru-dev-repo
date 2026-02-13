"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { cashAppStore } from "@/lib/cash-app-store";
import { Payment } from "@/lib/cash-app-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Edit,
  Settings,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Tag,
  UserPlus,
  Lightbulb,
  Clock,
  Search,
  MoreHorizontal,
  Mail,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { WhatHappenedTimeline } from "@/components/cash-app/WhatHappenedTimeline";
import { WhyEvidenceCard } from "@/components/cash-app/WhyEvidenceCard";
import { RoutingDebugCard } from "@/components/cash-app/RoutingDebugCard";
import { CreateJEModal } from "@/components/cash-app/CreateJEModal";
import { JEBuildModal } from "@/components/cash-app/JEBuildModal";
import { timelineStore } from "@/lib/timeline-store";
import { useAuth } from "@/lib/auth-context";
import { JEDraft, JEDraftTemplateRecord } from "@/lib/cash-app-types";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

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

export default function PaymentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const paymentId = params?.id as string;
  const { user } = useAuth();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>("");
  const [selectedJeTypeCode, setSelectedJeTypeCode] = useState<string>("");
  const [assignTo, setAssignTo] = useState<string>("");
  const [postingGate, setPostingGate] = useState<{ allowed: boolean; reason?: string }>({
    allowed: true,
  });
  const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);
  const [showCreateJEModal, setShowCreateJEModal] = useState(false);
  const [showJEBuildModal, setShowJEBuildModal] = useState(false);
  const [returnToJEBuild, setReturnToJEBuild] = useState(false);

  // Email composer state
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(EMAIL_TEMPLATES[0].id);
  const [emailSubject, setEmailSubject] = useState<string>(EMAIL_TEMPLATES[0].subject);
  const [emailBody, setEmailBody] = useState<string>(EMAIL_TEMPLATES[0].body);
  const [toRecipients, setToRecipients] = useState<string[]>([]);
  const [ccRecipients, setCcRecipients] = useState<string[]>([]);
  const [toInput, setToInput] = useState("");
  const [ccInput, setCcInput] = useState("");
  const [saveRecipients, setSaveRecipients] = useState(false);
  const [includeInternalCc, setIncludeInternalCc] = useState(true);
  const [includePaymentSummaryLink, setIncludePaymentSummaryLink] = useState(true);
  const [includeRemittanceUploadLink, setIncludeRemittanceUploadLink] = useState(false);
  const [attachmentOptions, setAttachmentOptions] = useState<AttachmentOption[]>([]);
  const [attachmentSelections, setAttachmentSelections] = useState<Record<string, boolean>>({});
  const [customerContacts, setCustomerContacts] = useState<CustomerContact[]>(CONTACTS_STORE);

  useEffect(() => {
    if (paymentId) {
      const foundPayment = cashAppStore.getPaymentById(paymentId);
      setPayment(foundPayment || null);
      if (foundPayment) {
        const gateResult = cashAppStore.canPostToERP(foundPayment.id);
        setPostingGate(gateResult);
      }
    }
  }, [paymentId]);

  useEffect(() => {
    if (!payment) return;
    if (payment.je_required) {
      appendActivityTimelineEntry(
        {
          event: "JE Required",
          detail: "Manual JE required for this payment",
          actor: "System",
          ts: new Date().toISOString(),
        },
        { ensureEvent: "JE Required" }
      );
      addSimpleTimelineEvent("JE Required", "Manual JE required for this payment", "System");
    }
  }, [payment]);

  if (!payment) {
    return (
      <div className="p-8">
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment not found</h2>
          <p className="text-gray-600 mb-6">The payment you are looking for does not exist.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const handleAction = (action: string) => {
    setCurrentAction(action);
    if (action === "je-type") {
      const existingJeTypeCode =
        payment.je_type_code ||
        jeTypeOptions.find((option) => option.label === payment.je_type_label)?.code;
      const defaultJeTypeCode = existingJeTypeCode || getDefaultJeTypeCode(payment);
      setSelectedJeTypeCode(defaultJeTypeCode);
      appendActivityTimelineEntry({
        event: "JE Type Modal Opened",
        detail: "User started JE type selection",
        actor: "User",
        ts: new Date().toISOString(),
      });
      addSimpleTimelineEvent("JE Type Modal Opened", "User started JE type selection", "User");
      setShowActionModal(true);
      return;
    }
    if (action === "assign") {
      setShowActionModal(true);
      return;
    }
    executeAction(action);
  };

  const addTimelineEvent = (
    eventTitle: string,
    eventType: any,
    reason: string,
    confidence: number,
    artifacts: any[] = [],
    statusTag: any = "Success"
  ) => {
    timelineStore.addEvent({
      id: `${payment.id}-${Date.now()}`,
      paymentId: payment.id,
      ts: new Date().toISOString(),
      eventType,
      eventTitle,
      actor: "Analyst",
      reason,
      confidence,
      artifacts,
      statusTag,
    });
    setTimelineRefreshKey((prev) => prev + 1);
  };

  const jeTypeOptions = [
    { code: "UNAPPLIED", label: "Unapplied Cash" },
    { code: "ADVANCE", label: "Customer Advance" },
    { code: "BAD_DEBT", label: "Bad Debt Recovery" },
    { code: "TEST_DEP", label: "Test Deposit" },
    { code: "INTERCO", label: "Intercompany" },
    { code: "NON_AR", label: "Non-AR Cash" },
  ];

  const getJeTypeLabel = (value?: string | null) => {
    if (!value) return null;
    const match = jeTypeOptions.find((option) => option.code === value || option.label === value);
    return match ? match.label : value;
  };

  const getDefaultJeTypeCode = (target: Payment) => {
    const aiText = `${target.aiRecommendation || ""} ${target.aiRationale || ""}`.toLowerCase();
    if (aiText.match(/bad debt|write[- ]?off/)) {
      return "BAD_DEBT";
    }
    const hasIntercompanyReason = Boolean(
      target.intercompany_flag ||
        (target.je_required &&
          [target.exception_reason_code, target.exception_reason_label].some(
            (value) =>
              value?.toLowerCase().includes("intercompany") ||
              value?.toLowerCase().includes("interco")
          ))
    );
    if (hasIntercompanyReason) {
      return "INTERCO";
    }
    return "UNAPPLIED";
  };

  function appendActivityTimelineEntry(
    entry: { event: string; detail?: string; actor: "System" | "User"; ts: string },
    options?: { ensureEvent?: string }
  ) {
    if (!payment) return;
    const currentPayment = cashAppStore.getPaymentById(payment.id);
    if (!currentPayment) return;
    const activityTimeline = [...(currentPayment.activity_timeline || [])];
    if (
      options?.ensureEvent &&
      activityTimeline.some((item) => item.event === options.ensureEvent)
    ) {
      return;
    }
    activityTimeline.push(entry);
    cashAppStore.updatePayment(payment.id, { activity_timeline: activityTimeline });
    setPayment({ ...currentPayment, activity_timeline: activityTimeline });
  }

  function addSimpleTimelineEvent(eventTitle: string, detail: string, actor: "System" | "User") {
    if (!payment) return;
    timelineStore.initializePaymentTimeline(payment.id);
    const existing = timelineStore.getEvents(payment.id);
    if (existing.some((event) => event.eventTitle === eventTitle && event.reason === detail)) {
      return;
    }
    timelineStore.addEvent({
      id: `${payment.id}-${Date.now()}`,
      paymentId: payment.id,
      ts: new Date().toISOString(),
      eventType: "Admin",
      eventTitle,
      actor,
      reason: detail,
      confidence: 100,
      artifacts: [],
      statusTag: "Success",
    });
    setTimelineRefreshKey((prev) => prev + 1);
  }

  const executeAction = (action?: string) => {
    const actionToExecute = action || currentAction;
    if (actionToExecute === "approve-post" && payment.settlement_state === "PENDING") {
      toast.error("Final settlement not confirmed. Posting blocked.");
      return;
    }
    const actionMap: Record<string, { status?: Payment["status"]; message: string }> = {
      "approve-post": { status: "Posted", message: "Payment approved and posted" },
      approve: { status: "PendingToPost", message: "Payment approved" },
      "missing-remittance": { message: "Marked as missing remittance" },
      duplicate: { message: "Marked as duplicate" },
    };

    if (actionToExecute === "assign" && assignTo) {
      cashAppStore.updatePayment(payment.id, { assignedTo: assignTo });
      cashAppStore.addActivityLog(payment.id, {
        timestamp: new Date().toISOString(),
        user: "Current User",
        action: "Assigned",
        details: `Assigned to ${assignTo}`,
      });

      addTimelineEvent(
        "Payment Assigned",
        "Admin",
        `Analyst manually assigned payment to ${assignTo} for review and processing`,
        100,
        [],
        "Success"
      );

      toast.success(`Assigned to ${assignTo}`);
      setPayment({ ...payment, assignedTo: assignTo });
      setShowActionModal(false);
    } else if (actionToExecute === "je-type" && selectedJeTypeCode) {
      const selectedLabel = getJeTypeLabel(selectedJeTypeCode) || selectedJeTypeCode;
      cashAppStore.updatePayment(payment.id, {
        je_type_code: selectedJeTypeCode,
        je_type_label: selectedLabel,
        je_flow_state: "TYPE_SELECTED",
        je_type: selectedJeTypeCode,
      });

      cashAppStore.addActivityLog(payment.id, {
        timestamp: new Date().toISOString(),
        user: "Current User",
        action: "JE Type Selected",
        details: `Selected JE type: ${selectedLabel}`,
      });

      appendActivityTimelineEntry({
        event: "JE Type Selected",
        detail: `Selected: ${selectedLabel}`,
        actor: "User",
        ts: new Date().toISOString(),
      });
      addSimpleTimelineEvent("JE Type Selected", `Selected: ${selectedLabel}`, "User");

      toast.success(`JE type set to ${selectedLabel}`);
      const updatedPayment = cashAppStore.getPaymentById(payment.id);
      if (updatedPayment) setPayment(updatedPayment);
      if (returnToJEBuild) {
        setShowJEBuildModal(true);
        setReturnToJEBuild(false);
      }
      setShowActionModal(false);
    } else if (actionToExecute === "edit-match") {
      addTimelineEvent(
        "Match Edit Initiated",
        "Match",
        "Analyst opened match editing interface to manually adjust invoice allocations",
        100,
        [],
        "Success"
      );
      toast.info("Edit match functionality coming soon");
    } else {
      const mappedAction = actionMap[actionToExecute];
      if (mappedAction) {
        const updates: Partial<Payment> = {};
        if (mappedAction.status) updates.status = mappedAction.status;

        if (actionToExecute === "missing-remittance") {
          updates.exceptionType = "MissingRemittance";
          updates.status = "Exception";

          addTimelineEvent(
            "Exception Raised",
            "Exception",
            "Analyst flagged payment as missing remittance documentation, requires follow-up with customer",
            100,
            [],
            "Warning"
          );
        } else if (actionToExecute === "duplicate") {
          updates.exceptionType = "DuplicateSuspected";
          updates.status = "Exception";

          addTimelineEvent(
            "Duplicate Suspected",
            "Exception",
            "Analyst identified potential duplicate payment based on amount and timing, requires investigation",
            95,
            [],
            "Warning"
          );
        } else if (actionToExecute === "approve-post") {
          addTimelineEvent(
            "Posted to ERP",
            "Posting",
            "Analyst approved payment and successfully posted journal entry to ERP system",
            100,
            [
              {
                artifactId: "je-posted-001",
                artifactType: "JEDraft" as const,
                label: "JE Posted",
                metadata: {
                  jeDraftLines: [
                    {
                      account: "1010",
                      debit: payment.amount,
                      credit: 0,
                      description: "Cash Receipt",
                    },
                    { account: "1200", debit: 0, credit: payment.amount, description: "AR Clear" },
                  ],
                },
              },
            ],
            "Success"
          );
        } else if (actionToExecute === "approve") {
          addTimelineEvent(
            "Payment Approved",
            "Posting",
            "Analyst reviewed and approved payment for posting, moved to posting queue",
            100,
            [],
            "Success"
          );
        }

        cashAppStore.updatePayment(payment.id, updates);
        cashAppStore.addActivityLog(payment.id, {
          timestamp: new Date().toISOString(),
          user: "Current User",
          action: actionToExecute,
          details: mappedAction.message,
        });

        toast.success(mappedAction.message);
        const updatedPayment = cashAppStore.getPaymentById(payment.id);
        if (updatedPayment) setPayment(updatedPayment);
      }
    }
  };

  const handleJESubmit = (jeTypeValue: string, jeDraft: JEDraft) => {
    if (!payment) return;

    cashAppStore.updatePayment(payment.id, {
      je_type: jeTypeValue,
      je_workflow_state: "SUBMITTED",
      je_draft: jeDraft,
    });

    cashAppStore.addActivityLog(payment.id, {
      timestamp: new Date().toISOString(),
      user: "Current User",
      action: "JE Draft Created",
      details: "Template populated (Bad Debt Recovery)",
    });

    cashAppStore.addActivityLog(payment.id, {
      timestamp: new Date().toISOString(),
      user: "Current User",
      action: "JE Submitted",
      details: "Submitted for approval",
    });

    addTimelineEvent(
      "JE Draft Created",
      "Posting",
      "Template populated (Bad Debt Recovery)",
      100,
      [
        {
          artifactId: "je-draft-bd",
          artifactType: "JEDraft" as const,
          label: "JE Draft",
          metadata: {},
        },
      ],
      "Success"
    );

    addTimelineEvent("JE Submitted", "Posting", "Submitted for approval", 100, [], "Success");

    toast.success("Journal Entry submitted for approval");
    const updatedPayment = cashAppStore.getPaymentById(payment.id);
    if (updatedPayment) setPayment(updatedPayment);
  };

  const handleJEApprove = () => {
    if (!payment) return;

    cashAppStore.updatePayment(payment.id, {
      je_workflow_state: "POSTED",
      status: "Posted",
    });

    cashAppStore.addActivityLog(payment.id, {
      timestamp: new Date().toISOString(),
      user: "Current User",
      action: "JE Approved",
      details: "Approved by User",
    });

    cashAppStore.addActivityLog(payment.id, {
      timestamp: new Date().toISOString(),
      user: "System",
      action: "JE Posted to NetSuite",
      details: "Posted successfully (mock JE# JE-2026-4451)",
    });

    addTimelineEvent("JE Approved", "Posting", "Approved by User", 100, [], "Success");

    addTimelineEvent(
      "JE Posted to NetSuite",
      "Posting",
      "Posted successfully (mock JE# JE-2026-4451)",
      100,
      [
        {
          artifactId: "je-posted-ns",
          artifactType: "JEDraft" as const,
          label: "NetSuite JE# JE-2026-4451",
          metadata: {},
        },
      ],
      "Success"
    );

    toast.success("JE approved and posted to NetSuite");
    const updatedPayment = cashAppStore.getPaymentById(payment.id);
    if (updatedPayment) setPayment(updatedPayment);
  };

  const handleJEReject = () => {
    if (!payment) return;

    cashAppStore.updatePayment(payment.id, {
      je_workflow_state: "REJECTED",
    });

    cashAppStore.addActivityLog(payment.id, {
      timestamp: new Date().toISOString(),
      user: "Current User",
      action: "JE Rejected",
      details: "Requires rework",
    });

    addTimelineEvent("JE Rejected", "Exception", "Requires rework", 100, [], "Warning");

    toast.error("JE rejected - requires rework");
    const updatedPayment = cashAppStore.getPaymentById(payment.id);
    if (updatedPayment) setPayment(updatedPayment);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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

  // Email composer helpers
  const getTemplateById = (templateId: string) =>
    EMAIL_TEMPLATES.find((t) => t.id === templateId) || EMAIL_TEMPLATES[0];

  const getContactForCustomer = (customerId: string) =>
    customerContacts.find((c) => c.customerId === customerId);

  const buildAttachmentOptions = (p: Payment): AttachmentOption[] => {
    const options: AttachmentOption[] = [];
    if (p.linkedRemittanceFileUrl) options.push({ id: "remittance", label: "Remittance PDF" });
    if (p.originalPaymentFileUrl) options.push({ id: "payment", label: "Payment File" });
    if (p.transformedLines?.length) options.push({ id: "invoice", label: "Invoice PDFs" });
    return options;
  };

  const addRecipient = (
    value: string,
    recipients: string[],
    setRecipientsFn: (v: string[]) => void
  ) => {
    const normalized = value.trim().replace(/,$/, "");
    if (normalized && !recipients.includes(normalized))
      setRecipientsFn([...recipients, normalized]);
  };

  const removeRecipient = (
    value: string,
    recipients: string[],
    setRecipientsFn: (v: string[]) => void
  ) => {
    setRecipientsFn(recipients.filter((r) => r !== value));
  };

  const buildInvoiceList = () => {
    if (!payment) return "N/A";
    const refs = payment.transformedLines?.map((line) => line.erpReference) || [];
    return Array.from(new Set(refs)).join(", ") || "N/A";
  };

  const resolveTemplateBody = () => {
    if (!payment) return "";
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
      "{{invoice_list}}": buildInvoiceList(),
      "{{difference_amount}}": formatCurrency(difference),
      "{{remittance_required}}": payment.exceptionType === "MissingRemittance" ? "Yes" : "No",
      "{{reason_code}}": reasonCode,
      "{{analyst_name}}": "Current User",
    };
    let body = emailBody;
    Object.entries(variables).forEach(([key, val]) => {
      body = body.replaceAll(key, val);
    });
    if (includePaymentSummaryLink || includeRemittanceUploadLink) {
      body += "\n\n---\n";
      if (includePaymentSummaryLink)
        body += `Payment summary: https://meeru.ai/payments/${payment.paymentNumber}\n`;
      if (includeRemittanceUploadLink)
        body += `Remittance upload: https://meeru.ai/remittances/upload\n`;
    }
    return body;
  };

  const openEmailComposer = () => {
    if (!payment) return;
    const template = getTemplateById(selectedTemplateId);
    const attachments = buildAttachmentOptions(payment);
    setEmailSubject(template.subject);
    setEmailBody(template.body);
    setAttachmentOptions(attachments);
    setAttachmentSelections(
      attachments.reduce(
        (acc, opt) => {
          acc[opt.id] = template.defaultAttachments?.includes(opt.id) ?? false;
          return acc;
        },
        {} as Record<string, boolean>
      )
    );
    const contact = getContactForCustomer(payment.customerId);
    const defaultTo = contact?.remittanceEmail || contact?.arEmail || contact?.billToEmail || "";
    setToRecipients(defaultTo ? [defaultTo] : []);
    setCcRecipients(contact?.ccList || []);
    setToInput("");
    setCcInput("");
    setSaveRecipients(false);
    setIncludeInternalCc(true);
    setIncludePaymentSummaryLink(true);
    setIncludeRemittanceUploadLink(false);
    setShowEmailComposer(true);
    cashAppStore.addActivityLog(payment.id, {
      timestamp: new Date().toISOString(),
      user: "System",
      action: "Email Draft Opened",
      details: "Email composer opened",
    });
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = getTemplateById(templateId);
    setEmailSubject(template.subject);
    setEmailBody(template.body);
  };

  const handleSendEmail = () => {
    if (!payment) return;
    const contact = getContactForCustomer(payment.customerId);
    const toList = toRecipients.length > 0 ? toRecipients : [];
    const ccList = [
      ...ccRecipients,
      ...(contact?.ccList || []),
      ...(includeInternalCc ? [INTERNAL_CC_ALIAS] : []),
    ].filter((v, i, self) => v && self.indexOf(v) === i);
    if (toList.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }
    cashAppStore.addActivityLog(payment.id, {
      timestamp: new Date().toISOString(),
      user: "System",
      action: "Email Sent",
      details: `Template ${getTemplateById(selectedTemplateId).name} sent to ${toList.join(", ")}`,
    });
    if (saveRecipients && contact) {
      setCustomerContacts((prev) =>
        prev.map((c) =>
          c.customerId === contact.customerId ? { ...c, arEmail: toList[0], ccList } : c
        )
      );
    }
    toast.success("Email queued successfully");
    setShowEmailComposer(false);
  };

  const resolvedJeTypeLabel = getJeTypeLabel(
    payment.je_type_label || payment.je_type_code || payment.je_type
  );
  const requiresJeTypeSelection = Boolean(payment.je_required && !resolvedJeTypeLabel);
  const approvePostDisabled = !postingGate.allowed || requiresJeTypeSelection;
  const approvePostReason = !postingGate.allowed
    ? postingGate.reason
    : requiresJeTypeSelection
      ? "Select JE Type required"
      : undefined;

  const handleOpenJEBuild = () => {
    if (!resolvedJeTypeLabel) {
      handleAction("je-type");
      return;
    }
    appendActivityTimelineEntry({
      event: "JE Builder Opened",
      detail: `JE Type: ${resolvedJeTypeLabel}`,
      actor: "User",
      ts: new Date().toISOString(),
    });
    addSimpleTimelineEvent("JE Builder Opened", `JE Type: ${resolvedJeTypeLabel}`, "User");
    setShowJEBuildModal(true);
  };

  const handleChangeJeType = () => {
    setShowJEBuildModal(false);
    setReturnToJEBuild(true);
    handleAction("je-type");
  };

  const handleSaveJEDraft = (draft: JEDraftTemplateRecord) => {
    cashAppStore.updatePayment(payment.id, {
      je_draft: draft,
      je_flow_state: "DRAFTED",
      pending_post_state: "APPROVAL_NEEDED",
    });
    appendActivityTimelineEntry({
      event: "JE Draft Saved",
      detail: `${draft.template_label} draft saved`,
      actor: "User",
      ts: new Date().toISOString(),
    });
    addSimpleTimelineEvent("JE Draft Saved", `${draft.template_label} draft saved`, "User");
    const updated = cashAppStore.getPaymentById(payment.id);
    if (updated) setPayment(updated);
    setShowJEBuildModal(false);
  };

  const handleSubmitJE = (draft: JEDraftTemplateRecord) => {
    cashAppStore.updatePayment(payment.id, {
      je_draft: draft,
      je_flow_state: "SUBMITTED",
      pending_post_state: "JE_APPROVAL_PENDING",
      suggestedAction: "Await Approval",
    });
    appendActivityTimelineEntry({
      event: "JE Submitted for Approval",
      detail: `${draft.template_label} submitted`,
      actor: "User",
      ts: new Date().toISOString(),
    });
    addSimpleTimelineEvent(
      "JE Submitted for Approval",
      `${draft.template_label} submitted`,
      "User"
    );
    const updated = cashAppStore.getPaymentById(payment.id);
    if (updated) setPayment(updated);
    setShowJEBuildModal(false);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="flex-1 overflow-auto">
        <div className="px-6 pt-4 pb-6">
          <div className="mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Queue
            </Button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 mb-1">
                  {payment.paymentNumber}
                </h1>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      payment.status === "Exception"
                        ? "destructive"
                        : payment.status === "Posted" || payment.je_workflow_state === "POSTED"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {payment.je_workflow_state === "POSTED"
                      ? "Resolved (JE Posted)"
                      : payment.status}
                  </Badge>
                  {payment.exceptionType && (
                    <Badge variant="outline">{payment.exceptionType}</Badge>
                  )}
                  {payment.exception_reason_label && (
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-700 border-amber-300"
                    >
                      {payment.exception_reason_label}
                    </Badge>
                  )}
                  {resolvedJeTypeLabel && (
                    <Badge
                      variant="outline"
                      className="bg-slate-50 text-slate-700 border-slate-300"
                    >
                      JE: {resolvedJeTypeLabel}
                    </Badge>
                  )}
                  {payment.je_flow_state === "SUBMITTED" && (
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-700 border-amber-200"
                    >
                      JE Approval Pending
                    </Badge>
                  )}
                  {payment.tags.map((tag) => (
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
                <Button variant="outline" size="sm" asChild>
                  <a href={payment.originalPaymentFileUrl} download>
                    <Download className="w-4 h-4 mr-2" />
                    Original File
                  </a>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Mappings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </DropdownMenuItem>
                    {payment.linkedRemittanceFileUrl && (
                      <DropdownMenuItem>
                        <FileText className="w-4 h-4 mr-2" />
                        Remittance File
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-5">
                <h2 className="text-base font-semibold mb-3">Payment Details</h2>

                {/* Identity Section */}
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">
                  Identity
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <div>
                    <div className="text-xs text-gray-500">Header ID</div>
                    <div className="text-sm font-medium">{payment.paymentHeaderId}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Payment Date</div>
                    <div className="text-sm font-medium">{payment.date}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Customer</div>
                    <div className="text-sm font-medium">{payment.customerName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Customer #</div>
                    <div className="text-sm font-medium">{payment.customerNumber}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Payer</div>
                    <div className="text-sm font-medium">{payment.payerNameRaw}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Remittance Source</div>
                    <div className="text-sm font-medium">{payment.remittanceSource}</div>
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Financial Section */}
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">
                  Financial
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <div>
                    <div className="text-xs text-gray-500">Amount</div>
                    <div className="text-sm font-semibold">{formatCurrency(payment.amount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Identification</div>
                    <div className="text-sm font-medium">{payment.identificationCriteria}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Status</div>
                    <div className="text-sm font-medium">
                      {payment.status === "Exception" ? "Exception" : "Success"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Method</div>
                    <div className="text-sm font-medium">{payment.method || "—"}</div>
                  </div>
                </div>

                {/* Notes & References Section */}
                {(payment.memoReferenceRaw ||
                  payment.linked_invoice_ref ||
                  payment.je_required) && (
                  <>
                    <Separator className="my-3" />
                    <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">
                      Notes & References
                    </div>
                    <div className="space-y-2.5">
                      {payment.memoReferenceRaw && (
                        <div>
                          <div className="text-xs text-gray-500">Notes</div>
                          <div className="text-sm font-medium">{payment.memoReferenceRaw}</div>
                        </div>
                      )}
                      {payment.linked_invoice_ref && (
                        <div>
                          <div className="text-xs text-gray-500">NetSuite Invoice</div>
                          <div className="text-sm font-medium">
                            {payment.linked_invoice_ref}
                            {payment.linked_invoice_status && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-xs bg-amber-50 text-amber-700 border-amber-300"
                              >
                                {payment.linked_invoice_status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      {payment.je_required && (
                        <div>
                          <div className="text-xs text-gray-500">Resolution</div>
                          <div className="text-sm font-medium text-blue-700">
                            Journal Entry Required ({resolvedJeTypeLabel || "Select JE Type"})
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
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
                          {payment.memoReferenceRaw}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Payer</div>
                        <div className="text-sm font-mono bg-gray-50 p-2 rounded">
                          {payment.payerNameRaw}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Bank Account</div>
                        <div className="text-sm font-mono bg-gray-50 p-2 rounded">
                          {payment.bankAccount}
                        </div>
                      </div>
                      {payment.linkedRemittanceFileUrl && (
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Remittance Data</div>
                          <div className="text-sm bg-blue-50 p-3 rounded border border-blue-200">
                            <div className="font-medium mb-2">Remittance Advice Attached</div>
                            <div className="text-xs text-gray-600">
                              Source: {payment.remittanceSource}
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
                            {formatCurrency(payment.amount)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Net Amount</div>
                          <div className="text-lg font-semibold">
                            {formatCurrency(
                              payment.transformedLines.reduce(
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
                              payment.amount -
                                payment.transformedLines.reduce(
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
                          {payment.transformedLines.map((line) => (
                            <tr key={line.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2">{line.erpReference}</td>
                              <td className="px-3 py-2 text-gray-600">{line.referenceField}</td>
                              <td className="px-3 py-2 text-right">
                                {line.discountAmount < 0 && (
                                  <span className="text-red-600 font-medium">
                                    {formatCurrency(line.discountAmount)}
                                  </span>
                                )}
                                {line.discountAmount >= 0 && formatCurrency(line.discountAmount)}
                              </td>
                              <td className="px-3 py-2 text-right font-medium">
                                {formatCurrency(line.paymentAmount)}
                              </td>
                              <td className="px-3 py-2">{line.reasonCode}</td>
                              <td className="px-3 py-2 text-gray-600">{line.reasonDescription}</td>
                              <td className="px-3 py-2">{line.customerNumber}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>

              <WhatHappenedTimeline
                paymentId={payment.id}
                key={timelineRefreshKey}
                onRefresh={() => {}}
              />
            </div>

            <div className="space-y-4 sticky top-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
              <Card className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm mb-1">AI Recommendation</h3>
                    <p className="text-sm text-gray-700">{payment.aiRecommendation}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Confidence Score</span>
                    <span className="text-sm font-semibold">{payment.confidenceScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        payment.confidenceScore >= 80
                          ? "bg-green-500"
                          : payment.confidenceScore >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${payment.confidenceScore}%` }}
                    ></div>
                  </div>
                </div>

                {payment.warnings && payment.warnings.length > 0 && (
                  <div className="mb-4">
                    {payment.warnings.map((warning, index) => (
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            className="w-full"
                            onClick={() => handleAction("approve-post")}
                            disabled={approvePostDisabled}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve & Post
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {approvePostReason && (
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="text-xs">
                            <div className="font-semibold mb-1">Posting Blocked</div>
                            <div>{approvePostReason}</div>
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  {!postingGate.allowed && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span>{postingGate.reason}</span>
                    </div>
                  )}
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleAction("approve")}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="w-full" variant="outline">
                        <MoreHorizontal className="w-4 h-4 mr-2" />
                        More Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(
                            `/workbench/order-to-cash/cash-application/matching-studio?paymentId=${payment.id}`
                          )
                        }
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Investigate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEmailComposer()}>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleAction("missing-remittance")}>
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Missing Remittance
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction("duplicate")}>
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Duplicate Payment
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          if (resolvedJeTypeLabel) {
                            handleOpenJEBuild();
                          } else {
                            handleAction("je-type");
                          }
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {resolvedJeTypeLabel ? "Build JE" : "Select JE Type"}
                      </DropdownMenuItem>
                      {payment.je_required &&
                        (payment.je_workflow_state === "NONE" ||
                          payment.je_workflow_state === "DRAFT" ||
                          payment.je_workflow_state === "REJECTED") && (
                          <DropdownMenuItem onClick={() => setShowCreateJEModal(true)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Create JE
                          </DropdownMenuItem>
                        )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleAction("assign")}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Assign / Tag
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {payment.je_workflow_state === "SUBMITTED" && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-xs font-semibold text-amber-800 mb-3">
                      JE Approval Required
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleJEApprove} className="flex-1">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approve JE
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleJEReject} className="flex-1">
                        Reject JE
                      </Button>
                    </div>
                  </div>
                )}

                {payment.je_required && payment.je_workflow_state !== "NONE" && (
                  <div className="mt-4 text-xs text-gray-600 bg-gray-50 p-3 rounded">
                    <div className="font-medium mb-1">JE Workflow Status</div>
                    <Badge
                      variant="outline"
                      className={
                        payment.je_workflow_state === "POSTED"
                          ? "bg-green-50 text-green-700 border-green-300"
                          : payment.je_workflow_state === "SUBMITTED"
                            ? "bg-blue-50 text-blue-700 border-blue-300"
                            : payment.je_workflow_state === "REJECTED"
                              ? "bg-red-50 text-red-700 border-red-300"
                              : "bg-gray-50 text-gray-700 border-gray-300"
                      }
                    >
                      {payment.je_workflow_state}
                    </Badge>
                    {resolvedJeTypeLabel && (
                      <div className="mt-2 text-gray-500">Type: {resolvedJeTypeLabel}</div>
                    )}
                  </div>
                )}
              </Card>

              <WhyEvidenceCard explainability={payment.explainability} />

              {user?.role === "ADMIN" && <RoutingDebugCard routing={payment.routing} />}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={showActionModal} onOpenChange={setShowActionModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {currentAction === "je-type" && "Select JE Type"}
              {currentAction === "assign" && "Assign Payment"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {currentAction === "je-type" && "Select the journal entry type for this payment."}
              {currentAction === "assign" && "Assign this payment to a team member."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {currentAction === "je-type" && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="je-type" className="text-sm font-medium">
                  JE Type
                </Label>
                <Select value={selectedJeTypeCode} onValueChange={setSelectedJeTypeCode}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select JE type" />
                  </SelectTrigger>
                  <SelectContent>
                    {jeTypeOptions.map((option) => (
                      <SelectItem key={option.code} value={option.code}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedJeTypeCode === "INTERCO" && (
                  <p className="text-xs text-slate-500 mt-2">
                    Intercompany JE will be generated from entity split rules.
                  </p>
                )}
              </div>
            </div>
          )}
          {currentAction === "assign" && (
            <div className="space-y-4">
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
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeAction()}
              disabled={
                (currentAction === "je-type" && !selectedJeTypeCode) ||
                (currentAction === "assign" && !assignTo)
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateJEModal
        open={showCreateJEModal}
        onOpenChange={setShowCreateJEModal}
        payment={payment}
        onSubmit={handleJESubmit}
      />

      {resolvedJeTypeLabel && (
        <JEBuildModal
          open={showJEBuildModal}
          onOpenChange={setShowJEBuildModal}
          payment={payment}
          jeTypeCode={payment.je_type_code || payment.je_type || "UNAPPLIED"}
          jeTypeLabel={resolvedJeTypeLabel}
          onChangeType={handleChangeJeType}
          onSaveDraft={handleSaveJEDraft}
          onSubmit={handleSubmitJE}
        />
      )}

      {/* Email Composer Modal */}
      <Dialog open={showEmailComposer} onOpenChange={setShowEmailComposer}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Payment {payment.paymentNumber} • {payment.customerName} • Template-driven email with
              auto-filled contacts
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column — Form */}
            <div className="space-y-4">
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
                {toRecipients.length === 0 && !getContactForCustomer(payment.customerId) && (
                  <div className="text-xs text-amber-600 mt-1">
                    No contact found for this customer — add email manually
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
                  Save recipients as Customer Contacts
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
            </div>

            {/* Right column — Preview & Attachments */}
            <div className="space-y-4">
              <Card className="p-4">
                <div className="text-sm font-semibold text-gray-900 mb-3">Preview</div>
                <div className="text-xs text-gray-600 whitespace-pre-wrap">
                  <div className="font-semibold text-gray-900 mb-2">{emailSubject}</div>
                  {resolveTemplateBody()}
                </div>
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
                  <div>Payment: {payment.paymentNumber}</div>
                  <div>Customer: {payment.customerName}</div>
                  <div>
                    To: {toRecipients.length > 0 ? toRecipients.join(", ") : "(no recipients)"}
                  </div>
                  <div>Template: {getTemplateById(selectedTemplateId).name}</div>
                </div>
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
                toast.success("Draft saved");
              }}
            >
              Save Draft
            </Button>
            <Button onClick={handleSendEmail}>
              <Send className="w-4 h-4 mr-2" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
