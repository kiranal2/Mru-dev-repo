import { NextResponse } from 'next/server';

// Mock stats data calculated from the seed data
const mockStats = {
  autoClearPercentage: 45,
  totalExceptions: 20,
  severityCounts: {
    HIGH: 12,
    MEDIUM: 5,
    LOW: 3,
  },
  exceptionTypeCounts: {
    'No Ack T+5': 10,
    'Ack > System Lead Time': 5,
    'Partial Commit': 2,
    'Lead Time Drift': 3,
  },
  slaStatus: 'ON TRACK',
};

export async function GET() {
  try {
    return NextResponse.json(mockStats);
  } catch (error) {
    console.error('Error fetching MRP stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MRP stats' },
      { status: 500 }
    );
  }
}

