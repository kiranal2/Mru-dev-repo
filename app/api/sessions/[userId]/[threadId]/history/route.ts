import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string; threadId: string } }
) {
  try {
    const userId = params.userId;
    const threadId = params.threadId;
    if (!userId || !threadId) {
      return NextResponse.json({ error: "Missing user_id or thread_id" }, { status: 400 });
    }

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
