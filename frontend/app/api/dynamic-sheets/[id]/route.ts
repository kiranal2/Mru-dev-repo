import { NextRequest, NextResponse } from 'next/server';
import { sheetsStorage } from '@/lib/dynamic-sheets-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const includeData = searchParams.get('includeData') === 'true';

    const sheet = sheetsStorage.get(id);

    if (!sheet) {
      return NextResponse.json(
        { error: 'Sheet not found' },
        { status: 404 }
      );
    }

    const response: any = {
      sheet: {
        ...sheet,
        // Don't include rows in the sheet object unless specifically requested
        rows: includeData ? sheet.rows : undefined,
      },
    };

    if (includeData) {
      response.data = sheet.rows || [];
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching sheet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sheet' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const sheet = sheetsStorage.get(id);

    if (!sheet) {
      return NextResponse.json(
        { error: 'Sheet not found' },
        { status: 404 }
      );
    }

    // Update sheet with provided fields
    const updatedSheet = {
      ...sheet,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    sheetsStorage.set(id, updatedSheet);

    return NextResponse.json({
      sheet: updatedSheet,
    });
  } catch (error) {
    console.error('Error updating sheet:', error);
    return NextResponse.json(
      { error: 'Failed to update sheet' },
      { status: 500 }
    );
  }
}

