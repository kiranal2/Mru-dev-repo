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
        path: "workbench/order-to-cash/cash-application",
        permission: "cash_application",
      },
      {
        path: "workbench/order-to-cash/merchant-dashboard",
        permission: "merchant_dashboard",
      },
      {
        path: "workbench/order-to-cash/cash-collection",
        permission: "cash_collection",
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
    path: "igrs/revenue-assurance",
    permission: "igrs_revenue_assurance",
    tabsList: [
      { path: "igrs/revenue-assurance/overview", permission: "igrs_overview" },
      { path: "igrs/revenue-assurance/cases", permission: "igrs_cases" },
      { path: "igrs/revenue-assurance/rules", permission: "igrs_rules" },
      { path: "igrs/revenue-assurance/insights", permission: "igrs_insights" },
      { path: "igrs/revenue-assurance/ai-chat", permission: "igrs_ai_chat" },
      { path: "igrs/revenue-assurance/mv-trends", permission: "igrs_mv_trends" },
      { path: "igrs/revenue-assurance/patterns", permission: "igrs_patterns" },
      { path: "igrs/revenue-assurance/exports", permission: "igrs_exports" },
      { path: "igrs/revenue-assurance/admin", permission: "igrs_admin" },
      { path: "igrs/revenue-assurance/settings", permission: "igrs_settings" },
    ],
  },
  {
    path: "revenue-assurance",
    permission: "revenue_assurance",
    tabsList: [
      { path: "revenue-assurance/overview", permission: "ra_overview" },
      { path: "revenue-assurance/cases", permission: "ra_cases" },
      { path: "revenue-assurance/rules", permission: "ra_rules" },
      { path: "revenue-assurance/customers", permission: "ra_customers" },
      { path: "revenue-assurance/contracts", permission: "ra_contracts" },
      { path: "revenue-assurance/insights", permission: "ra_insights" },
      { path: "revenue-assurance/ai-chat", permission: "ra_ai_chat" },
      { path: "revenue-assurance/patterns", permission: "ra_patterns" },
      { path: "revenue-assurance/exports", permission: "ra_exports" },
      { path: "revenue-assurance/settings", permission: "ra_settings" },
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
