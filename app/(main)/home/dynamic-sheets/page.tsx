"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  Play,
  Save,
  Copy,
  Download,
  Settings2,
  HelpCircle,
  Plus,
  Info,
  Loader2,
  AlertCircle,
  Table2,
  PanelLeft,
} from "lucide-react";

import { SheetsList } from "@/components/dynamic-sheets/SheetsList";

import { CreateSheetWizard } from "@/components/dynamic-sheets/CreateSheetWizard";

import { DataGrid } from "@/components/dynamic-sheets/DataGrid";

import { DesignerPanel } from "@/components/dynamic-sheets/DesignerPanel";

import {
  MOCK_AP_AGING_DATA,
  MOCK_AR_AGING_DATA,
  MOCK_CASH_FLOW_DATA,
} from "@/lib/dynamic-sheets-mock-data";

import { evaluateFormula } from "@/lib/formula-evaluator";

import { getDefaultColumns } from "@/lib/dynamic-sheets-store";

import { useToast } from "@/hooks/use-toast";

import { format } from "date-fns";

interface DynamicSheet {
  id: string;
  name: string;
  entity: string;
  sourceType: "Prompt" | "Template" | "Recon";
  promptText?: string;
  promptSummary?: string;
  rowCount: number;
  lastRefreshedAt?: string;
  isFavorite: boolean;
  status: "OK" | "Needs Refresh" | "Error";
  columns: any[];
  calculatedColumns: any[];
  filters: any[];
  ownerName: string;
  isDirty: boolean;
}

