"use client";

import { ReceiptEvidence } from "@/lib/revenue-leakage/types";
import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";

interface DelayRow extends ReceiptEvidence {
  delayDays: number | null;
}

interface CaseDrawerDelayTabProps {
  delayRows: DelayRow[];
  avgDelay: number;
}

export function CaseDrawerDelayTab({ delayRows, avgDelay }: CaseDrawerDelayTabProps) {
  return (
    <TabsContent value="delay" className="px-6 py-4 space-y-4">
      <Card className="p-3 bg-slate-50">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
          Timeline Flow
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 bg-white rounded border text-slate-700 font-medium">
            Bank Challan
          </span>
          <span className="text-slate-400">{"\u2192"}</span>
          <span className="px-2 py-1 bg-white rounded border text-slate-700 font-medium">
            Receipt
          </span>
          <span className="text-slate-400">{"\u2192"}</span>
          <span className="px-2 py-1 bg-white rounded border text-slate-700 font-medium">
            Registration
          </span>
        </div>
      </Card>
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Receipt Delays
          </h4>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${avgDelay > 7 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
          >
            Avg {avgDelay} days
          </span>
        </div>
        <div className="overflow-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-300 bg-slate-700">
              <tr>
                <th className="text-left py-2 px-3 font-semibold">Receipt</th>
                <th className="text-left py-2 px-3 font-semibold">Challan Date</th>
                <th className="text-left py-2 px-3 font-semibold">Receipt Date</th>
                <th className="text-left py-2 px-3 font-semibold">Delay</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {delayRows.map((row) => (
                <tr key={row.C_RECEIPT_NO} className="text-slate-800 hover:bg-slate-50">
                  <td className="py-2 px-3 font-semibold">{row.C_RECEIPT_NO}</td>
                  <td className="py-2 px-3">{row.BANK_CHALLAN_DT || "\u2014"}</td>
                  <td className="py-2 px-3">{row.RECEIPT_DATE}</td>
                  <td className="py-2 px-3">
                    {row.delayDays != null ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${row.delayDays > 7 ? "bg-red-100 text-red-700" : row.delayDays > 3 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                      >
                        {row.delayDays}d
                      </span>
                    ) : (
                      "\u2014"
                    )}
                  </td>
                </tr>
              ))}
              {!delayRows.length && (
                <tr>
                  <td colSpan={4} className="py-3 px-3 text-xs text-slate-500">
                    No receipts to compute delays.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </TabsContent>
  );
}
