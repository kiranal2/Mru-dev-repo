import { NextRequest, NextResponse } from 'next/server';

// Mock tasks data based on SQL seed
const MOCK_TASKS = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    worklist_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Bank Reconciliation - Operating Account',
    type: 'Recon',
    fsli: 'BANK-1010',
    assignee_id: 'sarah.accountant',
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'READY',
    priority: 'HIGH',
    blocking_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    linked_recon_id: null,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    worklist_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'AP Reconciliation - Trade Payables',
    type: 'Recon',
    fsli: 'AP-2000',
    assignee_id: 'mike.senior',
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'OPEN',
    priority: 'HIGH',
    blocking_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    linked_recon_id: null,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    worklist_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'AR Reconciliation - Trade Receivables',
    type: 'Recon',
    fsli: 'AR-1200',
    assignee_id: 'sarah.accountant',
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'IN_REVIEW',
    priority: 'HIGH',
    blocking_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    linked_recon_id: null,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    worklist_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Journal Entry - Accrual True-Up',
    type: 'JE',
    fsli: 'ACCR-2100',
    assignee_id: 'mike.senior',
    due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'BLOCKED',
    priority: 'MEDIUM',
    blocking_reason: 'Waiting for vendor invoice',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    linked_recon_id: null,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000005',
    worklist_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Revenue Recognition Review',
    type: 'Checklist',
    fsli: 'REV-4000',
    assignee_id: 'alex.manager',
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'OPEN',
    priority: 'MEDIUM',
    blocking_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    linked_recon_id: null,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000006',
    worklist_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Intercompany Balances Reconciliation',
    type: 'Recon',
    fsli: 'IC-1500',
    assignee_id: 'sarah.accountant',
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'READY',
    priority: 'HIGH',
    blocking_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    linked_recon_id: null,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000007',
    worklist_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Prepaid Expenses Roll Forward',
    type: 'Flux',
    fsli: 'PREP-1300',
    assignee_id: 'mike.senior',
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'OPEN',
    priority: 'LOW',
    blocking_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    linked_recon_id: null,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000008',
    worklist_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Depreciation Calculation',
    type: 'JE',
    fsli: 'PPE-1600',
    assignee_id: 'alex.manager',
    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'CLOSED',
    priority: 'MEDIUM',
    blocking_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    linked_recon_id: null,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000009',
    worklist_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Tax Provision Review',
    type: 'Checklist',
    fsli: 'TAX-2500',
    assignee_id: 'john.controller',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'OPEN',
    priority: 'HIGH',
    blocking_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    linked_recon_id: null,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000010',
    worklist_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Inventory Valuation',
    type: 'Flux',
    fsli: 'INV-1400',
    assignee_id: 'sarah.accountant',
    due_date: new Date().toISOString().split('T')[0],
    status: 'IN_REVIEW',
    priority: 'MEDIUM',
    blocking_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    linked_recon_id: null,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000011',
    worklist_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Payroll Accruals',
    type: 'JE',
    fsli: 'PAY-5100',
    assignee_id: 'mike.senior',
    due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'CLOSED',
    priority: 'MEDIUM',
    blocking_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    linked_recon_id: null,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000012',
    worklist_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Fixed Assets Additions',
    type: 'Checklist',
    fsli: 'PPE-1600',
    assignee_id: 'alex.manager',
    due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'OPEN',
    priority: 'LOW',
    blocking_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    linked_recon_id: null,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000013',
    worklist_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Deferred Revenue Schedule',
    type: 'Flux',
    fsli: 'DEF-2200',
    assignee_id: 'sarah.accountant',
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'READY',
    priority: 'MEDIUM',
    blocking_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    linked_recon_id: null,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000014',
    worklist_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Management Review Package',
    type: 'Other',
    fsli: 'RPT-ALL',
    assignee_id: 'john.controller',
    due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'OPEN',
    priority: 'HIGH',
    blocking_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    linked_recon_id: null,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000015',
    worklist_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Financial Statement Footnotes',
    type: 'Checklist',
    fsli: 'RPT-ALL',
    assignee_id: 'alex.manager',
    due_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'OPEN',
    priority: 'MEDIUM',
    blocking_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    linked_recon_id: null,
  },
];

// Mock events for tasks
const MOCK_EVENTS: Record<string, any[]> = {
  'b0000000-0000-0000-0000-000000000001': [
    {
      id: 'e1',
      type: 'STATUS_CHANGE',
      message: 'Marked as READY by Sarah',
      actor: 'sarah.accountant',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  'b0000000-0000-0000-0000-000000000003': [
    {
      id: 'e2',
      type: 'STATUS_CHANGE',
      message: 'Submitted for review by Sarah',
      actor: 'sarah.accountant',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  'b0000000-0000-0000-0000-000000000004': [
    {
      id: 'e3',
      type: 'BLOCKED',
      message: 'Blocked: Waiting for vendor invoice',
      actor: 'mike.senior',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  'b0000000-0000-0000-0000-000000000008': [
    {
      id: 'e4',
      type: 'CLOSED',
      message: 'Task completed and closed',
      actor: 'alex.manager',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  'b0000000-0000-0000-0000-000000000011': [
    {
      id: 'e5',
      type: 'CLOSED',
      message: 'Task completed and closed',
      actor: 'mike.senior',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  'b0000000-0000-0000-0000-000000000006': [
    {
      id: 'e6',
      type: 'ASSIGNED',
      message: 'Assigned to Sarah Accountant',
      actor: 'john.controller',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const worklistId = searchParams.get('worklist_id');
    const status = searchParams.get('status');
    const assignee = searchParams.get('assignee');
    const searchQuery = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');

    if (!worklistId) {
      return NextResponse.json(
        { error: 'worklist_id is required' },
        { status: 400 }
      );
    }

    let filtered = MOCK_TASKS.filter(task => task.worklist_id === worklistId);

    // Apply filters
    if (status && status !== 'ALL') {
      filtered = filtered.filter(task => task.status === status);
    }

    if (assignee && assignee !== 'ALL') {
      filtered = filtered.filter(task => task.assignee_id === assignee);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.type.toLowerCase().includes(query) ||
        task.fsli?.toLowerCase().includes(query)
      );
    }

    // Pagination
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedTasks = filtered.slice(start, end);

    // Add events to tasks
    const tasksWithEvents = paginatedTasks.map(task => ({
      ...task,
      events: MOCK_EVENTS[task.id] || [],
    }));

    return NextResponse.json({
      tasks: tasksWithEvents,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

