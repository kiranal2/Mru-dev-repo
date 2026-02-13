"use client";

import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, TrendingUp, Target } from "lucide-react";

interface MatchContextBannerProps {
  paymentNumber: string;
  workstream: "AutoMatched" | "Exception" | "Critical" | "PendingToPost";
  matchType: "EXACT" | "TOLERANCE" | "OUTSIDE";
  confidence: number;
  tolerancePolicy?: {
    amount?: number;
    percent?: number;
    label: string;
  };
  isMultiEntity?: boolean;
  reasons?: string[];
  onViewEvidence?: () => void;
  onBackToPayment?: () => void;
}

export function MatchContextBanner({
  paymentNumber,
  workstream,
  matchType,
  confidence,
  tolerancePolicy,
  isMultiEntity,
  reasons = [],
  onViewEvidence,
  onBackToPayment,
}: MatchContextBannerProps) {
  const getWorkstreamColor = (ws: string) => {
    switch (ws) {
      case "AutoMatched":
        return "bg-green-100 text-green-800 border-green-200";
      case "Exception":
        return "bg-red-100 text-red-800 border-red-200";
      case "Critical":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "PendingToPost":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getMatchTypeColor = (mt: string) => {
    switch (mt) {
      case "EXACT":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "TOLERANCE":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "OUTSIDE":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getConfidenceIcon = () => {
    if (confidence >= 90) return <CheckCircle className="w-3.5 h-3.5 text-green-600" />;
    if (confidence >= 70) return <TrendingUp className="w-3.5 h-3.5 text-blue-600" />;
    return <AlertCircle className="w-3.5 h-3.5 text-amber-600" />;
  };

  const displayReasons = reasons.slice(0, 2);
  const moreReasons = reasons.length - 2;

  return (
    <div className="bg-white border-b px-8 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Resolving Payment:</span>
          <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">
            {paymentNumber}
          </button>
        </div>

        <div className="h-4 w-px bg-gray-300" />

        <Badge className={`${getWorkstreamColor(workstream)} border text-xs px-2.5 py-0.5`}>
          {workstream}
        </Badge>

        <Badge className={`${getMatchTypeColor(matchType)} border text-xs px-2.5 py-0.5`}>
          {matchType === "EXACT"
            ? "Exact Match"
            : matchType === "TOLERANCE"
              ? "Tolerance"
              : "Outside Tolerance"}
        </Badge>

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-gray-50 border border-gray-200 rounded-full">
          {getConfidenceIcon()}
          <span className="text-xs font-medium text-gray-700">{confidence}%</span>
        </div>

        {tolerancePolicy && matchType !== "EXACT" && (
          <span className="text-xs text-gray-600">
            Tolerance: {tolerancePolicy.amount ? `$${tolerancePolicy.amount}` : ""}
            {tolerancePolicy.amount && tolerancePolicy.percent ? " or " : ""}
            {tolerancePolicy.percent ? `${tolerancePolicy.percent}%` : ""}({tolerancePolicy.label})
          </span>
        )}

        {isMultiEntity && (
          <Badge className="bg-purple-100 text-purple-800 border border-purple-200 text-xs px-2.5 py-0.5">
            Multi-Entity
          </Badge>
        )}

        {displayReasons.map((reason, idx) => (
          <Badge key={idx} variant="outline" className="text-xs px-2.5 py-0.5 border-slate-300">
            {reason}
          </Badge>
        ))}

        {moreReasons > 0 && (
          <button
            onClick={onViewEvidence}
            className="text-xs px-2.5 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-full font-medium text-slate-700 transition-colors"
          >
            +{moreReasons} more
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {onBackToPayment && (
            <button
              onClick={onBackToPayment}
              className="text-xs px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md font-medium transition-colors"
            >
              Back to Payment
            </button>
          )}
          <button
            onClick={onViewEvidence}
            className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors flex items-center gap-1.5"
          >
            <Target className="w-3.5 h-3.5" />
            Evidence
          </button>
        </div>
      </div>
    </div>
  );
}
