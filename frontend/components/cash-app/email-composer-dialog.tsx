"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  X,
  Paperclip,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Payment } from "@/lib/cash-app-types";
import type { RecipientScope, AttachmentOption } from "@/app/(main)/workbench/order-to-cash/cash-application/payments/types";
import { EMAIL_TEMPLATES, VARIABLE_OPTIONS } from "@/app/(main)/workbench/order-to-cash/cash-application/payments/constants";

interface EmailComposerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailMode: "bulk" | "single";
  selectedPayments: Payment[];
  selectedTemplateId: string;
  onTemplateChange: (templateId: string) => void;
  recipientScope: RecipientScope;
  onRecipientScopeChange: (scope: RecipientScope) => void;
  emailSubject: string;
  onEmailSubjectChange: (subject: string) => void;
  emailBody: string;
  onEmailBodyChange: (body: string) => void;
  toRecipients: string[];
  onToRecipientsChange: (recipients: string[]) => void;
  ccRecipients: string[];
  onCcRecipientsChange: (recipients: string[]) => void;
  toInput: string;
  onToInputChange: (value: string) => void;
  ccInput: string;
  onCcInputChange: (value: string) => void;
  saveRecipients: boolean;
  onSaveRecipientsChange: (value: boolean) => void;
  includeInternalCc: boolean;
  onIncludeInternalCcChange: (value: boolean) => void;
  allowPersonalization: boolean;
  onAllowPersonalizationChange: (value: boolean) => void;
  selectedPreviewPaymentId: string | null;
  onSelectedPreviewPaymentIdChange: (id: string | null) => void;
  attachmentOptions: AttachmentOption[];
  onAttachmentOptionsChange: (options: AttachmentOption[]) => void;
  attachmentSelections: Record<string, boolean>;
  onAttachmentSelectionsChange: (selections: Record<string, boolean>) => void;
  includePaymentSummaryLink: boolean;
  onIncludePaymentSummaryLinkChange: (value: boolean) => void;
  includeRemittanceUploadLink: boolean;
  onIncludeRemittanceUploadLinkChange: (value: boolean) => void;
  skipMissingContacts: boolean;
  onSkipMissingContactsChange: (value: boolean) => void;
  manualContactInputs: Record<string, string>;
  onManualContactInputsChange: (inputs: Record<string, string>) => void;
  emailOutbox: any[];
  onEmailOutboxChange: (outbox: any[]) => void;
  emailGroups: { id: string; customerId: string; customerName: string; payments: Payment[] }[];
  uniqueCustomersCount: number;
  emailCount: number;
  missingContactCount: number;
  previewPayment: Payment | undefined;
  addRecipient: (value: string, recipients: string[], setRecipients: (values: string[]) => void) => void;
  removeRecipient: (value: string, recipients: string[], setRecipients: (values: string[]) => void) => void;
  getTemplateById: (templateId: string) => { id: string; name: string; subject: string; body: string; requiredVariables: string[]; defaultAttachments?: string[] };
  getContactForCustomer: (customerId: string) => { customerId: string; customerName: string; billToEmail?: string; arEmail?: string; remittanceEmail?: string; portalUserEmail?: string; ccList?: string[] } | undefined;
  resolveTemplateBody: (paymentList: Payment[], payment: Payment) => { body: string; primary: Payment; variables: Record<string, string> };
  onSendEmails: () => void;
}

