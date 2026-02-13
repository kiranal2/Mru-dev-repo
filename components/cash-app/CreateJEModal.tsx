"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Payment, JEDraft } from "@/lib/cash-app-types";
import { FileText, CheckCircle2, X } from "lucide-react";

interface CreateJEModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment;
  onSubmit: (jeType: string, jeDraft: JEDraft) => void;
}

export function CreateJEModal({ open, onOpenChange, payment, onSubmit }: CreateJEModalProps) {
  const [jeType, setJeType] = useState<string>("");
  const [memo, setMemo] = useState("");
  const [postingDate, setPostingDate] = useState("");
  const [jeDraft, setJeDraft] = useState<JEDraft | null>(null);

  useEffect(() => {
    if (open && payment.exception_reason_code === "BAD_DEBT") {
      setJeType("BAD_DEBT_RECOVERY");
    }
    setPostingDate(new Date().toISOString().split("T")[0]);
    setMemo(`Bad debt recovery - ${payment.paymentNumber}`);
  }, [open, payment]);

  useEffect(() => {
    if (jeType === "BAD_DEBT_RECOVERY") {
      const draft: JEDraft = {
        header: {
          subsidiary: "US",
          currency: "USD",
          memo: memo,
          posting_date: postingDate,
        },
        lines: [
          {
            account: "Cash Clearing / Undeposited Funds",
            debit: payment.amount,
            credit: 0,
            memo: "Cash receipt",
          },
          {
            account: "Bad Debt Recovery (Write-off Recovery)",
            debit: 0,
            credit: payment.amount,
            memo: "Recovery of written-off receivable",
          },
        ],
      };
      setJeDraft(draft);
    }
  }, [jeType, memo, postingDate, payment.amount]);

  const handleSubmit = () => {
    if (jeDraft && jeType) {
      const finalDraft: JEDraft = {
        ...jeDraft,
        header: {
          ...jeDraft.header,
          memo,
          posting_date: postingDate,
        },
      };
      onSubmit(jeType, finalDraft);
      onOpenChange(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Create Journal Entry
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-blue-900">{payment.paymentNumber}</div>
                <div className="text-xs text-blue-700">{payment.customerName}</div>
              </div>
              <div className="text-lg font-bold text-blue-900">
                {formatCurrency(payment.amount)}
              </div>
            </div>
            {payment.linked_invoice_ref && (
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="text-xs text-blue-700">
                  NetSuite Invoice:{" "}
                  <span className="font-medium">{payment.linked_invoice_ref}</span>
                  <Badge
                    variant="outline"
                    className="ml-2 text-xs bg-amber-50 text-amber-700 border-amber-300"
                  >
                    {payment.linked_invoice_status}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="je-type" className="text-sm font-medium">
                JE Type
              </Label>
              <Select value={jeType} onValueChange={setJeType}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select JE type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAD_DEBT_RECOVERY">Bad Debt Recovery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {jeDraft && (
              <Card className="p-4">
                <div className="mb-4">
                  <div className="text-sm font-semibold mb-3">JE Preview</div>

                  <div className="grid grid-cols-3 gap-4 text-xs mb-4">
                    <div>
                      <div className="text-gray-600">Subsidiary</div>
                      <div className="font-medium">{jeDraft.header.subsidiary}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Currency</div>
                      <div className="font-medium">{jeDraft.header.currency}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Posting Date</div>
                      <Input
                        type="date"
                        value={postingDate}
                        onChange={(e) => setPostingDate(e.target.value)}
                        className="h-7 text-xs mt-0.5"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="memo" className="text-xs text-gray-600">
                      Memo
                    </Label>
                    <Input
                      id="memo"
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      className="mt-1 text-sm"
                    />
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">
                            Account
                          </th>
                          <th className="px-3 py-2 text-right font-semibold text-gray-600">
                            Debit
                          </th>
                          <th className="px-3 py-2 text-right font-semibold text-gray-600">
                            Credit
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600">Memo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {jeDraft.lines.map((line, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium">{line.account}</td>
                            <td className="px-3 py-2 text-right">
                              {line.debit > 0 ? formatCurrency(line.debit) : "-"}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {line.credit > 0 ? formatCurrency(line.credit) : "-"}
                            </td>
                            <td className="px-3 py-2 text-gray-600">{line.memo}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t">
                        <tr>
                          <td className="px-3 py-2 font-semibold">Total</td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {formatCurrency(jeDraft.lines.reduce((sum, l) => sum + l.debit, 0))}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {formatCurrency(jeDraft.lines.reduce((sum, l) => sum + l.credit, 0))}
                          </td>
                          <td className="px-3 py-2"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!jeDraft || !jeType}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Submit for Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
