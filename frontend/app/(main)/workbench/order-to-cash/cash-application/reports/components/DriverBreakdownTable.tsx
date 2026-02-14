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
import type { DriverBreakdownItem, ExceptionParetoItem } from "../types";
import { formatCurrency, getQueueLink } from "../constants";

type DriverBreakdownTableProps = {
  driverBreakdown: DriverBreakdownItem[];
  exceptionPareto: ExceptionParetoItem[];
};

export function DriverBreakdownTable({
  driverBreakdown,
  exceptionPareto,
}: DriverBreakdownTableProps) {
  const router = useRouter();

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Exception Drivers (Pareto)</h2>
            <p className="text-xs text-gray-500">Pending amount by reason with cumulative %</p>
          </div>
        </div>
        <div className="space-y-2">
          {exceptionPareto.map((item) => (
            <div key={item.driver} className="flex items-center gap-3">
              <div className="w-40 text-xs text-gray-600">{item.driver}</div>
              <div className="flex-1">
                <div className="h-3 bg-slate-100 rounded-full">
                  <div
                    className="h-3 rounded-full bg-amber-500"
                    style={{ width: `${item.percent}%` }}
                    title={`${formatCurrency(item.amount)} (${item.percent}%)`}
                  />
                </div>
              </div>
              <div className="w-14 text-xs text-gray-500">{item.cumulativePercent}%</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-0">
        <div className="px-4 py-3 border-b">
          <h2 className="text-sm font-semibold text-gray-900">Top Drivers of Pending Work</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Avg Age (hrs)</TableHead>
              <TableHead>SLA Risk</TableHead>
              <TableHead>Top Analyst</TableHead>
              <TableHead>% of Pending $</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {driverBreakdown.map((row) => (
              <TableRow key={row.driver}>
                <TableCell className="font-medium">{row.driver}</TableCell>
                <TableCell>{row.count}</TableCell>
                <TableCell>{formatCurrency(row.amount)}</TableCell>
                <TableCell>{row.avgAge.toFixed(1)}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      row.slaRisk === "High"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : row.slaRisk === "Med"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }
                  >
                    {row.slaRisk}
                  </Badge>
                </TableCell>
                <TableCell>{row.topAnalyst}</TableCell>
                <TableCell>{row.percentPending}%</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => router.push(getQueueLink(row.driver))}
                  >
                    View in Queue
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
