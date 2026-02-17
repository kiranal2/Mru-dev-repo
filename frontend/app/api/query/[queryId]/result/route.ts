import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseParams } from "@/app/api/_lib/validation";
import { getLastMockQuery, createMockQueryResult } from "@/app/api/_lib/mock-sse";

const queryResultParamsSchema = z.object({
  queryId: z.string().min(1),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ queryId: string }> }
) {
  const resolvedParams = await params;
  const paramsParsed = parseParams(resolvedParams, queryResultParamsSchema);
  if ('error' in paramsParsed) return paramsParsed.error;
  const { queryId } = paramsParsed.data;

  const apiBaseUrl = process.env.API_BASE_URL;

  // Demo mode: return mock result when no backend is configured
  if (!apiBaseUrl) {
    console.log("[query/result] No API_BASE_URL configured — using mock result");
    const lastMock = getLastMockQuery();
    const prompt = lastMock.prompt || "";
    const data = createMockQueryResult(prompt);
    return NextResponse.json(data);
  }

  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("thread_id");
  const backendUrl = threadId
    ? `${apiBaseUrl}/api/query/${queryId}/result?thread_id=${threadId}`
    : `${apiBaseUrl}/api/query/${queryId}/result`;
  console.log("[query/result] Fetching:", backendUrl);
  const result = await fetch(backendUrl);
  const data = await result.json();
  console.log("[query/result] Backend status:", result.status, "keys:", Object.keys(data));
  return NextResponse.json(data);
}
