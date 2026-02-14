"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ProcessingBucket } from "../types";
import { formatCurrency } from "../constants";

type ProcessingCategoriesCardsProps = {
  processingBuckets: ProcessingBucket[];
};

export function ProcessingCategoriesCards({ processingBuckets }: ProcessingCategoriesCardsProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Processing Categories (BRD Buckets)</p>
            <p className="text-xs text-gray-500 mt-1">Automatically Processed</p>
            <p className="text-lg font-semibold text-gray-900">
              {processingBuckets[0].count} payments
            </p>
            <p className="text-xs text-gray-500">
              {formatCurrency(processingBuckets[0].amount)} • {processingBuckets[0].share}%
            </p>
          </div>
          <Button
            variant="link"
            size="sm"
            onClick={() =>
              router.push(
                "/workbench/order-to-cash/cash-application/payments?segment=AutoMatched&status=AutoMatched"
              )
            }
          >
            View Payments
          </Button>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mt-1">Manually Processed (incl. JE)</p>
            <p className="text-lg font-semibold text-gray-900">
              {processingBuckets[1].count} payments
            </p>
            <p className="text-xs text-gray-500">
              {formatCurrency(processingBuckets[1].amount)} • {processingBuckets[1].share}%
            </p>
          </div>
          <Button
            variant="link"
            size="sm"
            onClick={() =>
              router.push(
                "/workbench/order-to-cash/cash-application/payments?segment=Exception&status=Exception"
              )
            }
          >
            View Payments
          </Button>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mt-1">Non-AR</p>
            <p className="text-lg font-semibold text-gray-900">
              {processingBuckets[2].count} payments
            </p>
            <p className="text-xs text-gray-500">
              {formatCurrency(processingBuckets[2].amount)} • {processingBuckets[2].share}%
            </p>
          </div>
          <Button
            variant="link"
            size="sm"
            onClick={() =>
              router.push("/workbench/order-to-cash/cash-application/payments?status=NonAR")
            }
          >
            View Payments
          </Button>
        </div>
      </Card>
    </div>
  );
}
