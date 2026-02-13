"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  X,
  Download,
  Columns,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import Breadcrumb from "@/components/layout/Breadcrumb";

interface FinancialRow {
  financialRow: string;
  q1_2024?: number;
  q2_2024?: number;
  q3_2024?: number;
  q4_2024?: number;
  q1_2023?: number;
  q2_2023?: number;
  dollarDifference?: number;
  differencePercent?: number;
  group?: string;
  level?: number;
  expanded?: boolean;
}

const MOCK_DATA: FinancialRow[] = [
  // Revenue section
  {
    financialRow: "Revenue",
    q1_2024: 2513.64,
    q2_2024: 2889.63,
    q3_2024: 3123.45,
    q4_2024: 3456.78,
    q1_2023: 2234.56,
    q2_2023: 2456.78,
    dollarDifference: 375.99,
    differencePercent: 15.0,
    group: "revenue",
    level: 0,
    expanded: true,
  },
  {
    financialRow: "Bazaar GOV",
    q1_2024: 18150.0,
    q2_2024: 20890.0,
    q3_2024: 22340.0,
    q4_2024: 25120.0,
    q1_2023: 16230.0,
    q2_2023: 17890.0,
    dollarDifference: 2740.0,
    differencePercent: 15.1,
    group: "revenue",
    level: 1,
  },
  {
    financialRow: "Consumer fees",
    q1_2024: 2513.64,
    q2_2024: 2889.63,
    q3_2024: 3123.45,
    q4_2024: 3456.78,
    q1_2023: 2234.56,
    q2_2023: 2456.78,
    dollarDifference: 375.99,
    differencePercent: 15.0,
    group: "revenue",
    level: 1,
  },
  {
    financialRow: "Merchant fees",
    q1_2024: 1890.45,
    q2_2024: 2145.32,
    q3_2024: 2312.34,
    q4_2024: 2567.89,
    q1_2023: 1678.9,
    q2_2023: 1845.67,
    dollarDifference: 254.87,
    differencePercent: 13.5,
    group: "revenue",
    level: 1,
  },
  {
    financialRow: "Other revenue",
    q1_2024: 128.75,
    q2_2024: 145.23,
    q3_2024: 156.78,
    q4_2024: 178.9,
    q1_2023: 112.34,
    q2_2023: 123.45,
    dollarDifference: 16.48,
    differencePercent: 12.8,
    group: "revenue",
    level: 1,
  },
  // Cost of revenue section
  {
    financialRow: "Cost of revenue",
    q1_2024: 1089.23,
    q2_2024: 1245.67,
    q3_2024: 1345.89,
    q4_2024: 1456.78,
    q1_2023: 967.89,
    q2_2023: 1089.12,
    dollarDifference: 156.44,
    differencePercent: 14.4,
    group: "costs",
    level: 0,
    expanded: true,
  },
  {
    financialRow: "Delivery and fulfillment",
    q1_2024: 875.42,
    q2_2024: 998.56,
    q3_2024: 1089.23,
    q4_2024: 1189.45,
    q1_2023: 778.9,
    q2_2023: 889.12,
    dollarDifference: 123.14,
    differencePercent: 14.1,
    group: "costs",
    level: 1,
  },
  {
    financialRow: "Driver payments",
    q1_2024: 567.89,
    q2_2024: 645.67,
    q3_2024: 723.45,
    q4_2024: 789.12,
    q1_2023: 512.34,
    q2_2023: 578.9,
    dollarDifference: 77.78,
    differencePercent: 13.7,
    group: "costs",
    level: 2,
  },
  {
    financialRow: "Logistics infrastructure",
    q1_2024: 234.56,
    q2_2024: 267.89,
    q3_2024: 289.12,
    q4_2024: 312.34,
    q1_2023: 198.76,
    q2_2023: 223.45,
    dollarDifference: 33.33,
    differencePercent: 14.2,
    group: "costs",
    level: 2,
  },
  {
    financialRow: "Warehousing",
    q1_2024: 72.97,
    q2_2024: 85.0,
    q3_2024: 76.66,
    q4_2024: 87.99,
    q1_2023: 67.8,
    q2_2023: 86.77,
    dollarDifference: 12.03,
    differencePercent: 16.5,
    group: "costs",
    level: 2,
  },
  {
    financialRow: "Payment processing",
    q1_2024: 123.89,
    q2_2024: 141.23,
    q3_2024: 156.78,
    q4_2024: 167.89,
    q1_2023: 112.34,
    q2_2023: 123.45,
    dollarDifference: 17.34,
    differencePercent: 14.0,
    group: "costs",
    level: 1,
  },
  {
    financialRow: "Other cost of revenue",
    q1_2024: 89.92,
    q2_2024: 105.88,
    q3_2024: 99.88,
    q4_2024: 99.44,
    q1_2023: 76.65,
    q2_2023: 76.55,
    dollarDifference: 15.96,
    differencePercent: 17.8,
    group: "costs",
    level: 1,
  },
  // Gross profit
  {
    financialRow: "Gross profit",
    q1_2024: 1424.41,
    q2_2024: 1643.96,
    q3_2024: 1777.56,
    q4_2024: 2000.0,
    q1_2023: 1266.67,
    q2_2023: 1367.66,
    dollarDifference: 219.55,
    differencePercent: 15.4,
    group: "profit",
    level: 0,
    expanded: true,
  },
  // Operating expenses section
  {
    financialRow: "Operating expenses",
    q1_2024: 1867.89,
    q2_2024: 2134.56,
    q3_2024: 2234.67,
    q4_2024: 2456.78,
    q1_2023: 1678.9,
    q2_2023: 1845.67,
    dollarDifference: 266.67,
    differencePercent: 14.3,
    group: "expenses",
    level: 0,
    expanded: true,
  },
  {
    financialRow: "Sales and marketing",
    q1_2024: 789.45,
    q2_2024: 912.34,
    q3_2024: 998.56,
    q4_2024: 1056.78,
    q1_2023: 678.9,
    q2_2023: 745.67,
    dollarDifference: 122.89,
    differencePercent: 15.6,
    group: "expenses",
    level: 1,
  },
  {
    financialRow: "Advertising and promotion",
    q1_2024: 456.78,
    q2_2024: 523.45,
    q3_2024: 589.12,
    q4_2024: 623.45,
    q1_2023: 398.76,
    q2_2023: 445.67,
    dollarDifference: 66.67,
    differencePercent: 14.6,
    group: "expenses",
    level: 2,
  },
  {
    financialRow: "Sales personnel",
    q1_2024: 198.67,
    q2_2024: 223.45,
    q3_2024: 245.67,
    q4_2024: 267.89,
    q1_2023: 178.9,
    q2_2023: 198.76,
    dollarDifference: 24.78,
    differencePercent: 12.5,
    group: "expenses",
    level: 2,
  },
  {
    financialRow: "Marketing operations",
    q1_2024: 134.0,
    q2_2024: 165.44,
    q3_2024: 163.77,
    q4_2024: 165.44,
    q1_2023: 101.24,
    q2_2023: 101.24,
    dollarDifference: 31.44,
    differencePercent: 23.5,
    group: "expenses",
    level: 2,
  },
  {
    financialRow: "Product development",
    q1_2024: 456.78,
    q2_2024: 523.45,
    q3_2024: 589.12,
    q4_2024: 623.45,
    q1_2023: 398.76,
    q2_2023: 445.67,
    dollarDifference: 66.67,
    differencePercent: 14.6,
    group: "expenses",
    level: 1,
  },
  {
    financialRow: "Research and development",
    q1_2024: 298.56,
    q2_2024: 334.78,
    q3_2024: 367.89,
    q4_2024: 389.12,
    q1_2023: 267.89,
    q2_2023: 298.56,
    dollarDifference: 36.22,
    differencePercent: 12.1,
    group: "expenses",
    level: 2,
  },
  {
    financialRow: "Engineering",
    q1_2024: 158.22,
    q2_2024: 188.67,
    q3_2024: 221.23,
    q4_2024: 234.33,
    q1_2023: 130.87,
    q2_2023: 147.11,
    dollarDifference: 30.45,
    differencePercent: 19.2,
    group: "expenses",
    level: 2,
  },
  {
    financialRow: "General and administrative",
    q1_2024: 345.67,
    q2_2024: 389.23,
    q3_2024: 412.45,
    q4_2024: 445.67,
    q1_2023: 298.76,
    q2_2023: 334.56,
    dollarDifference: 43.56,
    differencePercent: 12.6,
    group: "expenses",
    level: 1,
  },
  {
    financialRow: "Executive compensation",
    q1_2024: 123.45,
    q2_2024: 145.67,
    q3_2024: 156.78,
    q4_2024: 167.89,
    q1_2023: 112.34,
    q2_2023: 123.45,
    dollarDifference: 22.22,
    differencePercent: 18.0,
    group: "expenses",
    level: 2,
  },
  {
    financialRow: "Legal and compliance",
    q1_2024: 98.76,
    q2_2024: 112.34,
    q3_2024: 123.45,
    q4_2024: 134.56,
    q1_2023: 89.12,
    q2_2023: 98.76,
    dollarDifference: 13.58,
    differencePercent: 13.7,
    group: "expenses",
    level: 2,
  },
  {
    financialRow: "Corporate services",
    q1_2024: 123.46,
    q2_2024: 131.22,
    q3_2024: 132.22,
    q4_2024: 143.22,
    q1_2023: 97.3,
    q2_2023: 112.35,
    dollarDifference: 7.76,
    differencePercent: 6.3,
    group: "expenses",
    level: 2,
  },
  {
    financialRow: "Depreciation and amortization",
    q1_2024: 276.99,
    q2_2024: 309.54,
    q3_2024: 312.45,
    q4_2024: 334.56,
    q1_2023: 245.67,
    q2_2023: 267.89,
    dollarDifference: 32.55,
    differencePercent: 11.7,
    group: "expenses",
    level: 1,
  },
  // Operating loss
  {
    financialRow: "Operating loss",
    q1_2024: -443.48,
    q2_2024: -490.6,
    q3_2024: -457.11,
    q4_2024: -456.78,
    q1_2023: -412.23,
    q2_2023: -477.89,
    dollarDifference: -47.12,
    differencePercent: 10.6,
    group: "profit",
    level: 0,
    expanded: true,
  },
  // Other income/expense
  {
    financialRow: "Other income (expense), net",
    q1_2024: 45.67,
    q2_2024: 52.34,
    q3_2024: 56.78,
    q4_2024: 61.23,
    q1_2023: 41.23,
    q2_2023: 48.45,
    dollarDifference: 6.67,
    differencePercent: 14.6,
    group: "other",
    level: 0,
    expanded: true,
  },
  {
    financialRow: "Interest income",
    q1_2024: 34.56,
    q2_2024: 39.87,
    q3_2024: 42.34,
    q4_2024: 45.67,
    q1_2023: 31.23,
    q2_2023: 36.45,
    dollarDifference: 5.31,
    differencePercent: 15.4,
    group: "other",
    level: 1,
  },
  {
    financialRow: "Interest expense",
    q1_2024: -12.34,
    q2_2024: -14.56,
    q3_2024: -15.78,
    q4_2024: -17.89,
    q1_2023: -11.23,
    q2_2023: -12.45,
    dollarDifference: -2.22,
    differencePercent: 18.0,
    group: "other",
    level: 1,
  },
  {
    financialRow: "Other, net",
    q1_2024: 23.45,
    q2_2024: 27.03,
    q3_2024: 30.22,
    q4_2024: 33.45,
    q1_2023: 21.23,
    q2_2023: 24.45,
    dollarDifference: 3.58,
    differencePercent: 15.3,
    group: "other",
    level: 1,
  },
  // Net loss
  {
    financialRow: "Net loss",
    q1_2024: -397.81,
    q2_2024: -438.26,
    q3_2024: -400.33,
    q4_2024: -395.55,
    q1_2023: -370.0,
    q2_2023: -429.44,
    dollarDifference: -40.45,
    differencePercent: 10.2,
    group: "profit",
    level: 0,
    expanded: true,
  },
];

