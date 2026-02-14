import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseParams } from "@/app/api/_lib/validation";

const sessionUserIdParamsSchema = z.object({
  userId: z.string().min(1),
});

export type SessionItem = {
  id: number;
  session_id: string;
  thread_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  metadata?: { user_query?: string };
};

export type SessionsResponse = {
  success: boolean;
  user_id: string;
  sessions: SessionItem[];
  count: number;
  limit: number;
  offset: number;
};

export async function GET(_request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const paramsParsed = parseParams(params, sessionUserIdParamsSchema);
    if ('error' in paramsParsed) return paramsParsed.error;
    const { userId } = paramsParsed.data;

    const baseUrl = process.env.API_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json({ error: "API_BASE_URL not configured" }, { status: 500 });
    }

    const url = `${baseUrl.replace(/\/$/, "")}/api/sessions/${encodeURIComponent(userId)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || `Sessions API failed: ${res.status}` },
        { status: res.status }
      );
    }

    const data: SessionsResponse = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Sessions API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch sessions",
      },
      { status: 500 }
    );
  }
}
