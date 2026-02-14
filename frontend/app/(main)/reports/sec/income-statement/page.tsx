"use client";

import Breadcrumb from "@/components/layout/breadcrumb";
import { useIncomeStatement } from "./hooks/useIncomeStatement";
import { FilterBar } from "./components/FilterBar";
import { IncomeStatementGrid } from "./components/IncomeStatementGrid";

export default function IncomeStatementPage() {
  const {
    // Applied states
    asOfPeriods,
    subsidiaries,
    displayMode,
    setDisplayMode,
    filteredData,

    // Pending states
    pendingView,
    setPendingView,
    pendingPeriods,
    pendingSubsidiaries,

    // Popover states
    periodPopoverOpen,
    setPeriodPopoverOpen,
    subsidiaryPopoverOpen,
    setSubsidiaryPopoverOpen,

    // Hierarchical states
    expandedPeriods,
    expandedSubsidiaries,
    periodSearch,
    setPeriodSearch,
    subsidiarySearch,
    setSubsidiarySearch,

    // Formatters
    formatCurrency,
    formatPercent,

    // Handlers
    handleRemovePeriod,
    handleRemoveSubsidiary,
    togglePeriodExpanded,
    toggleSubsidiaryExpanded,
    handlePeriodToggle,
    handleSubsidiaryToggle,
    handleApplyFilters,

    // Filtered nodes
    filteredPeriodNodes,
    filteredSubsidiaryNodes,
  } = useIncomeStatement();

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      {/* Page Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="reports/sec/income-statement" className="mb-1.5" />
        <h1 className="text-2xl font-bold text-[#000000] mt-2">Income Statement</h1>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>

      {/* Global Filter Bar */}
      <FilterBar
        pendingView={pendingView}
        setPendingView={setPendingView}
        pendingPeriods={pendingPeriods}
        handleRemovePeriod={handleRemovePeriod}
        periodPopoverOpen={periodPopoverOpen}
        setPeriodPopoverOpen={setPeriodPopoverOpen}
        periodSearch={periodSearch}
        setPeriodSearch={setPeriodSearch}
        filteredPeriodNodes={filteredPeriodNodes}
        expandedPeriods={expandedPeriods}
        togglePeriodExpanded={togglePeriodExpanded}
        handlePeriodToggle={handlePeriodToggle}
        pendingSubsidiaries={pendingSubsidiaries}
        handleRemoveSubsidiary={handleRemoveSubsidiary}
        subsidiaryPopoverOpen={subsidiaryPopoverOpen}
        setSubsidiaryPopoverOpen={setSubsidiaryPopoverOpen}
        subsidiarySearch={subsidiarySearch}
        setSubsidiarySearch={setSubsidiarySearch}
        filteredSubsidiaryNodes={filteredSubsidiaryNodes}
        expandedSubsidiaries={expandedSubsidiaries}
        toggleSubsidiaryExpanded={toggleSubsidiaryExpanded}
        handleSubsidiaryToggle={handleSubsidiaryToggle}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
        handleApplyFilters={handleApplyFilters}
      />

      {/* AG Grid */}
      <IncomeStatementGrid
        filteredData={filteredData}
        subsidiaries={subsidiaries}
        asOfPeriods={asOfPeriods}
        formatCurrency={formatCurrency}
        formatPercent={formatPercent}
      />
    </div>
  );
}
