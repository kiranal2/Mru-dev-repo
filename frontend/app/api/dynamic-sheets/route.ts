import { NextRequest, NextResponse } from 'next/server';
import { sheetsStorage } from '@/lib/dynamic-sheets-storage';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get sheets for this user
    const userSheets = Array.from(sheetsStorage.values())
      .filter((sheet: any) => sheet.userId === userId);

    return NextResponse.json({
      sheets: userSheets,
    });
  } catch (error) {
    console.error('Error fetching sheets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sheets' },
      { status: 500 }
    );
  }
}

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
      return NextResponse.json(
        { error: 'userId and name are required' },
        { status: 400 }
      );
    }

    const sheetId = `sheet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newSheet = {
      id: sheetId,
      userId,
      name,
      entity: entity || 'Consolidated',
      sourceType: sourceType || 'Prompt',
      promptText,
      description,
      columns: columns || [],
      calculatedColumns: calculatedColumns || [],
      filters: filters || [],
      rows: rows || [],
      rowCount: rows?.length || 0,
      isFavorite: false,
      status: 'OK' as const,
      ownerName: 'You',
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
    console.error('Error creating sheet:', error);
    return NextResponse.json(
      { error: 'Failed to create sheet' },
      { status: 500 }
    );
  }
}

