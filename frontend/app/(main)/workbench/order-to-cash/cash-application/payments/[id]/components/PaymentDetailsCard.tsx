"use client";

import { Payment } from "@/lib/cash-app-types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface PaymentDetailsCardProps {
  payment: Payment;
  resolvedJeTypeLabel: string | null;
  formatCurrency: (amount: number) => string;
}

export function PaymentDetailsCard({
  payment,
  resolvedJeTypeLabel,
  formatCurrency,
}: PaymentDetailsCardProps) {
  return (
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
          <div className="text-sm font-medium">{payment.method || "\u2014"}</div>
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
  );
}
