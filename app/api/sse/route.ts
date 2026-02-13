import { NextRequest } from "next/server";
import { COMMAND_ENTER_SSE_URL } from "@/conf/conf";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const response = await fetch(`${process.env.API_BASE_URL}/api${COMMAND_ENTER_SSE_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return new Response(errorBody || response.statusText, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "text/plain",
      },
    });
  }

  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
