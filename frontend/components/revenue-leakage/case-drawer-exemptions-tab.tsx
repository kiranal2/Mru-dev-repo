"use client";

import { ExemptionEvidence } from "@/lib/revenue-leakage/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { AlertTriangle, Shield } from "lucide-react";
import { formatCurrency } from "./constants";

interface CaseDrawerExemptionsTabProps {
  exemptionEvidence: ExemptionEvidence;
}

export function CaseDrawerExemptionsTab({ exemptionEvidence }: CaseDrawerExemptionsTabProps) {
  return (
    <TabsContent value="exemptions" className="px-6 py-4 space-y-4">
      {exemptionEvidence.status === "Available" ? (
        <>
          {exemptionEvidence.repeat_usage_flag && (
            <Card className="p-3 border-red-200 bg-red-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <div>
                  <p className="text-sm font-semibold text-red-700">
                    Repeat Usage Detected
                  </p>
                  {exemptionEvidence.repeat_party_pan && (
                    <p className="text-xs text-red-600">
                      PAN: {exemptionEvidence.repeat_party_pan}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Exemption Entries
            </h4>
            <div className="overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-slate-300 bg-slate-700">
                  <tr>
                    <th className="text-left py-2 px-3 font-semibold">Code</th>
                    <th className="text-left py-2 px-3 font-semibold">Reason</th>
                    <th className="text-left py-2 px-3 font-semibold">Amount (\u20B9)</th>
                    <th className="text-left py-2 px-3 font-semibold">Eligibility</th>
                    <th className="text-left py-2 px-3 font-semibold">Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {exemptionEvidence.entries.map((entry, idx) => (
                    <tr
                      key={`${entry.exemption_code}-${idx}`}
                      className="text-slate-800 hover:bg-slate-50"
                    >
                      <td className="py-2 px-3 font-semibold">{entry.exemption_code}</td>
                      <td className="py-2 px-3">{entry.exemption_reason}</td>
                      <td className="py-2 px-3 font-semibold">
                        {formatCurrency(entry.exemption_amount)}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            entry.eligibility_result === "Pass"
                              ? "bg-emerald-100 text-emerald-700"
                              : entry.eligibility_result === "Fail"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {entry.eligibility_result}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          {!entry.doc_type_eligible && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                              Doc Type
                            </span>
                          )}
                          {entry.cap_exceeded && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                              Cap
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!exemptionEvidence.entries.length && (
                    <tr>
                      <td colSpan={5} className="py-3 px-3 text-xs text-slate-500">
                        No exemption entries.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {exemptionEvidence.note && (
            <Card className="p-3">
              <p className="text-xs text-slate-500">{exemptionEvidence.note}</p>
            </Card>
          )}
        </>
      ) : exemptionEvidence.status === "NotApplicable" ? (
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <p className="text-sm text-slate-600">
              No exemptions claimed for this document.
            </p>
          </div>
          {exemptionEvidence.note && (
            <p className="text-xs text-slate-500 mt-1">{exemptionEvidence.note}</p>
          )}
        </Card>
      ) : (
        <Card className="p-3 border border-dashed border-slate-200">
          <p className="text-sm text-slate-500">Exemption evidence not yet available.</p>
          <Badge variant="secondary" className="mt-2">
            Pending
          </Badge>
        </Card>
      )}
    </TabsContent>
  );
}
