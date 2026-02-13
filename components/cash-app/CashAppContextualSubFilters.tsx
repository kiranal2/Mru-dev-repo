"use client";

import { Badge } from "@/components/ui/badge";
import { X, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SubFilterChipsProps {
  context: "exceptions" | "critical" | "pendingToPost";
  counts: Record<string, number> | any;
  activeFilter: string;
  onFilterClick: (filter: string) => void;
  onClearFilter?: () => void;
}

export function CashAppContextualSubFilters({
  context,
  counts,
  activeFilter,
  onFilterClick,
  onClearFilter,
}: SubFilterChipsProps) {
  const getChipsForContext = () => {
    if (context === "exceptions") {
      return {
        visible: [
          {
            label: "Remittance",
            filter: "MissingRemittance",
            count: counts.missingRemittance || 0,
          },
          { label: "Invoice", filter: "InvoiceIssue", count: counts.invoiceIssue || 0 },
          { label: "Mismatch", filter: "AmountMismatch", count: counts.amountMismatch || 0 },
          { label: "Interco", filter: "MultiEntity", count: counts.multiEntity || 0 },
          { label: "JE", filter: "JERequired", count: counts.jeRequired || 0 },
          {
            label: "Duplicate",
            filter: "DuplicateSuspected",
            count: counts.duplicateSuspected || 0,
          },
        ],
        more: [
          {
            label: "Parse",
            filter: "RemittanceParseError",
            count: counts.remittanceParseError || 0,
          },
          { label: "ACH", filter: "ACHFailure", count: counts.achFailure || 0 },
          {
            label: "On Account",
            filter: "UnappliedOnAccount",
            count: counts.unappliedOnAccount || 0,
          },
        ],
      };
    }

    if (context === "critical") {
      return {
        visible: [
          { label: "High $", filter: "HighValue", count: counts.highValue || 0 },
          { label: "Overdue", filter: "SLABreach", count: counts.slaBreach || 0 },
          { label: "Sync Risk", filter: "NetSuiteSyncRisk", count: counts.netSuiteSyncRisk || 0 },
          { label: "Blocked", filter: "PostingBlocked", count: counts.postingBlocked || 0 },
          {
            label: "Escalated",
            filter: "CustomerEscalation",
            count: counts.customerEscalation || 0,
          },
        ],
        more: [
          { label: "Settlement", filter: "SettlementRisk", count: counts.settlementRisk || 0 },
        ],
      };
    }

    if (context === "pendingToPost") {
      return {
        visible: [
          { label: "Ready", filter: "READY", count: counts.readyToPost || 0 },
          { label: "Approval", filter: "APPROVAL_NEEDED", count: counts.approvalNeeded || 0 },
          {
            label: "JE Pending",
            filter: "JE_APPROVAL_PENDING",
            count: counts.jeApprovalPending || 0,
          },
          { label: "Syncing", filter: "SYNC_PENDING", count: counts.syncPending || 0 },
          { label: "Failed", filter: "FAILED", count: counts.postingFailed || 0 },
        ],
        more: [
          {
            label: "Bank Match",
            filter: "BANK_MATCH_PENDING",
            count: counts.bankMatchPending || 0,
          },
        ],
      };
    }

    return { visible: [], more: [] };
  };

  const { visible, more } = getChipsForContext();
  const allChips = [...visible, ...more];
  const activeChip = allChips.find((chip) => chip.filter === activeFilter);
  const isActiveInMore = more.some((chip) => chip.filter === activeFilter);

  return (
    <div className="flex items-center gap-1.5">
      {visible.map((chip) => {
        const isActive = activeFilter === chip.filter;
        return (
          <button
            key={chip.filter}
            onClick={() => (isActive ? onClearFilter?.() : onFilterClick(chip.filter))}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs whitespace-nowrap transition-colors ${
              isActive
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <span className="font-medium">{chip.label}</span>
            <span
              className={`text-[10px] font-semibold px-1 py-0 rounded ${isActive ? "bg-blue-200/60" : "bg-slate-100"}`}
            >
              {chip.count}
            </span>
            {isActive && <X className="w-3 h-3 ml-0.5 opacity-60 hover:opacity-100" />}
          </button>
        );
      })}

      {more.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`flex items-center gap-1 px-2 py-1 rounded-md border text-xs whitespace-nowrap transition-colors ${
                isActiveInMore
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <span className="font-medium">{isActiveInMore ? activeChip?.label : "More"}</span>
              {isActiveInMore && activeChip && (
                <span className="text-[10px] font-semibold px-1 py-0 rounded bg-blue-200/60">
                  {activeChip.count}
                </span>
              )}
              <ChevronDown className="w-3 h-3" />
              {isActiveInMore && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearFilter?.();
                  }}
                  className="ml-0.5"
                  aria-label="Clear filter"
                >
                  <X className="w-3 h-3 opacity-60 hover:opacity-100" />
                </button>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {more.map((chip) => (
              <DropdownMenuItem
                key={chip.filter}
                onClick={() => onFilterClick(chip.filter)}
                className="flex items-center justify-between cursor-pointer text-xs"
              >
                <span className="font-medium text-slate-700">{chip.label}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5">
                  {chip.count}
                </Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
