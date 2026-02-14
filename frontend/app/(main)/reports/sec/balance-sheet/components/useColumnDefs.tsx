"use client";

import { useMemo } from "react";
import type { ColDef, ColGroupDef, ICellRendererParams } from "ag-grid-community";
import type { FinancialRow } from "@/lib/balance-sheet-api";
import { WOLT_DATA, MONTH_TO_QUARTER } from "../constants";
import { cn } from "@/lib/utils";

/** Map a period label (e.g. "Q1 2024", "Jan 2024", "FY 2024") to a data field key. */
export function getPeriodField(period: string): string {
  // Parse quarter format: "Q1 2024" -> "q1_2024"
  const quarterMatch = period.match(/Q(\d)\s+(\d{4})/);
  if (quarterMatch) {
    const [, quarter, year] = quarterMatch;
    return `q${quarter}_${year}`;
  }

  // Parse month format: "Jan 2024" -> "q1_2024" (map to quarter)
  const monthMatch = period.match(
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/
  );
  if (monthMatch) {
    const [, month, year] = monthMatch;
    const quarter = MONTH_TO_QUARTER[month] || "4";
    return `q${quarter}_${year}`;
  }

  // Parse year format: "FY 2024" -> "q4_2024" (map to Q4)
  const yearMatch = period.match(/FY\s+(\d{4})/);
  if (yearMatch) {
    const [, year] = yearMatch;
    return `q4_${year}`;
  }

  return "";
}

export function useColumnDefs(
  subsidiaries: string[],
  asOfPeriods: string[],
  formatCurrency: (value: number | undefined) => string,
  formatPercent: (value: number | undefined) => string,
  financialRowRenderer: (params: ICellRendererParams) => JSX.Element
): (ColDef | ColGroupDef)[] {
  return useMemo(() => {
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

    subsidiaries.forEach((subsidiary) => {
      const isDoorDash = subsidiary === "BetaFoods, Inc. (Consolidated)";
      const isWolt = subsidiary === "Averra Oy (Consolidated)";
      const isLuxBite = subsidiary === "LuxBite, Inc. (Consolidated)";

      if (!isDoorDash && !isWolt && !isLuxBite) return;

      const childrenCols: ColDef[] = [];

      // Add period columns
      asOfPeriods.forEach((period) => {
        const field = getPeriodField(period);
        childrenCols.push({
          headerName: period,
          width: 188,
          suppressSizeToFit: true,
          field: isWolt ? `wolt_${field}` : field,
          cellRenderer: (params: ICellRendererParams) => {
            if (isWolt) {
              const woltData = WOLT_DATA.find((d) => d.financialRow === params.data.financialRow);
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
                const woltData = WOLT_DATA.find((d) => d.financialRow === params.data.financialRow);
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
                const woltData = WOLT_DATA.find((d) => d.financialRow === params.data.financialRow);
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
}
