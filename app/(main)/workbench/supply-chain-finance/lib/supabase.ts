import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://jxzvjslusefaijutgjbd.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4enZqc2x1c2VmYWlqdXRnamJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODMwNzYsImV4cCI6MjA3NTA1OTA3Nn0.DSDI2VxozB3Auv7yeN5bcSbXxV_dJIWbSyS3AS3D24A";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Supplier = {
  supplier_id: string;
  supplier_name: string;
  code: string | null;
  country: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
};

export type POLine = {
  po_line_id: string;
  po_number: string;
  supplier_id: string;
  item: string | null;
  item_description: string | null;
  po_date: string | null;
  mrp_required_date: string | null;
  po_promise_date: string | null;
  commit_date: string | null;
  lead_date: string | null;
  need_qty: number | null;
  uom: string | null;
  org_code: string | null;
  supplier_action: string | null;
  supplier_commit: string | null;
  delta_mrp: string | null;
  quarter_end: string | null;
  created_at: string;
  updated_at: string;
};

export type Signal = {
  signal_id: string;
  po_line_id: string;
  type:
    | "SIG_NO_ACK_T5"
    | "SIG_ACK_GT_SYS_LEAD"
    | "SIG_PARTIAL_COMMIT"
    | "SIG_LEADTIME_DRIFT"
    | "SIG_CANCEL_REQUEST"
    | "SIG_PULL_IN"
    | "SIG_PUSH_OUT"
    | "SIG_ACKNOWLEDGE"
    | "SIG_OK_CONFIRM"
    | "SIG_PAST_DUE"
    | "SIG_CANCEL"
    | "SIG_SUPPLIER_NO_RESPONSE";
  label: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  recommended: "ESCALATE" | "REQUEST_TRACKING" | "ACCEPT" | "COUNTER_DATE";
  recommendation?: string;
  status: "NEW" | "MONITORING" | "COMPLETED";
  rationale: string | null;
  score: number | null;
  is_open: boolean;
  ai_confidence: number | null;
  ai_auto_resolved: boolean;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export type SignalAction = {
  action_id: string;
  signal_id: string;
  action_type: "ACCEPT_COMMIT" | "COUNTER_DATE" | "REQUEST_TRACKING" | "ESCALATE";
  payload: Record<string, any> | null;
  actor: string | null;
  created_at: string;
};

export type SignalEvent = {
  event_id: string;
  signal_id: string;
  event_type: string;
  message: string;
  created_at: string;
};

export type SavedView = {
  view_id: string;
  name: string;
  params: Record<string, any>;
  created_by: string | null;
  created_at: string;
};

export type SignalRow = Signal & {
  po_line: POLine;
  supplier: Supplier;
  recommendation?: string;
};
