import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseParams } from '@/app/api/_lib/validation';

const bindingIdParamsSchema = z.object({
  id: z.string().min(1),
});

// Mock bindings data - in a real app, this would be in a database
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
      latest_execution: []
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
      latest_execution: []
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
      latest_execution: []
    }
  ];

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const paramsParsed = parseParams(resolvedParams, bindingIdParamsSchema);
    if ('error' in paramsParsed) return paramsParsed.error;
    const { id } = paramsParsed.data;

    // In a real app, this would delete from a database
    // For now, we'll just return success
    return NextResponse.json({ 
      success: true,
      message: `Binding ${id} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting binding:', error);
    return NextResponse.json(
      { error: 'Failed to delete binding' },
      { status: 500 }
    );
  }
}
