import { Tooltip } from '@material-tailwind/react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '../../utils/formatCurrency';
import { generateUUID } from '../../utils/generateUUID';
import { titleCase } from '@/utils/titleCase';
import { isValidUrl } from '../../utils/isValidUrl';

// Type definitions
type RowValue = string | number | boolean;
type TableColumnType = {
  id: string;
  name: string;
  data_type?: string;
  description?: string;
  is_hidden?: boolean;
};




// Constants
const STATUS_STYLES = {
  'past due': 'text-red-7',
  closed: 'text-green-1',
  disputed: 'text-[#F57C00]',
} as const;

const INVOICE_NUMBER_COLUMN_ID = 'prop_ar_invoice_number';
const TRANSACTION_ID_COLUMN_ID = 'prop_ar_erp_invoice_transaction_id';
const MAX_WIDTH_CLASS = 'max-w-50';

interface TableProps {
  headers: TableColumnType[];
  data: string[][];
  subjectArea: string;
  onRowClick?: (rowData: Record<string, string>, index: number) => void;
  customCellRenderer?: (
    value: RowValue,
    column: TableColumnType,
    row: Record<string, string>,
    index: number
  ) => React.ReactNode;
  className?: string;
}

interface CellRendererProps {
  value: RowValue;
  column: TableColumnType;
  row: Record<string, string>;
  index: number;
  apiLoading: number | null;
  onDownloadInvoice: (type: string, id: number, index: number) => void;
}

interface TableHeaderProps {
  headers: TableColumnType[];
}

interface TableRowProps {
  row: Record<string, string>;
  headers: TableColumnType[];
  index: number;
  apiLoading: number | null;
  onDownloadInvoice: (type: string, id: number, index: number) => void;
  onRowClick?: (rowData: Record<string, string>, index: number) => void;
}

// cell formatting hook
const useCellFormatting = () => {
  const formatCurrencyValue = useCallback((value: RowValue) => {
    return formatCurrency({
      value: value.toString(),
      precision: 2,
      isFloat: true,
    });
  }, []);

  const formatBooleanValue = useCallback((value: RowValue) => {
    return titleCase(value.toString());
  }, []);

  const formatUrlValue = useCallback((value: RowValue, columnName: string) => {
    return (
      <Link href={value.toString()} target="_blank" rel="noopener noreferrer" className="text-blue-600">
        {titleCase(columnName.replace(/_/g, ' '))}
      </Link>
    );
  }, []);

  const formatStatusValue = useCallback((value: RowValue) => {
    const statusValue = value.toString().toLowerCase();
    if (statusValue in STATUS_STYLES) {
      return <span className={STATUS_STYLES[statusValue as keyof typeof STATUS_STYLES]}>{value}</span>;
    }
    return false;
  }, []);

  return {
    formatCurrencyValue,
    formatBooleanValue,
    formatUrlValue,
    formatStatusValue,
  };
};

// Placeholder download function - to be implemented
const downloadDocumentApiService = async (
  type: string, 
  id: number, 
  subjectArea: string, 
  setApiLoading: (value: number | null) => void, 
  index: number
) => {
  // TODO: Implement actual download functionality
  console.log('Download requested:', { type, id, subjectArea, index });
  setApiLoading(index + id);
  
  // Simulate API call
  setTimeout(() => {
    setApiLoading(null);
  }, 2000);
};

// download functionality hook
const useDownloadInvoice = (subjectArea: string) => {
  const [apiLoading, setApiLoading] = useState<number | null>(null);

  const downloadInvoice = useCallback(
    async (type: string, id: number, index: number) => {
      if (apiLoading) return;
      await downloadDocumentApiService(type, id, subjectArea, setApiLoading, index);
    },
    [apiLoading, subjectArea]
  );

  return { apiLoading, downloadInvoice };
};

// data transformation hook
const useTableData = (data: string[][], headers: TableColumnType[]) => {
  const tableData = useMemo(
    () =>
      data.map((row) =>
        row.reduce(
          (acc, value, index) => {
            acc[headers[index].id] = value;
            return acc;
          },
          {} as Record<string, string>
        )
      ),
    [data, headers]
  );

  const visibleHeaders = useMemo(() => headers.filter((col) => !col?.is_hidden), [headers]);

  const rowKeys = useMemo(() => data.map(() => generateUUID()), [data]);

  return { tableData, visibleHeaders, rowKeys };
};

