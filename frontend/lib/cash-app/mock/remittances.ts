import type { Remittance } from "../types";
import { companies } from "./constants";

export function generateMockRemittances(): Remittance[] {
  const remittances: Remittance[] = [];

  for (let i = 0; i < 15; i++) {
    const extractStatus =
      i % 5 === 0
        ? "NOT_EXTRACTED"
        : i % 5 === 1
          ? "EXTRACTED"
          : i % 5 === 2
            ? "PARTIAL"
            : "FAILED";
    const linkStatus = i % 4 === 0 ? "UNLINKED" : i % 4 === 1 ? "MULTI_MATCH" : "LINKED";
    const invoicesFound = extractStatus === "NOT_EXTRACTED" ? 0 : (i % 4) + 1;
    const confidence = extractStatus === "NOT_EXTRACTED" ? null : 62 + ((i * 7) % 34);
    const keyReference =
      i % 3 === 0 ? `WIRE-${90010 + i}` : i % 3 === 1 ? `CHK-${10300 + i}` : `WT${24000 + i}`;
    const invoiceLines = Array.from({ length: Math.max(1, invoicesFound) }).map((_, idx) => ({
      invoice_number: `INV-${21000 + i * 4 + idx}`,
      invoice_amount: 12000 + idx * 2500,
      paid_amount: 12000 + idx * 2500,
      discount: idx === 0 && extractStatus === "PARTIAL" ? 320 : 0,
      credit_memo_ref: idx === 2 ? `CM-${1200 + i}` : undefined,
      notes: idx === 1 ? "Short paid line item" : undefined,
    }));

    remittances.push({
      id: `rem-${2000 + i}`,
      remittanceNumber: `REM-2024-${(20000 + i).toString()}`,
      source: i % 3 === 0 ? "Email" : i % 3 === 1 ? "EDI" : "Bank Portal",
      receivedDate: new Date(2024, 11, Math.floor(Math.random() * 28) + 1)
        .toISOString()
        .split("T")[0],
      customerName: companies[i % companies.length],
      customerId: `CUST-${(1000 + i).toString()}`,
      totalAmount: Math.floor(Math.random() * 500000) + 5000,
      status: i % 5 === 0 ? "Unmatched" : "Matched",
      emailSubject: i % 3 === 0 ? `Payment Advice - Invoice ${20000 + i}` : undefined,
      extract_status: extractStatus,
      link_status: linkStatus,
      confidence_score: confidence,
      key_reference: keyReference,
      invoices_found_count: invoicesFound,
      extract_reason:
        extractStatus === "FAILED"
          ? "PDF unreadable"
          : extractStatus === "PARTIAL"
            ? "No invoice numbers found"
            : undefined,
      link_reason:
        linkStatus === "UNLINKED"
          ? "Missing payment reference"
          : linkStatus === "MULTI_MATCH"
            ? "Multiple payments match amount"
            : undefined,
      linked_payment_id: linkStatus === "LINKED" ? `PMT-2026-00${220 + i}` : null,
      email_metadata:
        i % 3 === 0
          ? {
              from: "ap@customer.com",
              to: "ar@meeru.ai",
              subject: `Remittance ${20000 + i}`,
              received_ts: new Date(2024, 11, Math.floor(Math.random() * 28) + 1).toISOString(),
              body: "Please find remittance details in the attached file.",
            }
          : undefined,
      attachments: [
        {
          name: `remittance_${20000 + i}.pdf`,
          type: "PDF",
          size: "1.2 MB",
          url: `/mock/downloads/remittances/remittance_${20000 + i}.pdf`,
        },
      ],
      extracted_fields:
        extractStatus === "NOT_EXTRACTED"
          ? undefined
          : {
              customer: companies[i % companies.length],
              payment_date: new Date(2024, 11, Math.floor(Math.random() * 28) + 1)
                .toISOString()
                .split("T")[0],
              amount: Math.floor(Math.random() * 500000) + 5000,
              currency: "USD",
              reference: keyReference,
              method: "AI",
            },
      extracted_line_items: extractStatus === "NOT_EXTRACTED" ? [] : invoiceLines,
      validation_checks:
        extractStatus === "NOT_EXTRACTED"
          ? []
          : [
              { status: "PASS", label: "Invoices exist in NetSuite" },
              {
                status: extractStatus === "PARTIAL" ? "WARN" : "PASS",
                label: extractStatus === "PARTIAL" ? "Totals match" : "Totals match",
                detail: extractStatus === "PARTIAL" ? "Difference: $320" : undefined,
              },
              {
                status: linkStatus === "MULTI_MATCH" ? "WARN" : "PASS",
                label: "Currency match",
              },
            ],
      activity_log: [
        {
          event: "Remittance Captured",
          actor: "System",
          ts: new Date(2024, 11, Math.floor(Math.random() * 28) + 1).toISOString(),
          detail: `Source: ${i % 3 === 0 ? "Email" : i % 3 === 1 ? "EDI" : "Bank Portal"}`,
        },
      ],
      createdAt: new Date(2024, 11, Math.floor(Math.random() * 28) + 1).toISOString(),
    });
  }

  return remittances;
}
