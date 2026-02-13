import { NextRequest, NextResponse } from 'next/server';

// Mock bindings data based on the provided JSON
const MOCK_BINDINGS = [
  {
    id: "4f57fd66-b0c4-48dd-973b-b2ce71713344",
    scope: "RECONCILIATION",
    scope_id: "c0000000-0000-0000-0000-000000000007",
    template_id: "2917e70d-c9ba-4060-9cc4-7db2261da876",
    role: "SOURCE",
    auto_refresh: true,
    refresh_interval_hours: 24,
    parameter_overrides: {
      period_end: "2024-11-30",
      include_disputed: true
    },
    display_name: "AR Balance (from Aging)",
    display_order: 1,
    created_at: "2025-11-05T13:00:20.013723+00:00",
    created_by: "system",
    updated_at: "2025-11-05T13:00:20.013723+00:00",
    updated_by: "system",
    template: {
      id: "2917e70d-c9ba-4060-9cc4-7db2261da876",
      name: "AR Aging Report - Current",
      type: "EXTRACT",
      description: "Detailed accounts receivable aging by customer showing current, 30, 60, 90+ day buckets"
    },
    latest_execution: [
      {
        id: "dd5295c1-e48e-4841-aa64-80d9cc3f4340",
        status: "SUCCESS",
        ended_at: "2025-11-05T12:00:39.753198+00:00",
        row_count: 156,
        started_at: "2025-11-05T12:00:36.253198+00:00",
        error_message: null,
        result_summary: {
          current: 6200000,
          days_30: 1500000,
          days_60: 650000,
          total_ar: 8547890,
          days_90_plus: 197890,
          customer_count: 156
        },
        execution_time_ms: null
      }
    ]
  },
  {
    id: "e6fe3aba-e298-44bc-a74a-1d1329005bdb",
    scope: "RECONCILIATION",
    scope_id: "c0000000-0000-0000-0000-000000000007",
    template_id: "d570a892-c3c5-474c-bd45-29b89e6208d2",
    role: "TARGET",
    auto_refresh: true,
    refresh_interval_hours: 24,
    parameter_overrides: {
      entity: "Consolidated",
      period: "2024-11",
      account_filter: "1200"
    },
    display_name: "GL AR Balance",
    display_order: 2,
    created_at: "2025-11-05T13:00:20.013723+00:00",
    created_by: "system",
    updated_at: "2025-11-05T13:00:20.013723+00:00",
    updated_by: "system",
    template: {
      id: "d570a892-c3c5-474c-bd45-29b89e6208d2",
      name: "Trial Balance Extract",
      type: "EXTRACT",
      description: "Extracts trial balance for specified period and entity"
    },
    latest_execution: [
      {
        id: "917e505e-3e76-4996-9c88-015072b3e1e1",
        status: "SUCCESS",
        ended_at: "2025-11-05T12:00:42.453198+00:00",
        row_count: 1,
        started_at: "2025-11-05T12:00:41.253198+00:00",
        error_message: null,
        result_summary: {
          net_balance: 8547890,
          account_name: "Accounts Receivable",
          debit_balance: 8547890,
          account_number: "1200",
          credit_balance: 0
        },
        execution_time_ms: null
      }
    ]
  },
  {
    id: "2630bcb2-b3f5-4cf7-a8e5-d391649e3c0f",
    scope: "RECONCILIATION",
    scope_id: "c0000000-0000-0000-0000-000000000007",
    template_id: "6c0aad78-50eb-45f1-bc6c-0f4b81bd3c1c",
    role: "SUPPORTING",
    auto_refresh: false,
    refresh_interval_hours: 24,
    parameter_overrides: {
      months: 12,
      start_period: "2023-12"
    },
    display_name: "Historical Write-offs (12 months)",
    display_order: 3,
    created_at: "2025-11-05T13:00:20.013723+00:00",
    created_by: "system",
    updated_at: "2025-11-05T13:00:20.013723+00:00",
    updated_by: "system",
    template: {
      id: "6c0aad78-50eb-45f1-bc6c-0f4b81bd3c1c",
      name: "Bad Debt Write-off History",
      type: "TRANSFORM",
      description: "Historical bad debt write-offs for trend analysis and allowance calculation"
    },
    latest_execution: []
  },
  {
    id: "f2a8d0b0-5979-4e1b-90cd-fc6c9aa7b62b",
    scope: "RECONCILIATION",
    scope_id: "c0000000-0000-0000-0000-000000000007",
    template_id: "659a7a47-01db-4efc-bd53-c6519157dd51",
    role: "SUPPORTING",
    auto_refresh: false,
    refresh_interval_hours: 24,
    parameter_overrides: {
      period_end: "2024-11-30"
    },
    display_name: "Disputed Invoices Detail",
    display_order: 4,
    created_at: "2025-11-05T13:00:20.013723+00:00",
    created_by: "system",
    updated_at: "2025-11-05T13:00:20.013723+00:00",
    updated_by: "system",
    template: {
      id: "659a7a47-01db-4efc-bd53-c6519157dd51",
      name: "Disputed Invoices Report",
      type: "EXTRACT",
      description: "Lists all invoices in dispute that may impact allowance calculation"
    },
    latest_execution: []
  },
  {
    id: "b1b9d4f9-ff81-492d-b58f-c7b3c7827ddb",
    scope: "RECONCILIATION",
    scope_id: "c0000000-0000-0000-0000-000000000007",
    template_id: "1a1b360f-6437-4e33-85b6-d7731d67c4ab",
    role: "VALIDATION",
    auto_refresh: true,
    refresh_interval_hours: 24,
    parameter_overrides: {
      period: "2024-11",
      threshold: 80
    },
    display_name: "Collection Effectiveness Check",
    display_order: 5,
    created_at: "2025-11-05T13:00:20.013723+00:00",
    created_by: "system",
    updated_at: "2025-11-05T13:00:20.013723+00:00",
    updated_by: "system",
    template: {
      id: "1a1b360f-6437-4e33-85b6-d7731d67c4ab",
      name: "Collection Effectiveness Index",
      type: "VALIDATE",
      description: "Calculates collection effectiveness to support allowance estimation"
    },
    latest_execution: [
      {
        id: "8af5efc2-6965-4c99-94cb-29a785ae3476",
        status: "SUCCESS",
        ended_at: "2025-11-05T12:00:48.053198+00:00",
        row_count: 1,
        started_at: "2025-11-05T12:00:46.253198+00:00",
        error_message: null,
        result_summary: {
          period: "2024-11",
          status: "PASS",
          threshold: 80,
          cei_percentage: 87.5
        },
        execution_time_ms: null
      }
    ]
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');
    const scopeId = searchParams.get('scope_id');

    // Filter bindings by scope and scope_id if provided
    let filteredBindings = MOCK_BINDINGS;
    if (scope) {
      filteredBindings = filteredBindings.filter(b => b.scope === scope);
    }
    if (scopeId) {
      filteredBindings = filteredBindings.filter(b => b.scope_id === scopeId);
    }

    return NextResponse.json({
      bindings: filteredBindings
    });
  } catch (error) {
    console.error('Error fetching bindings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bindings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scope,
      scope_id,
      template_id,
      role,
      auto_refresh,
      parameter_overrides,
      display_name,
      created_by
    } = body;

    // Generate a new ID
    const newId = `binding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Find the template to include template info
    const { TEMPLATES_DATA } = await import('../data-templates/bindings/route');
    const template = TEMPLATES_DATA.templates.find((t: any) => t.id === template_id);

    // If template not found, return error
    if (!template) {
      return NextResponse.json(
        { error: `Template with id ${template_id} not found` },
        { status: 404 }
      );
    }

    // Create new binding
    const newBinding = {
      id: newId,
      scope,
      scope_id,
      template_id,
      role,
      auto_refresh: auto_refresh || false,
      refresh_interval_hours: 24,
      parameter_overrides: parameter_overrides || {},
      display_name: display_name || template.name || 'Untitled Binding',
      display_order: MOCK_BINDINGS.length + 1,
      created_at: new Date().toISOString(),
      created_by: created_by || 'user',
      updated_at: new Date().toISOString(),
      updated_by: created_by || 'user',
      template: {
        id: template.id,
        name: template.name,
        type: template.type,
        description: template.description
      },
      latest_execution: []
    };

    // Add to mock data (in a real app, this would be saved to a database)
    MOCK_BINDINGS.push(newBinding);

    return NextResponse.json(newBinding, { status: 201 });
  } catch (error) {
    console.error('Error creating binding:', error);
    return NextResponse.json(
      { error: 'Failed to create binding' },
      { status: 500 }
    );
  }
}
