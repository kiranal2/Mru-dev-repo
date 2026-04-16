"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIndustry } from "@/hooks/use-industry";
import { useStandardFlux } from "./hooks/use-standard-flux";
import {
  WorkbenchHeader,
  StandardFluxToolbar,
  FilterBar,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Banner data (static for now) ─── */

const BANNERS = [
  {
    scenarioTitle: "Story 1: AR & Revenue Timing Break",
    message:
      "AR variance driven by 2 unreconciled items ($250K) — unapplied cash from Acme Corp ($175K) and revenue posting error for GlobalTech ($75K).",
    severity: "High" as const,
    links: [
      { label: "View AR Reconciliation", route: "/workbench/record-to-report/reconciliations", severity: "High" as const },
      { label: "View Close Task", route: "/workbench/record-to-report/close", severity: "High" as const },
      { label: "View Cash Application", route: "/workbench/order-to-cash/cash-application/payments", severity: "Medium" as const },
    ],
    resolutionProgress: { completed: 2, total: 7 },
  },
  {
    scenarioTitle: "Story 2: Intercompany Mirror Entry Missing",
    message:
      "$150K intercompany mismatch between Meeru US and Meeru Europe — shared services charge posted in US but mirror entry missing in Europe.",
    severity: "High" as const,
    links: [
      { label: "View Intercompany Recon", route: "/workbench/record-to-report/reconciliations", severity: "High" as const },
      { label: "View Consolidation Task", route: "/workbench/record-to-report/close", severity: "High" as const },
      { label: "View Balance Sheet", route: "/reports/sec/balance-sheet", severity: "Medium" as const },
    ],
    resolutionProgress: { completed: 1, total: 5 },
  },
];

export default function StandardFluxPage() {
  const router = useRouter();
  const state = useStandardFlux();
  const { config: industryConfig, isDemoMode } = useIndustry();
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [driversSheetOpen, setDriversSheetOpen] = useState(false);
  const [alertsExpanded, setAlertsExpanded] = useState(false);

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

  const closedPct = state.reviewStats.total
    ? Math.round((state.reviewStats.closed / state.reviewStats.total) * 100)
    : 0;

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50">

      {/* ╔══════════════════════════════════════════════════════════╗
          ║  MOBILE / TABLET LAYOUT (< xl, 1280px)                 ║
          ╚══════════════════════════════════════════════════════════╝ */}
      <div className="xl:hidden flex flex-col h-full min-h-0 min-w-0">

        {/* ── Title row with action icons ── */}
        <div className="flex items-center justify-between px-4 pt-1.5 pb-1">
          <h1 className="text-sm font-semibold text-slate-900">Standard Flux</h1>
          <div className="flex items-center gap-1">
            {BANNERS.length > 0 && (
              <button
                type="button"
                onClick={() => setAlertsExpanded(!alertsExpanded)}
                className="relative rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
                title="Alerts"
              >
                <ShieldAlert className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white">
                  {BANNERS.length}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setDriversSheetOpen(true)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
              title="Top Drivers"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setAiSheetOpen(true)}
              className="rounded-lg p-1.5 text-primary hover:bg-primary/5 transition-colors"
              title="AI Assistant"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── KPI cards — 2x2 on tablet, stacked on phone ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-4 pb-2">
          {/* Net Variance */}
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Net Variance</div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={cn("text-lg font-bold", state.totalVariance >= 0 ? "text-emerald-600" : "text-red-600")}>
                {state.totalVariance >= 0 ? "+" : ""}${Math.abs(state.totalVariance).toFixed(1)}M
              </span>
              {state.totalVariance >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">QoQ period change</div>
          </div>

          {/* Review Progress */}
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Review Progress</span>
              <span className="text-xs font-bold text-slate-700">{state.reviewStats.closed}/{state.reviewStats.total}</span>
            </div>
            <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
              {closedPct > 0 && <div className="bg-emerald-500" style={{ width: `${closedPct}%` }} />}
              {state.reviewStats.total && state.reviewStats.inReview > 0 && (
                <div className="bg-amber-400" style={{ width: `${Math.round((state.reviewStats.inReview / state.reviewStats.total) * 100)}%` }} />
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Closed {state.reviewStats.closed}</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Review {state.reviewStats.inReview}</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" />Open {state.reviewStats.open}</span>
            </div>
          </div>

          {/* Top Drivers */}
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Top Drivers</div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {state.headerTopDrivers.map((d) => (
                <span
                  key={d.driver}
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    d.impact >= 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
                  )}
                >
                  {d.driver} {d.impact >= 0 ? "+" : ""}${d.impact.toFixed(0)}M
                </span>
              ))}
            </div>
          </div>

          {/* Needs Attention */}
          <div className={cn("rounded-lg border bg-white p-3", state.exceptionCount > 0 ? "border-amber-200" : "border-slate-200")}>
            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Needs Attention</div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={cn("text-lg font-bold", state.exceptionCount > 0 ? "text-amber-600" : "text-emerald-600")}>
                {state.exceptionCount}
              </span>
              {state.exceptionCount > 0 && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {state.exceptionCount > 0 ? "Items missing evidence" : "All items addressed"}
            </div>
          </div>
        </div>

        {/* ── Combined toolbar (ONE row) ── */}
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

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
          <div className="px-4 py-2">
            <div className="bg-white rounded-lg border border-slate-200">
              {(state.activeView === "is" || state.activeView === "bs") && (
                <>
                  <WorklistTable
                    rows={state.pagedRows}
                    title={state.activeView === "is" ? "Flux Worklist" : "Balance Sheet Worklist"}
                    accountCount={state.activeView === "is" ? state.filteredIS.length : state.filteredBS.length}
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
              {state.activeView === "bs" && (
                <FluxBsRollforwardTable rows={state.data.bsRoll} />
              )}
              {state.activeView === "cf" && (
                <>
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-800">Operating Cash Flow Bridge</span>
                  </div>
                  <FluxCfBridge cfData={state.data.cf} cfTotal={state.kpiCfTotal} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── AI Bottom Sheet ── */}
        <Sheet open={aiSheetOpen} onOpenChange={setAiSheetOpen}>
          <SheetContent side="bottom" className="h-[75vh] rounded-t-2xl p-0 overflow-hidden">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <SheetTitle className="text-sm font-semibold">AI Assistant</SheetTitle>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* ── Top Drivers Bottom Sheet ── */}
        <Sheet open={driversSheetOpen} onOpenChange={setDriversSheetOpen}>
          <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl p-0 overflow-hidden">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-slate-600" />
                  <SheetTitle className="text-sm font-semibold">Top Drivers</SheetTitle>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <FluxTopDriversTable
                  drivers={state.topDrivers}
                  baseRevenue={state.kpiRevenue?.base ?? 48.2}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>

      </div>

      {/* ╔══════════════════════════════════════════════════════════╗
          ║  DESKTOP LAYOUT (xl+, 1280px)                          ║
          ╚══════════════════════════════════════════════════════════╝ */}
      <div className="hidden xl:flex flex-col h-full min-h-0">
        {/* Title with alert icon */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1 bg-slate-50">
          <div>
            <h1 className="text-sm font-semibold text-slate-900">
              {isDemoMode ? `${industryConfig.label} — Flux Intelligence` : "Standard Flux"}
            </h1>
            <p className="text-[11px] text-slate-500">
              {isDemoMode
                ? `${industryConfig.revenueTerm} variance analysis \u2014 AI commentary, driver attribution & close workflow`
                : "Variance workbench \u2014 AI-driven analysis, driver attribution & close workflow"}
            </p>
          </div>
          {BANNERS.length > 0 && (
            <button
              type="button"
              onClick={() => setAlertsExpanded(true)}
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
              title={`${BANNERS.length} alerts`}
            >
              <ShieldAlert className="h-4.5 w-4.5" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                {BANNERS.length}
              </span>
            </button>
          )}
        </div>

        {/* Header KPIs */}
        <div data-tour-id="sf-kpis">
        <WorkbenchHeader
          totalVariance={state.totalVariance}
          topDrivers={state.headerTopDrivers}
          reviewStats={state.reviewStats}
          exceptionCount={state.exceptionCount}
          activeKpiCard={state.activeKpiCard}
          onKpiCardClick={state.handleKpiCardClick}
        />
        </div>

        {/* KPI-card-driven filter bar */}
        <FilterBar
          activeCard={state.activeKpiCard}
          expanded={state.filterBarExpanded}
          onToggle={() => state.setFilterBarExpanded(!state.filterBarExpanded)}
          comparisonMode={state.comparisonMode}
          onComparisonModeChange={state.setComparisonMode}
          materiality={state.materiality}
          onMaterialityChange={state.setMateriality}
          excludeNoise={state.excludeNoise}
          onExcludeNoiseChange={state.setExcludeNoise}
          ownerFilter={state.ownerFilter}
          onOwnerFilterChange={state.setOwnerFilter}
          statusFilter={state.statusFilter}
          onStatusFilterChange={state.setStatusFilter}
          ownerOptions={state.ownerOptions}
          statusOptions={state.statusOptions}
          quickFilter={state.quickFilter}
          onQuickFilterChange={state.setQuickFilter}
        />

        {/* Toolbar */}
        <div data-tour-id="sf-toolbar">
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
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
          <div className="space-y-3 px-5 py-3">
            <div className="grid grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_440px] gap-3">
              {/* LEFT */}
              <div className="min-w-0 space-y-3" data-tour-id="sf-worklist">
                <div className="bg-white rounded-lg border border-slate-200">
                  {(state.activeView === "is" || state.activeView === "bs") && (
                    <>
                      <WorklistTable
                        rows={state.pagedRows}
                        title={state.activeView === "is" ? "Flux Worklist" : "Balance Sheet Worklist"}
                        accountCount={state.activeView === "is" ? state.filteredIS.length : state.filteredBS.length}
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
                  {state.activeView === "bs" && <FluxBsRollforwardTable rows={state.data.bsRoll} />}
                  {state.activeView === "cf" && (
                    <>
                      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-800">Operating Cash Flow Bridge</span>
                      </div>
                      <FluxCfBridge cfData={state.data.cf} cfTotal={state.kpiCfTotal} />
                    </>
                  )}
                </div>
                <FluxTopDriversTable drivers={state.topDrivers} baseRevenue={state.kpiRevenue?.base ?? 48.2} />
              </div>

              {/* RIGHT: AI */}
              <aside className="min-w-0 space-y-3" data-tour-id="sf-ai-panel">
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
      </div>

      {/* ── Alerts Side Sheet (shared) ── */}
      <Sheet open={alertsExpanded} onOpenChange={setAlertsExpanded}>
        <SheetContent side="right" className="w-[340px] sm:w-[400px] p-0 overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                <SheetTitle className="text-sm font-semibold">Alerts &amp; Actions</SheetTitle>
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">{BANNERS.length}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {BANNERS.map((b) => (
                <CrossModuleBanner key={b.scenarioTitle} {...b} />
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Shared dialogs/drawers ── */}
      <FluxEvidenceDialog
        open={state.evidenceDialogOpen}
        onOpenChange={state.setEvidenceDialogOpen}
        targetRow={state.evidenceTargetRow}
        onAttach={state.handleAttachEvidence}
      />
      <FluxWatchDialog
        open={state.watchDialogOpen}
        onOpenChange={state.setWatchDialogOpen}
        isRows={state.data.is}
        bsRows={state.data.bs}
        defaultPeriodLabel={state.data.is[0]?.currentPeriod ?? "Q3 2025"}
        ownerOptions={state.ownerOptions}
      />
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
        commentaryIsGenerating={state.commentaryIsGenerating}
        commentaryThinkingSteps={state.commentaryThinkingSteps}
        onGenerateCommentary={state.handleGenerateCommentary}
        onUpdateCommentary={state.handleUpdateCommentary}
        onSubmitCommentary={state.handleSubmitCommentary}
        onApproveCommentary={state.handleApproveCommentary}
      />
    </div>
  );
}
