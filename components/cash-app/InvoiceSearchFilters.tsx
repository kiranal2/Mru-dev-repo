"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle } from "lucide-react";

interface InvoiceSearchFiltersProps {
  openOnly: boolean;
  sameEntity: boolean;
  fromRemittance: boolean;
  likelyMatches: boolean;
  onOpenOnlyChange: (value: boolean) => void;
  onSameEntityChange: (value: boolean) => void;
  onFromRemittanceChange: (value: boolean) => void;
  onLikelyMatchesChange: (value: boolean) => void;
  selectedPaymentEntity?: string;
}

export function InvoiceSearchFilters({
  openOnly,
  sameEntity,
  fromRemittance,
  likelyMatches,
  onOpenOnlyChange,
  onSameEntityChange,
  onFromRemittanceChange,
  onLikelyMatchesChange,
  selectedPaymentEntity,
}: InvoiceSearchFiltersProps) {
  const toggles = [
    {
      label: "Open Only",
      value: openOnly,
      onChange: onOpenOnlyChange,
      enabled: true,
    },
    {
      label: "Same Entity",
      value: sameEntity,
      onChange: onSameEntityChange,
      enabled: !!selectedPaymentEntity,
      subtitle: selectedPaymentEntity,
    },
    {
      label: "From Remittance",
      value: fromRemittance,
      onChange: onFromRemittanceChange,
      enabled: true,
    },
    {
      label: "Likely Matches",
      value: likelyMatches,
      onChange: onLikelyMatchesChange,
      enabled: true,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {toggles.map((toggle) => (
        <button
          key={toggle.label}
          onClick={() => toggle.enabled && toggle.onChange(!toggle.value)}
          disabled={!toggle.enabled}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium
            transition-all duration-150
            ${
              toggle.value
                ? "bg-blue-100 border-blue-300 text-blue-800"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }
            ${!toggle.enabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {toggle.value ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
            <Circle className="w-3.5 h-3.5" />
          )}
          <span>{toggle.label}</span>
          {toggle.subtitle && toggle.value && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 ml-1">
              {toggle.subtitle}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}
