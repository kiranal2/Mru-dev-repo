"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { cashAppStore } from "@/lib/cash-app-store";
import { useCashPayment } from "@/hooks/data/use-cash-payments";
import { Payment } from "@/lib/cash-app-types";
import { JEDraft, JEDraftTemplateRecord } from "@/lib/cash-app-types";
import { timelineStore } from "@/lib/timeline-store";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { AttachmentOption, CustomerContact } from "../types";
import {
  EMAIL_TEMPLATES,
  CONTACTS_STORE,
  INTERNAL_CC_ALIAS,
  JE_TYPE_OPTIONS,
} from "../constants";

export function usePaymentDetail() {
  const router = useRouter();
  const params = useParams();
  const paymentId = params?.id as string;
  const { user } = useAuth();

  // Bridge: use data hook for fetch lifecycle, store for rich Payment objects
  const { loading: dataLoading, error: dataError, refetch: refetchPayment } = useCashPayment(paymentId);
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

  // --- Helpers ---

  const getJeTypeLabel = (value?: string | null) => {
    if (!value) return null;
    const match = JE_TYPE_OPTIONS.find((option) => option.code === value || option.label === value);
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

  const addTimelineEvent = (
    eventTitle: string,
    eventType: any,
    reason: string,
    confidence: number,
    artifacts: any[] = [],
    statusTag: any = "Success"
  ) => {
    if (!payment) return;
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

  // --- Actions ---

  const executeAction = (action?: string) => {
    if (!payment) return;
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

  const handleAction = (action: string) => {
    setCurrentAction(action);
    if (action === "je-type") {
      const existingJeTypeCode =
        payment?.je_type_code ||
        JE_TYPE_OPTIONS.find((option) => option.label === payment?.je_type_label)?.code;
      const defaultJeTypeCode = existingJeTypeCode || (payment ? getDefaultJeTypeCode(payment) : "UNAPPLIED");
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

  const handleOpenJEBuild = () => {
    if (!payment) return;
    const label = resolvedJeTypeLabel;
    if (!label) {
      handleAction("je-type");
      return;
    }
    appendActivityTimelineEntry({
      event: "JE Builder Opened",
      detail: `JE Type: ${label}`,
      actor: "User",
      ts: new Date().toISOString(),
    });
    addSimpleTimelineEvent("JE Builder Opened", `JE Type: ${label}`, "User");
    setShowJEBuildModal(true);
  };

  const handleChangeJeType = () => {
    setShowJEBuildModal(false);
    setReturnToJEBuild(true);
    handleAction("je-type");
  };

  const handleSaveJEDraft = (draft: JEDraftTemplateRecord) => {
    if (!payment) return;
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
    if (!payment) return;
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

  // --- Formatters ---

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

  // --- Email helpers ---

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

  // --- Computed values ---

  const resolvedJeTypeLabel = getJeTypeLabel(
    payment?.je_type_label || payment?.je_type_code || payment?.je_type
  );
  const requiresJeTypeSelection = Boolean(payment?.je_required && !resolvedJeTypeLabel);
  const approvePostDisabled = !postingGate.allowed || requiresJeTypeSelection;
  const approvePostReason = !postingGate.allowed
    ? postingGate.reason
    : requiresJeTypeSelection
      ? "Select JE Type required"
      : undefined;

  return {
    // Core state
    router,
    user,
    payment,
    dataLoading,
    dataError,
    refetchPayment,
    timelineRefreshKey,

    // Modal state
    showActionModal,
    setShowActionModal,
    currentAction,
    selectedJeTypeCode,
    setSelectedJeTypeCode,
    assignTo,
    setAssignTo,
    showCreateJEModal,
    setShowCreateJEModal,
    showJEBuildModal,
    setShowJEBuildModal,

    // Email composer state
    showEmailComposer,
    setShowEmailComposer,
    selectedTemplateId,
    emailSubject,
    setEmailSubject,
    emailBody,
    setEmailBody,
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
    includePaymentSummaryLink,
    setIncludePaymentSummaryLink,
    includeRemittanceUploadLink,
    setIncludeRemittanceUploadLink,
    attachmentOptions,
    setAttachmentOptions,
    attachmentSelections,
    setAttachmentSelections,

    // Computed
    resolvedJeTypeLabel,
    postingGate,
    approvePostDisabled,
    approvePostReason,

    // Actions
    handleAction,
    executeAction,
    handleJESubmit,
    handleJEApprove,
    handleJEReject,
    handleOpenJEBuild,
    handleChangeJeType,
    handleSaveJEDraft,
    handleSubmitJE,

    // Email actions
    openEmailComposer,
    handleTemplateChange,
    handleSendEmail,
    addRecipient,
    removeRecipient,
    resolveTemplateBody,
    getContactForCustomer,
    getTemplateById,

    // Formatters
    formatCurrency,
    formatDate,
  };
}
