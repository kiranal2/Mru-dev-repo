export type RecipientScope = "payment" | "customer";
export type EmailMode = "bulk" | "single";

export type CustomerContact = {
  customerId: string;
  customerName: string;
  billToEmail?: string;
  arEmail?: string;
  remittanceEmail?: string;
  portalUserEmail?: string;
  ccList?: string[];
};

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  requiredVariables: string[];
  defaultAttachments?: string[];
};

export type AttachmentOption = {
  id: string;
  label: string;
};

export type EmailOutboxLog = {
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
