"use client";

import { useFluxAnalysisPage } from "./hooks/use-flux-analysis-page";
import {
  FluxToolbar,
  FluxTable,
  FluxPagination,
  FluxBsRollforwardTable,
  FluxTopDriversTable,
  FluxCfBridge,
  FluxAiSidebar,
  FluxAiExplanations,
  FluxSensitivityPanel,
  FluxDetailDrawer,
  FluxEvidenceDialog,
  FluxWatchDialog,
} from "@/components/flux-analysis";

export default function FluxAnalysisPage() {
  const state = useFluxAnalysisPage();

  if (state.fluxLoading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-slate-50">
        <p className="text-sm text-muted-foreground">Loading flux analysis...</p>
      </div>
    );
  }

  if (state.fluxError) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-slate-50">
        <p className="text-sm text-red-600">Error loading flux analysis: {state.fluxError}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50">
      {/* Title */}
      <div className="px-3 sm:px-5 pt-3 pb-1 bg-slate-50">
        <h1 className="text-sm font-semibold text-slate-900">Flux Analysis</h1>
        <p className="text-[11px] text-slate-500">Period variance analysis &amp; AI-driven driver decomposition</p>
      </div>

      {/* Toolbar */}
      <FluxToolbar
        activeView={state.activeView}
        onViewChange={state.setActiveView}
        consolidation={state.consolidation}
        onConsolidationChange={state.setConsolidation}
        currency={state.currency}
        onCurrencyChange={state.setCurrency}
        materiality={state.materiality}
        onMaterialityChange={state.setMateriality}
        ownerFilter={state.ownerFilter}
        onOwnerFilterChange={state.setOwnerFilter}
        statusFilter={state.statusFilter}
        onStatusFilterChange={state.setStatusFilter}
        excludeNoise={state.excludeNoise}
        onExcludeNoiseChange={state.setExcludeNoise}
        ownerOptions={state.ownerOptions}
        statusOptions={state.statusOptions}
        viewKpis={state.viewKpis}
        onExport={() => window.print()}
        onOpenWatch={state.handleOpenWatchDialog}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
        <div className="space-y-3 px-3 sm:px-5 py-3">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_440px]">
            {/* LEFT: Tables & Drivers */}
            <div className="min-w-0 space-y-3">
              {/* Tab Tables container */}
              <div className="bg-white rounded-lg border border-slate-200">
                {/* IS / BS Table — FluxTable renders its own header */}
                {(state.activeView === "is" || state.activeView === "bs") && (
                  <>
                    <FluxTable
                      rows={state.pagedRows}
                      title={state.activeView === "is" ? "Income Statement Coverage" : "Balance Sheet Coverage"}
                      accountCount={state.activeView === "is" ? state.filteredIS.length : state.filteredBS.length}
                      onRowClick={state.handleRowClick}
                      onAddEvidence={state.handleOpenEvidenceDialog}
                      hasEvidence={state.hasEvidence}
                    />
                    <FluxPagination
                      page={state.page}
                      totalPages={state.totalPages}
                      tableStart={state.tableStart}
                      tableEnd={state.tableEnd}
                      totalRows={state.activeRows.length}
                      onPageChange={state.setPage}
                    />
                  </>
                )}

                {/* BS Roll-forward */}
                {state.activeView === "bs" && (
                  <FluxBsRollforwardTable rows={state.data.bsRoll} />
                )}

                {/* CF Bridge — needs its own header since FluxCfBridge doesn't render one */}
                {state.activeView === "cf" && (
                  <>
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                      <span className="text-xs font-semibold text-slate-800">Operating Cash Flow Bridge</span>
                      <span className="text-xs text-slate-400"></span>
                    </div>
                    <FluxCfBridge cfData={state.data.cf} cfTotal={state.kpiCfTotal} />
                  </>
                )}
              </div>

              {/* Top Drivers */}
              <FluxTopDriversTable
                drivers={state.topDrivers}
                baseRevenue={state.kpiRevenue?.base ?? 48.2}
              />
            </div>

            {/* RIGHT: AI Sidebar */}
            <aside className="min-w-0 space-y-3">
              <FluxAiSidebar
                aiPrompt={state.aiPrompt}
                onAiPromptChange={state.setAiPrompt}
                aiResponses={state.aiResponses}
                aiIsThinking={state.aiIsThinking}
                aiPendingQuestion={state.aiPendingQuestion}
                aiThinkingSteps={state.aiThinkingSteps}
                showAutocomplete={state.showAiAutocomplete}
                autocompleteSuggestions={state.autocompleteSuggestions}
                onAsk={state.handleAsk}
                onSelectSuggestion={state.handleSelectPromptSuggestion}
                onNewChat={state.handleNewChat}
              />

              <FluxAiExplanations explanations={state.explanationCards} />

              <FluxSensitivityPanel
                priceSlider={state.priceSlider}
                onPriceChange={state.setPriceSlider}
                volumeSlider={state.volumeSlider}
                onVolumeChange={state.setVolumeSlider}
                fxSlider={state.fxSlider}
                onFxChange={state.setFxSlider}
                projectedDelta={state.projectedDelta}
              />
            </aside>
          </div>
        </div>
      </div>

      {/* Evidence Dialog */}
      <FluxEvidenceDialog
        open={state.evidenceDialogOpen}
        onOpenChange={state.setEvidenceDialogOpen}
        targetRow={state.evidenceTargetRow}
        onAttach={state.handleAttachEvidence}
      />

      {/* Watch Dialog */}
      <FluxWatchDialog
        open={state.watchDialogOpen}
        onOpenChange={state.setWatchDialogOpen}
        isRows={state.data.is}
        bsRows={state.data.bs}
        defaultPeriodLabel={state.data.is[0]?.currentPeriod ?? "Q3 2025"}
        ownerOptions={state.ownerOptions}
      />

      {/* Detail Drawer */}
      <FluxDetailDrawer
        open={state.detailOpen}
        onOpenChange={state.setDetailOpen}
        row={state.detailRow}
        hasEvidence={state.detailHasEvidence}
        aiAnalysis={state.detailAi}
        onAddEvidence={state.handleOpenEvidenceDialog}
        onAskAi={state.handleAskAiAboutRow}
      />
    </div>
  );
}
