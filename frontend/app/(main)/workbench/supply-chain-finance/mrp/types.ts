export type BulkActionModal =
  | "accept"
  | "counter"
  | "tracking"
  | "escalate"
  | "upload"
  | "new_po"
  | null;

export type SortState = {
  field: string;
  direction: "asc" | "desc";
};

export type NewPOForm = {
  po_number: string;
  supplier_id: string;
  item: string;
  item_description: string;
  mrp_required_date: string;
  po_promise_date: string;
  commit_date: string;
  lead_date: string;
  po_date: string;
  need_qty: string;
  uom: string;
  org_code: string;
  supplier_action: string;
  supplier_commit: string;
  delta_mrp: string;
  quarter_end: string;
};

export type StatusGroupKey = "NEW" | "MONITORING" | "COMPLETED";

export type ExceptionTypeItem = {
  key: string;
  label: string;
};

export type StatusGroup = {
  key: StatusGroupKey;
  label: string;
};