// Averra Oy data
const WOLT_DATA: FinancialRow[] = [
  {
    financialRow: "Revenue",
    q1_2024: 456.78,
    q2_2024: 523.45,
    dollarDifference: 66.67,
    differencePercent: 14.6,
    group: "revenue",
    level: 0,
    expanded: true,
  },
  {
    financialRow: "Bazaar GOV",
    q1_2024: 3256.89,
    q2_2024: 3745.23,
    dollarDifference: 488.34,
    differencePercent: 15.0,
    group: "revenue",
    level: 1,
  },
  {
    financialRow: "Consumer fees",
    q1_2024: 456.78,
    q2_2024: 523.45,
    dollarDifference: 66.67,
    differencePercent: 14.6,
    group: "revenue",
    level: 1,
  },
  {
    financialRow: "Merchant fees",
    q1_2024: 312.45,
    q2_2024: 358.92,
    dollarDifference: 46.47,
    differencePercent: 14.9,
    group: "revenue",
    level: 1,
  },
  {
    financialRow: "Other revenue",
    q1_2024: 23.45,
    q2_2024: 27.89,
    dollarDifference: 4.44,
    differencePercent: 18.9,
    group: "revenue",
    level: 1,
  },
  {
    financialRow: "Cost of revenue",
    q1_2024: 198.34,
    q2_2024: 227.89,
    dollarDifference: 29.55,
    differencePercent: 14.9,
    group: "costs",
    level: 0,
    expanded: true,
  },
  {
    financialRow: "Delivery and fulfillment",
    q1_2024: 156.78,
    q2_2024: 179.45,
    dollarDifference: 22.67,
    differencePercent: 14.5,
    group: "costs",
    level: 1,
  },
  {
    financialRow: "Payment processing",
    q1_2024: 28.45,
    q2_2024: 32.67,
    dollarDifference: 4.22,
    differencePercent: 14.8,
    group: "costs",
    level: 1,
  },
  {
    financialRow: "Other cost of revenue",
    q1_2024: 13.11,
    q2_2024: 15.77,
    dollarDifference: 2.66,
    differencePercent: 20.3,
    group: "costs",
    level: 1,
  },
  {
    financialRow: "Gross profit",
    q1_2024: 258.44,
    q2_2024: 295.56,
    dollarDifference: 37.12,
    differencePercent: 14.4,
    group: "profit",
    level: 0,
    expanded: true,
  },
  {
    financialRow: "Operating expenses",
    q1_2024: 345.67,
    q2_2024: 389.23,
    dollarDifference: 43.56,
    differencePercent: 12.6,
    group: "expenses",
    level: 0,
    expanded: true,
  },
  {
    financialRow: "Sales and marketing",
    q1_2024: 145.23,
    q2_2024: 167.89,
    dollarDifference: 22.66,
    differencePercent: 15.6,
    group: "expenses",
    level: 1,
  },
  {
    financialRow: "Product development",
    q1_2024: 87.45,
    q2_2024: 98.34,
    dollarDifference: 10.89,
    differencePercent: 12.5,
    group: "expenses",
    level: 1,
  },
  {
    financialRow: "General and administrative",
    q1_2024: 67.89,
    q2_2024: 76.45,
    dollarDifference: 8.56,
    differencePercent: 12.6,
    group: "expenses",
    level: 1,
  },
  {
    financialRow: "Depreciation and amortization",
    q1_2024: 45.1,
    q2_2024: 46.55,
    dollarDifference: 1.45,
    differencePercent: 3.2,
    group: "expenses",
    level: 1,
  },
  {
    financialRow: "Operating loss",
    q1_2024: -87.23,
    q2_2024: -93.67,
    dollarDifference: -6.44,
    differencePercent: 7.4,
    group: "profit",
    level: 0,
    expanded: true,
  },
  {
    financialRow: "Other income (expense), net",
    q1_2024: 8.45,
    q2_2024: 9.67,
    dollarDifference: 1.22,
    differencePercent: 14.4,
    group: "other",
    level: 0,
    expanded: true,
  },
  {
    financialRow: "Interest income",
    q1_2024: 6.78,
    q2_2024: 7.89,
    dollarDifference: 1.11,
    differencePercent: 16.4,
    group: "other",
    level: 1,
  },
  {
    financialRow: "Interest expense",
    q1_2024: -2.34,
    q2_2024: -2.67,
    dollarDifference: -0.33,
    differencePercent: 14.1,
    group: "other",
    level: 1,
  },
  {
    financialRow: "Other, net",
    q1_2024: 4.01,
    q2_2024: 4.45,
    dollarDifference: 0.44,
    differencePercent: 11.0,
    group: "other",
    level: 1,
  },
  {
    financialRow: "Net loss",
    q1_2024: -78.78,
    q2_2024: -84.0,
    dollarDifference: -5.22,
    differencePercent: 6.6,
    group: "profit",
    level: 0,
    expanded: true,
  },
];

