"use client";

import { LeakageCase } from "@/lib/revenue-leakage/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Shield } from "lucide-react";
import { formatCurrency } from "./constants";

interface CaseDrawerPropertyTabProps {
  caseItem: LeakageCase;
}

export function CaseDrawerPropertyTab({ caseItem }: CaseDrawerPropertyTabProps) {
  const mvEvidence = caseItem.evidence.mv_evidence;

  return (
    <TabsContent value="property" className="px-6 py-4 space-y-4">
      <Card className="p-3">
        <h4 className="text-sm font-semibold mb-2">Property Details</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-500">Location Type</p>
            <p>{caseItem.property_summary.is_urban ? "Urban" : "Rural"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Extent</p>
            <p>
              {caseItem.property_summary.extent} {caseItem.property_summary.unit}
            </p>
          </div>
          {caseItem.property_summary.is_urban && caseItem.property_summary.urban && (
            <>
              <div>
                <p className="text-xs text-slate-500">Ward / Block</p>
                <p>
                  {caseItem.property_summary.urban.WARD_NO} /{" "}
                  {caseItem.property_summary.urban.BLOCK_NO}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Door No</p>
                <p>{caseItem.property_summary.urban.DOOR_NO}</p>
              </div>
            </>
          )}
          {!caseItem.property_summary.is_urban && caseItem.property_summary.rural && (
            <>
              <div>
                <p className="text-xs text-slate-500">Village / Survey</p>
                <p>
                  {caseItem.property_summary.rural.VILLAGE_CODE} /{" "}
                  {caseItem.property_summary.rural.SURVEY_NO}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Plot</p>
                <p>{caseItem.property_summary.rural.PLOT_NO}</p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Market Value Evidence */}
      {mvEvidence.status === "Available" ? (
        <>
          <Card
            className={`p-3 ${mvEvidence.deviation_pct < -10 ? "border-red-200 bg-red-50" : mvEvidence.deviation_pct < 0 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">Market Value Comparison</h4>
              <Badge variant={mvEvidence.deviation_pct < -10 ? "destructive" : "secondary"}>
                {mvEvidence.deviation_pct > 0 ? "+" : ""}
                {mvEvidence.deviation_pct.toFixed(1)}% deviation
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Declared Value</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(mvEvidence.declared_value)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Expected Value (Rate Card)</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(mvEvidence.expected_value)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mt-3">
              <div>
                <p className="text-xs text-slate-500">Current Unit Rate</p>
                <p className="font-medium">
                  {formatCurrency(mvEvidence.unit_rate_current)}/unit
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Previous Unit Rate</p>
                <p className="font-medium">
                  {formatCurrency(mvEvidence.unit_rate_previous)}/unit
                </p>
              </div>
            </div>
            {mvEvidence.note && (
              <p className="text-xs text-slate-500 mt-2">{mvEvidence.note}</p>
            )}
          </Card>
          {mvEvidence.rate_card && (
            <Card className="p-3">
              <h4 className="text-sm font-semibold mb-2">Rate Card Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Source</p>
                  <p className="font-medium">{mvEvidence.rate_card.source}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">SRO Code</p>
                  <p>{mvEvidence.rate_card.SRO_CODE}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Location Key</p>
                  <p>{mvEvidence.rate_card.location_key}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Effective From</p>
                  <p>{mvEvidence.rate_card.effective_from}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Unit Rate (Current)</p>
                  <p className="font-medium">
                    {formatCurrency(mvEvidence.rate_card.UNIT_RATE)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Revenue Rate</p>
                  <p className="font-medium">
                    {formatCurrency(mvEvidence.rate_card.REV_RATE)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Previous Revenue Rate</p>
                  <p className="font-medium">
                    {formatCurrency(mvEvidence.rate_card.PRE_REV_RATE)}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      ) : mvEvidence.status === "NotApplicable" ? (
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <p className="text-sm text-slate-600">
              Market Value comparison not applicable for this document type.
            </p>
          </div>
          {mvEvidence.note && (
            <p className="text-xs text-slate-500 mt-1">{mvEvidence.note}</p>
          )}
        </Card>
      ) : (
        <Card className="p-3 border border-dashed border-slate-200">
          <h4 className="text-sm font-semibold mb-1">Expected Rate Card</h4>
          <p className="text-xs text-slate-500">
            Rate card data not yet available for this location.
          </p>
          <Badge variant="secondary" className="mt-2">
            Pending
          </Badge>
        </Card>
      )}
    </TabsContent>
  );
}
