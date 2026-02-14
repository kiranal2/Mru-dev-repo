"use client";

import { LeakageCase } from "@/lib/revenue-leakage/types";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileDown,
  ArrowUpRight,
  Clock,
  StickyNote,
  RotateCcw,
} from "lucide-react";
import { formatDocKey, riskStyles, statusStyles, owners } from "./constants";

interface CaseDrawerHeaderProps {
  caseItem: LeakageCase;
  editing: boolean;
  isEdited?: boolean;
  onUpdateCase: (caseId: string, updates: Partial<LeakageCase>) => Promise<void>;
  onResetCase?: (caseId: string) => Promise<void>;
  onSaveEdits: () => void;
  onCancelEdit: () => void;
  onEscalateOpen: () => void;
  onNoteOpen: () => void;
  onExport: (type: string) => void;
  onAuditPack: () => void;
}

export function CaseDrawerHeader({
  caseItem,
  editing,
  isEdited,
  onUpdateCase,
  onResetCase,
  onSaveEdits,
  onCancelEdit,
  onEscalateOpen,
  onNoteOpen,
  onExport,
  onAuditPack,
}: CaseDrawerHeaderProps) {
  const sla = caseItem.sla;

  return (
    <SheetHeader className="px-6 pt-5 pb-4 border-b bg-gradient-to-r from-slate-800 to-slate-700">
      {/* Row 1: Doc key + Case ID */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <SheetTitle className="text-xl font-bold text-white tracking-tight">
            {formatDocKey(caseItem)}
          </SheetTitle>
          <p className="text-xs text-slate-300 mt-1">Case ID {caseItem.case_id}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${riskStyles[caseItem.risk_level]}`}
          >
            {caseItem.risk_level} Risk
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${statusStyles[caseItem.case_status] || "bg-slate-500 text-white"}`}
          >
            {caseItem.case_status}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-white/15 text-white border border-white/20">
            {caseItem.confidence}% conf.
          </span>
        </div>
      </div>

      {/* Row 2: SLA strip (if applicable) */}
      {sla && (
        <div
          className={`mt-3 flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${sla.sla_breached ? "bg-red-500/20 text-red-200" : "bg-emerald-500/20 text-emerald-200"}`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>
            {sla.ageing_days}d old — Bucket: {sla.ageing_bucket}
          </span>
          {sla.sla_breached && (
            <span className="ml-auto font-bold text-red-300">SLA BREACHED</span>
          )}
          {!sla.sla_breached && (
            <span className="ml-auto text-emerald-300">
              Within SLA ({sla.sla_target_days}d target)
            </span>
          )}
        </div>
      )}

      {/* Row 3: Actions */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <Select
          value={caseItem.case_status}
          onValueChange={(value) =>
            onUpdateCase(caseItem.case_id, { case_status: value as LeakageCase["case_status"] })
          }
        >
          <SelectTrigger className="h-8 w-[140px] text-xs bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {["New", "In Review", "Confirmed", "Resolved", "Rejected"].map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={caseItem.assigned_to || ""}
          onValueChange={(value) => onUpdateCase(caseItem.case_id, { assigned_to: value })}
        >
          <SelectTrigger className="h-8 w-[150px] text-xs bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Assign owner" />
          </SelectTrigger>
          <SelectContent>
            {owners.map((owner) => (
              <SelectItem key={owner} value={owner}>
                {owner}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {editing ? (
          <>
            <Button
              size="sm"
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={onSaveEdits}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={onCancelEdit}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            {/* Edit button hidden
            <Button size="sm" variant="outline" className="h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={enterEditMode}>
              <Pencil className="w-3.5 h-3.5 mr-1" />
              Edit
            </Button>
            */}
            {isEdited && onResetCase && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs bg-amber-500/20 border-amber-400/30 text-amber-200 hover:bg-amber-500/30"
                onClick={() => onResetCase(caseItem.case_id)}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset
              </Button>
            )}
          </>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={onEscalateOpen}
          >
            <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
            Escalate
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={onNoteOpen}
          >
            <StickyNote className="w-3.5 h-3.5 mr-1" />
            Note
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <FileDown className="w-3.5 h-3.5 mr-1" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport("PDF")}>
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("CSV")}>
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAuditPack}>Generate Audit Pack</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </SheetHeader>
  );
}
