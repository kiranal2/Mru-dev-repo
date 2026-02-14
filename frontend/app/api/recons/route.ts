import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseBody } from '@/app/api/_lib/validation';

const createReconSchema = z.object({
  area: z.string().optional(),
  name: z.string().optional(),
  owner_id: z.string().optional(),
  threshold_abs: z.number().optional(),
  threshold_pct: z.number().optional(),
  entity: z.string().optional(),
  period: z.string().optional(),
});

// Mock reconciliations data based on SQL seed
const generateMockRecons = () => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const now = new Date();
  
  return [
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      entity: 'Consolidated',
      period: currentMonth,
      area: 'BANK',
      name: 'Operating Account Reconciliation',
      owner_id: 'sarah.accountant',
      status: 'READY',
      threshold_abs: 1000,
      threshold_pct: 0.5,
      last_run_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      variance: 450.50,
      balance_a: 1250000.00,
      balance_b: 1249549.50,
    },
    {
      id: 'c0000000-0000-0000-0000-000000000002',
      entity: 'Consolidated',
      period: currentMonth,
      area: 'AP',
      name: 'Trade Payables vs GL',
      owner_id: 'mike.senior',
      status: 'OPEN',
      threshold_abs: 5000,
      threshold_pct: 1.0,
      last_run_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      variance: 8250.00,
      balance_a: 2340000.00,
      balance_b: 2331750.00,
    },
    {
      id: 'c0000000-0000-0000-0000-000000000003',
      entity: 'Consolidated',
      period: currentMonth,
      area: 'AR',
      name: 'Trade Receivables Subledger',
      owner_id: 'sarah.accountant',
      status: 'REVIEWED',
      threshold_abs: 2000,
      threshold_pct: 0.5,
      last_run_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      variance: 125.00,
      balance_a: 3450000.00,
      balance_b: 3450125.00,
    },
    {
      id: 'c0000000-0000-0000-0000-000000000004',
      entity: 'Consolidated',
      period: currentMonth,
      area: 'INTERCO',
      name: 'Intercompany Balances - US/EU',
      owner_id: 'alex.manager',
      status: 'OPEN',
      threshold_abs: 500,
      threshold_pct: 0.1,
      last_run_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      variance: 1250.00,
      balance_a: 850000.00,
      balance_b: 851250.00,
    },
    {
      id: 'c0000000-0000-0000-0000-000000000005',
      entity: 'Consolidated',
      period: currentMonth,
      area: 'ACCRUALS',
      name: 'Accrued Expenses Schedule',
      owner_id: 'mike.senior',
      status: 'READY',
      threshold_abs: 3000,
      threshold_pct: 1.5,
      last_run_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      variance: 2100.00,
      balance_a: 456000.00,
      balance_b: 453900.00,
    },
    {
      id: 'c0000000-0000-0000-0000-000000000006',
      entity: 'Consolidated',
      period: currentMonth,
      area: 'BANK',
      name: 'Payroll Account',
      owner_id: 'sarah.accountant',
      status: 'CLOSED',
      threshold_abs: 500,
      threshold_pct: 0.1,
      last_run_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      variance: 0,
      balance_a: 125000.00,
      balance_b: 125000.00,
    },
    {
      id: 'c0000000-0000-0000-0000-000000000007',
      entity: 'Consolidated',
      period: currentMonth,
      area: 'AR',
      name: 'Allowance for Doubtful Accounts',
      owner_id: 'alex.manager',
      status: 'OPEN',
      threshold_abs: 10000,
      threshold_pct: 2.0,
      last_run_at: null,
      variance: 0,
      balance_a: 0,
      balance_b: 0,
    },
    {
      id: 'c0000000-0000-0000-0000-000000000008',
      entity: 'Consolidated',
      period: currentMonth,
      area: 'INTERCO',
      name: 'Intercompany Eliminations',
      owner_id: 'john.controller',
      status: 'READY',
      threshold_abs: 1000,
      threshold_pct: 0.5,
      last_run_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      variance: 750.00,
      balance_a: 2100000.00,
      balance_b: 2100750.00,
    },
  ];
};

