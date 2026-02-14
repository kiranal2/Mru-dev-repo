import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseBody, parseParams } from '@/app/api/_lib/validation';

const executeBindingParamsSchema = z.object({
  id: z.string().min(1),
});

const executeBindingBodySchema = z.object({
  actor: z.string().optional(),
  triggered_by: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const paramsParsed = parseParams(resolvedParams, executeBindingParamsSchema);
    if ('error' in paramsParsed) return paramsParsed.error;
    const { id } = paramsParsed.data;

    const parsed = await parseBody(request, executeBindingBodySchema);
    if ('error' in parsed) return parsed.error;
    const { actor, triggered_by } = parsed.data;

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
