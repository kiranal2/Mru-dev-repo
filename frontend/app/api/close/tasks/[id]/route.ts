import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseBody, parseParams } from '@/app/api/_lib/validation';

const taskIdParamsSchema = z.object({
  id: z.string().min(1),
});

const patchTaskSchema = z.object({
  status: z.enum(['OPEN', 'READY', 'IN_REVIEW', 'BLOCKED', 'CLOSED']).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  assignee_id: z.string().optional(),
  blocking_reason: z.string().nullable().optional(),
  title: z.string().optional(),
  due_date: z.string().optional(),
}).passthrough();

// Mock tasks data (same as in tasks route)
const MOCK_TASKS: Record<string, any> = {
  'b0000000-0000-0000-0000-000000000001': {
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
    events: [
      {
        id: 'e1',
        type: 'STATUS_CHANGE',
        message: 'Marked as READY by Sarah',
        actor: 'sarah.accountant',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  'b0000000-0000-0000-0000-000000000002': {
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
    events: [],
  },
  'b0000000-0000-0000-0000-000000000003': {
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
    events: [
      {
        id: 'e2',
        type: 'STATUS_CHANGE',
        message: 'Submitted for review by Sarah',
        actor: 'sarah.accountant',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  'b0000000-0000-0000-0000-000000000004': {
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
    events: [
      {
        id: 'e3',
        type: 'BLOCKED',
        message: 'Blocked: Waiting for vendor invoice',
        actor: 'mike.senior',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  'b0000000-0000-0000-0000-000000000005': {
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
    events: [],
  },
  'b0000000-0000-0000-0000-000000000006': {
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
    events: [
      {
        id: 'e6',
        type: 'ASSIGNED',
        message: 'Assigned to Sarah Accountant',
        actor: 'john.controller',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  'b0000000-0000-0000-0000-000000000007': {
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
    events: [],
  },
  'b0000000-0000-0000-0000-000000000008': {
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
    events: [
      {
        id: 'e4',
        type: 'CLOSED',
        message: 'Task completed and closed',
        actor: 'alex.manager',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  'b0000000-0000-0000-0000-000000000009': {
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
    events: [],
  },
  'b0000000-0000-0000-0000-000000000010': {
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
    events: [],
  },
  'b0000000-0000-0000-0000-000000000011': {
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
    events: [
      {
        id: 'e5',
        type: 'CLOSED',
        message: 'Task completed and closed',
        actor: 'mike.senior',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  'b0000000-0000-0000-0000-000000000012': {
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
    events: [],
  },
  'b0000000-0000-0000-0000-000000000013': {
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
    events: [],
  },
  'b0000000-0000-0000-0000-000000000014': {
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
    events: [],
  },
  'b0000000-0000-0000-0000-000000000015': {
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
    events: [],
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const paramsParsed = parseParams(resolvedParams, taskIdParamsSchema);
    if ('error' in paramsParsed) return paramsParsed.error;
    const { id } = paramsParsed.data;
    const task = MOCK_TASKS[id];

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const paramsParsed = parseParams(resolvedParams, taskIdParamsSchema);
    if ('error' in paramsParsed) return paramsParsed.error;
    const { id } = paramsParsed.data;

    const parsed = await parseBody(request, patchTaskSchema);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;

    const task = MOCK_TASKS[id];
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Update task with new values
    const updatedTask = {
      ...task,
      ...body,
      updated_at: new Date().toISOString(),
    };

    // Add event if status changed
    if (body.status && body.status !== task.status) {
      const eventType = body.status === 'BLOCKED' ? 'BLOCKED' : 
                       body.status === 'CLOSED' ? 'CLOSED' : 
                       'STATUS_CHANGE';
      const message = body.status === 'BLOCKED' ? `Blocked: ${body.blocking_reason || 'No reason provided'}` :
                     body.status === 'CLOSED' ? 'Task completed and closed' :
                     `Status changed to ${body.status}`;
      
      if (!updatedTask.events) {
        updatedTask.events = [];
      }
      updatedTask.events.push({
        id: `e${Date.now()}`,
        type: eventType,
        message,
        actor: 'current_user', // In real app, this would come from auth
        created_at: new Date().toISOString(),
      });
    }

    // Update the mock data
    MOCK_TASKS[id] = updatedTask;

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

