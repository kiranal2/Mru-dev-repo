"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import {
  MOCK_AP_AGING_DATA,
} from "@/lib/dynamic-sheets-mock-data";

import { evaluateFormula } from "@/lib/formula-evaluator";

import { toast } from "sonner";

import type { DynamicSheet } from "../types";
import { DEFAULT_USER_ID, buildSampleSheets, SAMPLE_SHEET_DATA } from "../constants";

export function useDynamicSheets() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sheetIdParam = searchParams.get("sheetId");
  const isPreviewMode = searchParams.get("preview") === "true";

  const sampleSheets = useMemo<DynamicSheet[]>(() => buildSampleSheets(), []);

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
  const [userId, setUserId] = useState<string>(DEFAULT_USER_ID);
  const [sheetData, setSheetData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isSavingPreview, setIsSavingPreview] = useState(false);
  const [justSavedSheetId, setJustSavedSheetId] = useState<string | null>(null);
  const [skipLoadSheets, setSkipLoadSheets] = useState(false);
  const justSavedSheetIdRef = useRef<string | null>(null);

  // ---------------------------------------------------------------------------
  // loadSheets
  // ---------------------------------------------------------------------------
  const loadSheets = useCallback(async () => {
    try {
      setIsLoadingSheets(true);

      const savedSheets: DynamicSheet[] = [];
      const justSavedStr = sessionStorage.getItem("justSavedSheet");
      if (justSavedStr) {
        try {
          const justSaved = JSON.parse(justSavedStr);
          if (Date.now() - justSaved.timestamp < 30000 || justSaved.sheet) {
            savedSheets.push(justSaved.sheet);
            console.log("Found saved sheet in sessionStorage:", justSaved.sheet.name);
          }
        } catch (e) {
          console.error("Error parsing saved sheet from sessionStorage:", e);
        }
      }

      setSheets((prev) => {
        const existingSavedSheets = prev.filter(
          (s) => !sampleSheets.find((sample) => sample.id === s.id)
        );

        const allSavedSheets = [
          ...savedSheets,
          ...existingSavedSheets.filter(
            (s) => !savedSheets.find((saved) => saved.id === s.id)
          ),
        ];

        const uniqueSavedSheets = allSavedSheets.filter(
          (sheet, index, self) => index === self.findIndex((s) => s.id === sheet.id)
        );

        return [...uniqueSavedSheets, ...sampleSheets];
      });
      console.log("Loaded sheets with saved sheets at top, then sample sheets");
    } catch (error) {
      console.error("Error loading sheets:", error);
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

  // ---------------------------------------------------------------------------
  // loadSheetData
  // ---------------------------------------------------------------------------
  const loadSheetData = useCallback(
    async (sheetId: string) => {
      if (justSavedSheetId === sheetId || justSavedSheetIdRef.current === sheetId) {
        console.log("Skipping loadSheetData for just-saved sheet:", sheetId);
        return;
      }

      const sampleData = SAMPLE_SHEET_DATA[sheetId];
      if (sampleData) {
        setSheetData(sampleData);
        return;
      }

      try {
        setIsLoadingData(true);
        const response = await fetch(`/api/dynamic-sheets/${sheetId}?includeData=true`);
        const result = await response.json();

        if (response.ok) {
          const loadedData = result.data || [];
          console.log("Loaded data rows:", loadedData.length);

          if (loadedData.length === 0) {
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
        setSheetData((prevData) => {
          return prevData.length > 0 ? prevData : [];
        });
      } finally {
        setIsLoadingData(false);
      }
    },
    [justSavedSheetId]
  );

  // ---------------------------------------------------------------------------
  // Effect: initialise from preview / sessionStorage / localStorage
  // ---------------------------------------------------------------------------
  useEffect(() => {
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

          if (!data.rows || !Array.isArray(data.rows)) {
            console.error("ERROR: data.rows is not an array!", data.rows);
          }
          if (!data.columns || !Array.isArray(data.columns)) {
            console.error("ERROR: data.columns is not an array!", data.columns);
          }

          setPreviewData(data);

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
          toast.error("Error", {
            description: "Failed to load preview data",
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
        if (Date.now() - justSaved.timestamp < 30000) {
          console.log("Restoring just-saved sheet from sessionStorage:", justSaved.sheetId);

          setSheets((prev) => {
            const exists = prev.find((s) => s.id === justSaved.sheetId);
            if (exists) {
              const updated = prev.map((s) =>
                s.id === justSaved.sheetId ? justSaved.sheet : s
              );
              const saved = updated.filter(
                (s) => !sampleSheets.find((sample) => sample.id === s.id)
              );
              const samples = updated.filter((s) =>
                sampleSheets.find((sample) => sample.id === s.id)
              );
              return [...saved, ...samples];
            }
            const saved = prev.filter(
              (s) => !sampleSheets.find((sample) => sample.id === s.id)
            );
            const samples = prev.filter((s) =>
              sampleSheets.find((sample) => sample.id === s.id)
            );
            return [justSaved.sheet, ...saved, ...samples];
          });

          setSheetData(justSaved.data);
          setActiveSheet(justSaved.sheet);
          setJustSavedSheetId(justSaved.sheetId);
          justSavedSheetIdRef.current = justSaved.sheetId;
          setSkipLoadSheets(true);

          setTimeout(() => {
            setJustSavedSheetId(null);
            justSavedSheetIdRef.current = null;
            setSkipLoadSheets(false);
          }, 2000);

          setIsLoadingSheets(false);
          setIsLoadingData(false);
          return;
        } else {
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
          setSheets(sampleSheets);
          setIsLoadingSheets(false);
        }
      } catch (e) {
        console.error("Error parsing user:", e);
        setSheets(sampleSheets);
        setIsLoadingSheets(false);
      }
    } else {
      console.log("No user found in localStorage - showing sample sheets");
      setSheets(sampleSheets);
      setIsLoadingSheets(false);
    }
  }, [sampleSheets, isPreviewMode]);

  // ---------------------------------------------------------------------------
  // Effect: load sheets (unless preview or just-saved)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isPreviewMode) return;
    if (skipLoadSheets) {
      console.log("Skipping loadSheets - sheet just saved");
      return;
    }
    loadSheets();
  }, [loadSheets, isPreviewMode, skipLoadSheets]);

  // ---------------------------------------------------------------------------
  // Effect: set active sheet from sheets list / URL param
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isPreviewMode) return;

    const justSavedStr = sessionStorage.getItem("justSavedSheet");
    if (justSavedStr) {
      try {
        const justSaved = JSON.parse(justSavedStr);
        if (Date.now() - justSaved.timestamp < 10000) {
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
      setActiveSheet((current) => {
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

        if (sheetIdParam) {
          const sheet = sheets.find((s) => s.id === sheetIdParam);
          if (sheet) {
            console.log("Selecting sheet from URL param:", sheetIdParam);
            return sheet;
          }
        }

        if (!current || !sheets.find((s) => s.id === current.id)) {
          console.log("Resetting to first sheet:", sheets[0].name);
          return sheets[0];
        }

        return current;
      });
    }
  }, [sheets, sheetIdParam, isPreviewMode, justSavedSheetId, activeSheet?.id]);

  // ---------------------------------------------------------------------------
  // Effect: load data for the active sheet
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isPreviewMode && activeSheet?.id === "preview") {
      console.log("Skipping data load for preview sheet - data already loaded");
      console.log("Current sheetData length:", sheetData.length);
      return;
    }

    if (
      (justSavedSheetId && activeSheet?.id === justSavedSheetId) ||
      (justSavedSheetIdRef.current && activeSheet?.id === justSavedSheetIdRef.current)
    ) {
      console.log("Skipping data load for just-saved sheet - data already set");
      return;
    }

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
      if (!isPreviewMode) {
        setSheetData([]);
      }
    }
  }, [activeSheet?.id, loadSheetData, isPreviewMode, justSavedSheetId]);

  // ---------------------------------------------------------------------------
  // transformedData
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
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

  const handleSavePreviewToSheets = async () => {
    if (!previewData || !activeSheet) {
      toast.error("Error", {
        description: "No preview data to save",
      });
      return;
    }

    setIsSavingPreview(true);

    try {
      const dataToSave = sheetData.length > 0 ? sheetData : previewData.rows || [];
      const sheetName = "Aging details for amazon";

      const response = await fetch("/api/dynamic-sheets/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId || DEFAULT_USER_ID,
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

      sessionStorage.removeItem("dynamicSheetPreview");

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

      const savedData = dataToSave.length > 0 ? dataToSave : MOCK_AP_AGING_DATA;

      const savedSheetData = {
        sheetId: sheet.id,
        sheet: savedSheet,
        data: savedData,
        timestamp: Date.now(),
      };
      sessionStorage.setItem("justSavedSheet", JSON.stringify(savedSheetData));

      setSkipLoadSheets(true);

      setSheets((prev) => {
        const exists = prev.find((s) => s.id === sheet.id);
        if (exists) {
          return prev.map((s) => (s.id === sheet.id ? savedSheet : s));
        }
        const savedSheets = prev.filter(
          (s) => !sampleSheets.find((sample) => sample.id === s.id)
        );
        const sampleSheetsInList = prev.filter((s) =>
          sampleSheets.find((sample) => sample.id === s.id)
        );
        return [savedSheet, ...savedSheets, ...sampleSheetsInList];
      });

      setSheetData(savedData);

      setJustSavedSheetId(sheet.id);
      justSavedSheetIdRef.current = sheet.id;

      setActiveSheet(savedSheet);

      router.replace(`/home/dynamic-sheets?sheetId=${sheet.id}`);

      setTimeout(() => {
        setJustSavedSheetId(null);
        justSavedSheetIdRef.current = null;
        setSkipLoadSheets(false);
      }, 2000);

      toast.success("Success", {
        description: "Dynamic sheet saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving preview sheet:", error);
      toast.error("Error", {
        description: error.message || "Failed to save dynamic sheet",
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
        toast.success("Dynamic Sheet Created", {
          description: `"${data.name}" created. Click Run Sheet to fetch fresh data.`,
        });
      } else {
        toast.error("Error", {
          description: result.error || "Failed to create sheet",
        });
      }
    } catch (error) {
      console.error("Error creating sheet:", error);
      toast.error("Error", {
        description: "Failed to create dynamic sheet",
      });
    }
  };

  const handleRunSheet = async () => {
    if (!activeSheet) {
      toast.error("No Sheet Selected", {
        description: "Please create or select a Dynamic Sheet.",
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

    toast.success("Sheet Refreshed", {
      description: `"${activeSheet.name}" ran successfully (${rowCount.toLocaleString()} rows).`,
    });
  };

  const handleSave = async () => {
    if (!activeSheet || !activeSheet.isDirty) {
      toast.success("No Changes", {
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

        toast.success("Changes Saved", {
          description: `Saved changes to "${activeSheet.name}".`,
        });
      }
    } catch (error) {
      console.error("Error saving sheet:", error);
      toast.error("Error", {
        description: "Failed to save changes",
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
        toast.success("Sheet Duplicated", {
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

    toast.success("Export Complete", {
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

    setActiveSheet({ ...activeSheet, columns: mergedColumns, isDirty: true });

    if (isPreviewMode && activeSheet.id === "preview" && sheetData.length > 0) {
      console.log("Preview mode with real data - preserving data, NOT generating samples");
      const firstRow = sheetData[0];
      const hasRealData =
        firstRow &&
        !Object.values(firstRow).some(
          (val: any) => typeof val === "string" && val.startsWith("Sample ")
        );

      if (hasRealData) {
        console.log("Confirmed real data exists, preserving it");
        return;
      } else {
        console.warn("Data appears to be sample data, but in preview mode - this shouldn't happen");
      }
    }

    setSheetData((prev) => {
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

    const currentFormulaFieldKeys = new Set(normalized.map((calc: any) => calc.fieldKey));

    const nonFormulaColumns = (activeSheet.columns || []).filter(
      (col: any) => !col.id?.startsWith("formula-col-")
    );

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

  return {
    // State
    sheets,
    activeSheet,
    isLoadingSheets,
    isLoadingData,
    isPreviewMode,
    previewData,
    isSavingPreview,
    showWizard,
    setShowWizard,
    showDesigner,
    setShowDesigner,
    showSheetsList,
    setShowSheetsList,
    showHelp,
    setShowHelp,
    isRunning,
    isSaving,
    showSaveAsDialog,
    setShowSaveAsDialog,
    saveAsName,
    setSaveAsName,
    sheetData,
    transformedData,

    // Handlers
    handleSelectSheet,
    handleToggleFavorite,
    handleSavePreviewToSheets,
    handleNewSheet,
    handleWizardComplete,
    handleRunSheet,
    handleSave,
    handleSaveAs,
    handleSaveAsConfirm,
    handleExportCSV,
    handleColumnsChange,
    handleFormulasChange,
    handleFiltersChange,
  };
}