// Hierarchical period structure
interface PeriodNode {
  id: string;
  label: string;
  type: "year" | "quarter" | "month";
  children?: PeriodNode[];
  year?: number;
  quarter?: number;
  month?: number;
}

// Hierarchical subsidiary structure
interface SubsidiaryNode {
  id: string;
  label: string;
  children?: SubsidiaryNode[];
}

// Generate period structure (FY 2014 to FY 2032)
const generatePeriodStructure = (): PeriodNode[] => {
  const years: PeriodNode[] = [];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  for (let year = 2014; year <= 2032; year++) {
    const quarters: PeriodNode[] = [];
    for (let q = 1; q <= 4; q++) {
      const quarterMonths: PeriodNode[] = [];
      for (let m = (q - 1) * 3; m < q * 3; m++) {
        quarterMonths.push({
          id: `${year}-${m + 1}`,
          label: `${months[m]} ${year}`,
          type: "month",
          year,
          quarter: q,
          month: m + 1,
        });
      }
      quarters.push({
        id: `Q${q}-${year}`,
        label: `Q${q} ${year}`,
        type: "quarter",
        year,
        quarter: q,
        children: quarterMonths,
      });
    }
    years.push({
      id: `FY-${year}`,
      label: `FY ${year}`,
      type: "year",
      year,
      children: quarters,
    });
  }
  return years;
};

