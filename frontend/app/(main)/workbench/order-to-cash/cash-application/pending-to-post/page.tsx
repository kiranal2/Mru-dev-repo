"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cashAppStore } from "@/lib/cash-app-store";
import { useCashPayments } from "@/hooks/data/use-cash-payments";
import { Clock, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";

export default function PendingToPostPage() {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Bridge: data hook for fetch lifecycle, store for rich Payment objects
  const { loading: dataLoading, error: dataError } = useCashPayments({ status: ["PendingToPost"] });
  const payments = cashAppStore.getPayments().filter((p) => p.status === "PendingToPost");

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const selectedAmount = payments
    .filter((p) => selectedIds.includes(p.id))
    .reduce((sum, p) => sum + p.amount, 0);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(payments.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handlePostSelected = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select payments to post");
      return;
    }

    selectedIds.forEach((id) => {
      cashAppStore.updatePayment(id, {
        status: "Posted",
      });

      cashAppStore.addActivityLog(id, {
        timestamp: new Date().toISOString(),
        user: "Current User",
        action: "Posted",
        details: "Payment posted to GL",
      });
    });

    toast.success(`${selectedIds.length} payment(s) posted successfully`);
    setSelectedIds([]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="border-b bg-white px-8 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Pending to Post</h1>
        <p className="text-sm text-gray-600 mt-1">Review and post approved payments to GL</p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Selected Amount</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(selectedAmount)}</p>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {selectedIds.length}
              </Badge>
            </div>
          </Card>
        </div>

        {selectedIds.length > 0 && (
          <Card className="mb-4 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedIds.length} payment{selectedIds.length !== 1 ? "s" : ""} selected (
                {formatCurrency(selectedAmount)})
              </span>
              <Button onClick={handlePostSelected}>
                <Send className="w-4 h-4 mr-2" />
                Post to GL
              </Button>
            </div>
          </Card>
        )}

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left w-12">
                    <Checkbox
                      checked={selectedIds.length === payments.length && payments.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
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
                    Confidence
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
                      router.push(
                        `/workbench/order-to-cash/cash-application/payments/${payment.id}?from=pending-to-post`
                      );
                    }}
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedIds.includes(payment.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIds([...selectedIds, payment.id]);
                          } else {
                            setSelectedIds(selectedIds.filter((id) => id !== payment.id));
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
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
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-green-600">
                          {payment.confidenceScore}%
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {payments.length === 0 && (
              <div className="p-12 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No payments pending to post</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
