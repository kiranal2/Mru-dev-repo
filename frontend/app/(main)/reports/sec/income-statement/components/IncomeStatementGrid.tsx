"use client";

import { useRef, useMemo, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  ColGroupDef,
  ICellRendererParams,
  ModuleRegistry,
  AllCommunityModule,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FinancialRow } from "../types";
import { WOLT_DATA, getPeriodField } from "../constants";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface IncomeStatementGridProps {
  filteredData: FinancialRow[];
  subsidiaries: string[];
  asOfPeriods: string[];
  formatCurrency: (value: number | undefined) => string;
  formatPercent: (value: number | undefined) => string;
}

export function IncomeStatementGrid({
  filteredData,
  subsidiaries,
  asOfPeriods,
  formatCurrency,
  formatPercent,
}: IncomeStatementGridProps) {
  const gridRef = useRef<AgGridReact>(null);

  const getRowClass = (params: any) => {
    if (params.data.level === 0) {
      return "bg-blue-50 font-bold";
    }
    return "";
  };

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

  const columnDefs: (ColDef | ColGroupDef)[] = useMemo(() => {
    const cols: (ColDef | ColGroupDef)[] = [
      {
        field: "financialRow",
        headerName: "Financial Row",
        pinned: "left",
        width: 400,
        suppressSizeToFit: true,
        cellRenderer: financialRowRenderer,
        cellStyle: { display: "flex", alignItems: "center" },
      },
    ];

    // Helper function to get Averra period field name (same mapping)
    const getWoltPeriodField = (period: string): string => {
      return getPeriodField(period);
    };

    // Create grouped columns for each subsidiary
    subsidiaries.forEach((subsidiary) => {
      const isDoorDash = subsidiary === "BetaFoods, Inc. (Consolidated)";
      const isWolt = subsidiary === "Averra Oy (Consolidated)";
      const isLuxBite = subsidiary === "LuxBite, Inc. (Consolidated)";

      if (!isDoorDash && !isWolt && !isLuxBite) return;

      const childrenCols: ColDef[] = [];

      // Add period columns
      asOfPeriods.forEach((period) => {
        childrenCols.push({
          headerName: period,
          width: 188,
          suppressSizeToFit: true,
          field: isWolt ? `wolt_${getWoltPeriodField(period)}` : getPeriodField(period),
          cellRenderer: (params: ICellRendererParams) => {
            if (isWolt) {
              const woltData = WOLT_DATA.find((d) => d.financialRow === params.data.financialRow);
              const field = getWoltPeriodField(period);
              const value = woltData?.[field as keyof FinancialRow] as number | undefined;
              return <div className="text-right">{formatCurrency(value)}</div>;
            } else {
              return <div className="text-right">{formatCurrency(params.value)}</div>;
            }
          },
          cellStyle: { textAlign: "right" },
        });
      });

      // Add difference columns if multiple periods are selected
      if (asOfPeriods.length >= 2) {
        childrenCols.push(
          {
            headerName: "$ Difference",
            width: 188,
            suppressSizeToFit: true,
            field: isWolt ? "wolt_dollarDifference" : "dollarDifference",
            cellRenderer: (params: ICellRendererParams) => {
              if (isWolt) {
                const woltData = WOLT_DATA.find(
                  (d) => d.financialRow === params.data.financialRow
                );
                const value = woltData?.dollarDifference;
                if (value === undefined || value === null) return "-";
                const isNegative = value < 0;
                return (
                  <div className={cn("text-right", isNegative && "text-red-600")}>
                    {formatCurrency(value)}
                  </div>
                );
              } else {
                const value = params.value;
                if (value === undefined || value === null) return "-";
                const isNegative = value < 0;
                return (
                  <div className={cn("text-right", isNegative && "text-red-600")}>
                    {formatCurrency(value)}
                  </div>
                );
              }
            },
            cellStyle: { textAlign: "right" },
          },
          {
            headerName: "Difference %",
            width: 188,
            suppressSizeToFit: true,
            field: isWolt ? "wolt_differencePercent" : "differencePercent",
            cellRenderer: (params: ICellRendererParams) => {
              if (isWolt) {
                const woltData = WOLT_DATA.find(
                  (d) => d.financialRow === params.data.financialRow
                );
                const value = woltData?.differencePercent;
                if (value === undefined || value === null) return "-";
                const isNegative = value < 0;
                return (
                  <div className={cn("text-right", isNegative && "text-red-600")}>
                    {formatPercent(value)}
                  </div>
                );
              } else {
                const value = params.value;
                if (value === undefined || value === null) return "-";
                const isNegative = value < 0;
                return (
                  <div className={cn("text-right", isNegative && "text-red-600")}>
                    {formatPercent(value)}
                  </div>
                );
              }
            },
            cellStyle: { textAlign: "right" },
          }
        );
      }

      // Add parent column group with subsidiary name
      if (childrenCols.length > 0) {
        cols.push({
          headerName: subsidiary,
          children: childrenCols,
          headerClass: "ag-header-group-cell text-center",
          headerStyle: { textAlign: "center", justifyContent: "center" },
        } as ColGroupDef);
      }
    });

    return cols;
  }, [subsidiaries, asOfPeriods, formatCurrency, formatPercent]);

  // Update grid when filtered data changes
  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.setGridOption("rowData", filteredData);
    }
  }, [filteredData]);

  return (
    <div className="flex-1 p-6 overflow-auto" style={{ minHeight: 0 }}>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div
          className="ag-theme-alpine w-full overflow-x-auto"
          style={{
            height: "calc(100vh - 280px)",
            width: "100%",
            minHeight: "400px",
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
  );
}
