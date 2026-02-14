import { z, ZodSchema } from "zod";
import { NextRequest, NextResponse } from "next/server";

export async function parseBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return { error: NextResponse.json({ error: { message: "Validation failed", details: result.error.flatten() } }, { status: 400 }) };
    }
    return { data: result.data };
  } catch {
    return { error: NextResponse.json({ error: { message: "Invalid JSON body" } }, { status: 400 }) };
  }
}

export function parseParams<T>(params: Record<string, string>, schema: ZodSchema<T>): { data: T } | { error: NextResponse } {
  const result = schema.safeParse(params);
  if (!result.success) {
    return { error: NextResponse.json({ error: { message: "Invalid parameters", details: result.error.flatten() } }, { status: 400 }) };
  }
  return { data: result.data };
}
