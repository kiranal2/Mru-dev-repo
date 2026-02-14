import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sheetsStorage } from '@/lib/dynamic-sheets-storage';
import { parseBody, parseParams } from '@/app/api/_lib/validation';

const sheetIdParamsSchema = z.object({
  id: z.string().min(1),
});

const patchSheetSchema = z.object({
  name: z.string().optional(),
  entity: z.string().optional(),
  columns: z.array(z.unknown()).optional(),
  calculatedColumns: z.array(z.unknown()).optional(),
  filters: z.array(z.unknown()).optional(),
  rows: z.array(z.unknown()).optional(),
  isFavorite: z.boolean().optional(),
  isDirty: z.boolean().optional(),
}).passthrough();

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
    const paramsParsed = parseParams(params, sheetIdParamsSchema);
    if ('error' in paramsParsed) return paramsParsed.error;
    const { id } = paramsParsed.data;

    const parsed = await parseBody(request, patchSheetSchema);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;

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

