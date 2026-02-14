import { MVSeverity, MVLocationType } from "@/lib/revenue-leakage/types";

export interface TooltipState {
  x: number;
  y: number;
  content: React.ReactNode;
}

export type ActiveView = "dashboard" | "map" | "comparison" | "anomalies";

export type MapViewMode = "state" | "district";

export type SortByOption = "loss" | "drr" | "transactions" | "severity";

export type TypeFilter = "all" | MVLocationType;

export interface SroTileFormatted {
  code: string;
  name: string;
  avg_drr: number;
  hotspots: number;
  color: string;
  loss: number;
}

export interface TopRule {
  rule_id: string;
  rule_name: string;
  count: number;
  impact: number;
  avg_drr: number;
}

export interface SeverityDistributionItem {
  label: string;
  count: number;
  color: string;
}
