"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cashAppStore } from "@/lib/cash-app-store";
import { History, FileText, CheckCircle2 } from "lucide-react";

export default function HistoryPage() {
  const router = useRouter();
  const payments = cashAppStore.getPayments().filter((p) => p.status === "Posted");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="border-b bg-white px-8 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Payment History</h1>
        <p className="text-sm text-gray-600 mt-1">View all posted payments</p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Posted Payments</p>
                <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Posted Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Payment #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() =>
                      router.push(
                        `/workbench/order-to-cash/cash-application/payments/${payment.id}?from=history`
                      )
                    }
                  >
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">
                      {payment.paymentNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{payment.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{payment.customerName}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{payment.method}</td>
                    <td className="px-4 py-3">
                      <Badge className="bg-green-100 text-green-800">Posted</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {payments.length === 0 && (
              <div className="p-12 text-center">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No payment history available</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