// Mock runs data
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
    {
      id: 'd0000000-0000-0000-0000-000000000002',
      reconciliation_id: 'c0000000-0000-0000-0000-000000000001',
      started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 3 * 60 * 1000).toISOString(),
      ended_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 1 * 60 * 1000).toISOString(),
      status: 'SUCCEEDED',
      row_count: 1238,
      variance: 1200.00,
      balance_a: 1248000.00,
      balance_b: 1246800.00,
      created_by: 'sarah.accountant',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      threshold_abs: 1000,
      threshold_pct: 0.5,
      effective_threshold: 6234.00,
      outcome: 'FAIL',
      result_url: '/recons/runs/d0000000-0000-0000-0000-000000000002',
      error_text: null,
    },
  ],
  'c0000000-0000-0000-0000-000000000002': [
    {
      id: 'd0000000-0000-0000-0000-000000000003',
      reconciliation_id: 'c0000000-0000-0000-0000-000000000002',
      started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 8 * 60 * 1000).toISOString(),
      ended_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 4 * 60 * 1000).toISOString(),
      status: 'SUCCEEDED',
      row_count: 3456,
      variance: 8250.00,
      balance_a: 2340000.00,
      balance_b: 2331750.00,
      created_by: 'mike.senior',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      threshold_abs: 5000,
      threshold_pct: 1.0,
      effective_threshold: 23317.50,
      outcome: 'PASS',
      result_url: '/recons/runs/d0000000-0000-0000-0000-000000000003',
      error_text: null,
    },
  ],
  'c0000000-0000-0000-0000-000000000003': [
    {
      id: 'd0000000-0000-0000-0000-000000000004',
      reconciliation_id: 'c0000000-0000-0000-0000-000000000003',
      started_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 2 * 60 * 1000).toISOString(),
      ended_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'SUCCEEDED',
      row_count: 2341,
      variance: 125.00,
      balance_a: 3450000.00,
      balance_b: 3450125.00,
      created_by: 'sarah.accountant',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      threshold_abs: 2000,
      threshold_pct: 0.5,
      effective_threshold: 17250.63,
      outcome: 'PASS',
      result_url: '/recons/runs/d0000000-0000-0000-0000-000000000004',
      error_text: null,
    },
  ],
  'c0000000-0000-0000-0000-000000000006': [
    {
      id: 'd0000000-0000-0000-0000-000000000005',
      reconciliation_id: 'c0000000-0000-0000-0000-000000000006',
      started_at: new Date(Date.now() - 1 * 60 * 60 * 1000 - 3 * 60 * 1000).toISOString(),
      ended_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      status: 'SUCCEEDED',
      row_count: 234,
      variance: 0,
      balance_a: 125000.00,
      balance_b: 125000.00,
      created_by: 'sarah.accountant',
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      threshold_abs: 500,
      threshold_pct: 0.1,
      effective_threshold: 500,
      outcome: 'PASS',
      result_url: '/recons/runs/d0000000-0000-0000-0000-000000000005',
      error_text: null,
    },
  ],
};

// Mock events data
const MOCK_EVENTS: Record<string, any[]> = {
  'c0000000-0000-0000-0000-000000000001': [
    {
      id: 'e1',
      type: 'STATUS_CHANGE',
      message: 'Marked as READY for review',
      actor: 'sarah.accountant',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  'c0000000-0000-0000-0000-000000000002': [
    {
      id: 'e2',
      type: 'VARIANCE_ALERT',
      message: 'Variance above threshold: $8,250',
      actor: 'system',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  'c0000000-0000-0000-0000-000000000003': [
    {
      id: 'e3',
      type: 'STATUS_CHANGE',
      message: 'Marked as REVIEWED',
      actor: 'alex.manager',
      created_at: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  'c0000000-0000-0000-0000-000000000006': [
    {
      id: 'e4',
      type: 'CLOSED',
      message: 'Reconciliation closed - no variance',
      actor: 'sarah.accountant',
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
  ],
  'c0000000-0000-0000-0000-000000000008': [
    {
      id: 'e5',
      type: 'ASSIGNED',
      message: 'Assigned to John Controller',
      actor: 'john.controller',
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entity = searchParams.get('entity') || 'Consolidated';
    const period = searchParams.get('period') || new Date().toISOString().slice(0, 7);
    const area = searchParams.get('area');
    const status = searchParams.get('status');
    const searchQuery = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');

    let allRecons = generateMockRecons();

    // Apply filters
    let filtered = allRecons.filter(recon => 
      recon.entity === entity && recon.period === period
    );

    if (area && area !== 'ALL') {
      filtered = filtered.filter(recon => recon.area === area);
    }

    if (status && status !== 'ALL') {
      filtered = filtered.filter(recon => recon.status === status);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(recon =>
        recon.name.toLowerCase().includes(query) ||
        recon.area.toLowerCase().includes(query) ||
        recon.owner_id?.toLowerCase().includes(query)
      );
    }

    // Calculate totals
    const totals = {
      open: filtered.filter(r => r.status === 'OPEN').length,
      atRisk: filtered.filter(r => {
        const threshold = Math.max(
          r.threshold_abs,
          (r.threshold_pct / 100) * Math.abs(r.balance_b)
        );
        return Math.abs(r.variance) > threshold;
      }).length,
      readyForReview: filtered.filter(r => r.status === 'READY').length,
      closed: filtered.filter(r => r.status === 'CLOSED').length,
    };

    // Pagination
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedRecons = filtered.slice(start, end);

    // Add events to reconciliations
    const reconsWithEvents = paginatedRecons.map(recon => ({
      ...recon,
      events: MOCK_EVENTS[recon.id] || [],
    }));

    return NextResponse.json({
      reconciliations: reconsWithEvents,
      total,
      page,
      pageSize,
      totals,
    });
  } catch (error) {
    console.error('Error fetching reconciliations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reconciliations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, createReconSchema);
    if ('error' in parsed) return parsed.error;
    const { area, name, owner_id, threshold_abs, threshold_pct, entity, period } = parsed.data;

    // Generate new reconciliation
    const newRecon = {
      id: `c${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entity: entity || 'Consolidated',
      period: period || new Date().toISOString().slice(0, 7),
      area: area || 'BANK',
      name: name || 'New Reconciliation',
      owner_id: owner_id || '',
      status: 'OPEN',
      threshold_abs: threshold_abs || 1000,
      threshold_pct: threshold_pct || 0.5,
      last_run_at: null,
      variance: 0,
      balance_a: 0,
      balance_b: 0,
      events: [],
    };

    return NextResponse.json(newRecon, { status: 201 });
  } catch (error) {
    console.error('Error creating reconciliation:', error);
    return NextResponse.json(
      { error: 'Failed to create reconciliation' },
      { status: 500 }
    );
  }
}

