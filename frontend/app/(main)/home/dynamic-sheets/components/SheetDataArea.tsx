"use client";

import { AlertDescription } from "@/components/ui/alert";

import { Loader2, AlertCircle } from "lucide-react";

import { DataGrid } from "@/components/dynamic-sheets/data-grid";
import { DesignerPanel } from "@/components/dynamic-sheets/designer-panel";

import type { DynamicSheet } from "../types";

interface SheetDataAreaProps {
  activeSheet: DynamicSheet | null;
  isLoadingData: boolean;
  isPreviewMode: boolean;
  sheetData: any[];
  transformedData: any[];
  showDesigner: boolean;
  onColumnsChange: (columns: any[]) => void;
  onFormulasChange: (calculatedColumns: any[]) => void;
  onFiltersChange: (filters: any[]) => void;
}

export function SheetDataArea({
  activeSheet,
  isLoadingData,
  isPreviewMode,
  sheetData,
  transformedData,
  showDesigner,
  onColumnsChange,
  onFormulasChange,
  onFiltersChange,
}: SheetDataAreaProps) {
  return (
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
                    <span className="text-amber-600">Warning: Filters may be hiding all rows</span>
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
            onColumnsChange={onColumnsChange}
            onFormulasChange={onFormulasChange}
            onFiltersChange={onFiltersChange}
          />
        </div>
      )}
    </div>
  );
}
