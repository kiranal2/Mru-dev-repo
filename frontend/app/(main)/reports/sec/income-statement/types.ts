export interface FinancialRow {
  financialRow: string;
  q1_2024?: number;
  q2_2024?: number;
  q3_2024?: number;
  q4_2024?: number;
  q1_2023?: number;
  q2_2023?: number;
  dollarDifference?: number;
  differencePercent?: number;
  group?: string;
  level?: number;
  expanded?: boolean;
}

// Hierarchical period structure
export interface PeriodNode {
  id: string;
  label: string;
  type: "year" | "quarter" | "month";
  children?: PeriodNode[];
  year?: number;
  quarter?: number;
  month?: number;
}

// Hierarchical subsidiary structure
export interface SubsidiaryNode {
  id: string;
  label: string;
  children?: SubsidiaryNode[];
}
