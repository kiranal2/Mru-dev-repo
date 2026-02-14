import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseBody, parseParams } from '@/app/api/_lib/validation';

const reconRunParamsSchema = z.object({
  id: z.string().min(1),
});

const reconRunBodySchema = z.object({
  created_by: z.string().optional(),
});

// Mock runs data storage (in a real app, this would be in a database)
const MOCK_RUNS: Record<string, any[]> = {
  'c0000000-0000-0000-0000-000000000001': [
    {
      id: 'd0000000-0000-0000-0000-000000000001',
      reconciliation_id: 'c0000000-0000-0000-0000-000000000001',
      started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 5 * 60 * 1000).toISOString(),
      ended_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 2 * 60 * 1000).toISOString(),
      status: 'SUCCEEDED',
      row_count: 1245,
      variance: 450.50,
      balance_a: 1250000.00,
      balance_b: 1249549.50,
      created_by: 'sarah.accountant',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      threshold_abs: 1000,
      threshold_pct: 0.5,
      effective_threshold: 6249.75,
      outcome: 'PASS',
      result_url: '/recons/runs/d0000000-0000-0000-0000-000000000001',
      error_text: null,
    },
  ],
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const paramsParsed = parseParams(resolvedParams, reconRunParamsSchema);
    if ('error' in paramsParsed) return paramsParsed.error;
    const { id } = paramsParsed.data;

    const parsed = await parseBody(request, reconRunBodySchema);
    if ('error' in parsed) return parsed.error;
    const { created_by } = parsed.data;

    // Get the reconciliation to determine thresholds
    const allRecons = [
      {
        id: 'c0000000-0000-0000-0000-000000000001',
        threshold_abs: 1000,
        threshold_pct: 0.5,
        balance_b: 1249549.50,
      },
      {
        id: 'c0000000-0000-0000-0000-000000000002',
        threshold_abs: 5000,
        threshold_pct: 1.0,
        balance_b: 2331750.00,
      },
      {
        id: 'c0000000-0000-0000-0000-000000000003',
        threshold_abs: 2000,
        threshold_pct: 0.5,
        balance_b: 3450125.00,
      },
      {
        id: 'c0000000-0000-0000-0000-000000000004',
        threshold_abs: 500,
        threshold_pct: 0.1,
        balance_b: 851250.00,
      },
      {
        id: 'c0000000-0000-0000-0000-000000000005',
        threshold_abs: 3000,
        threshold_pct: 1.5,
        balance_b: 453900.00,
      },
      {
        id: 'c0000000-0000-0000-0000-000000000006',
        threshold_abs: 500,
        threshold_pct: 0.1,
        balance_b: 125000.00,
      },
      {
        id: 'c0000000-0000-0000-0000-000000000007',
        threshold_abs: 10000,
        threshold_pct: 2.0,
        balance_b: 0,
      },
      {
        id: 'c0000000-0000-0000-0000-000000000008',
        threshold_abs: 1000,
        threshold_pct: 0.5,
        balance_b: 2100750.00,
      },
    ];

    const recon = allRecons.find(r => r.id === id);
    if (!recon) {
      return NextResponse.json(
        { error: 'Reconciliation not found' },
        { status: 404 }
      );
    }

    // Simulate running the reconciliation
    const startedAt = new Date();
    const endedAt = new Date(startedAt.getTime() + 2 * 60 * 1000); // 2 minutes later

    // Generate mock run results
    const rowCount = Math.floor(Math.random() * 5000) + 1000;
    const variance = Math.random() * 10000;
    const balanceA = recon.balance_b + variance;
    const balanceB = recon.balance_b;

    // Calculate effective threshold
    const effectiveThreshold = Math.max(
      recon.threshold_abs,
      (recon.threshold_pct / 100) * Math.abs(recon.balance_b)
    );

    // Determine outcome
    const outcome = Math.abs(variance) <= effectiveThreshold ? 'PASS' : 'FAIL';

    const newRun = {
      id: `d${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reconciliation_id: id,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      status: 'SUCCEEDED',
      row_count: rowCount,
      variance: variance,
      balance_a: balanceA,
      balance_b: balanceB,
      created_by: created_by || 'system',
      created_at: startedAt.toISOString(),
      threshold_abs: recon.threshold_abs,
      threshold_pct: recon.threshold_pct,
      effective_threshold: effectiveThreshold,
      outcome: outcome,
      result_url: `/recons/runs/${id}`,
      error_text: null,
    };

    // Store the run (in a real app, this would be in a database)
    if (!MOCK_RUNS[id]) {
      MOCK_RUNS[id] = [];
    }
    MOCK_RUNS[id].unshift(newRun); // Add to beginning

    // Update the reconciliation's last_run_at
    // In a real app, this would update the database
    const updatedRecon = {
      ...recon,
      last_run_at: endedAt.toISOString(),
      variance: variance,
      balance_a: balanceA,
      balance_b: balanceB,
    };

    return NextResponse.json({
      run: newRun,
      reconciliation: updatedRecon,
    });
  } catch (error) {
    console.error('Error running reconciliation:', error);
    return NextResponse.json(
      { error: 'Failed to run reconciliation' },
      { status: 500 }
    );
  }
}

