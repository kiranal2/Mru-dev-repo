"use client";

import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { SignalsService } from "../services/SignalsService";

type Props = {
  signalId: string;
  onClose: () => void;
};

export function ExplainPanel({ signalId, onClose }: Props) {
  const { data: explanation } = useQuery({
    queryKey: ["explain", signalId],
    queryFn: () => SignalsService.explain(signalId),
  });

  if (!explanation) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-40">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="font-semibold">How was this computed?</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition"
          aria-label="Close explanation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-1">Rule Type</h4>
          <p className="text-sm">{explanation.type}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-1">Threshold</h4>
          <p className="text-sm">{explanation.threshold}</p>
        </div>

        {explanation.score !== null && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-1">Risk Score</h4>
            <p className="text-sm">{explanation.score} / 100</p>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-1">Rationale</h4>
          <p className="text-sm text-gray-300">{explanation.rationale}</p>
        </div>
      </div>
    </div>
  );
}