//cell renderer component
const CellRenderer = memo<CellRendererProps>(({ value, column, row, index, apiLoading, onDownloadInvoice }) => {
  const { formatCurrencyValue, formatBooleanValue, formatUrlValue, formatStatusValue } = useCellFormatting();
  const cellRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (cellRef.current) {
      setShowTooltip(cellRef.current.offsetWidth < cellRef.current.scrollWidth);
    }
  }, [value]);

  try {
    if (!value) return '';
    const dataType = column.data_type?.toLowerCase();

    // Currency formatting
    if (dataType === 'currency') {
      return formatCurrencyValue(value);
    }

    // Boolean formatting
    if (dataType === 'boolean') {
      return formatBooleanValue(value);
    }

    // URL formatting
    if (isValidUrl(value.toString())) {
      return formatUrlValue(value, column.name);
    }

    // Invoice number with download functionality
    if (
      column.id.toLowerCase() === INVOICE_NUMBER_COLUMN_ID &&
      value.toString().trim() !== '' &&
      Number(row[TRANSACTION_ID_COLUMN_ID]) > 0
    ) {
      const invoiceId = Number(row[TRANSACTION_ID_COLUMN_ID]);
      const isLoading = apiLoading === index + invoiceId;

      return (
        <div className="flex items-center gap-2">
          <button
            className="text-blue-600 transition-colors hover:text-blue-800"
            onClick={() => onDownloadInvoice('invoice', invoiceId, index)}
            disabled={isLoading}
          >
            {value}
          </button>
          {isLoading && (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
          )}
        </div>
      );
    }

    if (formatStatusValue(value)) return formatStatusValue(value);

    return (
      <div ref={cellRef} className="truncate">
        {showTooltip ? (
          <Tooltip content={value.toString()} className="z-99999 max-w-80">
            <span>{value}</span>
          </Tooltip>
        ) : (
          <span>{value}</span>
        )}
      </div>
    );
  } catch {
    return value;
  }
});

CellRenderer.displayName = 'CellRenderer';

//header component
const TableHeader = memo<TableHeaderProps>(({ headers }) => (
  <thead className="font-semibold">
    <tr>
      {headers.map(
        (col) =>
          !col?.is_hidden && (
            <th
              key={col.id}
              className="sticky top-0 cursor-pointer border border-[#D2D2D2] bg-[#F9FAFD] px-3 py-2 text-sm shadow-card"
            >
              <Tooltip content={col?.description} className={`${col?.description ? 'z-99999 max-w-80' : 'hidden'}`}>
                <span>{col.name.replace(/_/g, ' ').trim()}</span>
              </Tooltip>
            </th>
          )
      )}
    </tr>
  </thead>
));

TableHeader.displayName = 'TableHeader';

//row component
const TableRow = memo<TableRowProps>(({ row, headers, index, apiLoading, onDownloadInvoice, onRowClick }) => {
  const handleRowClick = useCallback(() => {
    onRowClick?.(row, index);
  }, [onRowClick, row, index]);

  return (
    <tr
      className={`transition-colors hover:bg-[#f0f9ff] ${index % 2 !== 0 ? 'bg-gray-50' : 'bg-white'} ${onRowClick ? 'cursor-pointer' : ''}`}
      style={{ borderBottom: '0.5px solid #D2D2D2' }}
      onClick={onRowClick ? handleRowClick : undefined}
    >
      {headers.map((col) => (
        <td
          key={col.id}
          className={`${MAX_WIDTH_CLASS} truncate px-3 py-2 !text-sm text-black ${
            col.data_type?.toLowerCase() === 'currency' ? 'text-right' : ''
          }`}
        >
          <CellRenderer
            value={row[col.id]}
            column={col}
            row={row}
            index={index}
            apiLoading={apiLoading}
            onDownloadInvoice={onDownloadInvoice}
          />
        </td>
      ))}
    </tr>
  );
});

TableRow.displayName = 'TableRow';

// Main GridTable component
const GridTable = memo<TableProps>(
  ({ headers, data, subjectArea, onRowClick, customCellRenderer: _customCellRenderer, className = '' }) => {
    const { apiLoading, downloadInvoice } = useDownloadInvoice(subjectArea);
    const { tableData, visibleHeaders, rowKeys } = useTableData(data, headers);

    return (
      <div className={`relative w-full ${className}`}>
        <div className="table-block overflow-auto rounded-lg border-[0.5px] border-[#D2D2D2] pb-1" style={{ maxHeight: '22.5rem', maxWidth: '100%' }}>
          <table className="mb-1 w-full min-w-max table-auto rounded-lg border-separate border-spacing-0 border-[0.5px] border-[#D2D2D2] text-left">
            <TableHeader headers={visibleHeaders} />
            <tbody className="bg-white">
              {tableData.map((row, index) => (
                <TableRow
                  key={rowKeys[index]}
                  row={row}
                  headers={visibleHeaders}
                  index={index}
                  apiLoading={apiLoading}
                  onDownloadInvoice={downloadInvoice}
                  onRowClick={onRowClick}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

GridTable.displayName = 'GridTable';

export default GridTable;
