"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type DynamicSheetColumn = {
  id: string;
  fieldKey: string;
  label: string;
  dataType: "string" | "number" | "date" | "currency" | "boolean";
  visible: boolean;
  pinned?: "left" | "right" | null;
  sortable?: boolean;
  width?: number;
};

export type CalculatedColumn = {
  id: string;
  name: string;
  fieldKey: string;
  expression: string;
  dataType: "number" | "currency" | "string" | "percentage";
  format?: string;
};

export type SheetFilter = {
  id: string;
  fieldKey: string;
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "contains" | "in";
  value: string | number | (string | number)[];
};

export type DynamicSheet = {
  id: string;
  name: string;
  description?: string;
  entity?: string;
  category?: "AP_AGING" | "AR_AGING" | "CASH" | "CUSTOM" | string;
  sourceType: "PROMPT_RESULT" | "DATA_TEMPLATE" | "MANUAL_UPLOAD";
  sourceRef?: string;
  promptText?: string;
  columns: DynamicSheetColumn[];
  calculatedColumns: CalculatedColumn[];
  filters: SheetFilter[];
  lastRefreshedAt?: string;
  rowCount?: number;
  isDirty?: boolean;
};

const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const defaultColumns: DynamicSheetColumn[] = [
  {
    id: "1",
    fieldKey: "INVOICE_NUMBER",
    label: "Invoice #",
    dataType: "string",
    visible: true,
    pinned: "left",
    sortable: true,
    width: 120,
  },
  {
    id: "2",
    fieldKey: "CUSTOMER_NAME",
    label: "Customer Name",
    dataType: "string",
    visible: true,
    pinned: null,
    sortable: true,
    width: 200,
  },
  {
    id: "3",
    fieldKey: "INVOICE_DATE",
    label: "Invoice Date",
    dataType: "date",
    visible: true,
    pinned: null,
    sortable: true,
    width: 120,
  },
  {
    id: "4",
    fieldKey: "DUE_DATE",
    label: "Due Date",
    dataType: "date",
    visible: true,
    pinned: null,
    sortable: true,
    width: 120,
  },
  {
    id: "5",
    fieldKey: "AGE",
    label: "Age (Days)",
    dataType: "number",
    visible: true,
    pinned: null,
    sortable: true,
    width: 100,
  },
  {
    id: "6",
    fieldKey: "BUCKET_IN_DAYS",
    label: "Bucket",
    dataType: "string",
    visible: true,
    pinned: null,
    sortable: true,
    width: 100,
  },
  {
    id: "7",
    fieldKey: "OPEN_BALANCE_USD",
    label: "Open Balance (USD)",
    dataType: "currency",
    visible: true,
    pinned: null,
    sortable: true,
    width: 150,
  },
  {
    id: "8",
    fieldKey: "PAYMENTS_USD",
    label: "Payments (USD)",
    dataType: "currency",
    visible: true,
    pinned: null,
    sortable: true,
    width: 150,
  },
  {
    id: "9",
    fieldKey: "STATUS",
    label: "Status",
    dataType: "string",
    visible: true,
    pinned: null,
    sortable: true,
    width: 120,
  },
];

const sampleSheet: DynamicSheet = {
  id: "sample-1",
  name: "Accounts Payable Aging Report",
  description: "Default AP Aging report for DoorDash Inc",
  entity: "DoorDash Inc",
  category: "AP_AGING",
  sourceType: "PROMPT_RESULT",
  promptText: "Give me the AP Aging Detail for DoorDash Inc",
  columns: defaultColumns,
  calculatedColumns: [],
  filters: [],
  lastRefreshedAt: new Date().toISOString(),
  rowCount: 7083,
  isDirty: false,
};

type DynamicSheetsContextType = {
  sheets: DynamicSheet[];
  activeSheetId: string | null;
  createSheet: (payload: Partial<DynamicSheet>) => DynamicSheet;
  updateSheet: (id: string, patch: Partial<DynamicSheet>) => void;
  setActiveSheet: (id: string) => void;
  duplicateSheet: (id: string) => DynamicSheet | null;
  deleteSheet: (id: string) => void;
  markDirty: (id: string, isDirty: boolean) => void;
  setSheets: (sheets: DynamicSheet[]) => void;
};