export function EmailComposerDialog({
  open,
  onOpenChange,
  emailMode,
  selectedPayments,
  selectedTemplateId,
  onTemplateChange,
  recipientScope,
  onRecipientScopeChange,
  emailSubject,
  onEmailSubjectChange,
  emailBody,
  onEmailBodyChange,
  toRecipients,
  onToRecipientsChange,
  ccRecipients,
  onCcRecipientsChange,
  toInput,
  onToInputChange,
  ccInput,
  onCcInputChange,
  saveRecipients,
  onSaveRecipientsChange,
  includeInternalCc,
  onIncludeInternalCcChange,
  allowPersonalization,
  onAllowPersonalizationChange,
  selectedPreviewPaymentId,
  onSelectedPreviewPaymentIdChange,
  attachmentOptions,
  onAttachmentOptionsChange,
  attachmentSelections,
  onAttachmentSelectionsChange,
  includePaymentSummaryLink,
  onIncludePaymentSummaryLinkChange,
  includeRemittanceUploadLink,
  onIncludeRemittanceUploadLinkChange,
  skipMissingContacts,
  onSkipMissingContactsChange,
  manualContactInputs,
  onManualContactInputsChange,
  emailOutbox,
  onEmailOutboxChange,
  emailGroups,
  uniqueCustomersCount,
  emailCount,
  missingContactCount,
  previewPayment,
  addRecipient,
  removeRecipient,
  getTemplateById,
  getContactForCustomer,
  resolveTemplateBody,
  onSendEmails,
}: EmailComposerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                <Select value={selectedTemplateId} onValueChange={onTemplateChange}>
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
                    onValueChange={(value) => onRecipientScopeChange(value as RecipientScope)}
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
              <Input value={emailSubject} onChange={(e) => onEmailSubjectChange(e.target.value)} />
            </div>

            <div>
              <label className="text-xs text-gray-600">To</label>
              <div className="flex flex-wrap items-center gap-2 border rounded-md px-2 py-1">
                {toRecipients.map((email) => (
                  <Badge key={email} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <button onClick={() => removeRecipient(email, toRecipients, onToRecipientsChange)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  className="flex-1 text-sm p-1 focus:outline-none"
                  placeholder="Add email..."
                  value={toInput}
                  onChange={(e) => onToInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addRecipient(toInput, toRecipients, onToRecipientsChange);
                      onToInputChange("");
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
                          onManualContactInputsChange({
                            ...manualContactInputs,
                            [previewPayment.customerId]: e.target.value,
                          })
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const manual = manualContactInputs[previewPayment.customerId];
                          if (manual) {
                            onToRecipientsChange([manual]);
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
                    <button onClick={() => removeRecipient(email, ccRecipients, onCcRecipientsChange)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  className="flex-1 text-sm p-1 focus:outline-none"
                  placeholder="Add cc..."
                  value={ccInput}
                  onChange={(e) => onCcInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addRecipient(ccInput, ccRecipients, onCcRecipientsChange);
                      onCcInputChange("");
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-600">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={saveRecipients}
                  onCheckedChange={(checked) => onSaveRecipientsChange(Boolean(checked))}
                />
                Save these recipients as Customer Contacts
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={includeInternalCc}
                  onCheckedChange={(checked) => onIncludeInternalCcChange(Boolean(checked))}
                />
                Include internal CC
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-600">Body</label>
                <Select onValueChange={(value) => onEmailBodyChange(`${emailBody}\n${value}`)}>
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
                onChange={(e) => onEmailBodyChange(e.target.value)}
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-600">
              <Checkbox
                checked={allowPersonalization}
                onCheckedChange={(checked) => onAllowPersonalizationChange(Boolean(checked))}
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
                    onValueChange={onSelectedPreviewPaymentIdChange}
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
                        onAttachmentSelectionsChange({
                          ...attachmentSelections,
                          [option.id]: Boolean(checked),
                        })
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
                  onAttachmentOptionsChange([
                    ...attachmentOptions,
                    { id, label: "Additional Attachment" },
                  ]);
                  onAttachmentSelectionsChange({ ...attachmentSelections, [id]: true });
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
                  onCheckedChange={(checked) => onIncludePaymentSummaryLinkChange(Boolean(checked))}
                />
                Include payment summary link
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <Checkbox
                  checked={includeRemittanceUploadLink}
                  onCheckedChange={(checked) => onIncludeRemittanceUploadLinkChange(Boolean(checked))}
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
                      onCheckedChange={(checked) => onSkipMissingContactsChange(Boolean(checked))}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onEmailOutboxChange([
                ...emailOutbox,
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
          <Button onClick={onSendEmails}>
            <Send className="w-4 h-4 mr-2" />
            {emailMode === "single" ? "Send Email" : "Send Emails"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
