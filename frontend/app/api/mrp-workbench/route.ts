import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseBody } from '@/app/api/_lib/validation';

const bulkMrpPatchSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  status: z.string().optional(),
  action: z.string().optional(),
});

// Mock data based on the SQL seed data
const mockMRPLines = [
  {
    id: '1',
    po_line_number: 'PU384614-12',
    supplier: 'NOVA METALS',
    mrp_date: '2025-10-11',
    commit_date: '2025-10-19',
    exception_type: 'No Ack T+5',
    severity: 'HIGH',
    recommended_action: 'Escalate to supplier',
    status: 'New Exception',
    lead_date: '2025-10-11',
    reason: 'Commit - Need-by = +14d > 7d threshold',
  },
  {
    id: '2',
    po_line_number: 'PU384614-13',
    supplier: 'NOVA METALS',
    mrp_date: '2025-10-12',
    commit_date: '2025-10-20',
    exception_type: 'No Ack T+5',
    severity: 'HIGH',
    recommended_action: 'Escalate to supplier',
    status: 'New Exception',
    lead_date: '2025-10-12',
    reason: 'Commit - Need-by = +8d > 7d threshold',
  },
  {
    id: '3',
    po_line_number: 'PU384614-14',
    supplier: 'NOVA METALS',
    mrp_date: '2025-10-13',
    commit_date: '2025-10-21',
    exception_type: 'No Ack T+5',
    severity: 'HIGH',
    recommended_action: 'Monitor',
    status: 'Completed',
    lead_date: '2025-10-13',
    reason: 'Commit - Need-by = +8d > 7d threshold',
  },
  {
    id: '4',
    po_line_number: 'PU384614-15',
    supplier: 'NOVA METALS',
    mrp_date: '2025-10-14',
    commit_date: '2025-10-22',
    exception_type: 'No Ack T+5',
    severity: 'HIGH',
    recommended_action: 'Escalate to supplier',
    status: 'New Exception',
    lead_date: '2025-10-12',
    reason: 'Commit - Need-by = +8d > 7d threshold',
  },
  {
    id: '5',
    po_line_number: 'PU384614-16',
    supplier: 'NOVA Demo',
    mrp_date: '2025-10-15',
    commit_date: '2025-10-23',
    exception_type: 'No Ack T+5',
    severity: 'HIGH',
    recommended_action: 'Monitor',
    status: 'Completed',
    lead_date: '2025-10-13',
    reason: 'Commit - Need-by = +8d > 7d threshold',
  },
  {
    id: '6',
    po_line_number: 'PU384614-17',
    supplier: 'NOVA METALS',
    mrp_date: '2025-10-16',
    commit_date: '2025-10-24',
    exception_type: 'Ack > System Lead Time',
    severity: 'MEDIUM',
    recommended_action: 'Request tracking update',
    status: 'New Exception',
    lead_date: '2025-10-12',
    reason: 'Acknowledged date exceeds system lead time by 5 days',
  },
  {
    id: '7',
    po_line_number: 'PU384614-18',
    supplier: 'NOVA METALS',
    mrp_date: '2025-10-17',
    commit_date: '2025-10-25',
    exception_type: 'Ack > System Lead Time',
    severity: 'MEDIUM',
    recommended_action: 'Monitor',
    status: 'Completed',
    lead_date: '2025-10-13',
    reason: 'Acknowledged date exceeds system lead time by 6 days',
  },
  {
    id: '8',
    po_line_number: 'PU384614-19',
    supplier: 'NOVA METALS',
    mrp_date: '2025-10-18',
    commit_date: '2025-10-26',
    exception_type: 'Ack > System Lead Time',
    severity: 'MEDIUM',
    recommended_action: 'Request tracking update',
    status: 'New Exception',
    lead_date: '2025-10-12',
    reason: 'Acknowledged date exceeds system lead time by 4 days',
  },
  {
    id: '9',
    po_line_number: 'PU384614-20',
    supplier: 'NOVA METALS',
    mrp_date: '2025-10-19',
    commit_date: '2025-10-27',
    exception_type: 'Partial Commit',
    severity: 'LOW',
    recommended_action: 'Monitor',
    status: 'New Exception',
    lead_date: '2025-10-12',
    reason: 'Supplier committed to partial quantity only',
  },
  {
    id: '10',
    po_line_number: 'PU384614-21',
    supplier: 'NOVA METALS',
    mrp_date: '2025-10-20',
    commit_date: '2025-10-28',
    exception_type: 'Lead Time Drift',
    severity: 'LOW',
    recommended_action: 'Monitor',
    status: 'New Exception',
    lead_date: '2025-10-12',
    reason: 'Lead time has drifted by 3 days from baseline',
  },
  {
    id: '11',
    po_line_number: 'PU384614-22',
    supplier: 'NOVA METALS',
    mrp_date: '2025-10-21',
    commit_date: '2025-10-29',
    exception_type: 'No Ack T+5',
    severity: 'HIGH',
    recommended_action: 'Escalate to supplier',
    status: 'New Exception',
    lead_date: '2025-10-12',
    reason: 'Commit - Need-by = +8d > 7d threshold',
  },
  {
    id: '12',
    po_line_number: 'PU384614-23',
    supplier: 'NOVA METALS',
    mrp_date: '2025-10-22',
    commit_date: '2025-10-30',
    exception_type: 'No Ack T+5',
    severity: 'HIGH',
    recommended_action: 'Escalate to supplier',
    status: 'New Exception',
    lead_date: '2025-10-13',
    reason: 'Commit - Need-by = +8d > 7d threshold',
  },
  {
    id: '13',
    po_line_number: 'PU384614-24',
    supplier: 'ACME CORP',
    mrp_date: '2025-10-23',
    commit_date: '2025-10-31',
    exception_type: 'No Ack T+5',
    severity: 'HIGH',
    recommended_action: 'Monitor',
    status: 'Monitoring',
    lead_date: '2025-10-14',
    reason: 'Commit - Need-by = +8d > 7d threshold',
  },
  {
    id: '14',
    po_line_number: 'PU384614-25',
    supplier: 'ACME CORP',
    mrp_date: '2025-10-24',
    commit_date: '2025-11-01',
    exception_type: 'Ack > System Lead Time',
    severity: 'MEDIUM',
    recommended_action: 'Request tracking update',
    status: 'New Exception',
    lead_date: '2025-10-15',
    reason: 'Acknowledged date exceeds system lead time by 7 days',
  },
  {
    id: '15',
    po_line_number: 'PU384614-26',
    supplier: 'STEEL INDUSTRIES',
    mrp_date: '2025-10-25',
    commit_date: '2025-11-02',
    exception_type: 'Lead Time Drift',
    severity: 'LOW',
    recommended_action: 'Monitor',
    status: 'Completed',
    lead_date: '2025-10-16',
    reason: 'Lead time has drifted by 2 days from baseline',
  },
  {
    id: '16',
    po_line_number: 'PU384614-27',
    supplier: 'STEEL INDUSTRIES',
    mrp_date: '2025-10-26',
    commit_date: '2025-11-03',
    exception_type: 'No Ack T+5',
    severity: 'HIGH',
    recommended_action: 'Escalate to supplier',
    status: 'New Exception',
    lead_date: '2025-10-17',
    reason: 'Commit - Need-by = +8d > 7d threshold',
  },
  {
    id: '17',
    po_line_number: 'PU384614-28',
    supplier: 'GLOBAL SUPPLY',
    mrp_date: '2025-10-27',
    commit_date: '2025-11-04',
    exception_type: 'Partial Commit',
    severity: 'LOW',
    recommended_action: 'Monitor',
    status: 'New Exception',
    lead_date: '2025-10-18',
    reason: 'Supplier committed to partial quantity only',
  },
  {
    id: '18',
    po_line_number: 'PU384614-29',
    supplier: 'GLOBAL SUPPLY',
    mrp_date: '2025-10-28',
    commit_date: '2025-11-05',
    exception_type: 'Ack > System Lead Time',
    severity: 'MEDIUM',
    recommended_action: 'Monitor',
    status: 'Completed',
    lead_date: '2025-10-19',
    reason: 'Acknowledged date exceeds system lead time by 8 days',
  },
  {
    id: '19',
    po_line_number: 'PU384614-30',
    supplier: 'PRECISION PARTS',
    mrp_date: '2025-10-29',
    commit_date: '2025-11-06',
    exception_type: 'No Ack T+5',
    severity: 'HIGH',
    recommended_action: 'Escalate to supplier',
    status: 'New Exception',
    lead_date: '2025-10-20',
    reason: 'Commit - Need-by = +8d > 7d threshold',
  },
  {
    id: '20',
    po_line_number: 'PU384614-31',
    supplier: 'PRECISION PARTS',
    mrp_date: '2025-10-30',
    commit_date: '2025-11-07',
    exception_type: 'Lead Time Drift',
    severity: 'LOW',
    recommended_action: 'Monitor',
    status: 'New Exception',
    lead_date: '2025-10-21',
    reason: 'Lead time has drifted by 4 days from baseline',
  },
];

export async function GET() {
  try {
    return NextResponse.json(mockMRPLines);
  } catch (error) {
    console.error('Error fetching MRP data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MRP data' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const parsed = await parseBody(request, bulkMrpPatchSchema);
    if ('error' in parsed) return parsed.error;
    const { ids, status, action } = parsed.data;

    // In a real implementation, this would update the database
    // For now, we'll just return success
    console.log('Bulk action:', { ids, status, action });

    return NextResponse.json({ success: true, updated: ids.length });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}

