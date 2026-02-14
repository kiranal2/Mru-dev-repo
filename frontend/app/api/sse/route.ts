import { NextRequest } from "next/server";
import { z } from "zod";
import { COMMAND_ENTER_SSE_URL } from "@/conf/conf";
import { parseBody } from "@/app/api/_lib/validation";

const sseBodySchema = z.object({
  query: z.string().min(1),
}).passthrough();

export async function POST(request: NextRequest) {
  const parsed = await parseBody(request, sseBodySchema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;
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
