import { NextRequest, NextResponse } from 'next/server';

// Mock data generation (duplicated from route.ts for this handler)
const generateMockReconsData = () => {
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

const MOCK_RUNS_DATA: Record<string, any[]> = {
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

const MOCK_EVENTS_DATA: Record<string, any[]> = {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const allRecons = generateMockReconsData();
    const recon = allRecons.find(r => r.id === id);

    if (!recon) {
      return NextResponse.json(
        { error: 'Reconciliation not found' },
        { status: 404 }
      );
    }

    // Add runs and events
    const reconWithDetails = {
      ...recon,
      runs: MOCK_RUNS_DATA[id] || [],
      events: MOCK_EVENTS_DATA[id] || [],
    };

    return NextResponse.json(reconWithDetails);
  } catch (error) {
    console.error('Error fetching reconciliation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reconciliation' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    
    const allRecons = generateMockReconsData();
    const recon = allRecons.find(r => r.id === id);
    
    if (!recon) {
      return NextResponse.json(
        { error: 'Reconciliation not found' },
        { status: 404 }
      );
    }

    // Update reconciliation with new values
    const updatedRecon = {
      ...recon,
      ...body,
    };

    // Add event if status changed
    if (body.status && body.status !== recon.status) {
      const eventType = body.status === 'CLOSED' ? 'CLOSED' : 
                       body.status === 'REVIEWED' ? 'STATUS_CHANGE' : 
                       'STATUS_CHANGE';
      const message = body.status === 'CLOSED' ? 'Reconciliation closed' :
                     body.status === 'REVIEWED' ? 'Marked as REVIEWED' :
                     `Status changed to ${body.status}`;
      
      if (!MOCK_EVENTS_DATA[id]) {
        MOCK_EVENTS_DATA[id] = [];
      }
      MOCK_EVENTS_DATA[id].push({
        id: `e${Date.now()}`,
        type: eventType,
        message,
        actor: 'current_user', // In real app, this would come from auth
        created_at: new Date().toISOString(),
      });
    }

    // Add runs and events to response
    const reconWithDetails = {
      ...updatedRecon,
      runs: MOCK_RUNS_DATA[id] || [],
      events: MOCK_EVENTS_DATA[id] || [],
    };

    return NextResponse.json(reconWithDetails);
  } catch (error) {
    console.error('Error updating reconciliation:', error);
    return NextResponse.json(
      { error: 'Failed to update reconciliation' },
      { status: 500 }
    );
  }
}

