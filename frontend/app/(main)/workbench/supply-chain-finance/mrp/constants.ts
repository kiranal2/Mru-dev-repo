import type { NewPOForm, StatusGroup, ExceptionTypeItem } from "./types";

export const INITIAL_NEW_PO_FORM: NewPOForm = {
  po_number: "",
  supplier_id: "",
  item: "",
  item_description: "",
  mrp_required_date: "",
  po_promise_date: "",
  commit_date: "",
  lead_date: "",
  po_date: "",
  need_qty: "",
  uom: "",
  org_code: "",
  supplier_action: "",
  supplier_commit: "",
  delta_mrp: "",
  quarter_end: "",
};

export const STATUS_GROUPS: StatusGroup[] = [
  { key: "NEW", label: "New Exceptions" },
  { key: "MONITORING", label: "Monitoring" },
  { key: "COMPLETED", label: "Completed" },
];

export const EXCEPTION_TYPES: ExceptionTypeItem[] = [
  { key: "SIG_PULL_IN", label: "MRP Required < Supplier Commit" },
  { key: "SIG_PUSH_OUT", label: "MRP Required > Supplier Commit" },
  { key: "SIG_ACKNOWLEDGE", label: "Acknowledge" },
  { key: "SIG_NO_ACK_T5", label: "No Ack T+5" },
  { key: "SIG_OK_CONFIRM", label: "OK/Confirm" },
  { key: "SIG_PAST_DUE", label: "Past Due" },
  { key: "SIG_CANCEL", label: "Cancel" },
  { key: "SIG_PARTIAL_COMMIT", label: "Partial Commit" },
  { key: "SIG_CANCEL_REQUEST", label: "Cancel Request" },
  { key: "SIG_SUPPLIER_NO_RESPONSE", label: "Supplier No Response" },
];

export const SEVERITY_COLOR_MAP: Record<
  "HIGH" | "MEDIUM" | "LOW",
  { bg: string; text: string; border: string; hoverBg: string; hoverText: string }
> = {
  HIGH: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    hoverBg: "hover:bg-red-100",
    hoverText: "hover:text-red-800",
  },
  MEDIUM: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    hoverBg: "hover:bg-amber-100",
    hoverText: "hover:text-amber-800",
  },
  LOW: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    hoverBg: "hover:bg-green-100",
    hoverText: "hover:text-green-800",
  },
};

export const SUPPLIER_ACTION_COLOR_MAP: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  "PUSH OUT": {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  "PULL IN": {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  "PULL OUT": {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  "PAST DUE": {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  CANCEL: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  CONFIRM: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  OK: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  "OK/CONFIRM": {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  ACKNOWLEDGE: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  EXPEDITE: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  "ON TIME": {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
};

export const SEVERITY_BADGE_COLORS: Record<
  "HIGH" | "MEDIUM" | "LOW",
  { bg: string; text: string; border: string }
> = {
  HIGH: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  MEDIUM: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  LOW: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
};
