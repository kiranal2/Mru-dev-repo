"use client";

import { useState, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Download, Columns, ChevronDown, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import Breadcrumb from "@/components/layout/Breadcrumb";
import {
  getPeriodStructure,
  getSubsidiaryStructure,
  type PeriodNode,
  type SubsidiaryNode,
} from "@/lib/balance-sheet-api";

interface AccountActivityRow {
  type: string;
  date: string;
  documentNumber: string;
  name: string;
  credit: number | undefined;
  debit: number | undefined;
  memo: string;
}

// Load period and subsidiary structure from API
const PERIOD_STRUCTURE = getPeriodStructure();
const SUBSIDIARY_STRUCTURE = getSubsidiaryStructure();

// Mock data based on the image - matching exact format
const MOCK_DATA: AccountActivityRow[] = [
  {
    type: "Journal",
    date: "2024-12-01",
    documentNumber: "729381",
    name: "",
    credit: -295152.58,
    debit: 0,
    memo: "MJE-102 MQ - Payal",
  },
  {
    type: "Journal",
    date: "2024-12-02",
    documentNumber: "728530",
    name: "",
    credit: 0,
    debit: 5321000.05,
    memo: "SUTTON BANK DOO",
  },
  {
    type: "Journal",
    date: "2024-12-02",
    documentNumber: "728536",
    name: "",
    credit: 0,
    debit: 555899.49,
    memo: "BetaFoods FUNDING MASTE",
  },
  {
    type: "Journal",
    date: "2024-12-02",
    documentNumber: "728536",
    name: "",
    credit: 0,
    debit: 525145.49,
    memo: "BetaFoods FUNDING MASTE",
  },
  {
    type: "Journal",
    date: "2024-12-02",
    documentNumber: "728536",
    name: "",
    credit: 0,
    debit: 347811.96,
    memo: "BetaFoods FUNDING MASTE",
  },
  {
    type: "Journal",
    date: "2024-12-02",
    documentNumber: "728536",
    name: "",
    credit: 0,
    debit: 60448.44,
    memo: "BetaFoods FUNDING MASTE",
  },
  {
    type: "Journal",
    date: "2024-12-03",
    documentNumber: "728540",
    name: "",
    credit: 0,
    debit: 98765.43,
    memo: "BetaFoods FUNDING PEOPL",
  },
  {
    type: "Journal",
    date: "2024-12-03",
    documentNumber: "728541",
    name: "",
    credit: 2500000.0,
    debit: 0,
    memo: "CUSTOMER PAYMENT - ABC CORP",
  },
  {
    type: "Journal",
    date: "2024-12-04",
    documentNumber: "728542",
    name: "",
    credit: 0,
    debit: 450000.0,
    memo: "VENDOR PAYMENT - XYZ SUPPLY",
  },
  {
    type: "Journal",
    date: "2024-12-04",
    documentNumber: "728543",
    name: "",
    credit: 0,
    debit: 125000.0,
    memo: "MONTHLY RENT PAYMENT",
  },
  {
    type: "Journal",
    date: "2024-12-04",
    documentNumber: "728544",
    name: "",
    credit: 1500000.0,
    debit: 0,
    memo: "CUSTOMER PAYMENT - DEF LLC",
  },
  {
    type: "Journal",
    date: "2024-12-05",
    documentNumber: "728545",
    name: "",
    credit: 0,
    debit: 87500.0,
    memo: "UTILITY PAYMENT - ELECTRIC",
  },
  {
    type: "Journal",
    date: "2024-12-05",
    documentNumber: "728546",
    name: "",
    credit: 0,
    debit: 32000.0,
    memo: "UTILITY PAYMENT - WATER",
  },
  {
    type: "Journal",
    date: "2024-12-05",
    documentNumber: "728547",
    name: "",
    credit: 3200000.0,
    debit: 0,
    memo: "CUSTOMER PAYMENT - GHI INC",
  },
  {
    type: "Journal",
    date: "2024-12-06",
    documentNumber: "728548",
    name: "",
    credit: 0,
    debit: 150000.0,
    memo: "PAYROLL PROCESSING",
  },
  {
    type: "Journal",
    date: "2024-12-06",
    documentNumber: "728549",
    name: "",
    credit: 0,
    debit: 45000.0,
    memo: "BENEFITS PAYMENT",
  },
  {
    type: "Journal",
    date: "2024-12-06",
    documentNumber: "728550",
    name: "",
    credit: 1800000.0,
    debit: 0,
    memo: "CUSTOMER PAYMENT - JKL CO",
  },
  {
    type: "Journal",
    date: "2024-12-07",
    documentNumber: "728551",
    name: "",
    credit: 0,
    debit: 250000.0,
    memo: "VENDOR PAYMENT - MNO DIST",
  },
  {
    type: "Journal",
    date: "2024-12-07",
    documentNumber: "728552",
    name: "",
    credit: 0,
    debit: 75000.0,
    memo: "MARKETING EXPENSE",
  },
  {
    type: "Journal",
    date: "2024-12-07",
    documentNumber: "728553",
    name: "",
    credit: 2100000.0,
    debit: 0,
    memo: "CUSTOMER PAYMENT - PQR LTD",
  },
  {
    type: "Journal",
    date: "2024-12-08",
    documentNumber: "728554",
    name: "",
    credit: 0,
    debit: 125000.0,
    memo: "INSURANCE PAYMENT",
  },
  {
    type: "Journal",
    date: "2024-12-08",
    documentNumber: "728555",
    name: "",
    credit: 0,
    debit: 95000.0,
    memo: "LEGAL SERVICES",
  },
  {
    type: "Journal",
    date: "2024-12-08",
    documentNumber: "728556",
    name: "",
    credit: 2750000.0,
    debit: 0,
    memo: "CUSTOMER PAYMENT - STU CORP",
  },
  {
    type: "Journal",
    date: "2024-12-09",
    documentNumber: "728557",
    name: "",
    credit: 0,
    debit: 200000.0,
    memo: "EQUIPMENT MAINTENANCE",
  },
  {
    type: "Journal",
    date: "2024-12-09",
    documentNumber: "728558",
    name: "",
    credit: 0,
    debit: 55000.0,
    memo: "OFFICE SUPPLIES",
  },
  {
    type: "Journal",
    date: "2024-12-09",
    documentNumber: "728559",
    name: "",
    credit: 1900000.0,
    debit: 0,
    memo: "CUSTOMER PAYMENT - VWX LLC",
  },
  {
    type: "Journal",
    date: "2024-12-10",
    documentNumber: "728560",
    name: "",
    credit: 0,
    debit: 175000.0,
    memo: "PROFESSIONAL SERVICES",
  },
  {
    type: "Journal",
    date: "2024-12-10",
    documentNumber: "728561",
    name: "",
    credit: 0,
    debit: 85000.0,
    memo: "TRAVEL EXPENSES",
  },
  {
    type: "Journal",
    date: "2024-12-10",
    documentNumber: "728562",
    name: "",
    credit: 2250000.0,
    debit: 0,
    memo: "CUSTOMER PAYMENT - YZA INC",
  },
  {
    type: "Journal",
    date: "2024-12-11",
    documentNumber: "728563",
    name: "",
    credit: 0,
    debit: 300000.0,
    memo: "SOFTWARE LICENSE RENEWAL",
  },
  {
    type: "Journal",
    date: "2024-12-11",
    documentNumber: "728564",
    name: "",
    credit: 0,
    debit: 65000.0,
    memo: "CONSULTING FEES",
  },
  {
    type: "Journal",
    date: "2024-12-11",
    documentNumber: "728565",
    name: "",
    credit: 2400000.0,
    debit: 0,
    memo: "CUSTOMER PAYMENT - BCD CO",
  },
  {
    type: "Journal",
    date: "2024-12-12",
    documentNumber: "728566",
    name: "",
    credit: 0,
    debit: 140000.0,
    memo: "FACILITIES MAINTENANCE",
  },
  {
    type: "Journal",
    date: "2024-12-12",
    documentNumber: "728567",
    name: "",
    credit: 0,
    debit: 72000.0,
    memo: "COMMUNICATION EXPENSES",
  },
  {
    type: "Journal",
    date: "2024-12-12",
    documentNumber: "728568",
    name: "",
    credit: 2600000.0,
    debit: 0,
    memo: "CUSTOMER PAYMENT - EFG LTD",
  },
  {
    type: "Journal",
    date: "2024-12-13",
    documentNumber: "728569",
    name: "",
    credit: 0,
    debit: 110000.0,
    memo: "TRAINING EXPENSES",
  },
  {
    type: "Journal",
    date: "2024-12-13",
    documentNumber: "728570",
    name: "",
    credit: 0,
    debit: 48000.0,
    memo: "SUBSCRIPTION SERVICES",
  },
  {
    type: "Journal",
    date: "2024-12-13",
    documentNumber: "728571",
    name: "",
    credit: 2800000.0,
    debit: 0,
    memo: "CUSTOMER PAYMENT - HIJ CORP",
  },
  {
    type: "Journal",
    date: "2024-12-14",
    documentNumber: "728572",
    name: "",
    credit: 0,
    debit: 160000.0,
    memo: "REPAIR AND MAINTENANCE",
  },
  {
    type: "Journal",
    date: "2024-12-14",
    documentNumber: "728573",
    name: "",
    credit: 0,
    debit: 58000.0,
    memo: "ADVERTISING EXPENSES",
  },
  {
    type: "Journal",
    date: "2024-12-14",
    documentNumber: "728574",
    name: "",
    credit: 2700000.0,
    debit: 0,
    memo: "CUSTOMER PAYMENT - KLM LLC",
  },
  {
    type: "Journal",
    date: "2024-12-15",
    documentNumber: "728575",
    name: "",
    credit: 0,
    debit: 190000.0,
    memo: "VENDOR PAYMENT - NOP DIST",
  },
  {
    type: "Journal",
    date: "2024-12-15",
    documentNumber: "728576",
    name: "",
    credit: 0,
    debit: 67000.0,
    memo: "BANK FEES",
  },
  {
    type: "Journal",
    date: "2024-12-15",
    documentNumber: "728577",
    name: "",
    credit: 2900000.0,
    debit: 0,
    memo: "CUSTOMER PAYMENT - QRS INC",
  },
];

export default function AccountActivityPage() {
  const gridRef = useRef<AgGridReact>(null);
  const [startPeriod, setStartPeriod] = useState<string>("Dec 2024");
  const [endPeriod, setEndPeriod] = useState<string>("Dec 2024");
  const [glAccount, setGlAccount] = useState<string>("1400 - Marqeta Inc.");
  const [subsidiaries, setSubsidiaries] = useState<string[]>([
    "BetaFoods Consolidated (Incl. Averra)",
  ]);
  const [currency, setCurrency] = useState<"USD" | "Functional">("USD");
  const [displayMode, setDisplayMode] = useState<"millions" | "full">("millions");

  // Pending filter states (before clicking Go)
  const [pendingStartPeriod, setPendingStartPeriod] = useState<string>("Dec 2024");
  const [pendingEndPeriod, setPendingEndPeriod] = useState<string>("Dec 2024");
  const [pendingGlAccount, setPendingGlAccount] = useState<string>("1400 - Marqeta Inc.");
  const [pendingSubsidiaries, setPendingSubsidiaries] = useState<string[]>([
    "BetaFoods Consolidated (Incl. Averra)",
  ]);
  const [periodPopoverOpen, setPeriodPopoverOpen] = useState(false);
  const [subsidiaryPopoverOpen, setSubsidiaryPopoverOpen] = useState(false);
  const [glAccountPopoverOpen, setGlAccountPopoverOpen] = useState(false);

  // Hierarchical filter states
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set(["FY-2024"]));
  const [expandedSubsidiaries, setExpandedSubsidiaries] = useState<Set<string>>(
    new Set(["betaFoods-consolidated"])
  );
  const [periodSearch, setPeriodSearch] = useState("");
  const [subsidiarySearch, setSubsidiarySearch] = useState("");
  const [glAccountSearch, setGlAccountSearch] = useState("");

  // Mock GL accounts
  const glAccounts = [
    "1400 - Marqeta Inc.",
    "1100 - Cash",
    "1200 - Accounts Receivable",
    "1300 - Inventory",
    "1500 - Property, Plant & Equipment",
  ];

  const formatCurrency = useMemo(
    () =>
      (value: number | undefined): string => {
        if (value === undefined || value === null) return "$0.00";
        if (displayMode === "millions") {
          const absValue = Math.abs(value);
          const sign = value < 0 ? "-" : "";
          return `${sign}$${absValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
        }
        // Convert from millions to full amount
        const valueInFull = value * 1000000;
        const absValue = Math.abs(valueInFull);
        const sign = valueInFull < 0 ? "-" : "";
        return `${sign}$${absValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      },
    [displayMode]
  );

  // Filter period nodes based on search
  const filterPeriodNodes = (nodes: PeriodNode[], search: string): PeriodNode[] => {
    if (!search) return nodes;
    const lowerSearch = search.toLowerCase();
    const filtered: PeriodNode[] = [];
    nodes.forEach((node) => {
      const matches = node.label.toLowerCase().includes(lowerSearch);
      const children = node.children ? filterPeriodNodes(node.children, search) : [];
      if (matches || children.length > 0) {
        filtered.push({ ...node, children: children.length > 0 ? children : node.children });
      }
    });
    return filtered;
  };

  // Filter subsidiary nodes based on search
  const filterSubsidiaryNodes = (nodes: SubsidiaryNode[], search: string): SubsidiaryNode[] => {
    if (!search) return nodes;
    const lowerSearch = search.toLowerCase();
    const filtered: SubsidiaryNode[] = [];
    nodes.forEach((node) => {
      const matches = node.label.toLowerCase().includes(lowerSearch);
      const children = node.children ? filterSubsidiaryNodes(node.children, search) : [];
      if (matches || children.length > 0) {
        filtered.push({ ...node, children: children.length > 0 ? children : node.children });
      }
    });
    return filtered;
  };

  const togglePeriodExpanded = (id: string) => {
    setExpandedPeriods((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSubsidiaryExpanded = (id: string) => {
    setExpandedSubsidiaries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handlePeriodToggle = (label: string, checked: boolean) => {
    // This will be used for start/end period selection
    // For now, we'll use it for both start and end
  };

  const handleSubsidiaryToggle = (label: string, checked: boolean) => {
    setPendingSubsidiaries((prev) => {
      if (checked) {
        return [label];
      } else {
        return prev.filter((s) => s !== label);
      }
    });
  };

  const handleRemoveSubsidiary = (sub: string) => {
    setPendingSubsidiaries((prev) => prev.filter((s) => s !== sub));
  };

  // Render hierarchical period tree
  const renderPeriodTree = (
    nodes: PeriodNode[],
    level = 0,
    onSelect: (label: string) => void
  ): JSX.Element[] => {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedPeriods.has(node.id);
      const isLeafNode = !hasChildren;

      return (
        <div key={node.id}>
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded",
              level > 0 && "ml-4",
              isLeafNode ? "hover:bg-gray-100 cursor-pointer" : "cursor-pointer"
            )}
            onClick={() => {
              if (isLeafNode) {
                onSelect(node.label);
              }
            }}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePeriodExpanded(node.id);
                }}
                className="flex-shrink-0 w-4 h-4 flex items-center justify-center"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-gray-600" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-4" />
            )}
            <span className="text-sm flex-1">{node.label}</span>
          </div>
          {hasChildren && isExpanded && (
            <div className="ml-2">{renderPeriodTree(node.children!, level + 1, onSelect)}</div>
          )}
        </div>
      );
    });
  };

  // Render hierarchical subsidiary tree
  const renderSubsidiaryTree = (nodes: SubsidiaryNode[], level = 0): JSX.Element[] => {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedSubsidiaries.has(node.id);
      const isSelected = pendingSubsidiaries.includes(node.label);

      return (
        <div key={node.id}>
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer",
              level > 0 && "ml-4"
            )}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSubsidiaryExpanded(node.id);
                }}
                className="flex-shrink-0 w-4 h-4 flex items-center justify-center"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-gray-600" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-4" />
            )}
            <label className="flex items-center gap-2 flex-1 cursor-pointer">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  handleSubsidiaryToggle(node.label, e.target.checked);
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-sm">{node.label}</span>
            </label>
          </div>
          {hasChildren && isExpanded && (
            <div className="ml-2">{renderSubsidiaryTree(node.children!, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  const filteredPeriodNodes = useMemo(
    () => filterPeriodNodes(PERIOD_STRUCTURE, periodSearch),
    [periodSearch]
  );
  const filteredSubsidiaryNodes = useMemo(
    () => filterSubsidiaryNodes(SUBSIDIARY_STRUCTURE, subsidiarySearch),
    [subsidiarySearch]
  );

  const filteredGlAccounts = useMemo(() => {
    if (!glAccountSearch) return glAccounts;
    return glAccounts.filter((account) =>
      account.toLowerCase().includes(glAccountSearch.toLowerCase())
    );
  }, [glAccountSearch]);

  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        field: "type",
        headerName: "Type",
        flex: 2,
        minWidth: 150,
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => {
          return (
            <a href="#" className="text-blue-600 underline hover:text-blue-800">
              {params.value}
            </a>
          );
        },
      },
      {
        field: "date",
        headerName: "Date",
        flex: 2,
        minWidth: 150,
        sortable: true,
        filter: true,
        // Keep date in YYYY-MM-DD format as shown in image
      },
      {
        field: "documentNumber",
        headerName: "Document Number",
        flex: 3,
        minWidth: 200,
        sortable: true,
        filter: true,
      },
      {
        field: "name",
        headerName: "Name",
        flex: 3,
        minWidth: 200,
        sortable: true,
        filter: true,
      },
      {
        field: "credit",
        headerName: "Credit",
        flex: 2.5,
        minWidth: 180,
        sortable: true,
        filter: true,
        valueFormatter: (params) => {
          if (params.value === 0 || params.value === null || params.value === undefined)
            return "$0.00";
          // Show negative values with minus sign
          if (params.value < 0) {
            return formatCurrency(Math.abs(params.value)).replace("$", "-$");
          }
          return formatCurrency(params.value);
        },
        cellStyle: { textAlign: "right" },
      },
      {
        field: "debit",
        headerName: "Debit",
        flex: 2.5,
        minWidth: 180,
        sortable: true,
        filter: true,
        valueFormatter: (params) => {
          if (params.value === 0 || params.value === null || params.value === undefined)
            return "$0.00";
          return formatCurrency(params.value);
        },
        cellStyle: { textAlign: "right" },
      },
      {
        field: "memo",
        headerName: "Memo",
        flex: 4,
        minWidth: 250,
        sortable: true,
        filter: true,
      },
    ],
    [formatCurrency]
  );

  const defaultColDef: ColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    []
  );

  const handleApplyFilters = () => {
    setStartPeriod(pendingStartPeriod);
    setEndPeriod(pendingEndPeriod);
    setGlAccount(pendingGlAccount);
    setSubsidiaries([...pendingSubsidiaries]);
    setPeriodPopoverOpen(false);
    setSubsidiaryPopoverOpen(false);
    setGlAccountPopoverOpen(false);
  };

  const handleExportCSV = () => {
    if (gridRef.current?.api) {
      gridRef.current.api.exportDataAsCsv({
        fileName: `account-activity-${glAccount.replace(" ", "-").toLowerCase()}.csv`,
      });
    }
  };

  // Calculate opening and closing balances
  const openingBalance = 41849256.09;
  const closingBalance = 999687.31;

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      {/* Page Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="reports/financials/account-activity" className="mb-1.5" />
        <h1 className="text-2xl font-bold text-[#000000] mt-2">Account Activity</h1>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>
      {/* Global Filter Bar */}
      <div className="bg-slate-100 border-b px-6 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 whitespace-nowrap">
                Start Period:
              </label>
              <Popover open={periodPopoverOpen} onOpenChange={setPeriodPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 min-w-[140px] h-9 justify-between bg-white hover:bg-slate-50"
                  >
                    <span className="text-sm">{pendingStartPeriod}</span>
                    <X
                      className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingStartPeriod("");
                      }}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Type to Search..."
                        value={periodSearch}
                        onChange={(e) => setPeriodSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto p-2">
                    {filteredPeriodNodes.length > 0 ? (
                      renderPeriodTree(filteredPeriodNodes, 0, (label) => {
                        setPendingStartPeriod(label);
                        setPeriodPopoverOpen(false);
                      })
                    ) : (
                      <div className="px-2 py-4 text-sm text-gray-500 text-center">
                        No periods found
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                End Period:
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 min-w-[140px] h-9 justify-between bg-white hover:bg-slate-50"
                  >
                    <span className="text-sm">{pendingEndPeriod}</span>
                    <X
                      className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingEndPeriod("");
                      }}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Type to Search..."
                        value={periodSearch}
                        onChange={(e) => setPeriodSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto p-2">
                    {filteredPeriodNodes.length > 0 ? (
                      renderPeriodTree(filteredPeriodNodes, 0, (label) => {
                        setPendingEndPeriod(label);
                      })
                    ) : (
                      <div className="px-2 py-4 text-sm text-gray-500 text-center">
                        No periods found
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                GL Account:
              </label>
              <Popover open={glAccountPopoverOpen} onOpenChange={setGlAccountPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 min-w-[200px] h-9 justify-between bg-white hover:bg-slate-50"
                  >
                    <span className="text-sm">{pendingGlAccount}</span>
                    <X
                      className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingGlAccount("");
                      }}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Type to Search..."
                        value={glAccountSearch}
                        onChange={(e) => setGlAccountSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto p-2">
                    {filteredGlAccounts.length > 0 ? (
                      filteredGlAccounts.map((account) => (
                        <div
                          key={account}
                          className="px-3 py-2 hover:bg-gray-100 rounded cursor-pointer text-sm"
                          onClick={() => {
                            setPendingGlAccount(account);
                            setGlAccountPopoverOpen(false);
                          }}
                        >
                          {account}
                        </div>
                      ))
                    ) : (
                      <div className="px-2 py-4 text-sm text-gray-500 text-center">
                        No accounts found
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Subsidiary:
              </label>
              <Popover open={subsidiaryPopoverOpen} onOpenChange={setSubsidiaryPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 min-w-[300px] h-9 justify-start bg-white hover:bg-slate-50"
                  >
                    {pendingSubsidiaries.length > 0 ? (
                      <div className="flex items-center gap-2 flex-wrap flex-1">
                        {pendingSubsidiaries.map((sub) => (
                          <Badge
                            key={sub}
                            variant="secondary"
                            className="flex items-center gap-1 pr-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSubsidiary(sub);
                            }}
                          >
                            {sub}
                            <X className="h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm flex-1">Select a subsidiary</span>
                    )}
                    <ChevronDown className="h-4 w-4 text-gray-500 ml-auto" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Type to Search..."
                        value={subsidiarySearch}
                        onChange={(e) => setSubsidiarySearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto p-2">
                    {filteredSubsidiaryNodes.length > 0 ? (
                      renderSubsidiaryTree(filteredSubsidiaryNodes)
                    ) : (
                      <div className="px-2 py-4 text-sm text-gray-500 text-center">
                        No subsidiaries found
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Button className="h-9 px-6" onClick={handleApplyFilters}>
              Go
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <ToggleGroup
              type="single"
              value={currency}
              onValueChange={(value: string | undefined) =>
                value && setCurrency(value as "USD" | "Functional")
              }
              className="inline-flex border border-slate-200 rounded-md bg-white p-0.5 gap-0 shadow-sm"
            >
              <ToggleGroupItem
                value="USD"
                aria-label="USD"
                className={cn(
                  "px-4 py-2 data-[state=on]:bg-slate-100 data-[state=on]:text-slate-900 data-[state=on]:font-medium border-0 hover:bg-slate-50 transition-colors",
                  currency === "USD" && "bg-slate-100"
                )}
              >
                USD
              </ToggleGroupItem>
              <ToggleGroupItem
                value="Functional"
                aria-label="Functional"
                className={cn(
                  "px-4 py-2 data-[state=on]:bg-slate-100 data-[state=on]:text-slate-900 data-[state=on]:font-medium border-0 hover:bg-slate-50 transition-colors",
                  currency === "Functional" && "bg-slate-100"
                )}
              >
                Functional
              </ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup
              type="single"
              value={displayMode}
              onValueChange={(value: string | undefined) =>
                value && setDisplayMode(value as "millions" | "full")
              }
              className="inline-flex border border-slate-200 rounded-md bg-white p-0.5 gap-0 shadow-sm"
            >
              <ToggleGroupItem
                value="millions"
                aria-label="Millions"
                className={cn(
                  "px-4 py-2 data-[state=on]:bg-slate-100 data-[state=on]:text-slate-900 data-[state=on]:font-medium border-0 hover:bg-slate-50 transition-colors",
                  displayMode === "millions" && "bg-slate-100"
                )}
              >
                Millions
              </ToggleGroupItem>
              <ToggleGroupItem
                value="full"
                aria-label="Full Amount"
                className={cn(
                  "px-4 py-2 data-[state=on]:bg-slate-100 data-[state=on]:text-slate-900 data-[state=on]:font-medium border-0 hover:bg-slate-50 transition-colors",
                  displayMode === "full" && "bg-slate-100"
                )}
              >
                Full Amount
              </ToggleGroupItem>
            </ToggleGroup>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
              onClick={handleExportCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Account Summary and Table Section */}
      <div className="flex-1 p-6 overflow-auto" style={{ minHeight: 0 }}>
        {/* Account Information Header */}
        <div className="mb-4">
          <div className="flex items-center gap-6 flex-wrap mb-2">
            <h2 className="text-lg font-bold text-slate-900">Account: {glAccount}</h2>
            <span className="text-sm font-medium text-slate-600">
              Opening Balance:{" "}
              <span className="font-bold text-slate-900">{formatCurrency(openingBalance)}</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-medium text-slate-600">
              Closing Balance:{" "}
              <span className="font-bold text-slate-900">{formatCurrency(closingBalance)}</span>
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
              rowData={MOCK_DATA}
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
