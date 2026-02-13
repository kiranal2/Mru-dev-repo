export interface LivePinSummary {
    as_of: string;
    buckets: {
      '0_30': BucketData;
      '31_60': BucketData;
      '61_90': BucketData;
      gt_90: BucketData;
    };
    total: BucketData;
  }
  
  export interface BucketData {
    amount: number;
    delta: number;
    deltaPct: number;
  }
  
  export interface LivePin {
    id: string;
    user_id: string;
    query_payload: Record<string, any>;
    pin_type: string;
    title: string;
    entity_id_text?: string | null;
    entity_name?: string;
    params: Record<string, any>;
    baseline_date: string;
    last_refreshed_at: string;
    summary: LivePinSummary;
    insights: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  