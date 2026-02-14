"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AgingBucket, ReportPayment } from "../types";
import { formatCurrency } from "../constants";

type PendingAgingSectionProps = {
  agingBuckets: AgingBucket[];
  slaTable: ReportPayment[];
};

export function PendingAgingSection({ agingBuckets, slaTable }: PendingAgingSectionProps) {
  const router = useRouter();

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Pending Aging &amp; SLA</h2>
          <p className="text-xs text-gray-500">Aging buckets split by stream</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-6">
        {agingBuckets.map((bucket) => (
          <div key={bucket.label} className="border rounded-md p-3">
            <div className="text-xs text-gray-500 mb-2">{bucket.label}</div>
            <div className="space-y-1">
              {(["Exceptions", "Pending", "Settlement"] as const).map((stream) => {
                const count = bucket.byStream[stream];
                const percent = Math.round((count / bucket.total) * 100);
                const color =
                  stream === "Exceptions"
                    ? "bg-amber-500"
                    : stream === "Pending"
                      ? "bg-blue-500"
                      : "bg-slate-500";
                return (
                  <div key={stream}>
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span>{stream}</span>
                      <span>{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full">
                      <div
                        className={`h-1.5 rounded-full ${color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border rounded-md">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold text-gray-900">SLA Breach Watchlist</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Age (hrs)</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slaTable.map((item) => (
              <TableRow key={item.payment_id}>
                <TableCell className="font-medium text-blue-600">{item.payment_id}</TableCell>
                <TableCell>{item.assigned_to || "Unassigned"}</TableCell>
                <TableCell>{formatCurrency(item.amount)}</TableCell>
                <TableCell>{item.sla_age_hours}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 border-amber-200"
                  >
                    {item.exception_reason || item.status_bucket}
                  </Badge>
                </TableCell>
                <TableCell>{item.assigned_to || "Unassigned"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() =>
                      router.push(
                        `/workbench/order-to-cash/cash-application/payments?paymentId=${item.payment_id}`
                      )
                    }
                  >
                    Open Record
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
