// Import JSON data - Next.js handles this via resolveJsonModule
import balanceSheetData from "@/mock-api-responses/balance-sheet-api-response.json";

// Types matching the JSON structure
export interface BalanceSheetApiResponse {
  metadata: {
    reportType: string;
    reportName: string;
    currency: string;
    generatedAt: string;
    fiscalYearEnd: string;
    reportingStandard: string;
    format: string;
  };
  filters: {
    viewMode: {
      type: string;
      options: string[];
      description: string;
    };
    displayMode: {
      type: string;
      options: string[];
      description: string;
    };
    defaultPeriods: string[];
    defaultSubsidiaries: string[];
  };
  periodStructure: PeriodNode[];
  subsidiaryStructure: SubsidiaryNode[];
  financialData: {
    [subsidiaryId: string]: {
      subsidiaryId: string;
      subsidiaryName: string;
      rows: FinancialRowFromApi[];
    };
  };
  calculatedFields: {
    note: string;
    calculationRules: {
      dollarDifference: string;
      differencePercent: string;
      summaryRows: string;
    };
  };
  validation: {
    balanceCheck: {
      enabled: boolean;
      formula: string;
      description: string;
    };
    requiredFields: string[];
  };
}

export interface PeriodNode {
  id: string;
  label: string;
  type: "year" | "quarter" | "month";
  children?: PeriodNode[];
  year?: number;
  quarter?: number;
  month?: number;
}

export interface SubsidiaryNode {
  id: string;
  label: string;
  children?: SubsidiaryNode[];
}

export interface FinancialRowFromApi {
  financialRow: string;
  q1_2024?: number | null;
  q2_2024?: number | null;
  q3_2024?: number | null;
  q4_2024?: number | null;
  q1_2023?: number | null;
  q2_2023?: number | null;
  q3_2023?: number | null;
  q4_2023?: number | null;
  dollarDifference?: number | null;
  differencePercent?: number | null;
  group?: string;
  level?: number;
  expanded?: boolean;
  rowId: string;
  parentRowId: string | null;
  isSummary: boolean;
}

export interface FinancialRow {
  financialRow: string;
  q1_2024?: number;
  q2_2024?: number;
  q3_2024?: number;
  q4_2024?: number;
  q1_2023?: number;
  q2_2023?: number;
  q3_2023?: number;
  q4_2023?: number;
  dollarDifference?: number;
  differencePercent?: number;
  group?: string;
  level?: number;
  expanded?: boolean;
}

// Transform API response rows to FinancialRow format
function transformApiRowToFinancialRow(apiRow: FinancialRowFromApi): FinancialRow {
  return {
    financialRow: apiRow.financialRow,
    q1_2024: apiRow.q1_2024 ?? undefined,
    q2_2024: apiRow.q2_2024 ?? undefined,
    q3_2024: apiRow.q3_2024 ?? undefined,
    q4_2024: apiRow.q4_2024 ?? undefined,
    q1_2023: apiRow.q1_2023 ?? undefined,
    q2_2023: apiRow.q2_2023 ?? undefined,
    q3_2023: apiRow.q3_2023 ?? undefined,
    q4_2023: apiRow.q4_2023 ?? undefined,
    dollarDifference: apiRow.dollarDifference ?? undefined,
    differencePercent: apiRow.differencePercent ?? undefined,
    group: apiRow.group,
    level: apiRow.level,
    expanded: apiRow.expanded,
  };
}

// Get balance sheet data from API response
export function getBalanceSheetData(): BalanceSheetApiResponse {
  return balanceSheetData as BalanceSheetApiResponse;
}

// Get financial rows for a specific subsidiary
export function getFinancialRowsForSubsidiary(subsidiaryName: string): FinancialRow[] {
  const apiData = getBalanceSheetData();

  // Find the subsidiary by name
  const subsidiaryEntry = Object.values(apiData.financialData).find(
    (sub) => sub.subsidiaryName === subsidiaryName
  );

  if (!subsidiaryEntry) {
    return [];
  }

  return subsidiaryEntry.rows.map(transformApiRowToFinancialRow);
}

// Get financial rows for multiple subsidiaries
export function getFinancialRowsForSubsidiaries(subsidiaryNames: string[]): FinancialRow[] {
  if (subsidiaryNames.length === 0) {
    return [];
  }

  // For multiple subsidiaries in comparative view, return the first one's data
  // (The page handles comparative display in columns)
  if (subsidiaryNames.length === 1) {
    return getFinancialRowsForSubsidiary(subsidiaryNames[0]);
  }

  // If multiple subsidiaries, use the first one as primary data source
  return getFinancialRowsForSubsidiary(subsidiaryNames[0]);
}

// Get period structure from API
export function getPeriodStructure(): PeriodNode[] {
  const apiData = getBalanceSheetData();
  return apiData.periodStructure;
}

// Get subsidiary structure from API
export function getSubsidiaryStructure(): SubsidiaryNode[] {
  const apiData = getBalanceSheetData();
  return apiData.subsidiaryStructure;
}

// Get default filters from API
export function getDefaultFilters() {
  const apiData = getBalanceSheetData();
  return {
    defaultPeriods: apiData.filters.defaultPeriods,
    defaultSubsidiaries: apiData.filters.defaultSubsidiaries,
    defaultView: apiData.filters.viewMode.type as "consolidated" | "comparative" | "trended",
    defaultDisplayMode: apiData.filters.displayMode.type as "millions" | "full",
  };
}

// Get Averra financial rows (for comparative view column rendering)
export function getWoltFinancialRows(): FinancialRow[] {
  const apiData = getBalanceSheetData();

  const woltEntry = apiData.financialData["averra-oy"];
  if (!woltEntry) {
    return [];
  }

  return woltEntry.rows.map(transformApiRowToFinancialRow);
}

// Helper to get financial row by rowId from API data
export function getFinancialRowById(
  subsidiaryId: string,
  rowId: string
): FinancialRowFromApi | undefined {
  const apiData = getBalanceSheetData();
  const subsidiaryEntry = apiData.financialData[subsidiaryId];

  if (!subsidiaryEntry) {
    return undefined;
  }

  return subsidiaryEntry.rows.find((row) => row.rowId === rowId);
}
