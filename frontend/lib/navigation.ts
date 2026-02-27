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
  TrendingUp,
  Wallet,
  Settings,
  CreditCard,
  ShoppingBag,
  Package,
  LayoutGrid,
  BookOpen,
  Activity,
  FileSpreadsheet,
  Shield,
  Users,
  FileCheck,
  Brain,
  MessageCircle,
  Map,
  Download,
  Play,
  CheckSquare,
  GitBranch,
  ListTodo,
  Layers,
  Sparkles,
  Cog,
  Link2,
  ClipboardList,
  BookOpenText,
  Workflow,
  RefreshCw,
  Landmark,
  Building2,
  Store,
  PhoneCall,
} from "lucide-react";

type RailItem = "home" | "automation" | "reports" | "workbench" | "igrs" | "admin";

type NavigationItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  children?: NavigationItem[];
};

export const NAVIGATION_STRUCTURE: Record<RailItem, NavigationItem[]> = {
  // ─── HOME ─────────────────────────────────────────────
  home: [
    {
      id: "command-center",
      label: "Command Center",
      icon: React.createElement(MessageSquareMore, { size: 18 }),
      route: "/home/command-center",
    },
    {
      id: "my-workspace",
      label: "My Workspace",
      icon: React.createElement(FolderKanban, { size: 18 }),
      route: "/home/workspace/workspace-2",
    },
    {
      id: "live-pins",
      label: "Live Pins",
      icon: React.createElement(Pin, { size: 18 }),
      route: "/home/workspace/live-pins",
    },
    {
      id: "watchlist",
      label: "Watchlist",
      icon: React.createElement(Eye, { size: 18 }),
      route: "/home/workspace/watchlist",
    },
    {
      id: "autonomy-studio",
      label: "Autonomy Studio",
      icon: React.createElement(Sparkles, { size: 18 }),
      route: "/home/autonomy-studio",
    },
    {
      id: "narratives",
      label: "Narratives",
      icon: React.createElement(BookOpenText, { size: 18 }),
      route: "/home/narratives",
    },
    {
      id: "process-to-automation",
      label: "Process-to-Automation",
      icon: React.createElement(Workflow, { size: 18 }),
      route: "/home/process-to-automation",
    },
  ],

  // ─── AUTOMATION ───────────────────────────────────────
  automation: [
    {
      id: "data-templates",
      label: "Data Templates",
      icon: React.createElement(FileSpreadsheet, { size: 18 }),
      route: "/automation/data-templates",
    },
    {
      id: "all-runs",
      label: "All Runs",
      icon: React.createElement(Play, { size: 18 }),
      route: "/automation/all-runs",
    },
    {
      id: "reconciliation",
      label: "Reconciliation",
      icon: React.createElement(RefreshCw, { size: 18 }),
      route: "/automation/reconciliation",
    },
    {
      id: "worklist",
      label: "Worklist",
      icon: React.createElement(CheckSquare, { size: 18 }),
      route: "/automation/worklist",
    },
    {
      id: "workflow",
      label: "Workflow",
      icon: React.createElement(GitBranch, { size: 18 }),
      route: "/automation/workflow",
    },
    {
      id: "taskflow",
      label: "TaskFlow",
      icon: React.createElement(ListTodo, { size: 18 }),
      route: "/automation/taskflow",
    },
  ],

  // ─── REPORTS ──────────────────────────────────────────
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

  // ─── WORKBENCH ────────────────────────────────────────
  workbench: [
    {
      id: "order-to-cash",
      label: "Order-to-Cash",
      icon: React.createElement(CreditCard, { size: 18 }),
      route: "/workbench/order-to-cash",
      children: [
        {
          id: "collections",
          label: "Collections Workbench",
          icon: React.createElement(PhoneCall, { size: 16 }),
          route: "/workbench/order-to-cash/collections",
        },
        {
          id: "cash-application",
          label: "Cash Application Workbench",
          icon: React.createElement(LayoutGrid, { size: 16 }),
          route: "/workbench/order-to-cash/cash-application",
        },
        {
          id: "disputes",
          label: "Disputes",
          icon: React.createElement(FileText, { size: 16 }),
          route: "/workbench/order-to-cash/disputes",
        },
        {
          id: "merchant-portal",
          label: "Merchant Portal",
          icon: React.createElement(Store, { size: 16 }),
          route: "/workbench/order-to-cash/merchant-portal",
        },
        {
          id: "merchant-dashboard",
          label: "Merchant Dashboard",
          icon: React.createElement(BarChart3, { size: 16 }),
          route: "/workbench/order-to-cash/merchant-dashboard",
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
        {
          id: "ap-exceptions",
          label: "AP Exceptions",
          icon: React.createElement(Shield, { size: 16 }),
          route: "/workbench/procure-to-pay/ap-exceptions",
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
          icon: React.createElement(FileCheck, { size: 16 }),
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
      id: "bpo-setup",
      label: "BPO Setup",
      icon: React.createElement(Settings, { size: 18 }),
      route: "/workbench/bpo-setup",
    },
    {
      id: "fpa",
      label: "FP&A",
      icon: React.createElement(TrendingUp, { size: 18 }),
      route: "/workbench/fpa",
      children: [
        {
          id: "variance-drivers",
          label: "Variance Drivers",
          icon: React.createElement(BarChart3, { size: 16 }),
          route: "/workbench/fpa/variance-drivers",
        },
      ],
    },
    {
      id: "revenue-ops",
      label: "Revenue Ops",
      icon: React.createElement(Banknote, { size: 18 }),
      route: "/workbench/revenue-ops",
      children: [
        {
          id: "revenue-recognition",
          label: "Revenue Recognition",
          icon: React.createElement(Calculator, { size: 16 }),
          route: "/workbench/revenue-ops/revenue-recognition",
        },
      ],
    },
    {
      id: "treasury",
      label: "Treasury",
      icon: React.createElement(Landmark, { size: 18 }),
      route: "/workbench/treasury",
      children: [
        {
          id: "liquidity",
          label: "Liquidity",
          icon: React.createElement(Wallet, { size: 16 }),
          route: "/workbench/treasury/liquidity",
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
          id: "rl-ai-chat",
          label: "AI Chat",
          icon: React.createElement(MessageCircle, { size: 16 }),
          route: "/workbench/revenue-leakage/ai-chat",
        },
        {
          id: "rl-overview",
          label: "Overview",
          icon: React.createElement(BarChart3, { size: 16 }),
          route: "/workbench/revenue-leakage/overview",
        },
        {
          id: "rl-cases",
          label: "Cases",
          icon: React.createElement(FileCheck, { size: 16 }),
          route: "/workbench/revenue-leakage/cases",
        },
        {
          id: "rl-rules",
          label: "Rules",
          icon: React.createElement(Shield, { size: 16 }),
          route: "/workbench/revenue-leakage/rules",
        },
        {
          id: "rl-insights",
          label: "Insights",
          icon: React.createElement(Brain, { size: 16 }),
          route: "/workbench/revenue-leakage/insights",
        },
        {
          id: "rl-mv-trends",
          label: "MV Trends",
          icon: React.createElement(Map, { size: 16 }),
          route: "/workbench/revenue-leakage/mv-trends",
        },
        {
          id: "rl-exports",
          label: "Exports",
          icon: React.createElement(Download, { size: 16 }),
          route: "/workbench/revenue-leakage/exports",
        },
      ],
    },
  ],

  // ─── IGRS ───────────────────────────────────────────────
  igrs: [
    {
      id: "igrs-ai-chat",
      label: "AI Chat",
      icon: React.createElement(MessageCircle, { size: 18 }),
      route: "/igrs/revenue-assurance/ai-chat",
    },
    {
      id: "igrs-overview",
      label: "Overview",
      icon: React.createElement(BarChart3, { size: 18 }),
      route: "/igrs/revenue-assurance/overview",
    },
    {
      id: "igrs-cases",
      label: "Cases",
      icon: React.createElement(FileCheck, { size: 18 }),
      route: "/igrs/revenue-assurance/cases",
    },
{
      id: "igrs-insights",
      label: "Insights",
      icon: React.createElement(Brain, { size: 18 }),
      route: "/igrs/revenue-assurance/insights",
    },
    {
      id: "igrs-patterns",
      label: "Patterns",
      icon: React.createElement(Map, { size: 18 }),
      route: "/igrs/revenue-assurance/patterns",
    },
    {
      id: "igrs-mv-trends",
      label: "MV Trends",
      icon: React.createElement(Map, { size: 18 }),
      route: "/igrs/revenue-assurance/mv-trends",
    },
{
      id: "igrs-governance",
      label: "Governance",
      icon: React.createElement(Building2, { size: 18 }),
      route: "/igrs/revenue-assurance/governance",
    },
    {
      id: "igrs-ai-intelligence",
      label: "AI Intelligence",
      icon: React.createElement(Brain, { size: 18 }),
      route: "/igrs/revenue-assurance/ai-intelligence",
    },
{
      id: "igrs-admin",
      label: "Admin",
      icon: React.createElement(Users, { size: 18 }),
      route: "/igrs/revenue-assurance/admin",
    },
  ],

  // ─── ADMIN ────────────────────────────────────────────
  admin: [
    {
      id: "users",
      label: "Users & Roles",
      icon: React.createElement(Users, { size: 18 }),
      route: "/admin/users",
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: React.createElement(Link2, { size: 18 }),
      route: "/admin/integrations",
    },
    {
      id: "audit-log",
      label: "Audit Log",
      icon: React.createElement(ClipboardList, { size: 18 }),
      route: "/admin/audit-log",
    },
    {
      id: "settings",
      label: "System Settings",
      icon: React.createElement(Cog, { size: 18 }),
      route: "/admin/settings",
    },
  ],
};

export type { RailItem, NavigationItem };
