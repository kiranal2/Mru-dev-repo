"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cashAppStore } from "@/lib/cash-app-store";
import { BatchLineItem } from "@/lib/cash-app-types";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  UploadCloud,
} from "lucide-react";

export default function BatchDetailsPage({ params }: { params: { batchId: string } }) {
  const router = useRouter();
  const [batch, setBatch] = useState(() => cashAppStore.getPaymentBatchById(params.batchId));
  const [blockerItem, setBlockerItem] = useState<BatchLineItem | null>(null);

  useEffect(() => {
    setBatch(cashAppStore.getPaymentBatchById(params.batchId));
  }, [params.batchId]);

  const refreshBatch = () => {
    setBatch(cashAppStore.getPaymentBatchById(params.batchId));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  const getWorkstreamBadgeStyle = (workstream: string) => {
    switch (workstream) {
      case "AUTO_MATCHED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "INTERCOMPANY":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "JE_REQUIRED":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "EXCEPTION":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStateBadgeStyle = (state: string) => {
    switch (state) {
      case "READY":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "BLOCKED":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "FAILED":
        return "bg-red-50 text-red-700 border-red-200";
      case "POSTED":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const blockedReasonLabel = (reason?: string) => {
    switch (reason) {
      case "JE_APPROVAL":
        return "JE approval pending";
      case "SYNC_PENDING":
        return "NetSuite sync pending";
      case "DIMENSIONS_MISSING":
        return "Missing dimensions";
      case "EVIDENCE_REQUIRED":
        return "Evidence required";
      case "PERIOD_LOCKED":
        return "Period locked";
      default:
        return "Posting blocked";
    }
  };

  const blockedReasonFix = (reason?: string) => {
    switch (reason) {
      case "JE_APPROVAL":
        return "Submit the intercompany JE for approval and retry posting.";
      case "SYNC_PENDING":
        return "Wait for the NetSuite sync to complete before retrying.";
      case "DIMENSIONS_MISSING":
        return "Add missing department/class/location dimensions to the payment.";
      case "EVIDENCE_REQUIRED":
        return "Attach remittance evidence and request approval.";
      case "PERIOD_LOCKED":
        return "Open the accounting period or change the posting date.";
      default:
        return "Review the payment blockers and update required fields.";
    }
  };

  const summaryCards = batch
    ? [
        { label: "Total Payments", value: batch.total_payments.toString() },
        { label: "Total Amount", value: formatCurrency(batch.total_amount) },
        {
          label: "Ready vs Blocked",
          value: `${batch.ready_count} Ready • ${batch.blocked_count} Blocked`,
        },
        ...(batch.failed_count > 0 ? [{ label: "Failed", value: `${batch.failed_count}` }] : []),
      ]
    : [];

  if (!batch) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        <div className="border-b bg-white px-8 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/workbench/order-to-cash/cash-application/payment-batches")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Batches
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900 mt-2">Batch Details</h1>
          <p className="text-sm text-gray-600 mt-1">Batch not found</p>
        </div>
      </div>
    );
  }

  const canPostBatch = batch.status === "READY";
  const canPostReadyOnly =
    batch.status === "PARTIAL" || (batch.status === "READY" && batch.blocked_count > 0);
  const canRetryFailed = batch.failed_count > 0;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="border-b bg-white px-8 py-4">
        <div className="flex items-center justify-between gap-6">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push("/workbench/order-to-cash/cash-application/payment-batches")
              }
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Batches
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900 mt-2">Batch Details</h1>
            <div className="text-sm text-gray-600 mt-1 flex flex-wrap items-center gap-3">
              <span className="font-medium text-gray-800">{batch.batch_id}</span>
              <span>Posting date: {batch.posting_date}</span>
              <span>Bank: {batch.bank_account}</span>
              <span>Entity: {batch.entity}</span>
              <span>Currency: {batch.currency}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getStatusBadgeStyle(batch.status)}>
              {formatStatus(batch.status)}
            </Badge>
            <Button
              onClick={() => {
                cashAppStore.postPaymentBatch(batch.batch_id, "all");
                refreshBatch();
              }}
              disabled={!canPostBatch}
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              Post Batch
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                cashAppStore.postPaymentBatch(batch.batch_id, "ready");
                refreshBatch();
              }}
              disabled={!canPostReadyOnly}
            >
              Post Ready Only
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                cashAppStore.postPaymentBatch(batch.batch_id, "retry");
                refreshBatch();
              }}
              disabled={!canRetryFailed}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Failed
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const csv = cashAppStore.exportPaymentBatchReport(batch.batch_id);
                if (csv) {
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", `${batch.batch_id}-posting-report.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  refreshBatch();
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className={`grid gap-4 ${summaryCards.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
          {summaryCards.map((card) => (
            <Card key={card.label} className="p-4">
              <div>
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Payer / Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Workstream
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    State
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    NetSuite Ref
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {batch.line_items.map((item) => {
                  const resultStatus = item.netsuite_post_result.status;
                  return (
                    <tr key={item.payment_id} className="hover:bg-gray-50">
                      <td
                        className="px-4 py-3 text-sm font-medium text-blue-600 cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/workbench/order-to-cash/cash-application/payments/${item.payment_id}?from=payment-batches`
                          )
                        }
                      >
                        {item.payment_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-medium">{item.payer_name}</div>
                        <div className="text-xs text-gray-500">{item.customer_name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={getWorkstreamBadgeStyle(item.workstream)}
                        >
                          {item.workstream.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={getStateBadgeStyle(item.ready_state)}>
                          {item.ready_state}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          {resultStatus === "SUCCESS" && (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                          {resultStatus === "ERROR" && <XCircle className="w-4 h-4 text-red-500" />}
                          {resultStatus === "NOT_STARTED" && (
                            <AlertTriangle className="w-4 h-4 text-gray-400" />
                          )}
                          <span>
                            {resultStatus === "NOT_STARTED"
                              ? "—"
                              : resultStatus === "SUCCESS"
                                ? "Success"
                                : "Error"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        <div>{item.netsuite_post_result.netsuite_payment_id || "—"}</div>
                        <div>{item.netsuite_post_result.netsuite_je_id || ""}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.ready_state === "BLOCKED" && (
                          <Button variant="ghost" size="sm" onClick={() => setBlockerItem(item)}>
                            View Blocker
                          </Button>
                        )}
                        {item.ready_state === "FAILED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              cashAppStore.retryPaymentBatchLineItem(
                                batch.batch_id,
                                item.payment_id
                              );
                              refreshBatch();
                            }}
                          >
                            Retry
                          </Button>
                        )}
                        {item.ready_state === "READY" && <span>—</span>}
                        {item.ready_state === "POSTED" && <span>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
            <Badge variant="outline" className="text-xs">
              {batch.audit_timeline.length}
            </Badge>
          </div>
          <div className="space-y-4">
            {batch.audit_timeline.map((event, index) => (
              <div key={`${event.event}-${event.ts}`} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1"></div>
                  {index !== batch.audit_timeline.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200 mt-1 min-h-[28px]"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">{event.event}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(event.ts).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{event.detail}</div>
                  <div className="text-xs text-gray-500 mt-1">Actor: {event.actor}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Dialog
        open={!!blockerItem}
        onOpenChange={(open) => {
          if (!open) setBlockerItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Posting Blocker</DialogTitle>
            <DialogDescription>{blockedReasonLabel(blockerItem?.blocked_reason)}</DialogDescription>
          </DialogHeader>
          <div className="text-sm text-gray-700">
            {blockedReasonFix(blockerItem?.blocked_reason)}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBlockerItem(null)}>
              Close
            </Button>
            {blockerItem && (
              <Button
                onClick={() =>
                  router.push(
                    `/workbench/order-to-cash/cash-application/payments/${blockerItem.payment_id}?from=payment-batches`
                  )
                }
              >
                Open Payment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
