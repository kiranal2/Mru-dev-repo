import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseParams } from "@/app/api/_lib/validation";

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
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("thread_id");
  const backendUrl = threadId
    ? `${process.env.API_BASE_URL}/api/query/${queryId}/result?thread_id=${threadId}`
    : `${process.env.API_BASE_URL}/api/query/${queryId}/result`;
  console.log("[query/result] Fetching:", backendUrl);
  const result = await fetch(backendUrl);
  const data = await result.json();
  console.log("[query/result] Backend status:", result.status, "keys:", Object.keys(data));
  return NextResponse.json(data);
}
