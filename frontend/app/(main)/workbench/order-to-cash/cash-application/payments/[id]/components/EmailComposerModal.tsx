"use client";

import { Payment } from "@/lib/cash-app-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Paperclip, Send, X } from "lucide-react";
import { toast } from "sonner";
import { AttachmentOption } from "../types";
import { EMAIL_TEMPLATES, VARIABLE_OPTIONS } from "../constants";

interface EmailComposerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment;
  selectedTemplateId: string;
  emailSubject: string;
  onEmailSubjectChange: (value: string) => void;
  emailBody: string;
  onEmailBodyChange: (value: string) => void;
  toRecipients: string[];
  setToRecipients: (value: string[]) => void;
  ccRecipients: string[];
  setCcRecipients: (value: string[]) => void;
  toInput: string;
  setToInput: (value: string) => void;
  ccInput: string;
  setCcInput: (value: string) => void;
  saveRecipients: boolean;
  setSaveRecipients: (value: boolean) => void;
  includeInternalCc: boolean;
  setIncludeInternalCc: (value: boolean) => void;
  includePaymentSummaryLink: boolean;
  setIncludePaymentSummaryLink: (value: boolean) => void;
  includeRemittanceUploadLink: boolean;
  setIncludeRemittanceUploadLink: (value: boolean) => void;
  attachmentOptions: AttachmentOption[];
  setAttachmentOptions: (value: AttachmentOption[] | ((prev: AttachmentOption[]) => AttachmentOption[])) => void;
  attachmentSelections: Record<string, boolean>;
  setAttachmentSelections: (value: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  hasContactForCustomer: boolean;
  onTemplateChange: (templateId: string) => void;
  onSendEmail: () => void;
  addRecipient: (value: string, recipients: string[], setFn: (v: string[]) => void) => void;
  removeRecipient: (value: string, recipients: string[], setFn: (v: string[]) => void) => void;
  resolvedBody: string;
  getTemplateName: (templateId: string) => string;
}

export function EmailComposerModal({
  open,
  onOpenChange,
  payment,
  selectedTemplateId,
  emailSubject,
  onEmailSubjectChange,
  emailBody,
  onEmailBodyChange,
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
  hasContactForCustomer,
  onTemplateChange,
  onSendEmail,
  addRecipient,
  removeRecipient,
  resolvedBody,
  getTemplateName,
}: EmailComposerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>
            Payment {payment.paymentNumber} &bull; {payment.customerName} &bull; Template-driven email with
            auto-filled contacts
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Form */}
          <div className="space-y-4">
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
              {toRecipients.length === 0 && !hasContactForCustomer && (
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
          </div>

          {/* Right column - Preview & Attachments */}
          <div className="space-y-4">
            <Card className="p-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">Preview</div>
              <div className="text-xs text-gray-600 whitespace-pre-wrap">
                <div className="font-semibold text-gray-900 mb-2">{emailSubject}</div>
                {resolvedBody}
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
                        setAttachmentSelections((prev: Record<string, boolean>) => ({
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
                  setAttachmentOptions((prev: AttachmentOption[]) => [
                    ...prev,
                    { id, label: "Additional Attachment" },
                  ]);
                  setAttachmentSelections((prev: Record<string, boolean>) => ({ ...prev, [id]: true }));
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
                <div>Template: {getTemplateName(selectedTemplateId)}</div>
              </div>
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
              toast.success("Draft saved");
            }}
          >
            Save Draft
          </Button>
          <Button onClick={onSendEmail}>
            <Send className="w-4 h-4 mr-2" />
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
