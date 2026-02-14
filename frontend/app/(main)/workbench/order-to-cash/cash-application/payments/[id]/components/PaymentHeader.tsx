"use client";

import { Payment } from "@/lib/cash-app-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Edit,
  Settings,
  Upload,
  Download,
  FileText,
  MoreHorizontal,
} from "lucide-react";

interface PaymentHeaderProps {
  payment: Payment;
  resolvedJeTypeLabel: string | null;
  onGoBack: () => void;
}

export function PaymentHeader({ payment, resolvedJeTypeLabel, onGoBack }: PaymentHeaderProps) {
  return (
    <div className="mb-4">
      <Button variant="ghost" size="sm" onClick={onGoBack} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Queue
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">
            {payment.paymentNumber}
          </h1>
          <div className="flex items-center gap-3">
            <Badge
              variant={
                payment.status === "Exception"
                  ? "destructive"
                  : payment.status === "Posted" || payment.je_workflow_state === "POSTED"
                    ? "default"
                    : "secondary"
              }
            >
              {payment.je_workflow_state === "POSTED"
                ? "Resolved (JE Posted)"
                : payment.status}
            </Badge>
            {payment.exceptionType && (
              <Badge variant="outline">{payment.exceptionType}</Badge>
            )}
            {payment.exception_reason_label && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-300"
              >
                {payment.exception_reason_label}
              </Badge>
            )}
            {resolvedJeTypeLabel && (
              <Badge
                variant="outline"
                className="bg-slate-50 text-slate-700 border-slate-300"
              >
                JE: {resolvedJeTypeLabel}
              </Badge>
            )}
            {payment.je_flow_state === "SUBMITTED" && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200"
              >
                JE Approval Pending
              </Badge>
            )}
            {payment.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={payment.originalPaymentFileUrl} download>
              <Download className="w-4 h-4 mr-2" />
              Original File
            </a>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Manage Mappings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </DropdownMenuItem>
              {payment.linkedRemittanceFileUrl && (
                <DropdownMenuItem>
                  <FileText className="w-4 h-4 mr-2" />
                  Remittance File
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
