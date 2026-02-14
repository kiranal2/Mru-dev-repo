# Balance Sheet API Response Structure

This directory contains mock API response structures for the balance sheet page.

## Files

- `balance-sheet-api-response.json` - Complete API response structure for the balance sheet report

## Usage

The balance sheet page now uses the JSON structure from this file via the `lib/balance-sheet-api.ts` utility module.

### Structure Overview

The JSON response includes:

1. **Metadata** - Report type, currency, generation timestamp, fiscal year end, reporting standard
2. **Filters** - Default view modes, display modes, periods, and subsidiaries
3. **Period Structure** - Hierarchical structure (Years → Quarters → Months) for filtering
4. **Subsidiary Structure** - Hierarchical subsidiary structure for organization filtering
5. **Financial Data** - Complete data organized by subsidiary:
   - BetaFoods, Inc. (Consolidated)
   - Averra Oy (Consolidated)
6. **Calculated Fields** - Documentation on how differences and percentages are calculated
7. **Validation** - Balance check rules and required fields

### Data Fields

Each financial row includes:

- `financialRow`: Label/name of the financial line item
- Period values: `q1_2024`, `q2_2024`, `q3_2024`, `q4_2024`, `q1_2023`, `q2_2023`, etc.
- `dollarDifference`: Dollar difference between most recent periods
- `differencePercent`: Percentage difference
- `group`: Category (assets, liabilities, equity)
- `level`: Hierarchical level (0 = top level, 1 = sub-category, 2 = detail item)
- `expanded`: UI expansion state
- `rowId`: Unique identifier for the row
- `parentRowId`: Parent row identifier for hierarchy
- `isSummary`: Boolean indicating if this is a summary/total row

## Backend Integration

This JSON structure is designed to be consumed by the backend API. The backend should:

1. Provide data in this exact structure
2. Calculate `dollarDifference` and `differencePercent` automatically
3. Validate balance equation (Assets = Liabilities + Equity)
4. Support filtering by periods and subsidiaries
5. Generate hierarchical period and subsidiary structures

## Frontend Usage

The frontend uses `lib/balance-sheet-api.ts` to:

- Import and transform the JSON data
- Get financial rows for specific subsidiaries
- Get period and subsidiary structures
- Get default filter values

The balance sheet page (`app/(main)/reports/sec/balance-sheet/page.tsx`) now uses this API structure instead of hardcoded data.
