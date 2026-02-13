"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  ModuleRegistry,
  AllCommunityModule,
  ICellRendererParams,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Search, GripVertical, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Breadcrumb from "@/components/layout/Breadcrumb";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface ExploreDataGridProps {
  headers: Array<{
    id: string;
    name: string;
    data_type?: string;
    description?: string;
    is_hidden?: boolean;
  }>;
  data: string[][];
  onClose: () => void;
}

export function ExploreDataGrid({ headers, data, onClose }: ExploreDataGridProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [columnSearch, setColumnSearch] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(headers.map((h) => h.id))
  );
  const [pivotMode, setPivotMode] = useState(false);

  // Convert data to row objects
  const rowData = useMemo(() => {
    return data.map((row) => {
      const rowObj: Record<string, any> = {};
      headers.forEach((header, index) => {
        rowObj[header.id] = row[index] || "";
      });
      return rowObj;
    });
  }, [data, headers]);

  // Create column definitions
  const columnDefs = useMemo<ColDef[]>(() => {
    return headers
      .filter((header) => visibleColumns.has(header.id))
      .map((header) => ({
        field: header.id,
        headerName: header.name,
        sortable: true,
        filter: true,
        resizable: true,
        minWidth: 100,
        cellRenderer: (params: ICellRendererParams) => {
          const value = params.value;
          if (value === null || value === undefined || value === "") {
            return "-";
          }
          return <div className="py-2">{String(value)}</div>;
        },
      }));
  }, [headers, visibleColumns]);

  // Filter columns based on search
  const filteredHeaders = useMemo(() => {
    if (!columnSearch) return headers;
    const searchLower = columnSearch.toLowerCase();
    return headers.filter(
      (header) =>
        header.name.toLowerCase().includes(searchLower) ||
        header.id.toLowerCase().includes(searchLower)
    );
  }, [headers, columnSearch]);

  const toggleColumnVisibility = (columnId: string) => {
    setVisibleColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };

  // Auto-size columns when visible columns change
  useEffect(() => {
    if (gridRef.current?.api) {
      setTimeout(() => {
        gridRef.current?.api.autoSizeAllColumns();
      }, 100);
    }
  }, [visibleColumns, columnDefs]);

  return (
    <div className="flex flex-col bg-white w-full h-full">
      {/* Page Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <Breadcrumb activeRoute="home/command-center" className="mb-1.5" />
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <h1 className="text-2xl font-bold text-[#000000] mt-2">Explore Data</h1>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
        {/* AG Grid */}
        <div className="flex-1 overflow-hidden p-6">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden" style={{ height: "100%" }}>
            <div className="h-full w-full ag-theme-alpine" style={{ height: "100%" }}>
              <AgGridReact
                ref={gridRef}
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={{
                  resizable: true,
                  sortable: true,
                  filter: true,
                }}
                suppressRowClickSelection={true}
                enableCellTextSelection={true}
                ensureDomOrder={true}
                animateRows={true}
                rowHeight={40}
                headerHeight={40}
                enableRangeSelection={false}
                suppressMenuHide={true}
                suppressCellFocus={true}
                domLayout="normal"
                pivotMode={pivotMode}
                onGridReady={(params) => {
                  // Auto-size columns based on content
                  params.api.autoSizeAllColumns();
                }}
                onFirstDataRendered={(params) => {
                  setTimeout(() => {
                    // Auto-size columns based on content after data is rendered
                    params.api.autoSizeAllColumns();
                  }, 100);
                }}
                onGridSizeChanged={(params) => {
                  // Auto-size columns when grid size changes
                  params.api.autoSizeAllColumns();
                }}
                onColumnVisible={(params) => {
                  // Auto-size when columns are shown/hidden
                  if (params.column) {
                    params.api.autoSizeColumns([params.column]);
                  }
                }}
                getRowStyle={(params) => {
                  const rowIndex = params.node.rowIndex;
                  if (rowIndex !== null && rowIndex !== undefined && rowIndex % 2 === 0) {
                    return { backgroundColor: "#fafafa" };
                  }
                  return { backgroundColor: "#ffffff" };
                }}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
          {/* Columns Section */}
          <div className="p-4 border-b border-gray-200">
            <div className="mb-3">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={pivotMode}
                  onChange={(e) => setPivotMode(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Pivot Mode</span>
              </label>
            </div>
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Q Search..."
                  value={columnSearch}
                  onChange={(e) => setColumnSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-700 mb-2">Columns</div>
            <div className="max-h-[400px] overflow-y-auto space-y-1">
              {filteredHeaders.map((header) => {
                const isVisible = visibleColumns.has(header.id);
                return (
                  <div
                    key={header.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer group"
                  >
                    <GripVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <label className="flex items-center gap-2 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleColumnVisibility(header.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 flex-1">{header.name}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row Groups Section */}
          <div className="p-4 border-b border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-2">Row Groups</div>
            <div className="min-h-[80px] border-2 border-dashed border-gray-300 rounded-lg p-3 flex items-center justify-center">
              <span className="text-sm text-gray-400">Drag here to set row groups</span>
            </div>
          </div>

          {/* Values Section */}
          <div className="p-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Σ Values</div>
            <div className="min-h-[80px] border-2 border-dashed border-gray-300 rounded-lg p-3 flex items-center justify-center">
              <span className="text-sm text-gray-400">Drag here to aggregate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

