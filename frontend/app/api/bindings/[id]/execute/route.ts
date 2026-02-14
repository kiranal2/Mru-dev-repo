import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const { actor, triggered_by } = body;

    // Simulate execution
    // In a real app, this would trigger the actual template execution
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const execution = {
      id: executionId,
      status: "SUCCESS",
      ended_at: new Date().toISOString(),
      row_count: Math.floor(Math.random() * 100) + 1,
      started_at: new Date(Date.now() - 3000).toISOString(),
      error_message: null,
      result_summary: {
        message: "Execution completed successfully"
      },
      execution_time_ms: 3000
    };

    // In a real app, this would update the binding's latest_execution
    return NextResponse.json({
      success: true,
      execution,
      message: `Binding ${id} executed successfully`
    });
  } catch (error) {
    console.error('Error executing binding:', error);
    return NextResponse.json(
      { error: 'Failed to execute binding' },
      { status: 500 }
    );
  }
}
