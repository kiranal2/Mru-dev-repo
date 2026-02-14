"use client";

import { Payment } from "@/lib/cash-app-types";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface PaymentDataTabsProps {
  payment: Payment;
  formatCurrency: (amount: number) => string;
}

export function PaymentDataTabs({ payment, formatCurrency }: PaymentDataTabsProps) {
  const totalApplied = payment.transformedLines.reduce(
    (sum, line) => sum + line.paymentAmount,
    0
  );
  const difference = payment.amount - totalApplied;

  return (
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
                  {formatCurrency(totalApplied)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Difference</div>
                <div className="text-lg font-semibold text-green-600">
                  {formatCurrency(difference)}
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
  );
}
