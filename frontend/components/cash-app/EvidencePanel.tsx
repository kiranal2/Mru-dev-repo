"use client";

import { useEffect } from "react";
import {
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Building2,
  CreditCard,
  Mail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BankEvidence {
  bankAccount: string;
  currency: string;
  amount: number;
  paymentDate: string;
  payerName: string;
  memo?: string;
  reference?: string;
  traceId?: string;
}

interface RemittanceEvidence {
  source: "Email" | "Portal" | "API" | "Upload" | "None";
  parsedInvoices?: Array<{ invoiceNumber: string; amount: number }>;
  parseStatus: "Success" | "Failed" | "Partial" | "None";
  filename?: string;
}

interface NetSuiteEvidence {
  entities: string[];
  customerIds: string[];
  invoiceWarnings?: Array<{ invoiceNumber: string; warning: string }>;
}

interface EvidencePanelProps {
  isOpen: boolean;
  onClose: () => void;
  whyNotAutoMatched: string[];
  signals: {
    invoiceRefsFound: boolean;
    remittanceLinked: boolean;
    amountAligns: boolean;
    toleranceApplied: boolean;
    multiEntityInvoices: boolean;
    jeRequired: boolean;
    closedInvoicePresent: boolean;
  };
  bankEvidence: BankEvidence;
  remittanceEvidence: RemittanceEvidence;
  netsuiteEvidence: NetSuiteEvidence;
  reasonCodes: string[];
  onEvidenceViewed?: () => void;
  scrollToSectionId?: string;
}

export function EvidencePanel({
  isOpen,
  onClose,
  whyNotAutoMatched,
  signals,
  bankEvidence,
  remittanceEvidence,
  netsuiteEvidence,
  reasonCodes,
  onEvidenceViewed,
  scrollToSectionId,
}: EvidencePanelProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  useEffect(() => {
    if (isOpen && onEvidenceViewed) {
      onEvidenceViewed();
    }
  }, [isOpen, onEvidenceViewed]);

  useEffect(() => {
    if (!isOpen || !scrollToSectionId) return;
    const target = document.getElementById(scrollToSectionId);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }, [isOpen, scrollToSectionId]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-b from-gray-50 to-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Evidence & Why</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close panel"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Why this is not auto-matched
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                {whyNotAutoMatched.map((reason, idx) => (
                  <p key={idx} className="text-sm text-amber-900 leading-relaxed">
                    • {reason}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Signals</h3>
              <div className="flex flex-wrap gap-2">
                <Badge
                  className={`${signals.invoiceRefsFound ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"} border text-xs`}
                >
                  {signals.invoiceRefsFound ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <XCircle className="w-3 h-3 mr-1" />
                  )}
                  Invoice refs found
                </Badge>
                <Badge
                  className={`${signals.remittanceLinked ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"} border text-xs`}
                >
                  {signals.remittanceLinked ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <XCircle className="w-3 h-3 mr-1" />
                  )}
                  Remittance linked
                </Badge>
                <Badge
                  className={`${signals.amountAligns ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"} border text-xs`}
                >
                  {signals.amountAligns ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <XCircle className="w-3 h-3 mr-1" />
                  )}
                  Amount aligns
                </Badge>
                <Badge
                  className={`${signals.toleranceApplied ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-gray-100 text-gray-600 border-gray-200"} border text-xs`}
                >
                  {signals.toleranceApplied ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <XCircle className="w-3 h-3 mr-1" />
                  )}
                  Tolerance applied
                </Badge>
                <Badge
                  className={`${signals.multiEntityInvoices ? "bg-purple-100 text-purple-800 border-purple-200" : "bg-gray-100 text-gray-600 border-gray-200"} border text-xs`}
                >
                  {signals.multiEntityInvoices ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <XCircle className="w-3 h-3 mr-1" />
                  )}
                  Multi-entity invoices
                </Badge>
                <Badge
                  className={`${signals.jeRequired ? "bg-orange-100 text-orange-800 border-orange-200" : "bg-gray-100 text-gray-600 border-gray-200"} border text-xs`}
                >
                  {signals.jeRequired ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <XCircle className="w-3 h-3 mr-1" />
                  )}
                  JE required
                </Badge>
                <Badge
                  className={`${signals.closedInvoicePresent ? "bg-red-100 text-red-800 border-red-200" : "bg-gray-100 text-gray-600 border-gray-200"} border text-xs`}
                >
                  {signals.closedInvoicePresent ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <XCircle className="w-3 h-3 mr-1" />
                  )}
                  Closed invoice present
                </Badge>
              </div>
            </div>

            <div className="border-t pt-6" id="netsuite-evidence">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                Bank Evidence
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Bank Account</div>
                    <div className="font-medium text-gray-900">{bankEvidence.bankAccount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Currency</div>
                    <div className="font-medium text-gray-900">{bankEvidence.currency}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Amount</div>
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(bankEvidence.amount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Payment Date</div>
                    <div className="font-medium text-gray-900">{bankEvidence.paymentDate}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-gray-600 mb-1">Payer Name</div>
                    <div className="font-medium text-gray-900">{bankEvidence.payerName}</div>
                  </div>
                  {bankEvidence.memo && (
                    <div className="col-span-2">
                      <div className="text-xs text-gray-600 mb-1">Memo / Reference</div>
                      <div className="font-medium text-gray-900">{bankEvidence.memo}</div>
                    </div>
                  )}
                  {bankEvidence.traceId && (
                    <div className="col-span-2">
                      <div className="text-xs text-gray-600 mb-1">Trace / Transaction ID</div>
                      <div className="font-mono text-xs text-gray-700">{bankEvidence.traceId}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-600" />
                Remittance Evidence
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600">Remittance Source</div>
                  <Badge variant="outline" className="text-xs">
                    {remittanceEvidence.source}
                  </Badge>
                </div>
                {remittanceEvidence.parseStatus !== "None" && (
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-600">Parse Status</div>
                    <Badge
                      className={`text-xs ${
                        remittanceEvidence.parseStatus === "Success"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : remittanceEvidence.parseStatus === "Failed"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                      } border`}
                    >
                      {remittanceEvidence.parseStatus}
                    </Badge>
                  </div>
                )}
                {remittanceEvidence.filename && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Filename</div>
                    <div className="text-xs font-mono text-gray-700 bg-white px-2 py-1 rounded border">
                      {remittanceEvidence.filename}
                    </div>
                  </div>
                )}
                {remittanceEvidence.parsedInvoices &&
                  remittanceEvidence.parsedInvoices.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-600 mb-2">Parsed Invoices</div>
                      <div className="space-y-1">
                        {remittanceEvidence.parsedInvoices.slice(0, 5).map((inv, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs bg-white px-2 py-1.5 rounded border"
                          >
                            <span className="font-medium text-gray-900">{inv.invoiceNumber}</span>
                            <span className="text-gray-600">{formatCurrency(inv.amount)}</span>
                          </div>
                        ))}
                        {remittanceEvidence.parsedInvoices.length > 5 && (
                          <div className="text-xs text-gray-500 text-center py-1">
                            +{remittanceEvidence.parsedInvoices.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-green-600" />
                NetSuite Evidence
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <div className="text-xs text-gray-600 mb-2">Candidate Customer IDs</div>
                  <div className="flex flex-wrap gap-1.5">
                    {netsuiteEvidence.customerIds.map((id, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs font-mono">
                        {id}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-2">Entities / Subsidiaries</div>
                  <div className="flex flex-wrap gap-1.5">
                    {netsuiteEvidence.entities.map((entity, idx) => (
                      <Badge
                        key={idx}
                        className="bg-blue-100 text-blue-800 border-blue-200 border text-xs"
                      >
                        {entity}
                      </Badge>
                    ))}
                  </div>
                </div>
                {netsuiteEvidence.invoiceWarnings &&
                  netsuiteEvidence.invoiceWarnings.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-600 mb-2">Invoice Status Warnings</div>
                      <div className="space-y-1.5">
                        {netsuiteEvidence.invoiceWarnings.map((warning, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded px-2 py-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-amber-900">
                              <span className="font-medium">{warning.invoiceNumber}:</span>{" "}
                              {warning.warning}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Reason Codes</h3>
              <div className="space-y-2">
                {reasonCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <p className="text-sm text-slate-900">{code}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
