import React from "react";
import {
  MessageSquareMore,
  FolderKanban,
  Pin,
  Eye,
  FileText,
  Calculator,
  Star,
  Banknote,
  BarChart3,
  Focus as Abacus,
  Type,
  Video,
  MousePointerClick,
  TrendingUp,
  Wallet,
  Settings,
  CreditCard,
  ShoppingBag,
  Coins,
  Receipt,
  Package,
  LayoutGrid,
  BookOpen,
  Activity,
  FileSpreadsheet,
  Shield,
  Building2,
  DollarSign,
  Users,
  FileCheck,
  Brain,
  MessageCircle,
  Map,
  Download,
  Landmark,
} from "lucide-react";

type RailItem = "home" | "automation" | "workbench" | "reports" | "igrs" | "revenue-assurance";

type NavigationItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  children?: NavigationItem[];
};

export const NAVIGATION_STRUCTURE: Record<RailItem, NavigationItem[]> = {
  home: [
    {
      id: "command-center",
      label: "Command Center",
      icon: React.createElement(MessageSquareMore, { size: 18 }),
      route: "/home/command-center",
    },
    {
      id: "dynamic-sheets",
      label: "Dynamic Sheets",
      icon: React.createElement(FileSpreadsheet, { size: 18 }),
      route: "/home/dynamic-sheets",
    },
    {
      id: "workspace",
      label: "Workspace",
      icon: React.createElement(FolderKanban, { size: 18 }),
      route: "/home/workspace",
      children: [
        {
          id: "my-workspace",
          label: "My Workspace",
          icon: React.createElement(FolderKanban, { size: 16 }),
          route: "/home/workspace/my-workspace",
        },
        {
          id: "live-pins",
          label: "Live Pins",
          icon: React.createElement(Pin, { size: 16 }),
          route: "/home/workspace/live-pins",
        },
        {
          id: "watchlist",
          label: "Watchlist",
          icon: React.createElement(Eye, { size: 16 }),
          route: "/home/workspace/watchlist",
        },
        {
          id: "data-template",
          label: "Data template",
          icon: React.createElement(FileSpreadsheet, { size: 16 }),
          route: "/home/workspace/data-template",
        },
      ],
    },
  ],
  automation: [
    {
      id: "autonomy-studio",
      label: "Autonomy Studio",
      icon: React.createElement(FileText, { size: 18 }),
      route: "/automation/autonomy-studio",
    },
  ],
  igrs: [
    {
      id: "igrs-revenue-assurance",
      label: "Revenue Assurance",
      icon: React.createElement(Landmark, { size: 18 }),
      route: "/igrs/revenue-assurance",
      children: [
        {
          id: "igrs-overview",
          label: "Overview",
          icon: React.createElement(BarChart3, { size: 16 }),
          route: "/igrs/revenue-assurance/overview",
        },
        {
          id: "igrs-cases",
          label: "Cases",
          icon: React.createElement(FileCheck, { size: 16 }),
          route: "/igrs/revenue-assurance/cases",
        },
        {
          id: "igrs-rules",
          label: "Rules",
          icon: React.createElement(Shield, { size: 16 }),
          route: "/igrs/revenue-assurance/rules",
        },
        {
          id: "igrs-insights",
          label: "Insights",
          icon: React.createElement(Brain, { size: 16 }),
          route: "/igrs/revenue-assurance/insights",
        },
        {
          id: "igrs-ai-chat",
          label: "AI Chat",
          icon: React.createElement(MessageCircle, { size: 16 }),
          route: "/igrs/revenue-assurance/ai-chat",
        },
        {
          id: "igrs-mv-trends",
          label: "MV Trends",
          icon: React.createElement(Map, { size: 16 }),
          route: "/igrs/revenue-assurance/mv-trends",
        },
        {
          id: "igrs-patterns",
          label: "Patterns",
          icon: React.createElement(TrendingUp, { size: 16 }),
          route: "/igrs/revenue-assurance/patterns",
        },
        {
          id: "igrs-exports",
          label: "Exports",
          icon: React.createElement(Download, { size: 16 }),
          route: "/igrs/revenue-assurance/exports",
        },
        {
          id: "igrs-admin",
          label: "Admin",
          icon: React.createElement(Users, { size: 16 }),
          route: "/igrs/revenue-assurance/admin",
        },
        {
          id: "igrs-settings",
          label: "Settings",
          icon: React.createElement(Settings, { size: 16 }),
          route: "/igrs/revenue-assurance/settings",
        },
      ],
    },
  ],
  "revenue-assurance": [
    {
      id: "ra-overview",
      label: "Overview",
      icon: React.createElement(BarChart3, { size: 18 }),
      route: "/revenue-assurance/overview",
    },
    {
      id: "ra-cases",
      label: "Cases",
      icon: React.createElement(FileCheck, { size: 18 }),
      route: "/revenue-assurance/cases",
    },
    {
      id: "ra-rules",
      label: "Rules",
      icon: React.createElement(Shield, { size: 18 }),
      route: "/revenue-assurance/rules",
    },
    {
      id: "ra-customers",
      label: "Customers",
      icon: React.createElement(Users, { size: 18 }),
      route: "/revenue-assurance/customers",
    },
    {
      id: "ra-contracts",
      label: "Contracts",
      icon: React.createElement(FileText, { size: 18 }),
      route: "/revenue-assurance/contracts",
    },
    {
      id: "ra-insights",
      label: "Insights",
      icon: React.createElement(Brain, { size: 18 }),
      route: "/revenue-assurance/insights",
    },
    {
      id: "ra-ai-chat",
      label: "AI Chat",
      icon: React.createElement(MessageCircle, { size: 18 }),
      route: "/revenue-assurance/ai-chat",
    },
    {
      id: "ra-patterns",
      label: "Patterns",
      icon: React.createElement(TrendingUp, { size: 18 }),
      route: "/revenue-assurance/patterns",
    },
    {
      id: "ra-exports",
      label: "Exports",
      icon: React.createElement(Download, { size: 18 }),
      route: "/revenue-assurance/exports",
    },
    {
      id: "ra-settings",
      label: "Settings",
      icon: React.createElement(Settings, { size: 18 }),
      route: "/revenue-assurance/settings",
    },
  ],
  workbench: [
    {
      id: "order-to-cash",
      label: "Order-to-Cash",
      icon: React.createElement(CreditCard, { size: 18 }),
      route: "/workbench/order-to-cash",
      children: [
        {
          id: "cash-application",
          label: "Cash Application",
          icon: React.createElement(LayoutGrid, { size: 16 }),
          route: "/workbench/order-to-cash/cash-application",
        },
        {
          id: "merchant-dashboard",
          label: "Merchant Dashboard",
          icon: React.createElement(ShoppingBag, { size: 16 }),
          route: "/workbench/order-to-cash/merchant-dashboard",
        },
        {
          id: "collection-dashboard",
          label: "Collection Dashboard",
          icon: React.createElement(Wallet, { size: 16 }),
          route: "/workbench/order-to-cash/cash-collection",
        },
      ],
    },
    {
      id: "procure-to-pay",
      label: "Procure-to-Pay & Spend",
      icon: React.createElement(ShoppingBag, { size: 18 }),
      route: "/workbench/procure-to-pay",
      children: [
        {
          id: "saas-renewal",
          label: "SaaS Renewal Workbench",
          icon: React.createElement(Calculator, { size: 16 }),
          route: "/workbench/procure-to-pay/saas-renewal",
        },
      ],
    },
    {
      id: "record-to-report",
      label: "Record-to-Report",
      icon: React.createElement(FileText, { size: 18 }),
      route: "/workbench/record-to-report",
      children: [
        {
          id: "close",
          label: "Close Workbench",
          icon: React.createElement(FileText, { size: 16 }),
          route: "/workbench/record-to-report/close",
        },
        {
          id: "reconciliations",
          label: "Reconciliations Workbench",
          icon: React.createElement(Calculator, { size: 16 }),
          route: "/workbench/record-to-report/reconciliations",
        },
      ],
    },
    {
      id: "supply-chain-finance",
      label: "Supply Chain Finance",
      icon: React.createElement(Package, { size: 18 }),
      route: "/workbench/supply-chain-finance",
      children: [
        {
          id: "mrp",
          label: "MRP Workbench",
          icon: React.createElement(Package, { size: 16 }),
          route: "/workbench/supply-chain-finance/mrp",
        },
      ],
    },
    {
      id: "revenue-leakage",
      label: "Revenue Leakage (Legacy)",
      icon: React.createElement(Shield, { size: 18 }),
      route: "/workbench/revenue-leakage",
      children: [
        {
          id: "overview",
          label: "Overview",
          icon: React.createElement(Shield, { size: 16 }),
          route: "/workbench/revenue-leakage/overview",
        },
      ],
    },
  ],
  reports: [
    {
      id: "sec-reports",
      label: "SEC Reports",
      icon: React.createElement(Star, { size: 18 }),
      route: "/reports/sec",
      children: [
        {
          id: "balance-sheet",
          label: "Balance Sheet",
          icon: React.createElement(BarChart3, { size: 16 }),
          route: "/reports/sec/balance-sheet",
        },
        {
          id: "income-statement",
          label: "Income Statement",
          icon: React.createElement(BarChart3, { size: 16 }),
          route: "/reports/sec/income-statement",
        },
      ],
    },
    {
      id: "financials",
      label: "Financials",
      icon: React.createElement(BookOpen, { size: 18 }),
      route: "/reports/financials",
      children: [
        {
          id: "trial-balance",
          label: "Trial Balance",
          icon: React.createElement(BookOpen, { size: 16 }),
          route: "/reports/financials/trial-balance",
        },
        {
          id: "account-activity",
          label: "Account Activity",
          icon: React.createElement(Activity, { size: 16 }),
          route: "/reports/financials/account-activity",
        },
      ],
    },
    {
      id: "analysis",
      label: "Analysis",
      icon: React.createElement(TrendingUp, { size: 18 }),
      route: "/reports/analysis",
      children: [
        {
          id: "one-click-variance",
          label: "One Click Variance",
          icon: React.createElement(BarChart3, { size: 16 }),
          route: "/reports/analysis/one-click-variance",
        },
        {
          id: "flux-analysis",
          label: "Flux Analysis",
          icon: React.createElement(BarChart3, { size: 16 }),
          route: "/reports/analysis/flux-analysis",
        },
      ],
    },
  ],
};

export type { RailItem, NavigationItem };