const PERIOD_STRUCTURE = generatePeriodStructure();

// Subsidiary structure
const SUBSIDIARY_STRUCTURE: SubsidiaryNode[] = [
  {
    id: "betaFoods-consolidated",
    label: "BetaFoods Consolidated (Incl. Averra)",
    children: [
      {
        id: "betaFoods-inc",
        label: "BetaFoods, Inc. (Consolidated)",
      },
      {
        id: "averra-oy",
        label: "Averra Oy (Consolidated)",
      },
    ],
  },
  {
    id: "LuxBite-inc",
    label: "LuxBite, Inc. (Consolidated)",
  },
];

// Helper to get all leaf nodes (selectable items)
const getLeafNodes = (
  nodes: PeriodNode[] | SubsidiaryNode[],
  type: "period" | "subsidiary"
): string[] => {
  const leaves: string[] = [];
  nodes.forEach((node) => {
    if (!node.children || node.children.length === 0) {
      leaves.push(type === "period" ? (node as PeriodNode).label : (node as SubsidiaryNode).label);
    } else {
      leaves.push(...getLeafNodes(node.children, type));
    }
  });
  return leaves;
};

export default function IncomeStatementPage() {
  const gridRef = useRef<AgGridReact>(null);
  const [view, setView] = useState<"consolidated" | "comparative" | "trended">("comparative");
  const [asOfPeriods, setAsOfPeriods] = useState<string[]>(["Q1 2024", "Q2 2024"]);
  const [subsidiaries, setSubsidiaries] = useState<string[]>([
    "BetaFoods, Inc. (Consolidated)",
    "Averra Oy (Consolidated)",
  ]);
  const [displayMode, setDisplayMode] = useState<"millions" | "full">("millions");

  // Pending filter states (before clicking Go)
  const [pendingPeriods, setPendingPeriods] = useState<string[]>(["Q1 2024", "Q2 2024"]);
  const [pendingSubsidiaries, setPendingSubsidiaries] = useState<string[]>([
    "BetaFoods, Inc. (Consolidated)",
    "Averra Oy (Consolidated)",
  ]);
  const [pendingView, setPendingView] = useState<"consolidated" | "comparative" | "trended">(
    "comparative"
  );
  const [periodPopoverOpen, setPeriodPopoverOpen] = useState(false);
  const [subsidiaryPopoverOpen, setSubsidiaryPopoverOpen] = useState(false);

  // Hierarchical filter states
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set(["FY-2024"]));
  const [expandedSubsidiaries, setExpandedSubsidiaries] = useState<Set<string>>(
    new Set(["betaFoods-consolidated"])
  );
  const [periodSearch, setPeriodSearch] = useState("");
  const [subsidiarySearch, setSubsidiarySearch] = useState("");

  const formatCurrency = useMemo(
    () =>
      (value: number | undefined): string => {
        if (value === undefined || value === null) return "-";
        if (displayMode === "millions") {
          return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
        }
        // Convert from millions to full amount
        const valueInFull = value * 1000000;
        return `$${valueInFull.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      },
    [displayMode]
  );

  const formatPercent = useMemo(
    () =>
      (value: number | undefined): string => {
        if (value === undefined || value === null) return "-";
        return `${value.toFixed(2)}%`;
      },
    []
  );

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

    // Helper function to map period (month/quarter/year) to field name
    const getPeriodField = (period: string): string => {
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
        const monthToQuarter: { [key: string]: string } = {
          Jan: "1",
          Feb: "1",
          Mar: "1",
          Apr: "2",
          May: "2",
          Jun: "2",
          Jul: "3",
          Aug: "3",
          Sep: "3",
          Oct: "4",
          Nov: "4",
          Dec: "4",
        };
        const quarter = monthToQuarter[month] || "4";
        return `q${quarter}_${year}`;
      }

      // Parse year format: "FY 2024" -> "q4_2024" (map to Q4)
      const yearMatch = period.match(/FY\s+(\d{4})/);
      if (yearMatch) {
        const [, year] = yearMatch;
        return `q4_${year}`;
      }

      return "";
    };

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

  const handleRemovePeriod = (period: string) => {
    setPendingPeriods((prev) => prev.filter((p) => p !== period));
  };

  const handleRemoveSubsidiary = (subsidiary: string) => {
    setPendingSubsidiaries((prev) => prev.filter((s) => s !== subsidiary));
  };

  const togglePeriodExpanded = (id: string) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSubsidiaryExpanded = (id: string) => {
    setExpandedSubsidiaries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePeriodToggle = (period: string, checked: boolean) => {
    if (checked) {
      // Determine max selections based on view mode
      const maxSelections = pendingView === "consolidated" ? 1 : 2; // Comparative and Trended both allow 2

      // Check if we've reached the limit
      if (pendingPeriods.length >= maxSelections) {
        // For consolidated, replace the existing selection
        if (pendingView === "consolidated") {
          setPendingPeriods([period]);
          return;
        }
        // For comparative and trended, don't allow more than 2
        if (
          (pendingView === "comparative" || pendingView === "trended") &&
          pendingPeriods.length >= 2
        ) {
          return;
        }
      }

      setPendingPeriods((prev) => {
        // Prevent duplicates
        if (prev.includes(period)) {
          return prev;
        }
        return [...prev, period];
      });
    } else {
      setPendingPeriods((prev) => prev.filter((p) => p !== period));
    }
  };

  const handleSubsidiaryToggle = (subsidiary: string, checked: boolean) => {
    if (checked) {
      setPendingSubsidiaries((prev) => [...prev, subsidiary]);
    } else {
      setPendingSubsidiaries((prev) => prev.filter((s) => s !== subsidiary));
    }
  };

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

  // Render hierarchical period tree
  const renderPeriodTree = (nodes: PeriodNode[], level = 0): JSX.Element[] => {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedPeriods.has(node.id);
      const isSelected = pendingPeriods.includes(node.label);
      const isLeafNode = !hasChildren;

      // Determine max selections based on view mode
      const maxSelections = pendingView === "consolidated" ? 1 : 2; // Comparative and Trended both allow 2
      const isLimitReached = pendingPeriods.length >= maxSelections;

      // Consolidated: only leaf nodes (months) can be selected
      // Comparative and Trended: all nodes (years, quarters, months) can be selected
      const canSelect =
        pendingView === "consolidated"
          ? isLeafNode && (!isLimitReached || isSelected)
          : !isLimitReached || isSelected;

      return (
        <div key={node.id}>
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded",
              level > 0 && "ml-4",
              pendingView === "comparative" || pendingView === "trended" || isLeafNode
                ? "hover:bg-gray-100 cursor-pointer"
                : "cursor-pointer",
              !canSelect &&
                (pendingView === "comparative" || pendingView === "trended" || isLeafNode) &&
                "opacity-50"
            )}
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
            {/* Consolidated view: only show checkboxes for leaf nodes (months) */}
            {/* Comparative and Trended views: show checkboxes for all nodes (years, quarters, months) */}
            {pendingView === "comparative" || pendingView === "trended" || isLeafNode ? (
              <label
                className={cn(
                  "flex items-center gap-2 flex-1",
                  canSelect ? "cursor-pointer" : "cursor-not-allowed"
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={!canSelect}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (canSelect) {
                      handlePeriodToggle(node.label, e.target.checked);
                    }
                  }}
                  onClick={(e) => {
                    if (!canSelect) {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }
                    e.stopPropagation();
                  }}
                  className={cn(
                    "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500",
                    !canSelect && "opacity-50 cursor-not-allowed"
                  )}
                />
                <span className={cn("text-sm", !canSelect && "opacity-50")}>{node.label}</span>
              </label>
            ) : (
              <span className="text-sm flex-1">{node.label}</span>
            )}
          </div>
          {hasChildren && isExpanded && (
            <div className="ml-2">{renderPeriodTree(node.children!, level + 1)}</div>
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

  const handleApplyFilters = () => {
    setAsOfPeriods([...pendingPeriods]);
    setSubsidiaries([...pendingSubsidiaries]);
    setView(pendingView);
    setPeriodPopoverOpen(false);
    setSubsidiaryPopoverOpen(false);
  };

  // Filter the data based on selected filters (View, As Of, Subsidiary)
  const filteredData = useMemo(() => {
    let dataSource: FinancialRow[] = [];

    // Determine which data source to use based on subsidiary selection
    if (subsidiaries.length === 0) {
      // No subsidiary selected, show empty or default
      return [];
    }

    // If only BetaFoods is selected, use MOCK_DATA
    if (
      subsidiaries.includes("BetaFoods, Inc. (Consolidated)") &&
      !subsidiaries.includes("Averra Oy (Consolidated)")
    ) {
      dataSource = [...MOCK_DATA];
    }
    // If only Averra is selected, use WOLT_DATA
    else if (
      subsidiaries.includes("Averra Oy (Consolidated)") &&
      !subsidiaries.includes("BetaFoods, Inc. (Consolidated)")
    ) {
      dataSource = [...WOLT_DATA];
    }
    // If both are selected (comparative view), use MOCK_DATA as primary
    else {
      dataSource = [...MOCK_DATA];
    }

    // Filter based on As Of periods - if only one period is selected, filter the data
    // (This would affect which columns show, but we'll keep all rows)
    // For now, we'll return all data and let columnDefs handle period filtering

    return dataSource;
  }, [subsidiaries, asOfPeriods]);

  // Sync pending states when applied filters change
  useEffect(() => {
    setPendingPeriods([...asOfPeriods]);
    setPendingSubsidiaries([...subsidiaries]);
    setPendingView(view);
  }, [asOfPeriods, subsidiaries, view]);

  // Adjust period selections when view mode changes
  useEffect(() => {
    const maxSelections = pendingView === "consolidated" ? 1 : 2; // Comparative and Trended both allow 2
    if (pendingPeriods.length > maxSelections) {
      // If consolidated, keep only the first selection
      if (pendingView === "consolidated") {
        setPendingPeriods((prev) => prev.slice(0, 1));
      }
      // If comparative or trended, keep only the first two selections
      else if (pendingView === "comparative" || pendingView === "trended") {
        setPendingPeriods((prev) => prev.slice(0, 2));
      }
    }
  }, [pendingView, pendingPeriods.length]);

  // Update grid when filtered data changes
  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.setGridOption("rowData", filteredData);
    }
  }, [filteredData]);

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      {/* Page Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="reports/sec/income-statement" className="mb-1.5" />
        <h1 className="text-2xl font-bold text-[#000000] mt-2">Income Statement</h1>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>
      {/* Global Filter Bar */}
      <div className="bg-slate-100 border-b px-6 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 whitespace-nowrap">View:</label>
              <Select
                value={pendingView}
                onValueChange={(value: string) =>
                  setPendingView(value as "consolidated" | "comparative" | "trended")
                }
              >
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consolidated">Consolidated</SelectItem>
                  <SelectItem value="comparative">Comparative</SelectItem>
                  <SelectItem value="trended">Trended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 whitespace-nowrap">
                Period:
              </label>
              <Popover open={periodPopoverOpen} onOpenChange={setPeriodPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 min-w-[200px] h-9 justify-start bg-white hover:bg-slate-50"
                  >
                    {pendingPeriods.length > 0 ? (
                      <div className="flex items-center gap-2 flex-wrap flex-1">
                        {pendingPeriods.slice(0, 2).map((period) => (
                          <Badge
                            key={period}
                            variant="secondary"
                            className="flex items-center gap-1 pr-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePeriod(period);
                            }}
                          >
                            {period}
                            <X className="h-3 w-3" />
                          </Badge>
                        ))}
                        {pendingPeriods.length > 2 && (
                          <Badge variant="secondary" className="flex items-center gap-1 pr-1">
                            +{pendingPeriods.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm flex-1">Select a period</span>
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
                        value={periodSearch}
                        onChange={(e) => setPeriodSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto p-2">
                    {filteredPeriodNodes.length > 0 ? (
                      renderPeriodTree(filteredPeriodNodes)
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
                        {pendingSubsidiaries.slice(0, 1).map((sub) => (
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
                        {pendingSubsidiaries.length > 1 && (
                          <Badge variant="secondary" className="flex items-center gap-1 pr-1">
                            +{pendingSubsidiaries.length - 1}
                          </Badge>
                        )}
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
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0 border border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
            >
              <Columns className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* AG Grid */}
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
