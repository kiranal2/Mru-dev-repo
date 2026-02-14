import { NextRequest, NextResponse } from "next/server";

// Templates data for bindings
export const TEMPLATES_DATA = {
  templates: [
    {
      id: "2917e70d-c9ba-4060-9cc4-7db2261da876",
      name: "Aging details for Amazon",
      description:
        "Detailed accounts payable aging report for Amazon vendor transactions showing outstanding balances by aging buckets",
      type: "EXTRACT",
      category: "Accounts Payable",
      query_text:
        "SELECT customer_id, customer_name, current_amount, days_30, days_60, days_90_plus, total_balance FROM ar_aging WHERE as_of_date = :period_end ORDER BY total_balance DESC",
      parameters: {},
      created_by: "system",
      created_at: "2025-11-05T13:00:05.21699+00:00",
      updated_at: "2025-11-05T13:00:05.21699+00:00",
    },
    {
      id: "6c0aad78-50eb-45f1-bc6c-0f4b81bd3c1c",
      name: "Accounts Payable Aging Report",
      description:
        "Comprehensive accounts payable aging analysis showing vendor invoices by aging periods (current, 30, 60, 90+ days) for cash flow planning",
      type: "TRANSFORM",
      category: "Accounts Payable",
      query_text:
        "SELECT period, SUM(write_off_amount) as total_writeoffs, COUNT(DISTINCT customer_id) as customer_count FROM bad_debt_writeoffs WHERE period >= :start_period GROUP BY period ORDER BY period DESC",
      parameters: {},
      created_by: "system",
      created_at: "2025-11-05T13:00:05.21699+00:00",
      updated_at: "2025-11-05T13:00:05.21699+00:00",
    },
    {
      id: "e686241b-caf8-4a9a-837c-bce6784b012b",
      name: "Accounts Receivable Aging Summary",
      description:
        "Summary of accounts receivable aging by customer showing outstanding balances categorized by aging periods (current, 30, 60, 90+ days)",
      type: "EXTRACT",
      category: "Accounts Receivable",
      query_text:
        "SELECT account_number, account_name, statement_date, ending_balance, currency FROM bank_statements WHERE account_number = '1001' AND statement_date = :period_end",
      parameters: {},
      created_by: "system",
      created_at: "2025-11-05T12:49:13.171533+00:00",
      updated_at: "2025-11-05T12:49:13.171533+00:00",
    },
    {
      id: "1a1b360f-6437-4e33-85b6-d7731d67c4ab",
      name: "Amazon Vendor Aging Report",
      description:
        "Detailed aging analysis of accounts payable transactions with Amazon vendor, showing outstanding invoices by aging buckets and payment status",
      type: "VALIDATE",
      category: "Accounts Payable",
      query_text:
        "SELECT period, (collections / (beginning_ar + sales - ending_ar)) * 100 as cei_percentage FROM collection_metrics WHERE period = :period",
      parameters: {},
      created_by: "system",
      created_at: "2025-11-05T13:00:05.21699+00:00",
      updated_at: "2025-11-05T13:00:05.21699+00:00",
    },
    {
      id: "4898b272-d2b5-45ce-becd-39522bbf736b",
      name: "Quarterly Cash Flow Analysis",
      description:
        "Comprehensive quarterly cash flow analysis showing operating, investing, and financing activities with net change in cash position",
      type: "TRANSFORM",
      category: "Cash Flow",
      query_text:
        "SELECT account, beginning_balance, additions, revenue_recognized, ending_balance FROM deferred_revenue_rollforward WHERE period = :period",
      parameters: {},
      created_by: "system",
      created_at: "2025-11-05T12:49:13.171533+00:00",
      updated_at: "2025-11-05T12:49:13.171533+00:00",
    },
    // {
    //   id: "17892c5e-ab7c-4f3e-9511-7ffca894ba1e",
    //   name: "Deposits in Transit",
    //   description: "Shows deposits recorded in GL but not yet on bank statement",
    //   type: "EXTRACT",
    //   category: "Bank",
    //   query_text:
    //     "SELECT deposit_id, deposit_date, amount, reference, status FROM deposits WHERE status = 'IN_TRANSIT' AND account = :account_number",
    //   parameters: {},
    //   created_by: "system",
    //   created_at: "2025-11-05T12:49:13.171533+00:00",
    //   updated_at: "2025-11-05T12:49:13.171533+00:00",
    // },
    // {
    //   id: "6faae9e0-69ec-4aab-bcfe-3536734134a5",
    //   name: "Depreciation Expense - Current Period",
    //   description: "Calculates depreciation expense for the current accounting period",
    //   type: "TRANSFORM",
    //   category: "Fixed Assets",
    //   query_text:
    //     "SELECT asset_id, description, depreciation_method, monthly_depreciation, ytd_depreciation FROM fixed_assets WHERE status = 'ACTIVE' AND period = :period",
    //   parameters: {},
    //   created_by: "system",
    //   created_at: "2025-11-05T12:49:13.171533+00:00",
    //   updated_at: "2025-11-05T12:49:13.171533+00:00",
    // },
    // {
    //   id: "659a7a47-01db-4efc-bd53-c6519157dd51",
    //   name: "Disputed Invoices Report",
    //   description: "Lists all invoices in dispute that may impact allowance calculation",
    //   type: "EXTRACT",
    //   category: "Accounts Receivable",
    //   query_text:
    //     "SELECT invoice_number, customer_name, amount, dispute_reason, days_outstanding, dispute_date FROM ar_invoices WHERE status = 'DISPUTED' AND as_of_date = :period_end",
    //   parameters: {},
    //   created_by: "system",
    //   created_at: "2025-11-05T13:00:05.21699+00:00",
    //   updated_at: "2025-11-05T13:00:05.21699+00:00",
    // },
    // {
    //   id: "d102c8b6-bedb-4e62-8025-17d5ba915834",
    //   name: "Fixed Assets Register",
    //   description: "Complete listing of all fixed assets with current net book value",
    //   type: "EXTRACT",
    //   category: "Fixed Assets",
    //   query_text:
    //     "SELECT asset_id, description, acquisition_date, cost, accumulated_depreciation, net_book_value, location FROM fixed_assets WHERE status = 'ACTIVE' ORDER BY acquisition_date DESC",
    //   parameters: {},
    //   created_by: "system",
    //   created_at: "2025-11-05T12:49:13.171533+00:00",
    //   updated_at: "2025-11-05T12:49:13.171533+00:00",
    // },
    // {
    //   id: "834535d9-6296-4b24-a46d-8e681b774443",
    //   name: "GL Cash Balance",
    //   description: "Extracts cash balance from general ledger",
    //   type: "EXTRACT",
    //   category: "General Ledger",
    //   query_text:
    //     "SELECT account, balance, period FROM gl_accounts WHERE account = '1001' AND period = :period",
    //   parameters: {},
    //   created_by: "system",
    //   created_at: "2025-11-05T12:49:13.171533+00:00",
    //   updated_at: "2025-11-05T12:49:13.171533+00:00",
    // },
    // {
    //   id: "e6614a52-0220-427b-bbd7-cd8ed182768c",
    //   name: "Intercompany Balance Validation",
    //   description: "Validates that intercompany balances are reciprocal across entities",
    //   type: "VALIDATE",
    //   category: "Intercompany",
    //   query_text:
    //     "SELECT entity_a, entity_b, account, entity_a_balance, entity_b_balance, (entity_a_balance + entity_b_balance) as out_of_balance FROM intercompany_balances WHERE period = :period AND ABS(entity_a_balance + entity_b_balance) > :threshold",
    //   parameters: {},
    //   created_by: "system",
    //   created_at: "2025-11-05T12:49:13.171533+00:00",
    //   updated_at: "2025-11-05T12:49:13.171533+00:00",
    // },
    // {
    //   id: "23352ace-0a3e-4dac-afea-f7891350cedd",
    //   name: "Outstanding Checks Report",
    //   description: "Lists all checks issued but not yet cleared by the bank",
    //   type: "EXTRACT",
    //   category: "Bank",
    //   query_text:
    //     "SELECT check_number, payee, check_date, amount, status FROM checks WHERE status = 'OUTSTANDING' AND account = :account_number ORDER BY check_date DESC",
    //   parameters: {},
    //   created_by: "system",
    //   created_at: "2025-11-05T12:49:13.171533+00:00",
    //   updated_at: "2025-11-05T12:49:13.171533+00:00",
    // },
    // {
    //   id: "46ae4c79-39eb-4855-b7ff-3c8754f6ae56",
    //   name: "Payroll Accrual Validation",
    //   description: "Validates that payroll accruals match actual payroll processed",
    //   type: "VALIDATE",
    //   category: "Payroll",
    //   query_text:
    //     "SELECT gl_account, accrual_amount, actual_payroll, (accrual_amount - actual_payroll) as variance FROM payroll_validation WHERE period = :period AND ABS(variance) > :threshold",
    //   parameters: {},
    //   created_by: "system",
    //   created_at: "2025-11-05T12:49:13.171533+00:00",
    //   updated_at: "2025-11-05T12:49:13.171533+00:00",
    // },
    // {
    //   id: "f19f375f-f65f-4240-a2b2-6bb8ad9293c0",
    //   name: "Payroll Summary by Department",
    //   description: "Aggregate payroll costs by department for the period",
    //   type: "TRANSFORM",
    //   category: "Payroll",
    //   query_text:
    //     "SELECT department, COUNT(employee_id) as employee_count, SUM(gross_pay) as total_gross, SUM(taxes) as total_taxes, SUM(net_pay) as total_net FROM payroll WHERE period = :period GROUP BY department",
    //   parameters: {},
    //   created_by: "system",
    //   created_at: "2025-11-05T12:49:13.171533+00:00",
    //   updated_at: "2025-11-05T12:49:13.171533+00:00",
    // },
    // {
    //   id: "1ea9ef60-13d1-4ece-a4ce-d059b096329e",
    //   name: "Revenue by Product Line",
    //   description: "Breaks down revenue by product line for variance analysis",
    //   type: "TRANSFORM",
    //   category: "Revenue",
    //   query_text:
    //     "SELECT product_line, SUM(revenue) as total_revenue, SUM(cost_of_sales) as total_cos, (SUM(revenue) - SUM(cost_of_sales)) as gross_profit FROM sales WHERE period = :period GROUP BY product_line",
    //   parameters: {},
    //   created_by: "system",
    //   created_at: "2025-11-05T12:49:13.171533+00:00",
    //   updated_at: "2025-11-05T12:49:13.171533+00:00",
    // },
    // {
    //   id: "d570a892-c3c5-474c-bd45-29b89e6208d2",
    //   name: "Trial Balance Extract",
    //   description: "Extracts trial balance for specified period and entity",
    //   type: "EXTRACT",
    //   category: "General Ledger",
    //   query_text:
    //     "SELECT account_number, account_name, debit_balance, credit_balance, net_balance FROM trial_balance WHERE entity = :entity AND period = :period ORDER BY account_number",
    //   parameters: {},
    //   created_by: "system",
    //   created_at: "2025-11-05T12:49:13.171533+00:00",
    //   updated_at: "2025-11-05T12:49:13.171533+00:00",
    // },
  ],
  meta: {
    count: 16,
    limit: 100,
    offset: 0,
  },
};

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(TEMPLATES_DATA);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}