const DynamicSheetsContext = createContext<DynamicSheetsContextType | undefined>(undefined);

export function DynamicSheetsProvider({ children }: { children: ReactNode }) {
  const [sheets, setSheets] = useState<DynamicSheet[]>([sampleSheet]);
  const [activeSheetId, setActiveSheetId] = useState<string | null>("sample-1");

  const createSheet = (payload: Partial<DynamicSheet>): DynamicSheet => {
    const newSheet: DynamicSheet = {
      id: generateId(),
      name: payload.name || "Untitled Sheet",
      description: payload.description,
      entity: payload.entity,
      category: payload.category || "CUSTOM",
      sourceType: payload.sourceType || "MANUAL_UPLOAD",
      sourceRef: payload.sourceRef,
      promptText: payload.promptText,
      columns: payload.columns || defaultColumns,
      calculatedColumns: payload.calculatedColumns || [],
      filters: payload.filters || [],
      lastRefreshedAt: payload.lastRefreshedAt,
      rowCount: payload.rowCount,
      isDirty: false,
    };

    setSheets((prev) => [newSheet, ...prev]);
    setActiveSheetId(newSheet.id);

    // TODO: Backend API - POST /api/dynamic-sheets
    // await fetch('/api/dynamic-sheets', { method: 'POST', body: JSON.stringify(newSheet) });

    return newSheet;
  };

  const updateSheet = (id: string, patch: Partial<DynamicSheet>) => {
    setSheets((prev) => prev.map((sheet) => (sheet.id === id ? { ...sheet, ...patch } : sheet)));

    // TODO: Backend API - PATCH /api/dynamic-sheets/:id
    // await fetch(`/api/dynamic-sheets/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  };

  const setActiveSheetFunc = (id: string) => {
    setActiveSheetId(id);
  };

  const duplicateSheet = (id: string): DynamicSheet | null => {
    const original = sheets.find((s) => s.id === id);
    if (!original) return null;

    const duplicate: DynamicSheet = {
      ...original,
      id: generateId(),
      name: `${original.name} (Copy)`,
      lastRefreshedAt: undefined,
      rowCount: undefined,
      isDirty: false,
    };

    setSheets((prev) => [duplicate, ...prev]);
    setActiveSheetId(duplicate.id);

    // TODO: Backend API - POST /api/dynamic-sheets/:id/duplicate
    // await fetch(`/api/dynamic-sheets/${id}/duplicate`, { method: 'POST' });

    return duplicate;
  };

  const deleteSheet = (id: string) => {
    setSheets((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (activeSheetId === id) {
        setActiveSheetId(filtered[0]?.id || null);
      }
      return filtered;
    });

    // TODO: Backend API - DELETE /api/dynamic-sheets/:id
    // await fetch(`/api/dynamic-sheets/${id}`, { method: 'DELETE' });
  };

  const markDirty = (id: string, isDirty: boolean) => {
    setSheets((prev) => prev.map((sheet) => (sheet.id === id ? { ...sheet, isDirty } : sheet)));
  };

  const setSheetsFunc = (newSheets: DynamicSheet[]) => {
    setSheets(newSheets);
    // This would be called when loading from backend
    // const response = await fetch('/api/dynamic-sheets');
    // const sheets = await response.json();
    // setSheets(sheets);
  };

  return (
    <DynamicSheetsContext.Provider
      value={{
        sheets,
        activeSheetId,
        createSheet,
        updateSheet,
        setActiveSheet: setActiveSheetFunc,
        duplicateSheet,
        deleteSheet,
        markDirty,
        setSheets: setSheetsFunc,
      }}
    >
      {children}
    </DynamicSheetsContext.Provider>
  );
}

export function useDynamicSheetsStore() {
  const context = useContext(DynamicSheetsContext);
  if (!context) {
    throw new Error("useDynamicSheetsStore must be used within DynamicSheetsProvider");
  }
  return context;
}

export const getDefaultColumns = () => defaultColumns;
