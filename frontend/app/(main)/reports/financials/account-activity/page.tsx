"use client";

import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

import Breadcrumb from "@/components/layout/breadcrumb";
import { useAccountActivity } from "./hooks/useAccountActivity";
import { MOCK_DATA, OPENING_BALANCE, CLOSING_BALANCE } from "./constants";
import FilterBar from "./components/FilterBar";
import { useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AccountActivityPage() {
  const searchParams = useSearchParams();
  const jeFilter = searchParams.get("je");
  const fromClose = searchParams.get("from") === "close";
  const closeTaskId = searchParams.get("taskId");
  const {
    gridRef,
    dataLoading,
    dataError,
    dataLayerRows,
    glAccount,
    currency,
    setCurrency,
    displayMode,
    setDisplayMode,
    pendingStartPeriod,
    setPendingStartPeriod,
    pendingEndPeriod,
    setPendingEndPeriod,
    pendingGlAccount,
    setPendingGlAccount,
    pendingSubsidiaries,
    periodPopoverOpen,
    setPeriodPopoverOpen,
    subsidiaryPopoverOpen,
    setSubsidiaryPopoverOpen,
    glAccountPopoverOpen,
    setGlAccountPopoverOpen,
    periodSearch,
    setPeriodSearch,
    subsidiarySearch,
    setSubsidiarySearch,
    glAccountSearch,
    setGlAccountSearch,
    expandedPeriods,
    expandedSubsidiaries,
    formatCurrency,
    filteredPeriodNodes,
    filteredSubsidiaryNodes,
    filteredGlAccounts,
    columnDefs,
    defaultColDef,
    togglePeriodExpanded,
    toggleSubsidiaryExpanded,
    handleSubsidiaryToggle,
    handleRemoveSubsidiary,
    handleApplyFilters,
    handleExportCSV,
  } = useAccountActivity();

  // Prefer data-layer rows, fall back to inline mock data
  // If ?je= is present, filter to show only that journal entry's rows
  const rowData = useMemo(() => {
    const base = dataLayerRows && dataLayerRows.length > 0 ? dataLayerRows : MOCK_DATA;
    if (jeFilter) {
      // Match the JE entry number pattern (e.g., JE-006 → JE-2024-12-006)
      return base.filter((row) => {
        const docNum = row.documentNumber || "";
        // Match either the short ID (JE-006) or the full entry number (JE-2024-12-006)
        return docNum === jeFilter || docNum.endsWith(jeFilter.replace("JE-", ""));
      });
    }
    return base;
  }, [dataLayerRows, jeFilter]);

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      {/* Page Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="reports/financials/account-activity" className="mb-1.5" />
        {fromClose && closeTaskId && (
          <Link
            href="/workbench/record-to-report/close"
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mb-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Close Task {closeTaskId}
          </Link>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#000000] mt-2">Account Activity</h1>
          {jeFilter && (
            <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
              Filtered: {jeFilter}
            </span>
          )}
        </div>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>

      {/* Global Filter Bar */}
      <FilterBar
        pendingStartPeriod={pendingStartPeriod}
        setPendingStartPeriod={setPendingStartPeriod}
        pendingEndPeriod={pendingEndPeriod}
        setPendingEndPeriod={setPendingEndPeriod}
        pendingGlAccount={pendingGlAccount}
        setPendingGlAccount={setPendingGlAccount}
        pendingSubsidiaries={pendingSubsidiaries}
        periodPopoverOpen={periodPopoverOpen}
        setPeriodPopoverOpen={setPeriodPopoverOpen}
        subsidiaryPopoverOpen={subsidiaryPopoverOpen}
        setSubsidiaryPopoverOpen={setSubsidiaryPopoverOpen}
        glAccountPopoverOpen={glAccountPopoverOpen}
        setGlAccountPopoverOpen={setGlAccountPopoverOpen}
        periodSearch={periodSearch}
        setPeriodSearch={setPeriodSearch}
        subsidiarySearch={subsidiarySearch}
        setSubsidiarySearch={setSubsidiarySearch}
        glAccountSearch={glAccountSearch}
        setGlAccountSearch={setGlAccountSearch}
        expandedPeriods={expandedPeriods}
        expandedSubsidiaries={expandedSubsidiaries}
        filteredPeriodNodes={filteredPeriodNodes}
        filteredSubsidiaryNodes={filteredSubsidiaryNodes}
        filteredGlAccounts={filteredGlAccounts}
        currency={currency}
        setCurrency={setCurrency}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
        togglePeriodExpanded={togglePeriodExpanded}
        toggleSubsidiaryExpanded={toggleSubsidiaryExpanded}
        handleSubsidiaryToggle={handleSubsidiaryToggle}
        handleRemoveSubsidiary={handleRemoveSubsidiary}
        handleApplyFilters={handleApplyFilters}
        handleExportCSV={handleExportCSV}
      />

      {/* Account Summary and Table Section */}
      <div className="flex-1 p-6 overflow-auto" style={{ minHeight: 0 }}>
        {dataLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-slate-500">Loading account activity data...</div>
          </div>
        )}
        {dataError && (
          <div className="flex items-center justify-center py-4">
            <div className="text-sm text-red-500">Error: {dataError}</div>
          </div>
        )}
        {/* Account Information Header */}
        <div className="mb-4">
          <div className="flex items-center gap-6 flex-wrap mb-2">
            <h2 className="text-lg font-bold text-slate-900">Account: {glAccount}</h2>
            <span className="text-sm font-medium text-slate-600">
              Opening Balance:{" "}
              <span className="font-bold text-slate-900">{formatCurrency(OPENING_BALANCE)}</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-medium text-slate-600">
              Closing Balance:{" "}
              <span className="font-bold text-slate-900">{formatCurrency(CLOSING_BALANCE)}</span>
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div
            className="ag-theme-alpine w-full overflow-x-auto"
            style={{
              height: "calc(100vh - 360px)",
              width: "100%",
              minHeight: "300px",
            }}
          >
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              suppressRowClickSelection={true}
              enableCellTextSelection={true}
              ensureDomOrder={true}
              animateRows={true}
              rowHeight={52}
              headerHeight={48}
              enableRangeSelection={false}
              suppressMenuHide={true}
              suppressCellFocus={true}
              suppressHorizontalScroll={false}
              domLayout="normal"
              className="ag-theme-alpine"
              getRowStyle={(params) => {
                // Highlight rows when filtering by JE
                if (jeFilter) {
                  return { backgroundColor: "#eef2ff" }; // indigo-50
                }
                const rowIndex = params.node.rowIndex;
                if (rowIndex !== null && rowIndex !== undefined && rowIndex % 2 === 0) {
                  return { backgroundColor: "#fafafa" };
                }
                return { backgroundColor: "#ffffff" };
              }}
              onGridReady={(params) => {
                console.log("AG Grid Ready!");
              }}
              onFirstDataRendered={(params) => {
                // Size columns to fit the full width of the table
                setTimeout(() => {
                  params.api.sizeColumnsToFit();
                }, 100);
              }}
              onGridSizeChanged={(params) => {
                // Resize columns when grid size changes
                params.api.sizeColumnsToFit();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
