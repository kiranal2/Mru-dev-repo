"use client";

import { Payment } from "@/lib/cash-app-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  UserPlus,
  Lightbulb,
  Search,
  MoreHorizontal,
  Mail,
} from "lucide-react";
import { WhyEvidenceCard } from "@/components/cash-app/why-evidence-card";
import { RoutingDebugCard } from "@/components/cash-app/routing-debug-card";

interface ActionSidebarProps {
  payment: Payment;
  resolvedJeTypeLabel: string | null;
  postingGate: { allowed: boolean; reason?: string };
  approvePostDisabled: boolean;
  approvePostReason: string | undefined;
  isAdmin: boolean;
  onAction: (action: string) => void;
  onApprovePost: () => void;
  onApprove: () => void;
  onInvestigate: () => void;
  onOpenEmailComposer: () => void;
  onOpenJEBuild: () => void;
  onShowCreateJE: () => void;
  onJEApprove: () => void;
  onJEReject: () => void;
}

export function ActionSidebar({
  payment,
  resolvedJeTypeLabel,
  postingGate,
  approvePostDisabled,
  approvePostReason,
  isAdmin,
  onAction,
  onApprovePost,
  onApprove,
  onInvestigate,
  onOpenEmailComposer,
  onOpenJEBuild,
  onShowCreateJE,
  onJEApprove,
  onJEReject,
}: ActionSidebarProps) {
  return (
    <div className="space-y-4 sticky top-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
      <Card className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm mb-1">AI Recommendation</h3>
            <p className="text-sm text-gray-700">{payment.aiRecommendation}</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Confidence Score</span>
            <span className="text-sm font-semibold">{payment.confidenceScore}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                payment.confidenceScore >= 80
                  ? "bg-green-500"
                  : payment.confidenceScore >= 50
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${payment.confidenceScore}%` }}
            ></div>
          </div>
        </div>

        {payment.warnings && payment.warnings.length > 0 && (
          <div className="mb-4">
            {payment.warnings.map((warning, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-xs text-orange-700 bg-orange-50 p-2 rounded mb-2"
              >
                <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        <Separator className="my-4" />

        <div className="space-y-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    className="w-full"
                    onClick={onApprovePost}
                    disabled={approvePostDisabled}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve & Post
                  </Button>
                </div>
              </TooltipTrigger>
              {approvePostReason && (
                <TooltipContent side="top" className="max-w-xs">
                  <div className="text-xs">
                    <div className="font-semibold mb-1">Posting Blocked</div>
                    <div>{approvePostReason}</div>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          {!postingGate.allowed && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded flex items-start gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>{postingGate.reason}</span>
            </div>
          )}
          <Button
            className="w-full"
            variant="outline"
            onClick={onApprove}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Approve
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-full" variant="outline">
                <MoreHorizontal className="w-4 h-4 mr-2" />
                More Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={onInvestigate}>
                <Search className="w-4 h-4 mr-2" />
                Investigate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenEmailComposer}>
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAction("missing-remittance")}>
                <AlertCircle className="w-4 h-4 mr-2" />
                Missing Remittance
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("duplicate")}>
                <AlertCircle className="w-4 h-4 mr-2" />
                Duplicate Payment
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (resolvedJeTypeLabel) {
                    onOpenJEBuild();
                  } else {
                    onAction("je-type");
                  }
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                {resolvedJeTypeLabel ? "Build JE" : "Select JE Type"}
              </DropdownMenuItem>
              {payment.je_required &&
                (payment.je_workflow_state === "NONE" ||
                  payment.je_workflow_state === "DRAFT" ||
                  payment.je_workflow_state === "REJECTED") && (
                  <DropdownMenuItem onClick={onShowCreateJE}>
                    <FileText className="w-4 h-4 mr-2" />
                    Create JE
                  </DropdownMenuItem>
                )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAction("assign")}>
                <UserPlus className="w-4 h-4 mr-2" />
                Assign / Tag
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {payment.je_workflow_state === "SUBMITTED" && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-xs font-semibold text-amber-800 mb-3">
              JE Approval Required
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={onJEApprove} className="flex-1">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Approve JE
              </Button>
              <Button size="sm" variant="ghost" onClick={onJEReject} className="flex-1">
                Reject JE
              </Button>
            </div>
          </div>
        )}

        {payment.je_required && payment.je_workflow_state !== "NONE" && (
          <div className="mt-4 text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <div className="font-medium mb-1">JE Workflow Status</div>
            <Badge
              variant="outline"
              className={
                payment.je_workflow_state === "POSTED"
                  ? "bg-green-50 text-green-700 border-green-300"
                  : payment.je_workflow_state === "SUBMITTED"
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : payment.je_workflow_state === "REJECTED"
                      ? "bg-red-50 text-red-700 border-red-300"
                      : "bg-gray-50 text-gray-700 border-gray-300"
              }
            >
              {payment.je_workflow_state}
            </Badge>
            {resolvedJeTypeLabel && (
              <div className="mt-2 text-gray-500">Type: {resolvedJeTypeLabel}</div>
            )}
          </div>
        )}
      </Card>

      <WhyEvidenceCard explainability={payment.explainability} />

      {isAdmin && <RoutingDebugCard routing={payment.routing} />}
    </div>
  );
}
