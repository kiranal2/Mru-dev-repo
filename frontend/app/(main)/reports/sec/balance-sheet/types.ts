import type { PeriodNode, SubsidiaryNode } from "@/lib/balance-sheet-api";

export type ViewMode = "consolidated" | "comparative" | "trended";
export type DisplayMode = "millions" | "full";

export interface BalanceSheetFilters {
  view: ViewMode;
  asOfPeriods: string[];
  subsidiaries: string[];
  displayMode: DisplayMode;
}

export interface PendingFilters {
  pendingView: ViewMode;
  pendingPeriods: string[];
  pendingSubsidiaries: string[];
}

export interface HierarchicalFilterState {
  expandedPeriods: Set<string>;
  expandedSubsidiaries: Set<string>;
  periodSearch: string;
  subsidiarySearch: string;
  periodPopoverOpen: boolean;
  subsidiaryPopoverOpen: boolean;
}

export type { PeriodNode, SubsidiaryNode };
