export interface WatchItem {
    id: string;
    title: string;
    watch_type: 'ar_open_amount' | 'ar_aged_into_bucket' | 'custom';
    entity_id: string;
    entity_name: string;
    params: Record<string, any>;
    operator: '>' | '>=' | '<' | '<=';
    threshold_value: number;
    metric: {
      agg: 'sum' | 'count' | 'avg';
      field: string;
      where: Record<string, any>;
      label: string;
    };
    bucket?: string | null;
    currency: string;
    last_value?: number;
    last_evaluated_at?: string;
    status: 'ok' | 'breached' | 'muted';
    notify_channels: string[];
    recipients?: string[] | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface WatchEvent {
    id: string;
    watch_id: string;
    event_type: 'created' | 'checked' | 'breached' | 'resolved' | 'muted' | 'deleted';
    value?: number;
    payload: Record<string, any>;
    created_at: string;
  }
  
  export interface InvoiceRow {
    invoice_id: string;
    customer_id: string;
    customer_name: string;
    invoice_date: string;
    due_date: string;
    amount: number;
    currency: string;
    status: string;
    [key: string]: any;
  }
  
  export function computeAgeDays(asOfDate: string, dueDate: string): number {
    const asOf = new Date(asOfDate);
    const due = new Date(dueDate);
    const diffMs = asOf.getTime() - due.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
  
  export function getAgeBucket(ageDays: number): string {
    if (ageDays <= 30) return '0_30';
    if (ageDays <= 60) return '31_60';
    if (ageDays <= 90) return '61_90';
    return 'gt_90';
  }
  
  export function computeWatchValue(
    watchType: string,
    metric: WatchItem['metric'],
    bucket: string | undefined,
    invoiceData: InvoiceRow[]
  ): number {
    let filteredData = [...invoiceData];
  
    if (metric.where) {
      filteredData = filteredData.filter(row => {
        for (const [key, value] of Object.entries(metric.where)) {
          if (key === 'status' && row.status !== value) return false;
          if (key === 'ageBucket') {
            const ageDays = computeAgeDays(row.as_of || new Date().toISOString(), row.due_date);
            const rowBucket = getAgeBucket(ageDays);
            if (rowBucket !== value) return false;
          }
        }
        return true;
      });
    }
  
    if (bucket) {
      filteredData = filteredData.filter(row => {
        const ageDays = computeAgeDays(row.as_of || new Date().toISOString(), row.due_date);
        const rowBucket = getAgeBucket(ageDays);
        return rowBucket === bucket;
      });
    }
  
    if (metric.agg === 'sum') {
      const sum = filteredData.reduce((acc, row) => {
        const val = parseFloat(String(row[metric.field] || 0));
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      return sum;
    }
  
    if (metric.agg === 'count') {
      return filteredData.length;
    }
  
    if (metric.agg === 'avg') {
      if (filteredData.length === 0) return 0;
      const sum = filteredData.reduce((acc, row) => {
        const val = parseFloat(String(row[metric.field] || 0));
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
      return sum / filteredData.length;
    }
  
    return 0;
  }
  
  export function evaluateThreshold(
    value: number,
    operator: WatchItem['operator'],
    threshold: number
  ): boolean {
    switch (operator) {
      case '>':
        return value > threshold;
      case '>=':
        return value >= threshold;
      case '<':
        return value < threshold;
      case '<=':
        return value <= threshold;
      default:
        return false;
    }
  }
  
  export function formatCurrency(value: number, currency: string = 'USD'): string {
    if (isNaN(value)) return '$0';
  
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
  
    if (absValue >= 1_000_000_000) {
      return `${sign}$${(absValue / 1_000_000_000).toFixed(2)}B`;
    }
    if (absValue >= 1_000_000) {
      return `${sign}$${(absValue / 1_000_000).toFixed(2)}M`;
    }
    if (absValue >= 1_000) {
      return `${sign}$${(absValue / 1_000).toFixed(2)}K`;
    }
  
    return `${sign}$${absValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  export function roundToNearestThousand(value: number): number {
    return Math.round(value / 1000) * 1000;
  }
  
  export function getWatchTypeLabel(watchType: string, bucket?: string | null): string {
    if (watchType === 'ar_open_amount') return 'Open AR total';
    if (watchType === 'ar_aged_into_bucket' && bucket === 'gt_90') return 'AR in >90';
    return 'Custom watch';
  }
  
  export function formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
  
    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  