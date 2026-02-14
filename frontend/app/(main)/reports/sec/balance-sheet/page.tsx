"use client";

import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  ICellRendererParams,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Breadcrumb from "@/components/layout/breadcrumb";

import { useBalanceSheet } from "./hooks/useBalanceSheet";
import { useColumnDefs } from "./components/useColumnDefs";
import { FilterBar } from "./components/FilterBar";

export default function BalanceSheetPage() {
  const {
    gridRef,
    view,
    asOfPeriods,
    subsidiaries,
    displayMode,
    setDisplayMode,
    pendingView,
    setPendingView,
    pendingPeriods,
    pendingSubsidiaries,
    periodPopoverOpen,
    setPeriodPopoverOpen,
    subsidiaryPopoverOpen,
    setSubsidiaryPopoverOpen,
    expandedPeriods,
    expandedSubsidiaries,
    periodSearch,
    setPeriodSearch,
    subsidiarySearch,
    setSubsidiarySearch,
    formatCurrency,
    formatPercent,
    getRowClass,
    handleRemovePeriod,
    handleRemoveSubsidiary,
    togglePeriodExpanded,
    toggleSubsidiaryExpanded,
    handlePeriodToggle,
    handleSubsidiaryToggle,
    handleApplyFilters,
    filteredPeriodNodes,
    filteredSubsidiaryNodes,
    filteredData,
  } = useBalanceSheet();

  const financialRowRenderer = (params: ICellRendererParams) => {
    const level = params.data.level || 0;
    const indent = level * 20;
    const isParent = level === 0;

    return (
      <div className="flex items-center gap-2 h-full" style={{ paddingLeft: `${indent}px` }}>
        {isParent && <ChevronDown className="h-4 w-4 text-gray-600 flex-shrink-0" />}
        {!isParent && level > 0 && <div className="w-4 flex-shrink-0" />}
        <span
          className={cn(
            isParent ? "font-bold" : "font-normal",
            isParent ? "text-gray-900" : "text-gray-700"
          )}
        >
          {params.value}
        </span>
      </div>
    );
  };

  const columnDefs = useColumnDefs(
    subsidiaries,
    asOfPeriods,
    formatCurrency,
    formatPercent,
    financialRowRenderer
  );

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      {/* Page Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="reports/sec/balance-sheet" className="mb-1.5" />
        <h1 className="text-2xl font-bold text-[#000000] mt-2">Balance Sheet</h1>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>

      {/* Global Filter Bar */}
      <FilterBar
        pendingView={pendingView}
        setPendingView={setPendingView}
        pendingPeriods={pendingPeriods}
        periodPopoverOpen={periodPopoverOpen}
        setPeriodPopoverOpen={setPeriodPopoverOpen}
        handleRemovePeriod={handleRemovePeriod}
        periodSearch={periodSearch}
        setPeriodSearch={setPeriodSearch}
        filteredPeriodNodes={filteredPeriodNodes}
        expandedPeriods={expandedPeriods}
        togglePeriodExpanded={togglePeriodExpanded}
        handlePeriodToggle={handlePeriodToggle}
        pendingSubsidiaries={pendingSubsidiaries}
        subsidiaryPopoverOpen={subsidiaryPopoverOpen}
        setSubsidiaryPopoverOpen={setSubsidiaryPopoverOpen}
        handleRemoveSubsidiary={handleRemoveSubsidiary}
        subsidiarySearch={subsidiarySearch}
        setSubsidiarySearch={setSubsidiarySearch}
        filteredSubsidiaryNodes={filteredSubsidiaryNodes}
        expandedSubsidiaries={expandedSubsidiaries}
        toggleSubsidiaryExpanded={toggleSubsidiaryExpanded}
        handleSubsidiaryToggle={handleSubsidiaryToggle}
        handleApplyFilters={handleApplyFilters}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
      />

      {/* AG Grid */}
      <div className="flex-1 p-6 overflow-auto" style={{ minHeight: 0 }}>
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div
            className="ag-theme-alpine w-full overflow-x-auto"
            style={{
              height: "calc(100vh - 320px)",
              width: "100%",
              minHeight: "300px",
            }}
          >
            <AgGridReact
              ref={gridRef}
              rowData={filteredData}
              columnDefs={columnDefs}
              getRowClass={getRowClass}
              defaultColDef={{
                resizable: true,
                sortable: true,
                filter: true,
              }}
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
                const rowIndex = params.node.rowIndex;
                if (rowIndex !== null && rowIndex !== undefined && rowIndex % 2 === 0) {
                  return { backgroundColor: "#fafafa" };
                }
                return { backgroundColor: "#ffffff" };
              }}
              onGridReady={(params) => {
                console.log("AG Grid Ready!");
                console.log("Row count:", params.api.getDisplayedRowCount());
                console.log("Data length:", filteredData.length);
              }}
              onFirstDataRendered={(params) => {
                setTimeout(() => {
                  params.api.sizeColumnsToFit();
                }, 100);
              }}
              onGridSizeChanged={(params) => {
                params.api.sizeColumnsToFit();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
