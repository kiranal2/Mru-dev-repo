import { NextRequest, NextResponse } from 'next/server';

// Mock data with history for the first PO line
const mockLineWithHistory = {
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
  history: [
    {
      id: '1',
      event_type: 'Imported from supplier attachment',
      description: 'System processed delivery commitment',
      event_date: '2025-10-08',
      metadata: { source: 'supplier_attachment', automated: true },
    },
    {
      id: '2',
      event_type: 'AI normalized line',
      description: 'Automated risk assessment completed',
      event_date: '2025-10-09',
      metadata: { ai_confidence: 0.95, automated: true },
    },
    {
      id: '3',
      event_type: 'Signal generated',
      description: 'No Ack T+5',
      event_date: '2025-10-10',
      metadata: { exception_type: 'No Ack T+5', severity: 'HIGH' },
    },
  ],
};

// Mock data for other lines (without history for now)
const mockLinesWithoutHistory: Record<string, any> = {
  '2': {
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
    history: [],
  },
  '3': {
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
    history: [],
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);

    // Return the line with history for id 1, or a mock line for others
    if (id === '1') {
      return NextResponse.json(mockLineWithHistory);
    }

    // For other IDs, return a mock line or the one from the map
    const line = mockLinesWithoutHistory[id] || {
      id,
      po_line_number: `PU384614-${id}`,
      supplier: 'NOVA METALS',
      mrp_date: '2025-10-11',
      commit_date: '2025-10-19',
      exception_type: 'No Ack T+5',
      severity: 'HIGH',
      recommended_action: 'Escalate to supplier',
      status: 'New Exception',
      lead_date: '2025-10-11',
      reason: 'Commit - Need-by = +14d > 7d threshold',
      history: [],
    };

    return NextResponse.json(line);
  } catch (error) {
    console.error('Error fetching MRP line details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MRP line details' },
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
    const { status, action } = body;

    // In a real implementation, this would update the database
    // For now, we'll just return success
    console.log('Detail action:', { id, status, action });

    return NextResponse.json({ success: true, id, status, action });
  } catch (error) {
    console.error('Error performing detail action:', error);
    return NextResponse.json(
      { error: 'Failed to perform detail action' },
      { status: 500 }
    );
  }
}

