import {
  MOCK_AP_AGING_DATA,
  MOCK_AR_AGING_DATA,
  MOCK_CASH_FLOW_DATA,
} from "@/lib/dynamic-sheets-mock-data";

import { getDefaultColumns } from "@/lib/dynamic-sheets-store";

import type { DynamicSheet } from "./types";

export const DEFAULT_USER_ID = "8203ca58-cbd9-48b0-8dac-761728965740";

export function buildSampleSheets(): DynamicSheet[] {
  return [
    {
      id: "sample-1",
      name: "Accounts Payable Aging Report",
      entity: "DoorDash Inc",
      sourceType: "Prompt",
      rowCount: MOCK_AP_AGING_DATA.length,
      isFavorite: false,
      status: "OK",
      columns: getDefaultColumns(),
      calculatedColumns: [],
      filters: [],
      ownerName: "Sample",
      isDirty: false,
      lastRefreshedAt: new Date().toISOString(),
      promptText: "Give me the AP Aging Detail for DoorDash Inc",
    },
    {
      id: "sample-2",
      name: "Accounts Receivable Aging Summary",
      entity: "Consolidated",
      sourceType: "Template",
      rowCount: 150,
      isFavorite: false,
      status: "OK",
      columns: getDefaultColumns(),
      calculatedColumns: [],
      filters: [],
      ownerName: "Sample",
      isDirty: false,
      lastRefreshedAt: new Date(Date.now() - 86400000).toISOString(),
      promptText: "Show me the Accounts Receivable aging summary",
    },
    {
      id: "sample-4",
      name: "Amazon Vendor Aging Report",
      entity: "Amazon",
      sourceType: "Prompt",
      rowCount: MOCK_AP_AGING_DATA.length,
      isFavorite: false,
      status: "OK",
      columns: getDefaultColumns(),
      calculatedColumns: [],
      filters: [],
      ownerName: "You",
      isDirty: false,
      lastRefreshedAt: new Date().toISOString(),
      promptText: "Give me the aging details for Amazon",
    },
    {
      id: "sample-3",
      name: "Quarterly Cash Flow Analysis",
      entity: "DoorDash Inc",
      sourceType: "Prompt",
      rowCount: 45,
      isFavorite: false,
      status: "Needs Refresh",
      columns: getDefaultColumns(),
      calculatedColumns: [],
      filters: [],
      ownerName: "Sample",
      isDirty: false,
      lastRefreshedAt: new Date(Date.now() - 172800000).toISOString(),
      promptText: "Generate cash flow analysis for the last quarter",
    },
  ];
}

/** Map sample sheet IDs to their mock data sets */
export const SAMPLE_SHEET_DATA: Record<string, any[] | undefined> = {
  "sample-1": MOCK_AP_AGING_DATA,
  "sample-2": MOCK_AR_AGING_DATA,
  "sample-3": MOCK_CASH_FLOW_DATA,
  "sample-4": MOCK_AP_AGING_DATA,
};
