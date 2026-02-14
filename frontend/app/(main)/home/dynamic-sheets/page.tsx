"use client";

import { Loader2 } from "lucide-react";

import { SheetsList } from "@/components/dynamic-sheets/sheets-list";
import { CreateSheetWizard } from "@/components/dynamic-sheets/create-sheet-wizard";

import { useDynamicSheets } from "./hooks/useDynamicSheets";
import { SheetToolbar } from "./components/SheetToolbar";
import { SheetDataArea } from "./components/SheetDataArea";
import { SaveAsDialog } from "./components/SaveAsDialog";

export default function DynamicSheetsPage() {
  const {
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
  } = useDynamicSheets();

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
        <SheetToolbar
          activeSheet={activeSheet}
          isPreviewMode={isPreviewMode}
          previewData={previewData}
          isSavingPreview={isSavingPreview}
          showSheetsList={showSheetsList}
          showHelp={showHelp}
          showDesigner={showDesigner}
          isRunning={isRunning}
          isSaving={isSaving}
          transformedDataLength={transformedData.length}
          onToggleSheetsList={() => setShowSheetsList((prev) => !prev)}
          onToggleHelp={() => setShowHelp((prev) => !prev)}
          onToggleDesigner={() => setShowDesigner((prev) => !prev)}
          onNewSheet={handleNewSheet}
          onRunSheet={handleRunSheet}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onExportCSV={handleExportCSV}
          onSavePreview={handleSavePreviewToSheets}
        />

        <SheetDataArea
          activeSheet={activeSheet}
          isLoadingData={isLoadingData}
          isPreviewMode={isPreviewMode}
          sheetData={sheetData}
          transformedData={transformedData}
          showDesigner={showDesigner}
          onColumnsChange={handleColumnsChange}
          onFormulasChange={handleFormulasChange}
          onFiltersChange={handleFiltersChange}
        />

        <CreateSheetWizard
          open={showWizard}
          onOpenChange={setShowWizard}
          onComplete={handleWizardComplete}
        />

        <SaveAsDialog
          open={showSaveAsDialog}
          onOpenChange={setShowSaveAsDialog}
          saveAsName={saveAsName}
          onSaveAsNameChange={setSaveAsName}
          onConfirm={handleSaveAsConfirm}
        />
      </div>
    </div>
  );
}
