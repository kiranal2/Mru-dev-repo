"use client";

import { ReceiptEvidence } from "@/lib/revenue-leakage/types";
import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { formatCurrency } from "./constants";

interface CaseDrawerPaymentsTabProps {
  receiptsIncluded: ReceiptEvidence[];
  receiptsExcluded: ReceiptEvidence[];
  paidTotal: number;
  gap: number;
}

export function CaseDrawerPaymentsTab({
  receiptsIncluded,
  receiptsExcluded,
  paidTotal,
  gap,
}: CaseDrawerPaymentsTabProps) {
  return (
    <TabsContent value="payments" className="px-6 py-4 space-y-4">
      <Card className="p-3 border-amber-300 bg-amber-50">
        <p className="text-xs text-amber-800 font-bold">Inclusion Rule (Locked)</p>
        <p className="text-xs text-amber-700 mt-1">
          Include only receipts where CASH_DET.ACC_CANC = &apos;A&apos;. CASH_DET.STATUS is
          null and not used.
        </p>
      </Card>
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
          Included Receipts
        </h4>
        <div className="overflow-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-300 bg-slate-700">
              <tr>
                <th className="text-left py-2 px-3 font-semibold">Receipt</th>
                <th className="text-left py-2 px-3 font-semibold">Receipt Date</th>
                <th className="text-left py-2 px-3 font-semibold">Challan</th>
                <th className="text-left py-2 px-3 font-semibold">Bank</th>
                <th className="text-left py-2 px-3 font-semibold">Entry</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {receiptsIncluded.map((receipt) => (
                <tr key={receipt.C_RECEIPT_NO} className="text-slate-800 hover:bg-slate-50">
                  <td className="py-2 px-3 font-semibold">{receipt.C_RECEIPT_NO}</td>
                  <td className="py-2 px-3">{receipt.RECEIPT_DATE}</td>
                  <td className="py-2 px-3">{receipt.BANK_CHALLAN_NO || "\u2014"}</td>
                  <td className="py-2 px-3">
                    {receipt.BANK_NAME || "\u2014"}{" "}
                    {receipt.BANK_BRANCH ? `(${receipt.BANK_BRANCH})` : ""}
                  </td>
                  <td className="py-2 px-3">{receipt.ENTRY_DATE || "\u2014"}</td>
                </tr>
              ))}
              {!receiptsIncluded.length && (
                <tr>
                  <td colSpan={5} className="py-3 px-3 text-xs text-slate-500">
                    No included receipts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
          Excluded Receipts
        </h4>
        <div className="overflow-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-300 bg-slate-700">
              <tr>
                <th className="text-left py-2 px-3 font-semibold">Receipt</th>
                <th className="text-left py-2 px-3 font-semibold">Reason</th>
                <th className="text-left py-2 px-3 font-semibold">Receipt Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {receiptsExcluded.map((receipt) => (
                <tr key={receipt.C_RECEIPT_NO} className="text-slate-800 hover:bg-slate-50">
                  <td className="py-2 px-3 font-semibold">{receipt.C_RECEIPT_NO}</td>
                  <td className="py-2 px-3 text-red-600 font-medium">
                    {receipt.exclude_reason || "Excluded"}
                  </td>
                  <td className="py-2 px-3">{receipt.RECEIPT_DATE}</td>
                </tr>
              ))}
              {!receiptsExcluded.length && (
                <tr>
                  <td colSpan={3} className="py-3 px-3 text-xs text-slate-500">
                    No excluded receipts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Card className="p-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
          Payment Line Items
        </h4>
        <div className="overflow-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-300 bg-slate-700">
              <tr>
                <th className="text-left py-2 px-3 font-semibold">Account Code</th>
                <th className="text-left py-2 px-3 font-semibold">Amount (\u20B9)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {receiptsIncluded
                .flatMap((receipt) => receipt.cash_paid)
                .map((line, idx) => (
                  <tr
                    key={`${line.ACCOUNT_CODE}-${idx}`}
                    className="text-slate-800 hover:bg-slate-50"
                  >
                    <td className="py-2 px-3">{line.ACCOUNT_CODE}</td>
                    <td className="py-2 px-3 font-semibold">
                      {formatCurrency(line.AMOUNT)}
                    </td>
                  </tr>
                ))}
              {!receiptsIncluded.length && (
                <tr>
                  <td colSpan={2} className="py-3 px-3 text-xs text-slate-500">
                    No payment lines.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3 bg-blue-50 border-blue-200">
          <p className="text-[11px] font-medium text-blue-600">Paid Total</p>
          <p className="text-lg font-bold text-blue-900">{formatCurrency(paidTotal)}</p>
        </Card>
        <Card
          className={`p-3 ${gap > 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}
        >
          <p
            className={`text-[11px] font-medium ${gap > 0 ? "text-red-600" : "text-emerald-600"}`}
          >
            Gap
          </p>
          <p
            className={`text-lg font-bold ${gap > 0 ? "text-red-700" : "text-emerald-700"}`}
          >
            {formatCurrency(gap)}
          </p>
        </Card>
      </div>
    </TabsContent>
  );
}
