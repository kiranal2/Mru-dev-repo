"use client";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AnalystWorkloadItem, AnalystThroughput } from "../types";
import { formatCurrency } from "../constants";

type AnalystSectionProps = {
  analystThroughput: AnalystThroughput;
  analystWorkload: AnalystWorkloadItem[];
};

export function AnalystSection({ analystThroughput, analystWorkload }: AnalystSectionProps) {
  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Analyst Throughput (Daily)</h2>
            <p className="text-xs text-gray-500">Posted vs resolved vs escalated</p>
          </div>
        </div>
        <div className="flex items-end gap-2 h-28">
          {analystThroughput.series.map((day, idx) => {
            const total = day.posted + day.resolved + day.escalated || 1;
            return (
              <div key={`throughput-${idx}`} className="flex-1 flex flex-col justify-end gap-1">
                <div className="flex flex-col justify-end h-24 bg-slate-100 rounded-md overflow-hidden">
                  <div
                    className="bg-emerald-500"
                    style={{ height: `${(day.posted / total) * 100}%` }}
                  />
                  <div
                    className="bg-blue-500"
                    style={{ height: `${(day.resolved / total) * 100}%` }}
                  />
                  <div
                    className="bg-amber-500"
                    style={{ height: `${(day.escalated / total) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 text-center">
                  {analystThroughput.labels[idx]}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Posted
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Resolved
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Escalated
          </span>
        </div>
      </Card>

      <Card className="p-0">
        <div className="px-4 py-3 border-b">
          <h2 className="text-sm font-semibold text-gray-900">Analyst Workload</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Analyst</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>SLA Breaches</TableHead>
              <TableHead>Avg time to post</TableHead>
              <TableHead>In Queue</TableHead>
              <TableHead>Pending $</TableHead>
              <TableHead>Auto Cleared</TableHead>
              <TableHead>Manual Actions</TableHead>
              <TableHead>JE Tasks</TableHead>
              <TableHead>Remittance Requests Sent</TableHead>
              <TableHead>Utilization</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analystWorkload.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-sm text-gray-500">
                  No analyst assignments in this period.
                </TableCell>
              </TableRow>
            ) : (
              analystWorkload.map((row) => (
                <TableRow key={row.analyst}>
                  <TableCell className="font-medium">{row.analyst}</TableCell>
                  <TableCell>{row.assigned}</TableCell>
                  <TableCell>{row.completed}</TableCell>
                  <TableCell>{row.breaches}</TableCell>
                  <TableCell>{row.avgHours} hrs</TableCell>
                  <TableCell>{row.inQueue}</TableCell>
                  <TableCell>{formatCurrency(row.pendingAmount)}</TableCell>
                  <TableCell>{row.autoCleared}</TableCell>
                  <TableCell>{row.manualActions}</TableCell>
                  <TableCell>{row.jeTasks}</TableCell>
                  <TableCell>{row.remittanceRequests}</TableCell>
                  <TableCell className="min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${row.utilization}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">
                        {row.utilization}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
