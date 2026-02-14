"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FunnelBucket } from "../types";
import { formatCurrency } from "../constants";

type WorkstreamsFunnelProps = {
  funnelBuckets: FunnelBucket[];
  funnelMetric: "count" | "amount";
  setFunnelMetric: (metric: "count" | "amount") => void;
};

export function WorkstreamsFunnel({
  funnelBuckets,
  funnelMetric,
  setFunnelMetric,
}: WorkstreamsFunnelProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Workstreams Funnel</h2>
          <p className="text-xs text-gray-500">Workload distribution</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={funnelMetric === "count" ? "default" : "outline"}
            onClick={() => setFunnelMetric("count")}
          >
            Count
          </Button>
          <Button
            size="sm"
            variant={funnelMetric === "amount" ? "default" : "outline"}
            onClick={() => setFunnelMetric("amount")}
          >
            Amount
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        {funnelBuckets.map((bucket) => (
          <div key={bucket.key}>
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>{bucket.label}</span>
              <span>{bucket.percent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-500"
                style={{ width: `${bucket.percent}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {funnelMetric === "count"
                ? `${bucket.value} items`
                : formatCurrency(bucket.value)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
