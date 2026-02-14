import type { EmailTemplate, CustomerContact } from "./types";

export const INTERNAL_CC_ALIAS = "ar-ops@meeru.ai";

export const EMAIL_TEMPLATES: EmailTemplate[] = [
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

export const CONTACTS_STORE: CustomerContact[] = [
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

export const VARIABLE_OPTIONS = [
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
