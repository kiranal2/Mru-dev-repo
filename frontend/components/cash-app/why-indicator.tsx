"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PaymentExplainability } from "@/lib/cash-app-types";

interface WhyIndicatorProps {
  explainability?: PaymentExplainability;
}

export function WhyIndicator({ explainability }: WhyIndicatorProps) {
  if (!explainability) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-gray-100 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Info className="w-3.5 h-3.5 text-gray-500 hover:text-blue-600" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs p-3">
          <div className="space-y-2">
            <div className="font-semibold text-xs">{explainability.primary_reason_label}</div>

            {explainability.evidence_items.length > 0 && (
              <ul className="space-y-1 text-xs text-gray-700">
                {explainability.evidence_items.slice(0, 2).map((evidence, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>{evidence.text}</span>
                  </li>
                ))}
              </ul>
            )}

            {explainability.reason_codes.length > 0 && (
              <div className="pt-1 border-t text-xs">
                <span className="text-gray-600">
                  Match:{" "}
                  {explainability.reason_codes.includes("AMT_EXACT")
                    ? "Exact"
                    : explainability.reason_codes.includes("AMT_TOLERANCE")
                      ? "Tolerance"
                      : "Standard"}
                  {explainability.reason_codes.includes("IC_MULTI_ENTITY") && " | IC: Yes"}
                  {explainability.reason_codes.includes("JE_REQUIRED") && " | JE: Required"}
                  {explainability.reason_codes.includes("JE_NOT_REQUIRED") && " | JE: Not required"}
                </span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
