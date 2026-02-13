import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("API BASE URL:", process.env.API_BASE_URL);
    const externalUrl = `${process.env.API_BASE_URL}/api/query`;

    const res = await fetch(externalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `API request failed: ${res.status} ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Return response with CORS headers
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Request-ID": `req-${Date.now()}`,
      },
    });
  } catch (error) {
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process query" },
      { status: 500 }
    );
  }
}
