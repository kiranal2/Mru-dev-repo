"use client";

import { Button } from "@/components/ui/button";
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
  PanelLeft,
} from "lucide-react";

import { format } from "date-fns";

import type { DynamicSheet } from "../types";

interface SheetToolbarProps {
  activeSheet: DynamicSheet | null;
  isPreviewMode: boolean;
  previewData: any;
  isSavingPreview: boolean;
  showSheetsList: boolean;
  showHelp: boolean;
  showDesigner: boolean;
  isRunning: boolean;
  isSaving: boolean;
  transformedDataLength: number;
  onToggleSheetsList: () => void;
  onToggleHelp: () => void;
  onToggleDesigner: () => void;
  onNewSheet: () => void;
  onRunSheet: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExportCSV: () => void;
  onSavePreview: () => void;
}

export function SheetToolbar({
  activeSheet,
  isPreviewMode,
  previewData,
  isSavingPreview,
  showSheetsList,
  showHelp,
  showDesigner,
  isRunning,
  isSaving,
  transformedDataLength,
  onToggleSheetsList,
  onToggleHelp,
  onToggleDesigner,
  onNewSheet,
  onRunSheet,
  onSave,
  onSaveAs,
  onExportCSV,
  onSavePreview,
}: SheetToolbarProps) {
  return (
    <div className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
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
                onClick={onSavePreview}
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
                onClick={onToggleSheetsList}
                aria-label={showSheetsList ? "Hide sheets list" : "Show sheets list"}
              >
                <PanelLeft className="h-4 w-4 mr-1" />
                {showSheetsList ? "Hide Sheets" : "Show Sheets"}
              </Button>
              <Button variant="ghost" size="sm" onClick={onToggleHelp}>
                <HelpCircle className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={onNewSheet}>
                <Plus className="h-4 w-4 mr-1" />
                New Dynamic Sheet
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRunSheet}
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
                onClick={onSave}
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
                onClick={onSaveAs}
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
            onClick={onExportCSV}
            disabled={!activeSheet || transformedDataLength === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={onToggleDesigner}>
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
  );
}
