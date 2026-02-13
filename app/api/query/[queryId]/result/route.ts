import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ queryId: string }> }
) {
  const { queryId } = await params;
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("thread_id");
  if (!queryId) {
    return NextResponse.json({ error: "Missing queryId" }, { status: 400 });
  }
  const backendUrl = threadId
    ? `${process.env.API_BASE_URL}/api/query/${queryId}/result?thread_id=${threadId}`
    : `${process.env.API_BASE_URL}/api/query/${queryId}/result`;
  console.log("[query/result] Fetching:", backendUrl);
  const result = await fetch(backendUrl);
  const data = await result.json();
  console.log("[query/result] Backend status:", result.status, "keys:", Object.keys(data));
  return NextResponse.json(data);
}
