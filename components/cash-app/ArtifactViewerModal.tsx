"use client";

import { TimelineArtifact } from "@/lib/timeline-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, Mail, FileText, Link2, Receipt, File } from "lucide-react";

interface ArtifactViewerModalProps {
  artifact: TimelineArtifact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArtifactViewerModal({ artifact, open, onOpenChange }: ArtifactViewerModalProps) {
  if (!artifact) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getIcon = () => {
    switch (artifact.artifactType) {
      case "Email":
        return <Mail className="w-5 h-5" />;
      case "PDF":
        return <FileText className="w-5 h-5" />;
      case "Remittance":
        return <Receipt className="w-5 h-5" />;
      case "MatchSet":
        return <Link2 className="w-5 h-5" />;
      case "JEDraft":
        return <FileText className="w-5 h-5" />;
      case "BankLine":
        return <Receipt className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const renderPreview = () => {
    switch (artifact.artifactType) {
      case "Email":
        return (
          <div className="bg-gray-50 rounded-lg border p-4 space-y-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="text-xs text-gray-600">From</div>
                  <div className="text-sm font-medium">
                    {artifact.metadata?.emailFrom || "customer@example.com"}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(artifact.metadata?.emailDate)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-600">Subject</div>
                <div className="text-sm font-medium">
                  {artifact.metadata?.emailSubject || "Payment Remittance Advice"}
                </div>
              </div>
            </div>
            <div className="border-t pt-3">
              <div className="text-sm text-gray-700 space-y-2">
                <p>Dear Accounts Receivable,</p>
                <p>Please find attached our payment advice for the following invoices:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>INV-2024-001: $5,000.00</li>
                  <li>INV-2024-002: $7,500.00</li>
                  <li>INV-2024-003: $2,500.00</li>
                </ul>
                <p className="mt-2">Total payment: $15,000.00</p>
                <p className="mt-2">
                  Best regards,
                  <br />
                  Accounts Payable Team
                </p>
              </div>
            </div>
          </div>
        );

      case "PDF":
        return (
          <div className="bg-gray-100 rounded-lg border h-64 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2" />
              <div className="text-sm">PDF Preview</div>
              <div className="text-xs mt-1">remittance_advice.pdf</div>
            </div>
          </div>
        );

      case "MatchSet":
        return (
          <div className="bg-gray-50 rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Invoice
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {artifact.metadata?.matchSetData?.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{item.invoice}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(item.amount)}</td>
                      <td className="px-4 py-2 text-center">
                        {item.matched ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Matched
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td className="px-4 py-2 font-semibold">Total</td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {formatCurrency(
                        artifact.metadata?.matchSetData?.reduce(
                          (sum: number, item: any) => sum + item.amount,
                          0
                        ) || 0
                      )}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );

      case "JEDraft":
        return (
          <div className="bg-gray-50 rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Account
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Description
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">
                      Debit
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">
                      Credit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {artifact.metadata?.jeDraftLines?.map((line: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono">{line.account}</td>
                      <td className="px-4 py-2">{line.description}</td>
                      <td className="px-4 py-2 text-right">
                        {line.debit > 0 ? formatCurrency(line.debit) : "-"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {line.credit > 0 ? formatCurrency(line.credit) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "BankLine":
        return (
          <div className="bg-gray-50 rounded-lg border p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-600 mb-1">Bank Account</div>
                <div className="text-sm font-medium">
                  {artifact.metadata?.bankLineData?.account || "****1234"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Amount</div>
                <div className="text-sm font-semibold">
                  {formatCurrency(artifact.metadata?.bankLineData?.amount || 0)}
                </div>
              </div>
            </div>
          </div>
        );

      case "Remittance":
        return (
          <div className="bg-gray-50 rounded-lg border p-4">
            <div className="text-sm text-gray-600">
              <div className="font-medium mb-2">Remittance Advice Document</div>
              <div className="text-xs">
                Contains detailed payment application instructions and invoice references.
              </div>
            </div>
          </div>
        );

      case "Evidence":
        return (
          <div className="bg-gray-50 rounded-lg border p-4">
            <div className="text-sm text-gray-600">
              <div className="font-medium mb-2">Customer Identification Evidence</div>
              <div className="text-xs">
                Supporting data and matching scores used to identify the customer.
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-gray-100 rounded-lg border h-32 flex items-center justify-center text-gray-500 text-sm">
            No preview available
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            <span>{artifact.artifactType}</span>
            <Badge variant="outline" className="ml-2">
              {artifact.artifactId}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-600 mb-1">Artifact Type</div>
              <div className="font-medium">{artifact.artifactType}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Artifact ID</div>
              <div className="font-mono text-xs">{artifact.artifactId}</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Preview</div>
            {renderPreview()}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button size="sm" variant="outline" className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Full
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
