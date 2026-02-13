"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Eye, UserPlus, Split, BookOpen, CheckCircle2 } from "lucide-react";
import { Payment } from "@/lib/cash-app-types";

interface TableRowActionsProps {
  payment: Payment;
  onViewDetails: (payment: Payment) => void;
  onAssign?: (payment: Payment) => void;
  onSplit?: (payment: Payment) => void;
  onCreateJE?: (payment: Payment) => void;
  onApprovePost?: (payment: Payment) => void;
  showPrimaryAction?: boolean;
  isHovered?: boolean;
}

export function TableRowActions({
  payment,
  onViewDetails,
  onAssign,
  onSplit,
  onCreateJE,
  onApprovePost,
  showPrimaryAction = true,
  isHovered = false,
}: TableRowActionsProps) {
  const showJEAction =
    payment.je_required || payment.intercompany_flag || payment.match_type === "INTERCOMPANY";
  const canApprove = payment.status === "AutoMatched" || payment.status === "PendingToPost";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1">
        {showPrimaryAction && canApprove && (
          <Button
            size="sm"
            className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            onClick={(e) => {
              e.stopPropagation();
              onApprovePost?.(payment);
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Approve & Post
          </Button>
        )}

        <div
          className={`
            flex items-center gap-0.5
            transition-all duration-150 ease-out
            ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"}
          `}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(payment);
                }}
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              View Details
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssign?.(payment);
                }}
              >
                <UserPlus className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Assign
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onSplit?.(payment);
                }}
              >
                <Split className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Split Payment
            </TooltipContent>
          </Tooltip>

          {showJEAction && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateJE?.(payment);
                  }}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Create Journal Entry
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
