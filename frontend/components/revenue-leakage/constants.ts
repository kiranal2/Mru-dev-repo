import { LeakageCase } from "@/lib/revenue-leakage/types";

export const owners = ["DIG", "DR", "Joint IG 1", "Joint IG 2", "Addl IG", "Audit DR"];

export const riskStyles: Record<LeakageCase["risk_level"], string> = {
  High: "bg-red-600 text-white border-red-700",
  Medium: "bg-amber-500 text-white border-amber-600",
  Low: "bg-emerald-600 text-white border-emerald-700",
};

export const statusStyles: Record<string, string> = {
  New: "bg-blue-600 text-white",
  "In Review": "bg-amber-500 text-white",
  Confirmed: "bg-orange-600 text-white",
  Resolved: "bg-emerald-600 text-white",
  Rejected: "bg-slate-500 text-white",
};

export const payableLabels: Record<string, string> = {
  SD_PAYABLE: "Stamp Duty",
  TD_PAYABLE: "Transfer Duty",
  RF_PAYABLE: "Registration Fee",
  DSD_PAYABLE: "DSD Fee",
  OTHER_FEE: "Other Fees",
  FINAL_TAXABLE_VALUE: "Taxable Value",
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const formatDocKey = (caseItem: LeakageCase) =>
  `${caseItem.document_key.SR_CODE}/${caseItem.document_key.BOOK_NO}/${caseItem.document_key.DOCT_NO}/${caseItem.document_key.REG_YEAR}`;

export const riskScoreColor = (score: number) => {
  if (score >= 80) return "bg-red-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-emerald-500";
};

export const fieldLabels: Record<string, string> = {
  risk_level: "Risk Level",
  risk_score: "Risk Score",
  confidence: "Confidence",
  impact_amount_inr: "Impact Amount",
  payable_total_inr: "Payable Total",
  paid_total_inr: "Paid Total",
  gap_inr: "Gap",
};