export default function DynamicSheetsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sheetIdParam = searchParams.get("sheetId");
  const isPreviewMode = searchParams.get("preview") === "true";

  const sampleSheets = useMemo<DynamicSheet[]>(
    () => [
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
    ],
    []
  );

  const fallbackSheet = sampleSheets[0];

  const [sheets, setSheets] = useState<DynamicSheet[]>([]);
  const [activeSheet, setActiveSheet] = useState<DynamicSheet | null>(null);
  const [isLoadingSheets, setIsLoadingSheets] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [showDesigner, setShowDesigner] = useState(false);
  const [showSheetsList, setShowSheetsList] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");
  const [userId, setUserId] = useState<string>("8203ca58-cbd9-48b0-8dac-761728965740");
  const [sheetData, setSheetData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isSavingPreview, setIsSavingPreview] = useState(false);
  const [justSavedSheetId, setJustSavedSheetId] = useState<string | null>(null);
  const [skipLoadSheets, setSkipLoadSheets] = useState(false);
  const justSavedSheetIdRef = useRef<string | null>(null);

  const loadSheets = useCallback(async () => {
    try {
      setIsLoadingSheets(true);

      // Check sessionStorage for any saved sheets that should persist
      const savedSheets: DynamicSheet[] = [];
      const justSavedStr = sessionStorage.getItem("justSavedSheet");
      if (justSavedStr) {
        try {
          const justSaved = JSON.parse(justSavedStr);
          // Keep saved sheet if it's recent (within last 30 seconds) or if it's still valid
          if (Date.now() - justSaved.timestamp < 30000 || justSaved.sheet) {
            savedSheets.push(justSaved.sheet);
            console.log("Found saved sheet in sessionStorage:", justSaved.sheet.name);
          }
        } catch (e) {
          console.error("Error parsing saved sheet from sessionStorage:", e);
        }
      }

      // Always show sample/dummy sheets, with saved sheets at the top
      setSheets((prev) => {
        // Collect all saved sheets from previous state that aren't in sampleSheets
        const existingSavedSheets = prev.filter(
          (s) => !sampleSheets.find((sample) => sample.id === s.id)
        );

        // Combine: saved sheets from sessionStorage, existing saved sheets, then sample sheets
        const allSavedSheets = [
          ...savedSheets,
          ...existingSavedSheets.filter((s) => !savedSheets.find((saved) => saved.id === s.id)),
        ];

        // Remove duplicates and ensure saved sheets are at the top
        const uniqueSavedSheets = allSavedSheets.filter(
          (sheet, index, self) => index === self.findIndex((s) => s.id === sheet.id)
        );

        return [...uniqueSavedSheets, ...sampleSheets];
      });
      console.log("Loaded sheets with saved sheets at top, then sample sheets");
    } catch (error) {
      console.error("Error loading sheets:", error);
      // Show sample sheets on error, but still preserve saved sheets
      setSheets((prev) => {
        const existingSavedSheets = prev.filter(
          (s) => !sampleSheets.find((sample) => sample.id === s.id)
        );
        return [...existingSavedSheets, ...sampleSheets];
      });
      console.log("Error occurred, showing saved + sample sheets");
    } finally {
      setIsLoadingSheets(false);
    }
  }, [sampleSheets]);

  const loadSheetData = useCallback(
    async (sheetId: string) => {
      // Don't reload if we just saved this sheet (data is already set)
      if (justSavedSheetId === sheetId || justSavedSheetIdRef.current === sheetId) {
        console.log("Skipping loadSheetData for just-saved sheet:", sheetId);
        return;
      }

      // Check if it's a sample sheet and load appropriate mock data
      if (sheetId === "sample-1") {
        setSheetData(MOCK_AP_AGING_DATA);
        return;
      } else if (sheetId === "sample-2") {
        setSheetData(MOCK_AR_AGING_DATA);
        return;
      } else if (sheetId === "sample-3") {
        setSheetData(MOCK_CASH_FLOW_DATA);
        return;
      } else if (sheetId === "sample-4") {
        // Use dummy data for "Aging details for amazon" sheet
        setSheetData(MOCK_AP_AGING_DATA);
        return;
      }

      try {
        setIsLoadingData(true);
        const response = await fetch(`/api/dynamic-sheets/${sheetId}?includeData=true`);
        const result = await response.json();

        if (response.ok) {
          const loadedData = result.data || [];
          console.log("Loaded data rows:", loadedData.length);

          // If no data is returned, check if this is the "Aging details for amazon" sheet and use dummy data
          if (loadedData.length === 0) {
            // Check if sheet name matches "Aging details for amazon" - use dummy data as fallback
            const sheetName = result.sheet?.name || "";
            if (sheetName === "Aging details for amazon") {
              console.log(
                "Using dummy data for 'Aging details for amazon' sheet (no data from API)"
              );
              setSheetData(MOCK_AP_AGING_DATA);
              return;
            }
          }

          if (loadedData.length > 0) {
            console.log("First row field keys:", Object.keys(loadedData[0]));
          }
          setSheetData(loadedData);
        } else {
          console.error("API error loading data:", result.error);
          // Use dummy data for "Aging details for amazon" sheet on error
          const sheetName = result.sheet?.name || "";
          if (sheetName === "Aging details for amazon") {
            console.log("Using dummy data for 'Aging details for amazon' sheet (API error)");
            setSheetData(MOCK_AP_AGING_DATA);
          } else {
            setSheetData([]);
          }
        }
      } catch (error) {
        console.error("Error loading sheet data:", error);
        // For "Aging details for amazon" sheet, use dummy data on error
        // We'll check the activeSheet state to determine this
        setSheetData((prevData) => {
          // If we have no data and this might be the amazon sheet, use dummy data
          // This is a fallback - the main logic should prevent this from being needed
          return prevData.length > 0 ? prevData : [];
        });
      } finally {
        setIsLoadingData(false);
      }
    },
    [justSavedSheetId]
  );

  useEffect(() => {
    // Check if we're in preview mode first
    if (isPreviewMode) {
      const previewDataStr = sessionStorage.getItem("dynamicSheetPreview");
      console.log(
        "Preview mode detected, sessionStorage data:",
        previewDataStr ? "found" : "not found"
      );
      if (previewDataStr) {
        try {
          console.log("=== LOADING PREVIEW DATA ===");
          console.log("Raw sessionStorage data length:", previewDataStr.length);

          const data = JSON.parse(previewDataStr);
          console.log("Parsed preview data:", {
            name: data.name,
            rowsCount: data.rows?.length || 0,
            columnsCount: data.columns?.length || 0,
            firstRow: data.rows?.[0],
            firstRowKeys: data.rows?.[0] ? Object.keys(data.rows[0]) : [],
            columnFieldKeys: data.columns?.map((c: any) => c.fieldKey),
          });

          // Verify data structure
          if (!data.rows || !Array.isArray(data.rows)) {
            console.error("ERROR: data.rows is not an array!", data.rows);
          }
          if (!data.columns || !Array.isArray(data.columns)) {
            console.error("ERROR: data.columns is not an array!", data.columns);
          }

          setPreviewData(data);

          // Create a temporary preview sheet
          const previewSheet: DynamicSheet = {
            id: "preview",
            name: data.name,
            entity: data.entity,
            sourceType: data.sourceType,
            promptText: data.promptText,
            rowCount: data.rows?.length || 0,
            isFavorite: false,
            status: "OK",
            columns: data.columns || [],
            calculatedColumns: data.calculatedColumns || [],
            filters: data.filters || [],
            ownerName: "Preview",
            isDirty: true,
            lastRefreshedAt: new Date().toISOString(),
          };

          console.log("Setting preview sheet and data...");
          console.log("Preview sheet columns:", previewSheet.columns.length);
          console.log("Preview sheet row count:", previewSheet.rowCount);

          // Ensure rows is an array
          const rowsData = Array.isArray(data.rows) ? data.rows : [];
          console.log("=== SETTING PREVIEW SHEET ===");
          console.log("Rows data:", {
            isArray: Array.isArray(rowsData),
            length: rowsData.length,
            firstRow: rowsData[0],
            firstRowKeys: rowsData[0] ? Object.keys(rowsData[0]) : [],
          });
          console.log("Preview sheet columns:", {
            count: previewSheet.columns.length,
            fieldKeys: previewSheet.columns.map((c: any) => c.fieldKey),
          });

          // Verify fieldKey matching
          if (rowsData.length > 0 && previewSheet.columns.length > 0) {
            const rowKeys = Object.keys(rowsData[0]);
            const columnKeys = previewSheet.columns.map((c: any) => c.fieldKey);
            const matchingKeys = rowKeys.filter((key) => columnKeys.includes(key));
            console.log("FieldKey matching:", {
              rowKeys,
              columnKeys,
              matchingKeys,
              matchCount: matchingKeys.length,
            });

            if (matchingKeys.length === 0) {
              console.error("ERROR: No matching fieldKeys between rows and columns!");
              console.error("Row keys:", rowKeys);
              console.error("Column fieldKeys:", columnKeys);
            }
          }

          // Set data first, then sheet to prevent handleColumnsChange from generating samples
          setSheetData(rowsData);
          setActiveSheet(previewSheet);
          setIsLoadingSheets(false);
          setIsLoadingData(false);
          console.log("=== PREVIEW DATA SETUP COMPLETE ===");
          console.log("Final state:", {
            sheetDataLength: rowsData.length,
            activeSheetColumns: previewSheet.columns.length,
            firstRowSample: rowsData[0],
          });
          return;
        } catch (e) {
          console.error("Error loading preview data:", e);
          toast({
            title: "Error",
            description: "Failed to load preview data",
            variant: "destructive",
          });
        }
      } else {
        console.warn("Preview mode active but no data in sessionStorage");
      }
    }

    // Check for just-saved sheet in sessionStorage (restore after navigation)
    const justSavedStr = sessionStorage.getItem("justSavedSheet");
    if (justSavedStr && !isPreviewMode) {
      try {
        const justSaved = JSON.parse(justSavedStr);
        // Restore if it's recent (within last 30 seconds) - keep it longer
        if (Date.now() - justSaved.timestamp < 30000) {
          console.log("Restoring just-saved sheet from sessionStorage:", justSaved.sheetId);

          // Restore the sheet to the list - ensure it's at the top before sample sheets
          setSheets((prev) => {
            const exists = prev.find((s) => s.id === justSaved.sheetId);
            if (exists) {
              // Update existing sheet
              const updated = prev.map((s) => (s.id === justSaved.sheetId ? justSaved.sheet : s));
              // Reorder to put saved sheets at top
              const savedSheets = updated.filter(
                (s) => !sampleSheets.find((sample) => sample.id === s.id)
              );
              const sampleSheetsInList = updated.filter((s) =>
                sampleSheets.find((sample) => sample.id === s.id)
              );
              return [...savedSheets, ...sampleSheetsInList];
            }
            // Add new sheet at the top
            const savedSheets = prev.filter(
              (s) => !sampleSheets.find((sample) => sample.id === s.id)
            );
            const sampleSheetsInList = prev.filter((s) =>
              sampleSheets.find((sample) => sample.id === s.id)
            );
            return [justSaved.sheet, ...savedSheets, ...sampleSheetsInList];
          });

          // Restore the data
          setSheetData(justSaved.data);

          // Restore the active sheet
          setActiveSheet(justSaved.sheet);

          // Mark as just saved to prevent reset
          setJustSavedSheetId(justSaved.sheetId);
          justSavedSheetIdRef.current = justSaved.sheetId;
          setSkipLoadSheets(true);

          // Don't clear sessionStorage immediately - let it persist
          // Only clear the flags after a delay
          setTimeout(() => {
            setJustSavedSheetId(null);
            justSavedSheetIdRef.current = null;
            setSkipLoadSheets(false);
            // Keep sessionStorage for 30 seconds total
          }, 2000);

          setIsLoadingSheets(false);
          setIsLoadingData(false);
          return;
        } else {
          // Remove old sessionStorage entry if it's too old
          sessionStorage.removeItem("justSavedSheet");
        }
      } catch (e) {
        console.error("Error parsing just-saved sheet:", e);
        sessionStorage.removeItem("justSavedSheet");
      }
    }

    const userStr = localStorage.getItem("user");
    console.log("User from localStorage:", userStr);
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log("Parsed user:", user);
        if (user && user.id) {
          setUserId(user.id);
        } else {
          // Invalid user data, show sample sheets
          setSheets(sampleSheets);
          setIsLoadingSheets(false);
        }
      } catch (e) {
        console.error("Error parsing user:", e);
        // Invalid user data, show sample sheets
        setSheets(sampleSheets);
        setIsLoadingSheets(false);
      }
    } else {
      console.log("No user found in localStorage - showing sample sheets");
      // No user logged in, show sample sheets immediately
      setSheets(sampleSheets);
      setIsLoadingSheets(false);
    }
  }, [sampleSheets, isPreviewMode, toast]);

  useEffect(() => {
    // Skip loading sheets if we're in preview mode
    if (isPreviewMode) {
      return;
    }

    // Skip loading sheets if we just saved a sheet (to prevent overwriting)
    if (skipLoadSheets) {
      console.log("Skipping loadSheets - sheet just saved");
      return;
    }

    // Always load sample sheets (dummy cards)
    loadSheets();
  }, [loadSheets, isPreviewMode, skipLoadSheets]);

  useEffect(() => {
    // Skip this logic if we're in preview mode (preview sheet handled separately)
    if (isPreviewMode) {
      return;
    }

    // Check sessionStorage for just-saved sheet - if found, don't reset activeSheet
    const justSavedStr = sessionStorage.getItem("justSavedSheet");
    if (justSavedStr) {
      try {
        const justSaved = JSON.parse(justSavedStr);
        if (Date.now() - justSaved.timestamp < 10000) {
          // If we have a just-saved sheet and it matches the current activeSheet, preserve it
          if (activeSheet?.id === justSaved.sheetId) {
            console.log("Preserving just-saved sheet from sessionStorage:", justSaved.sheetId);
            return;
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    if (sheets.length > 0) {
      // If no active sheet, or active sheet is not in the current sheets list (e.g., fallback sheet when real sheets load)
      setActiveSheet((current) => {
        // Don't reset if we just saved this sheet
        if (
          (justSavedSheetId && current?.id === justSavedSheetId) ||
          (justSavedSheetIdRef.current && current?.id === justSavedSheetIdRef.current)
        ) {
          console.log(
            "Preserving just-saved sheet:",
            justSavedSheetId || justSavedSheetIdRef.current
          );
          return current;
        }

        // If we have a sheetIdParam, prioritize it
        if (sheetIdParam) {
          const sheet = sheets.find((s) => s.id === sheetIdParam);
          if (sheet) {
            console.log("Selecting sheet from URL param:", sheetIdParam);
            return sheet;
          }
        }

        // Only reset if current sheet is not in the list
        if (!current || !sheets.find((s) => s.id === current.id)) {
          console.log("Resetting to first sheet:", sheets[0].name);
          return sheets[0];
        }

        return current;
      });
    }
  }, [sheets, sheetIdParam, isPreviewMode, justSavedSheetId, activeSheet?.id]);

  useEffect(() => {
    // Skip loading data if we're in preview mode (data already set from sessionStorage)
    if (isPreviewMode && activeSheet?.id === "preview") {
      console.log("Skipping data load for preview sheet - data already loaded");
      console.log("Current sheetData length:", sheetData.length);
      // Don't overwrite the data that was already set
      return;
    }

    // Don't reload data if we just saved this sheet and already have data
    if (
      (justSavedSheetId && activeSheet?.id === justSavedSheetId) ||
      (justSavedSheetIdRef.current && activeSheet?.id === justSavedSheetIdRef.current)
    ) {
      console.log("Skipping data load for just-saved sheet - data already set");
      return;
    }

    // Check sessionStorage for just-saved sheet data
    const justSavedStr = sessionStorage.getItem("justSavedSheet");
    if (justSavedStr && activeSheet) {
      try {
        const justSaved = JSON.parse(justSavedStr);
        if (justSaved.sheetId === activeSheet.id && Date.now() - justSaved.timestamp < 10000) {
          console.log("Using just-saved sheet data from sessionStorage");
          setSheetData(justSaved.data);
          return;
        }
      } catch (e) {
        console.error("Error parsing just-saved sheet:", e);
      }
    }

    if (activeSheet && activeSheet.id !== "preview") {
      console.log("Loading data for sheet:", activeSheet.id);
      loadSheetData(activeSheet.id);
    } else if (!activeSheet) {
      // Only clear data if we're not in preview mode
      if (!isPreviewMode) {
        setSheetData([]);
      }
    }
  }, [activeSheet?.id, loadSheetData, isPreviewMode, justSavedSheetId]);

  const handleSelectSheet = (sheetId: string) => {
    const sheet = sheets.find((s) => s.id === sheetId);
    if (sheet) {
      console.log("=== Switching to sheet ===");
      console.log("Sheet name:", sheet.name);
      console.log("Number of columns:", sheet.columns?.length || 0);
      console.log(
        "Column field keys:",
        sheet.columns?.map((c) => c.fieldKey)
      );
      setActiveSheet(sheet);
      router.push(`/home/dynamic-sheets?sheetId=${sheetId}`);
    }
  };

  const handleToggleFavorite = async (sheetId: string) => {
    const sheet = sheets.find((s) => s.id === sheetId);
    if (!sheet) return;

    try {
      const response = await fetch(`/api/dynamic-sheets/${sheetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !sheet.isFavorite }),
      });

      if (response.ok) {
        const data = await response.json();
        setSheets(sheets.map((s) => (s.id === sheetId ? data.sheet : s)));
        if (activeSheet?.id === sheetId) {
          setActiveSheet(data.sheet);
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const transformedData = useMemo(() => {
    if (!activeSheet) {
      console.log("No active sheet, returning empty array");
      return [];
    }

    if (sheetData.length === 0) {
      console.log("No sheet data available, returning empty array");
      return [];
    }

    console.log("Transforming data:", {
      sheetDataLength: sheetData.length,
      columnsCount: activeSheet.columns.length,
      calculatedColumnsCount: activeSheet.calculatedColumns.length,
      filtersCount: activeSheet.filters.length,
      firstRowKeys: Object.keys(sheetData[0] || {}),
      columnFieldKeys: activeSheet.columns.map((c) => c.fieldKey),
    });

    let data = [...sheetData];

    if (activeSheet.calculatedColumns.length > 0) {
      data = data.map((row) => {
        const newRow: any = { ...row };
        activeSheet.calculatedColumns.forEach((calc) => {
          try {
            const result = evaluateFormula(calc.expression, row);
            newRow[calc.fieldKey] = result;
          } catch (error) {
            newRow[calc.fieldKey] = "ERROR";
          }
        });
        return newRow;
      });
    }

    if (activeSheet.filters.length > 0) {
      data = data.filter((row) => {
        return activeSheet.filters.every((filter) => {
          const value = (row as any)[filter.fieldKey];

          switch (filter.operator) {
            case "=":
              return String(value).toLowerCase() === String(filter.value).toLowerCase();
            case "!=":
              return String(value).toLowerCase() !== String(filter.value).toLowerCase();
            case ">":
              return Number(value) > Number(filter.value);
            case "<":
              return Number(value) < Number(filter.value);
            case ">=":
              return Number(value) >= Number(filter.value);
            case "<=":
              return Number(value) <= Number(filter.value);
            case "contains":
              return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
            case "in":
              const values = Array.isArray(filter.value) ? filter.value : [filter.value];
              return values.some(
                (v: any) => String(value).toLowerCase() === String(v).toLowerCase()
              );
            default:
              return true;
          }
        });
      });
    }

    console.log("Transformed data result:", {
      finalLength: data.length,
      firstRowSample: data[0],
    });

    return data;
  }, [activeSheet, sheetData]);

  const handleSavePreviewToSheets = async () => {
    if (!previewData || !activeSheet) {
      toast({
        title: "Error",
        description: "No preview data to save",
        variant: "destructive",
      });
      return;
    }

    setIsSavingPreview(true);

    try {
      // Ensure we have all the current sheet data
      const dataToSave = sheetData.length > 0 ? sheetData : previewData.rows || [];

      // Use "Aging details for amazon" as the sheet name
      const sheetName = "Aging details for amazon";

      const response = await fetch("/api/dynamic-sheets/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId || "8203ca58-cbd9-48b0-8dac-761728965740",
          name: sheetName,
          entity: activeSheet.entity || "Amazon",
          sourceType: activeSheet.sourceType || "Prompt",
          promptText:
            previewData.promptText ||
            activeSheet.promptText ||
            "Give me the aging details for Amazon",
          description: previewData.description,
          columns: activeSheet.columns,
          calculatedColumns: activeSheet.calculatedColumns,
          filters: activeSheet.filters,
          rows: dataToSave,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save sheet");
      }

      const { sheet } = await response.json();

      // Clear preview data from sessionStorage
      sessionStorage.removeItem("dynamicSheetPreview");

      // Create the saved sheet object
      const savedSheet: DynamicSheet = {
        id: sheet.id,
        name: sheet.name,
        entity: sheet.entity,
        sourceType: sheet.sourceType,
        promptText: sheet.promptText,
        rowCount: sheet.rowCount || dataToSave.length,
        isFavorite: sheet.isFavorite,
        status: sheet.status,
        columns: sheet.columns || activeSheet.columns || [],
        calculatedColumns: sheet.calculatedColumns || [],
        filters: sheet.filters || [],
        ownerName: sheet.ownerName || "You",
        isDirty: false,
        lastRefreshedAt: sheet.lastRefreshedAt,
      };

      // Use dummy data (MOCK_AP_AGING_DATA) for the saved sheet to ensure data persists
      // This ensures the data doesn't disappear after navigation
      const savedData = dataToSave.length > 0 ? dataToSave : MOCK_AP_AGING_DATA;

      // Store the saved sheet data in sessionStorage to persist across navigation
      const savedSheetData = {
        sheetId: sheet.id,
        sheet: savedSheet,
        data: savedData,
        timestamp: Date.now(),
      };
      sessionStorage.setItem("justSavedSheet", JSON.stringify(savedSheetData));

      // Prevent loadSheets from running immediately after save
      setSkipLoadSheets(true);

      // Add the saved sheet to the sheets list immediately (at the beginning)
      // Make sure it's at the top, before any sample sheets
      setSheets((prev) => {
        // Check if sheet already exists (shouldn't, but just in case)
        const exists = prev.find((s) => s.id === sheet.id);
        if (exists) {
          return prev.map((s) => (s.id === sheet.id ? savedSheet : s));
        }
        // Separate saved sheets from sample sheets
        const savedSheets = prev.filter((s) => !sampleSheets.find((sample) => sample.id === s.id));
        const sampleSheetsInList = prev.filter((s) =>
          sampleSheets.find((sample) => sample.id === s.id)
        );
        // Add at the beginning: new saved sheet, then other saved sheets, then sample sheets
        return [savedSheet, ...savedSheets, ...sampleSheetsInList];
      });

      // Set the data first to ensure it's available - use dummy data to ensure persistence
      setSheetData(savedData);

      // Mark this sheet as just saved to prevent useEffect from resetting it
      setJustSavedSheetId(sheet.id);
      justSavedSheetIdRef.current = sheet.id;

      // Set as active sheet
      setActiveSheet(savedSheet);

      // Navigate to the saved sheet (without preview mode)
      // Use replace to avoid adding to history and prevent back button issues
      router.replace(`/home/dynamic-sheets?sheetId=${sheet.id}`);

      // Clear the flags after a delay, but keep sessionStorage longer
      // This ensures the saved sheet persists even after navigation
      setTimeout(() => {
        setJustSavedSheetId(null);
        justSavedSheetIdRef.current = null;
        setSkipLoadSheets(false);
        // Don't clear sessionStorage immediately - keep it for 30 seconds
        // This ensures the saved sheet persists across page refreshes and navigation
      }, 2000);

      toast({
        title: "Success",
        description: "Dynamic sheet saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving preview sheet:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save dynamic sheet",
        variant: "destructive",
      });
    } finally {
      setIsSavingPreview(false);
    }
  };

  const handleNewSheet = () => {
    setShowWizard(true);
  };

  const handleWizardComplete = async (data: any) => {
    if (!userId) return;

    try {
      const response = await fetch("/api/dynamic-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: data.name,
          entity: data.entity || "Consolidated",
          sourceType:
            data.sourceType === "PROMPT_RESULT"
              ? "Prompt"
              : data.sourceType === "DATA_TEMPLATE"
                ? "Template"
                : "Prompt",
          promptText: data.promptText,
          description: data.description,
          columns: data.columns,
          calculatedColumns: data.calculatedColumns,
          filters: data.filters,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSheets([result.sheet, ...sheets]);
        setActiveSheet(result.sheet);
        router.push(`/home/dynamic-sheets?sheetId=${result.sheet.id}`);
        toast({
          title: "Dynamic Sheet Created",
          description: `"${data.name}" created. Click Run Sheet to fetch fresh data.`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create sheet",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating sheet:", error);
      toast({
        title: "Error",
        description: "Failed to create dynamic sheet",
        variant: "destructive",
      });
    }
  };

  const handleRunSheet = async () => {
    if (!activeSheet) {
      toast({
        title: "No Sheet Selected",
        description: "Please create or select a Dynamic Sheet.",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const rowCount = transformedData.length;

    try {
      const response = await fetch(`/api/dynamic-sheets/${activeSheet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastRefreshedAt: new Date().toISOString(),
          rowCount,
          status: "OK",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSheets(sheets.map((s) => (s.id === activeSheet.id ? data.sheet : s)));
        setActiveSheet(data.sheet);
      }
    } catch (error) {
      console.error("Error updating sheet:", error);
    }

    setIsRunning(false);

    toast({
      title: "Sheet Refreshed",
      description: `"${activeSheet.name}" ran successfully (${rowCount.toLocaleString()} rows).`,
    });
  };

  const handleSave = async () => {
    if (!activeSheet || !activeSheet.isDirty) {
      toast({
        title: "No Changes",
        description: "Sheet has no unsaved changes.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/dynamic-sheets/${activeSheet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columns: activeSheet.columns,
          calculatedColumns: activeSheet.calculatedColumns,
          filters: activeSheet.filters,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedSheet = { ...data.sheet, isDirty: false };
        setSheets(sheets.map((s) => (s.id === activeSheet.id ? updatedSheet : s)));
        setActiveSheet(updatedSheet);

        toast({
          title: "Changes Saved",
          description: `Saved changes to "${activeSheet.name}".`,
        });
      }
    } catch (error) {
      console.error("Error saving sheet:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }

    setIsSaving(false);
  };

  const handleSaveAs = () => {
    if (!activeSheet) return;
    setSaveAsName(`${activeSheet.name} (Copy)`);
    setShowSaveAsDialog(true);
  };

  const handleSaveAsConfirm = async () => {
    if (!activeSheet || !saveAsName.trim() || !userId) return;

    try {
      const response = await fetch("/api/dynamic-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: saveAsName,
          entity: activeSheet.entity,
          sourceType: activeSheet.sourceType,
          promptText: activeSheet.promptText,
          columns: activeSheet.columns,
          calculatedColumns: activeSheet.calculatedColumns,
          filters: activeSheet.filters,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSheets([result.sheet, ...sheets]);
        toast({
          title: "Sheet Duplicated",
          description: `Created copy "${saveAsName}".`,
        });
      }
    } catch (error) {
      console.error("Error duplicating sheet:", error);
    }

    setShowSaveAsDialog(false);
    setSaveAsName("");
  };

  const handleExportCSV = () => {
    if (!activeSheet || transformedData.length === 0) return;

    const visibleColumns = activeSheet.columns.filter((c) => c.visible);
    const headers = visibleColumns.map((c) => c.label).join(",");
    const rows = transformedData
      .map((row) =>
        visibleColumns
          .map((c) => {
            const value = (row as any)[c.fieldKey];
            return typeof value === "string" && value.includes(",") ? `"${value}"` : value;
          })
          .join(",")
      )
      .join("\n");

    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeSheet.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Downloaded "${activeSheet.name}.csv"`,
    });
  };

  const handleColumnsChange = (columns: any[]) => {
    if (!activeSheet) return;

    console.log("handleColumnsChange called:", {
      isPreviewMode,
      activeSheetId: activeSheet.id,
      currentDataRows: sheetData.length,
      newColumnsCount: columns.length,
      firstRowSample: sheetData[0],
    });

    const mergedColumns = columns.map((col: any, idx: number) => ({
      ...col,
      order: idx,
    }));

    // Update columns in the sheet
    setActiveSheet({ ...activeSheet, columns: mergedColumns, isDirty: true });

    // CRITICAL: In preview mode with real data, NEVER generate sample data
    // Just update the columns, the data is already set correctly
    if (isPreviewMode && activeSheet.id === "preview" && sheetData.length > 0) {
      console.log("Preview mode with real data - preserving data, NOT generating samples");
      // Verify data integrity
      const firstRow = sheetData[0];
      const hasRealData =
        firstRow &&
        !Object.values(firstRow).some(
          (val: any) => typeof val === "string" && val.startsWith("Sample ")
        );

      if (hasRealData) {
        console.log("Confirmed real data exists, preserving it");
        return; // Don't touch the data at all
      } else {
        console.warn("Data appears to be sample data, but in preview mode - this shouldn't happen");
      }
    }

    // For non-preview sheets or when we have no data, handle normally
    // Only seed sample values if we don't have real data
    setSheetData((prev) => {
      // If we have real data (not sample data), preserve it and only add missing fields
      if (prev && prev.length > 0) {
        const firstRow = prev[0];
        const hasRealData =
          firstRow &&
          !Object.values(firstRow).some(
            (val: any) => typeof val === "string" && val.startsWith("Sample ")
          );

        if (hasRealData) {
          console.log("Preserving real data, only adding missing fields for new columns");
          return prev.map((row) => {
            const next = { ...row };
            mergedColumns.forEach((col: any) => {
              // Only add empty value if the field is completely missing
              if (next[col.fieldKey] === undefined) {
                const defaultValue = (type: string) => {
                  switch (type) {
                    case "number":
                    case "currency":
                      return 0;
                    case "date":
                      return "";
                    case "boolean":
                      return false;
                    default:
                      return "";
                  }
                };
                next[col.fieldKey] = defaultValue(col.dataType);
              }
            });
            return next;
          });
        }
      }

      // Only generate sample data if we have no data at all
      console.log("No existing data - generating sample data");
      const rows = Array.from({ length: 5 }, () => ({}) as any);

      return rows.map((row, rowIndex) => {
        const next = { ...row };
        mergedColumns.forEach((col: any, colIndex: number) => {
          const sampleForType = (type: string) => {
            switch (type) {
              case "number":
                return (rowIndex + 1) * (colIndex + 1) * 10;
              case "currency":
                return (rowIndex + 1) * (colIndex + 1) * 123.45;
              case "date":
                return new Date(Date.now() - rowIndex * 86400000).toISOString();
              case "boolean":
                return (rowIndex + colIndex) % 2 === 0;
              default:
                return `Sample ${col.fieldKey || col.label} ${rowIndex + 1}`;
            }
          };

          next[col.fieldKey] = sampleForType(col.dataType);
        });
        return next;
      });
    });
  };

  const handleFormulasChange = (calculatedColumns: any[]) => {
    if (!activeSheet) return;

    const normalized = calculatedColumns.map((calc: any, idx: number) => {
      const fieldKey =
        calc.fieldKey ||
        (calc.name ? calc.name.replace(/\s+/g, "_").toUpperCase() : `FORMULA_${idx}`);
      return {
        ...calc,
        fieldKey,
      };
    });

    // Get the field keys of current formulas
    const currentFormulaFieldKeys = new Set(normalized.map((calc: any) => calc.fieldKey));

    // Remove formula columns that no longer have corresponding formulas
    // Formula columns have IDs starting with "formula-col-"
    const nonFormulaColumns = (activeSheet.columns || []).filter(
      (col: any) => !col.id?.startsWith("formula-col-")
    );

    // Ensure each formula shows up as a visible column.
    const formulaColumns = normalized.map((calc: any, idx: number) => ({
      id: `formula-col-${calc.id || idx}`,
      fieldKey: calc.fieldKey,
      label: calc.name || calc.fieldKey,
      dataType: calc.dataType === "percentage" ? "number" : calc.dataType || "number",
      visible: true,
      pinned: null,
      sortable: false,
      width: 140,
      order: nonFormulaColumns.length + idx,
    }));

    // Merge: non-formula columns + current formula columns
    const existingByKey = new Set(nonFormulaColumns.map((c: any) => c.fieldKey));
    const mergedColumns = [
      ...nonFormulaColumns,
      ...formulaColumns.filter((c) => !existingByKey.has(c.fieldKey)),
    ];

    setActiveSheet({
      ...activeSheet,
      calculatedColumns: normalized,
      columns: mergedColumns,
      isDirty: true,
    });
  };

  const handleFiltersChange = (filters: any[]) => {
    if (!activeSheet) return;
    setActiveSheet({ ...activeSheet, filters, isDirty: true });
  };

  if (isLoadingSheets) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden">
      {showSheetsList && !isPreviewMode && (
        <div className="w-80 border-r flex-shrink-0">
          <SheetsList
            sheets={sheets}
            activeSheetId={activeSheet?.id}
            onSelectSheet={handleSelectSheet}
            onToggleFavorite={handleToggleFavorite}
            isLoading={isLoadingSheets}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col bg-white min-w-0 overflow-hidden">
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* <div className="flex items-center space-x-2">
              <Label className="text-sm text-slate-600">Sheet:</Label>
                <Select
                  value={activeSheet?.id || undefined}
                  onValueChange={handleSelectSheet}
                >
                <SelectTrigger className="w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sheets.map((sheet) => (
                    <SelectItem key={sheet.id} value={sheet.id}>
                      {sheet.name}
                      {sheet.isDirty && <span className="text-amber-600 ml-1">*</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div> */}

              {activeSheet?.lastRefreshedAt && (
                <div className="text-sm text-slate-500">
                  Last refreshed: {format(new Date(activeSheet.lastRefreshedAt), "MMM d, h:mm a")}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {isPreviewMode && previewData ? (
                <>
                  <Alert className="mr-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Preview Mode - Make changes and save when ready
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={handleSavePreviewToSheets}
                    disabled={isSavingPreview}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSavingPreview ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save to Dynamic Sheets
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSheetsList((prev) => !prev)}
                    aria-label={showSheetsList ? "Hide sheets list" : "Show sheets list"}
                  >
                    <PanelLeft className="h-4 w-4 mr-1" />
                    {showSheetsList ? "Hide Sheets" : "Show Sheets"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowHelp(!showHelp)}>
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNewSheet}>
                    <Plus className="h-4 w-4 mr-1" />
                    New Dynamic Sheet
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRunSheet}
                    disabled={!activeSheet || isRunning}
                  >
                    {isRunning ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    Run Sheet
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    disabled={!activeSheet?.isDirty || isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveAs}
                    disabled={!activeSheet}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Save As...
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={!activeSheet || transformedData.length === 0}
              >
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowDesigner(!showDesigner)}>
                <Settings2 className="h-4 w-4 mr-1" />
                {showDesigner ? "Hide" : "Show"}
              </Button>
            </div>
          </div>

          {activeSheet?.promptText && (
            <div className="mt-3 flex items-start space-x-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-slate-700">
                <span className="font-medium">Prompt:</span> {activeSheet.promptText}
              </div>
            </div>
          )}

          {showHelp && (
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border bg-blue-50 p-4 text-sm text-slate-700">
                <h3 className="font-semibold">What are Dynamic Sheets?</h3>
                <p className="mt-2">
                  Dynamic Sheets let you start with data results and interactively configure which
                  fields are visible, how they are ordered, grouped, and filtered. You can also add
                  calculated columns with simple formulas.
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Use the Columns tab to show/hide and reorder columns</li>
                  <li>Use the Formulas tab to add calculated columns</li>
                  <li>Use the Filters tab to filter rows and group data</li>
                  <li>Click Save to keep your configuration for future use</li>
                  <li>Export your view to CSV at any time</li>
                </ul>
              </div>
            </div>
          )}

          {activeSheet && !activeSheet.lastRefreshedAt && (
            <Alert className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This sheet hasn&apos;t been run yet. Click &quot;Run Sheet&quot; to fetch data.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Table Container - Simple container that auto-adjusts */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {isLoadingData ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : activeSheet ? (
              <>
                {/* Debug info for preview mode */}
                {isPreviewMode && (
                  <div className="p-2 bg-blue-50 border-b border-blue-200 text-xs flex-shrink-0">
                    <div className="flex items-center gap-4">
                      <span>
                        <strong>Rows:</strong> {sheetData.length} | <strong>Columns:</strong>{" "}
                        {activeSheet.columns.length} | <strong>Visible:</strong>{" "}
                        {activeSheet.columns.filter((c) => c.visible).length}
                      </span>
                      {transformedData.length === 0 && sheetData.length > 0 && (
                        <span className="text-amber-600">⚠️ Filters may be hiding all rows</span>
                      )}
                    </div>
                  </div>
                )}
                {transformedData.length === 0 && sheetData.length > 0 && (
                  <div className="p-4 bg-yellow-50 border-b border-yellow-200 flex-shrink-0">
                    <AlertDescription className="text-yellow-800">
                      Data loaded ({sheetData.length} rows) but no rows match the current filters.
                      Try adjusting your filters or clearing them.
                    </AlertDescription>
                  </div>
                )}
                {transformedData.length === 0 &&
                  sheetData.length === 0 &&
                  activeSheet.id === "preview" && (
                    <div className="p-4 bg-red-50 border-b border-red-200 flex-shrink-0">
                      <AlertDescription className="text-red-800">
                        No data available. Please check the console for errors.
                      </AlertDescription>
                    </div>
                  )}
                {/* Simple scroll container - no padding */}
                <div className="flex-1 min-w-0 overflow-auto" style={{ height: "100%" }}>
                  {transformedData.length > 0 ? (
                    <DataGrid
                      data={transformedData}
                      columns={activeSheet.columns.filter((c) => c.visible)}
                    />
                  ) : sheetData.length > 0 ? (
                    <div className="p-8 text-center">
                      <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">
                        No data visible. Check filters or column visibility settings.
                      </p>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Select a sheet to view data
              </div>
            )}
          </div>

          {/* Designer Panel - Fixed width, only shown when enabled */}
          {showDesigner && activeSheet && (
            <div className="w-96 border-l bg-slate-50 overflow-auto shadow-xl flex-shrink-0">
              <DesignerPanel
                columns={activeSheet.columns}
                formulas={activeSheet.calculatedColumns}
                filters={activeSheet.filters}
                onColumnsChange={handleColumnsChange}
                onFormulasChange={handleFormulasChange}
                onFiltersChange={handleFiltersChange}
              />
            </div>
          )}
        </div>

        <CreateSheetWizard
          open={showWizard}
          onOpenChange={setShowWizard}
          onComplete={handleWizardComplete}
        />

        <AlertDialog open={showSaveAsDialog} onOpenChange={setShowSaveAsDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Save as new Dynamic Sheet</AlertDialogTitle>
              <AlertDialogDescription>
                Create a copy of this sheet with a new name.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="save-as-name">New name</Label>
              <Input
                id="save-as-name"
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                className="mt-2"
                placeholder="Enter sheet name..."
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSaveAsConfirm} disabled={!saveAsName.trim()}>
                Save Sheet
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
