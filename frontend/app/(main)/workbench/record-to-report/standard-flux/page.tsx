"use client";

import { useStandardFlux } from "./hooks/use-standard-flux";
import {
  WorkbenchHeader,
  StandardFluxToolbar,
  WorklistTable,
  StandardFluxDrawer,
  StandardFluxAiPanel,
  StandardFluxAiExplanations,
} from "@/components/standard-flux";
import {
  FluxPagination,
  FluxBsRollforwardTable,
  FluxTopDriversTable,
  FluxCfBridge,
  FluxSensitivityPanel,
  FluxEvidenceDialog,
  FluxWatchDialog,
} from "@/components/flux-analysis";
import { CrossModuleBanner } from "@/components/cross-module";

export default function StandardFluxPage() {
  const state = useStandardFlux();

  if (state.fluxLoading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-slate-50">
        <p className="text-sm text-muted-foreground">Loading variance workbench...</p>
      </div>
    );
  }

  if (state.fluxError) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-slate-50">
        <p className="text-sm text-red-600">Error loading data: {state.fluxError}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50">
      {/* Title */}
      <div className="px-5 pt-3 pb-1 bg-slate-50">
        <h1 className="text-sm font-semibold text-slate-900">Standard Flux</h1>
        <p className="text-[11px] text-slate-500">
          Variance workbench &mdash; AI-driven analysis, driver attribution &amp; close workflow
        </p>
      </div>

      {/* Cross-Module Alert Banners */}
      <CrossModuleBanner
        scenarioTitle="Story 1: AR & Revenue Timing Break"
        message="AR variance driven by 2 unreconciled items ($250K) — unapplied cash from Acme Corp ($175K) and revenue posting error for GlobalTech ($75K). AR reconciliation has exceptions blocking close certification."
        severity="High"
        links={[
          { label: "View AR Reconciliation", route: "/workbench/record-to-report/reconciliations", severity: "High" },
          { label: "View Close Task", route: "/workbench/record-to-report/close", severity: "High" },
          { label: "View Cash Application", route: "/workbench/order-to-cash/cash-application/payments", severity: "Medium" },
        ]}
        resolutionProgress={{ completed: 2, total: 7 }}
      />
      <CrossModuleBanner
        scenarioTitle="Story 2: Intercompany Mirror Entry Missing"
        message="$150K intercompany mismatch between Meeru US and Meeru Europe — shared services charge posted in US but mirror entry missing in Europe. Consolidation elimination cannot net to zero."
        severity="High"
        links={[
          { label: "View Intercompany Recon", route: "/workbench/record-to-report/reconciliations", severity: "High" },
          { label: "View Consolidation Task", route: "/workbench/record-to-report/close", severity: "High" },
          { label: "View Balance Sheet", route: "/reports/sec/balance-sheet", severity: "Medium" },
        ]}
        resolutionProgress={{ completed: 1, total: 5 }}
      />

      {/* Workbench Header — Executive clarity strip */}
      <WorkbenchHeader
        totalVariance={state.totalVariance}
        topDrivers={state.headerTopDrivers}
        reviewStats={state.reviewStats}
        exceptionCount={state.exceptionCount}
      />

      {/* Toolbar — comparison mode, view tabs, filters, KPI chips */}
      <StandardFluxToolbar
        activeView={state.activeView}
        onViewChange={state.setActiveView}
        comparisonMode={state.comparisonMode}
        onComparisonModeChange={state.setComparisonMode}
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
        <div className="space-y-3 px-5 py-3">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_440px]">
            {/* LEFT: Worklist + Drivers */}
            <div className="min-w-0 space-y-3">
              {/* Worklist Table */}
              <div className="bg-white rounded-lg border border-slate-200">
                {(state.activeView === "is" || state.activeView === "bs") && (
                  <>
                    <WorklistTable
                      rows={state.pagedRows}
                      title={
                        state.activeView === "is"
                          ? "Flux Worklist"
                          : "Balance Sheet Worklist"
                      }
                      accountCount={
                        state.activeView === "is"
                          ? state.filteredIS.length
                          : state.filteredBS.length
                      }
                      quickFilter={state.quickFilter}
                      onQuickFilterChange={state.setQuickFilter}
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

                {/* CF Bridge */}
                {state.activeView === "cf" && (
                  <>
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                      <span className="text-xs font-semibold text-slate-800">
                        Operating Cash Flow Bridge
                      </span>
                    </div>
                    <FluxCfBridge
                      cfData={state.data.cf}
                      cfTotal={state.kpiCfTotal}
                    />
                  </>
                )}
              </div>

              {/* Top Drivers */}
              <FluxTopDriversTable
                drivers={state.topDrivers}
                baseRevenue={state.kpiRevenue?.base ?? 48.2}
              />
            </div>

            {/* RIGHT: AI Panel */}
            <aside className="min-w-0 space-y-3">
              <StandardFluxAiPanel
                scopedRow={state.detailRow}
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

              <StandardFluxAiExplanations
                explanations={state.explanationCards}
                onAssignOwner={state.handleExplanationAssignOwner}
                onAddEvidence={state.handleExplanationAddEvidence}
                onMarkClosed={state.handleExplanationMarkClosed}
                onFollowUp={state.handleExplanationFollowUp}
              />

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

      {/* Evidence Dialog (reused) */}
      <FluxEvidenceDialog
        open={state.evidenceDialogOpen}
        onOpenChange={state.setEvidenceDialogOpen}
        targetRow={state.evidenceTargetRow}
        onAttach={state.handleAttachEvidence}
      />

      {/* Watch Dialog (reused) */}
      <FluxWatchDialog
        open={state.watchDialogOpen}
        onOpenChange={state.setWatchDialogOpen}
        isRows={state.data.is}
        bsRows={state.data.bs}
        defaultPeriodLabel={state.data.is[0]?.currentPeriod ?? "Q3 2025"}
        ownerOptions={state.ownerOptions}
      />

      {/* Detail Drawer (restructured) */}
      <StandardFluxDrawer
        open={state.detailOpen}
        onOpenChange={state.setDetailOpen}
        row={state.detailRow}
        hasEvidence={state.detailHasEvidence}
        aiAnalysis={state.detailAi}
        onAddEvidence={state.handleOpenEvidenceDialog}
        onAskAi={state.handleAskAiAboutRow}
        ownerOptions={state.ownerOptions}
        onUpdateOwner={state.handleUpdateOwner}
        onUpdateStatus={state.handleUpdateStatus}
      />
    </div>
  );
}
