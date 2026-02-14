"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentExplainability } from "@/lib/cash-app-types";
import { FileText, ExternalLink } from "lucide-react";

interface WhyEvidenceCardProps {
  explainability?: PaymentExplainability;
}

export function WhyEvidenceCard({ explainability }: WhyEvidenceCardProps) {
  if (!explainability) return null;

  const getSourceBadgeClass = (source: string) => {
    const classes: Record<string, string> = {
      Bank: "bg-blue-50 text-blue-700 border-blue-200",
      NetSuite: "bg-green-50 text-green-700 border-green-200",
      Remit: "bg-purple-50 text-purple-700 border-purple-200",
      System: "bg-gray-50 text-gray-700 border-gray-200",
    };
    return classes[source] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3 mb-4">
        <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-sm mb-1">Why & Evidence</h3>
          <p className="text-xs text-gray-600">Decision rationale and supporting evidence</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-2">Primary Decision</div>
          <div className="text-sm font-bold text-gray-900">
            {explainability.primary_reason_label}
          </div>
        </div>

        {explainability.reason_codes.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-2">Reason Codes</div>
            <div className="flex flex-wrap gap-1.5">
              {explainability.reason_codes.map((code) => (
                <Badge key={code} variant="outline" className="text-xs bg-gray-50">
                  {code}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {explainability.evidence_items.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-2">Evidence</div>
            <div className="space-y-2">
              {explainability.evidence_items.map((evidence, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <div className="flex-1">
                    <span className="text-gray-700">{evidence.text}</span>
                    <Badge
                      variant="outline"
                      className={`ml-2 text-xs ${getSourceBadgeClass(evidence.source)}`}
                    >
                      {evidence.source}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="text-xs font-semibold text-gray-600 mb-2">Artifacts</div>
          <div className="flex flex-wrap gap-2">
            {explainability.artifact_links.bank_line_url && (
              <Button size="sm" variant="outline" className="h-7 text-xs">
                <ExternalLink className="w-3 h-3 mr-1" />
                Bank Line
              </Button>
            )}
            {explainability.artifact_links.remittance_url && (
              <Button size="sm" variant="outline" className="h-7 text-xs">
                <ExternalLink className="w-3 h-3 mr-1" />
                Remit
              </Button>
            )}
            {explainability.artifact_links.invoice_set_url && (
              <Button size="sm" variant="outline" className="h-7 text-xs">
                <ExternalLink className="w-3 h-3 mr-1" />
                Invoice Set
              </Button>
            )}
            {explainability.artifact_links.je_draft_url && (
              <Button size="sm" variant="outline" className="h-7 text-xs">
                <ExternalLink className="w-3 h-3 mr-1" />
                JE Draft
              </Button>
            )}
            {explainability.artifact_links.netsuite_post_url && (
              <Button size="sm" variant="outline" className="h-7 text-xs">
                <ExternalLink className="w-3 h-3 mr-1" />
                NetSuite Ref
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
