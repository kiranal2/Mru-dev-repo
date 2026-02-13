"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EnhancedARItem } from "@/lib/cash-app-types";

interface EnhancedInvoiceCardProps {
  invoice: EnhancedARItem;
  isSelected: boolean;
  onClick: () => void;
  formatCurrency: (amount: number) => string;
}

export function EnhancedInvoiceCard({
  invoice,
  isSelected,
  onClick,
  formatCurrency,
}: EnhancedInvoiceCardProps) {
  const isClosedOrPaid = invoice.status !== "Open";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-green-100 text-green-800 border-green-200";
      case "Closed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Paid":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div
      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="font-medium text-sm text-gray-900">{invoice.invoiceNumber}</div>
          {invoice.entity && (
            <Badge variant="outline" className="text-xs">
              {invoice.entity}
            </Badge>
          )}
          {invoice.is_from_remittance_candidate && (
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 border text-xs">
              From Remittance
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isClosedOrPaid && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Invoice is closed/paid; may require JE or exception handling
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {isSelected && <CheckCircle2 className="w-4 h-4 text-green-600" />}
        </div>
      </div>

      <div className="flex items-center justify-between mb-1">
        <Badge className={`${getStatusColor(invoice.status)} border text-xs`}>
          {invoice.status}
        </Badge>
        <div className="text-lg font-bold text-gray-900">
          {formatCurrency(invoice.openAmount || invoice.amount)}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
        <span>Due: {invoice.dueDate}</span>
        {invoice.match_hint_score !== undefined && invoice.match_hint_score > 0 && (
          <Badge variant="outline" className="text-xs">
            Match: {Math.round(invoice.match_hint_score)}%
          </Badge>
        )}
      </div>
    </div>
  );
}
