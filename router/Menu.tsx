export interface MenuItem {
  path: string;
  permission?: string;
  subPermission?: string;
  tabsList?: MenuItem[];
}

export const Menu: MenuItem[] = [
  {
    path: "ai-chat-intelligence/login",
    permission: "ai_chat_intelligence",
  },
  {
    path: "home/command-center",
    permission: "command_center",
  },
  {
    path: "home/dynamic-sheets",
    permission: "dynamic_sheets",
  },
  {
    path: "home/workspace",
    permission: "workspace",
    tabsList: [
      {
        path: "home/workspace/my-workspace",
        permission: "my_workspace",
      },
      {
        path: "home/workspace/workspace-2",
        permission: "workspace_2",
      },
      {
        path: "home/workspace/live-pins",
        permission: "live_pins",
      },
      {
        path: "home/workspace/watchlist",
        permission: "watchlist",
      },
      {
        path: "home/workspace/data-template",
        permission: "data_template",
      },
    ],
  },
  {
    path: "automation/autonomy-studio",
    permission: "autonomy_studio",
  },
  {
    path: "workbench/order-to-cash",
    permission: "order_to_cash",
    tabsList: [
      {
        path: "workbench/order-to-cash/cash-collection",
        permission: "cash_collection",
      },
      {
        path: "workbench/order-to-cash/cash-application",
        permission: "cash_application",
      },
      {
        path: "workbench/order-to-cash/disputes",
        permission: "disputes",
      },
    ],
  },
  {
    path: "workbench/procure-to-pay",
    permission: "procure_to_pay",
    tabsList: [
      {
        path: "workbench/procure-to-pay/saas-renewal",
        permission: "saas_renewal",
      },
      {
        path: "workbench/procure-to-pay/ap-exceptions",
        permission: "ap_exceptions",
      },
    ],
  },
  {
    path: "workbench/record-to-report",
    permission: "record_to_report",
    tabsList: [
      {
        path: "workbench/record-to-report/close",
        permission: "close",
      },
      {
        path: "workbench/record-to-report/reconciliations",
        permission: "reconciliations",
      },
    ],
  },
  {
    path: "workbench/fpa",
    permission: "fpa",
    tabsList: [
      {
        path: "workbench/fpa/variance-drivers",
        permission: "variance_drivers",
      },
    ],
  },
  {
    path: "workbench/treasury",
    permission: "treasury",
    tabsList: [
      {
        path: "workbench/treasury/liquidity",
        permission: "liquidity",
      },
    ],
  },
  {
    path: "workbench/revenue-ops",
    permission: "revenue_ops",
    tabsList: [
      {
        path: "workbench/revenue-ops/revenue-recognition",
        permission: "revenue_recognition",
      },
    ],
  },
  {
    path: "workbench/supply-chain-finance",
    permission: "supply_chain_finance",
    tabsList: [
      {
        path: "workbench/supply-chain-finance/mrp",
        permission: "mrp",
      },
    ],
  },
  {
    path: "workbench/revenue-leakage",
    permission: "revenue_leakage",
    tabsList: [
      { path: "workbench/revenue-leakage/ai-chat", permission: "revenue_leakage" },
      { path: "workbench/revenue-leakage/overview", permission: "overview" },
      { path: "workbench/revenue-leakage/cases", permission: "cases" },
      { path: "workbench/revenue-leakage/rules", permission: "rules" },
      { path: "workbench/revenue-leakage/insights", permission: "insights" },
      { path: "workbench/revenue-leakage/patterns", permission: "patterns" },
      { path: "workbench/revenue-leakage/mv-trends", permission: "mv_trends" },
      { path: "workbench/revenue-leakage/exports", permission: "exports" },
      { path: "workbench/revenue-leakage/settings", permission: "settings" },
      { path: "workbench/revenue-leakage/admin", permission: "revenue_leakage" },
    ],
  },
  {
    path: "workbench/bpo-setup",
    permission: "bpo_setup",
  },
  {
    path: "reports/sec",
    permission: "sec_reports",
    tabsList: [
      {
        path: "reports/sec/balance-sheet",
        permission: "balance_sheet",
      },
      {
        path: "reports/sec/income-statement",
        permission: "income_statement",
      },
    ],
  },
  {
    path: "reports/financials",
    permission: "financials",
    tabsList: [
      {
        path: "reports/financials/trial-balance",
        permission: "trial_balance",
      },
      {
        path: "reports/financials/account-activity",
        permission: "account_activity",
      },
    ],
  },
  {
    path: "reports/analysis",
    permission: "analysis",
    tabsList: [
      {
        path: "reports/analysis/one-click-variance",
        permission: "one_click_variance",
      },
      {
        path: "reports/analysis/flux-analysis",
        permission: "flux_analysis",
      },
    ],
  },
  {
    path: "financial-tasks",
    permission: "financial_tasks",
  },
];
