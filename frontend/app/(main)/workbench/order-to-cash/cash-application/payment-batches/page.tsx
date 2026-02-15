"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cashAppStore } from "@/lib/cash-app-store";
import { useCashPayments } from "@/hooks/data/use-cash-payments";
import { Layers, Calendar, DollarSign, FileText } from "lucide-react";

export default function PaymentBatchesPage() {
  const router = useRouter();
  // Bridge: data hook for fetch lifecycle, store for rich batch objects
  const { loading: dataLoading, error: dataError } = useCashPayments();
  const batches = cashAppStore.getPaymentBatches();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "POSTED":
        return "bg-green-50 text-green-700 border-green-200";
      case "PARTIAL":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "FAILED":
        return "bg-red-50 text-red-700 border-red-200";
      case "READY":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "POSTING":
        return "bg-slate-100 text-slate-700 border-slate-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "POSTED":
        return "Posted";
      case "PARTIAL":
        return "Partial";
      case "FAILED":
        return "Failed";
      case "READY":
        return "Ready";
      case "POSTING":
        return "Posting";
      case "DRAFT":
        return "Draft";
      default:
        return status;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="border-b bg-white px-8 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Payment Batches</h1>
        <p className="text-sm text-gray-600 mt-1">View and manage payment posting batches</p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Batches</p>
                <p className="text-2xl font-bold text-gray-900">{batches.length}</p>
              </div>
              <Layers className="w-8 h-8 text-purple-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {batches.reduce((sum, b) => sum + b.total_payments, 0)}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(batches.reduce((sum, b) => sum + b.total_amount, 0))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>

        <div className="grid gap-4">
          {batches.map((batch) => (
            <Card key={batch.batch_id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Layers className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{batch.batch_id}</h3>
                      <Badge variant="outline" className={getStatusBadgeStyle(batch.status)}>
                        {formatStatus(batch.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {batch.posting_date}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {batch.total_payments} payments
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency(batch.total_amount)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {batch.posted_by ? `Posted by ${batch.posted_by}` : "Not posted yet"}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/workbench/order-to-cash/cash-application/payment-batches/${batch.batch_id}`
                    )
                  }
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
