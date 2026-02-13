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
} from "lucide-react";

type RailItem = "home" | "automation" | "workbench" | "reports";

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
        // {
        //   id: "workspace-2",
        //   label: "Workspace 2",
        //   icon: React.createElement(FolderKanban, { size: 16 }),
        //   route: "/home/workspace/workspace-2",
        // },
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
  workbench: [
    {
      id: "order-to-cash",
      label: "Order-to-Cash",
      icon: React.createElement(CreditCard, { size: 18 }),
      route: "/workbench/order-to-cash",
      children: [
        {
          id: "cash-collection",
          label: "Cash Collection Workbench",
          icon: React.createElement(Wallet, { size: 16 }),
          route: "/workbench/order-to-cash/cash-collection",
        },
        {
          id: "cash-application",
          label: "Cash Application Workbench",
          icon: React.createElement(LayoutGrid, { size: 16 }),
          route: "/workbench/order-to-cash/cash-application",
        },
        // { id: 'disputes', label: 'Disputes Workbench', icon: React.createElement(FileText, { size: 16 }), route: '/workbench/order-to-cash/disputes' }
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
        // { id: 'ap-exceptions', label: 'AP Exceptions Workbench', icon: React.createElement(FileText, { size: 16 }), route: '/workbench/procure-to-pay/ap-exceptions' }
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
    // {
    //   id: 'fpa',
    //   label: 'FP&A',
    //   icon: React.createElement(TrendingUp, { size: 18 }),
    //   route: '/workbench/fpa',
    //   children: [
    //     { id: 'variance-drivers', label: 'Variance & Drivers Workbench', icon: React.createElement(BarChart3, { size: 16 }), route: '/workbench/fpa/variance-drivers' }
    //   ]
    // },
    // {
    //   id: 'treasury',
    //   label: 'Treasury',
    //   icon: React.createElement(Coins, { size: 18 }),
    //   route: '/workbench/treasury',
    //   children: [
    //     { id: 'liquidity', label: 'Liquidity Workbench', icon: React.createElement(Wallet, { size: 16 }), route: '/workbench/treasury/liquidity' }
    //   ]
    // },
    // {
    //   id: 'revenue-ops',
    //   label: 'Revenue Ops',
    //   icon: React.createElement(Receipt, { size: 18 }),
    //   route: '/workbench/revenue-ops',
    //   children: [
    //     { id: 'revenue-recognition', label: 'Revenue Recognition Workbench', icon: React.createElement(Calculator, { size: 16 }), route: '/workbench/revenue-ops/revenue-recognition' }
    //   ]
    // },
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
      label: "Revenue Leakage",
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
    // { id: 'bpo-setup', label: 'BPO Setup', icon: React.createElement(Settings, { size: 18 }), route: '/workbench/bpo-setup' }
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
