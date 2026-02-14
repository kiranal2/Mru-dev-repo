import { NextRequest, NextResponse } from "next/server";
import { sheetsStorage } from "@/lib/dynamic-sheets-storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      entity,
      sourceType,
      promptText,
      description,
      columns,
      calculatedColumns,
      filters,
      rows,
    } = body;

    if (!userId || !name) {
      return NextResponse.json({ error: "userId and name are required" }, { status: 400 });
    }

    const sheetId = `sheet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newSheet = {
      id: sheetId,
      userId,
      name,
      entity: entity || "Consolidated",
      sourceType: sourceType || "Prompt",
      promptText,
      description,
      columns: columns || [],
      calculatedColumns: calculatedColumns || [],
      filters: filters || [],
      rows: rows || [],
      rowCount: rows?.length || 0,
      isFavorite: false,
      status: "OK" as const,
      ownerName: "You",
      isDirty: false,
      lastRefreshedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    sheetsStorage.set(sheetId, newSheet);

    return NextResponse.json({
      sheet: newSheet,
    });
  } catch (error) {
    console.error("Error saving expanded sheet:", error);
    return NextResponse.json({ error: "Failed to save sheet" }, { status: 500 });
  }
}
