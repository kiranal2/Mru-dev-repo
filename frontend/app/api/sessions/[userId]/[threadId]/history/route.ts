import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseParams } from "@/app/api/_lib/validation";

const threadHistoryParamsSchema = z.object({
  userId: z.string().min(1),
  threadId: z.string().min(1),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string; threadId: string } }
) {
  try {
    const paramsParsed = parseParams(params, threadHistoryParamsSchema);
    if ('error' in paramsParsed) return paramsParsed.error;
    const { userId, threadId } = paramsParsed.data;

    const baseUrl = process.env.API_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: "API_BASE_URL not configured" }, { status: 500 });
    }

    const url = `${baseUrl.replace(/\/$/, "")}/api/sessions/${encodeURIComponent(userId)}/${encodeURIComponent(threadId)}/history`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || `Thread history API failed: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Thread history API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch thread history",
      },
      { status: 500 }
    );
  }
}
