import { NextRequest, NextResponse } from 'next/server';

// Mock executions data based on the provided JSON
const MOCK_EXECUTIONS = [
  {
    id: "d239c4bf-fb89-47e9-bc32-c07c92f2e509",
    template_id: "2917e70d-c9ba-4060-9cc4-7db2261da876",
    binding_id: "85491056-2786-4fda-8288-56447a33528a",
    started_at: "2025-11-05T13:41:09.413+00:00",
    ended_at: "2025-11-05T13:41:11.86+00:00",
    status: "SUCCESS",
    row_count: 1414,
    output_url: "/data/outputs/template_d239c4bf-fb89-47e9-bc32-c07c92f2e509.csv",
    output_size_bytes: 180992,
    result_summary: {
      row_count: 1414,
      total_balance: 797884
    },
    error_message: null,
    triggered_by: "MANUAL",
    actor: "user",
    parameters: {
      entity: "Consolidated",
      period: "2025-11"
    },
    execution_time_ms: 2447,
    created_at: "2025-11-05T13:41:09.722706+00:00",
    template: {
      id: "2917e70d-c9ba-4060-9cc4-7db2261da876",
      name: "AR Aging Report - Current",
      category: "Accounts Receivable",
      description: "Detailed accounts receivable aging by customer showing current, 30, 60, 90+ day buckets"
    },
    binding: {
      id: "85491056-2786-4fda-8288-56447a33528a",
      role: "SOURCE",
      scope: "RECONCILIATION",
      scope_id: "642a1fda-1010-41eb-8bc3-9a9dc3cde85b",
      auto_refresh: false
    }
  },
  {
    id: "0bffaf91-8a2a-47f4-bc13-a137d9345ae1",
    template_id: "2917e70d-c9ba-4060-9cc4-7db2261da876",
    binding_id: "85491056-2786-4fda-8288-56447a33528a",
    started_at: "2025-11-05T13:41:00.926+00:00",
    ended_at: "2025-11-05T13:41:03.421+00:00",
    status: "SUCCESS",
    row_count: 875,
    output_url: "/data/outputs/template_0bffaf91-8a2a-47f4-bc13-a137d9345ae1.csv",
    output_size_bytes: 112000,
    result_summary: {
      row_count: 875,
      total_balance: 8282158
    },
    error_message: null,
    triggered_by: "MANUAL",
    actor: "user",
    parameters: {
      entity: "Consolidated",
      period: "2025-11"
    },
    execution_time_ms: 2495,
    created_at: "2025-11-05T13:41:01.27469+00:00",
    template: {
      id: "2917e70d-c9ba-4060-9cc4-7db2261da876",
      name: "AR Aging Report - Current",
      category: "Accounts Receivable",
      description: "Detailed accounts receivable aging by customer showing current, 30, 60, 90+ day buckets"
    },
    binding: {
      id: "85491056-2786-4fda-8288-56447a33528a",
      role: "SOURCE",
      scope: "RECONCILIATION",
      scope_id: "642a1fda-1010-41eb-8bc3-9a9dc3cde85b",
      auto_refresh: false
    }
  },
  {
    id: "8af5efc2-6965-4c99-94cb-29a785ae3476",
    template_id: "1a1b360f-6437-4e33-85b6-d7731d67c4ab",
    binding_id: "b1b9d4f9-ff81-492d-b58f-c7b3c7827ddb",
    started_at: "2025-11-05T12:00:46.253198+00:00",
    ended_at: "2025-11-05T12:00:48.053198+00:00",
    status: "SUCCESS",
    row_count: 1,
    output_url: null,
    output_size_bytes: null,
    result_summary: {
      period: "2024-11",
      status: "PASS",
      threshold: 80,
      cei_percentage: 87.5
    },
    error_message: null,
    triggered_by: "AUTO",
    actor: "system",
    parameters: {
      period: "2024-11",
      threshold: 80
    },
    execution_time_ms: null,
    created_at: "2025-11-05T13:00:36.253198+00:00",
    template: {
      id: "1a1b360f-6437-4e33-85b6-d7731d67c4ab",
      name: "Collection Effectiveness Index",
      category: "Accounts Receivable",
      description: "Calculates collection effectiveness to support allowance estimation"
    },
    binding: {
      id: "b1b9d4f9-ff81-492d-b58f-c7b3c7827ddb",
      role: "VALIDATION",
      scope: "RECONCILIATION",
      scope_id: "c0000000-0000-0000-0000-000000000007",
      auto_refresh: true
    }
  },
  {
    id: "917e505e-3e76-4996-9c88-015072b3e1e1",
    template_id: "d570a892-c3c5-474c-bd45-29b89e6208d2",
    binding_id: "e6fe3aba-e298-44bc-a74a-1d1329005bdb",
    started_at: "2025-11-05T12:00:41.253198+00:00",
    ended_at: "2025-11-05T12:00:42.453198+00:00",
    status: "SUCCESS",
    row_count: 1,
    output_url: null,
    output_size_bytes: null,
    result_summary: {
      net_balance: 8547890,
      account_name: "Accounts Receivable",
      debit_balance: 8547890,
      account_number: "1200",
      credit_balance: 0
    },
    error_message: null,
    triggered_by: "AUTO",
    actor: "system",
    parameters: {
      entity: "Consolidated",
      period: "2024-11",
      account_filter: "1200"
    },
    execution_time_ms: null,
    created_at: "2025-11-05T13:00:36.253198+00:00",
    template: {
      id: "d570a892-c3c5-474c-bd45-29b89e6208d2",
      name: "Trial Balance Extract",
      category: "General Ledger",
      description: "Extracts trial balance for specified period and entity"
    },
    binding: {
      id: "e6fe3aba-e298-44bc-a74a-1d1329005bdb",
      role: "TARGET",
      scope: "RECONCILIATION",
      scope_id: "c0000000-0000-0000-0000-000000000007",
      auto_refresh: true
    }
  },
  {
    id: "dd5295c1-e48e-4841-aa64-80d9cc3f4340",
    template_id: "2917e70d-c9ba-4060-9cc4-7db2261da876",
    binding_id: "4f57fd66-b0c4-48dd-973b-b2ce71713344",
    started_at: "2025-11-05T12:00:36.253198+00:00",
    ended_at: "2025-11-05T12:00:39.753198+00:00",
    status: "SUCCESS",
    row_count: 156,
    output_url: null,
    output_size_bytes: null,
    result_summary: {
      current: 6200000,
      days_30: 1500000,
      days_60: 650000,
      total_ar: 8547890,
      days_90_plus: 197890,
      customer_count: 156
    },
    error_message: null,
    triggered_by: "AUTO",
    actor: "system",
    parameters: {
      period_end: "2024-11-30",
      include_disputed: true
    },
    execution_time_ms: null,
    created_at: "2025-11-05T13:00:36.253198+00:00",
    template: {
      id: "2917e70d-c9ba-4060-9cc4-7db2261da876",
      name: "AR Aging Report - Current",
      category: "Accounts Receivable",
      description: "Detailed accounts receivable aging by customer showing current, 30, 60, 90+ day buckets"
    },
    binding: {
      id: "4f57fd66-b0c4-48dd-973b-b2ce71713344",
      role: "SOURCE",
      scope: "RECONCILIATION",
      scope_id: "c0000000-0000-0000-0000-000000000007",
      auto_refresh: true
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    // Sort by created_at descending (most recent first)
    const sortedExecutions = [...MOCK_EXECUTIONS].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    // Apply limit
    const limitedExecutions = sortedExecutions.slice(0, limit);

    return NextResponse.json({
      executions: limitedExecutions
    });
  } catch (error) {
    console.error('Error fetching executions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch executions' },
      { status: 500 }
    );
  }
}
