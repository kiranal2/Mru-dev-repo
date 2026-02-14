import { NextRequest, NextResponse } from 'next/server';

// Mock worklist data based on SQL seed
const MOCK_WORKLIST = {
  id: 'a0000000-0000-0000-0000-000000000001',
  entity: 'Consolidated',
  period: new Date().toISOString().slice(0, 7), // Current month YYYY-MM
  owner_id: 'john.controller',
  status: 'IN_PROGRESS',
  progress_pct: 45,
};

// Mock KPIs calculated from the task data
const MOCK_KPIS = {
  progressPct: 45,
  open: 7,
  late: 3,
  blocked: 1,
  whatsMissing: ['BANK Recon', 'AP Recon'],
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entity = searchParams.get('entity') || 'Consolidated';
    const period = searchParams.get('period') || new Date().toISOString().slice(0, 7);

    // Return mock data matching the seed data
    return NextResponse.json({
      worklist: {
        ...MOCK_WORKLIST,
        entity,
        period,
      },
      kpis: MOCK_KPIS,
    });
  } catch (error) {
    console.error('Error fetching worklist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worklist' },
      { status: 500 }
    );
  }
}

