"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpRight } from "lucide-react";

/* ─── Add Note Dialog ─── */

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteText: string;
  onNoteTextChange: (text: string) => void;
  onSubmit: () => void;
}

export function NoteDialog({
  open,
  onOpenChange,
  noteText,
  onNoteTextChange,
  onSubmit,
}: NoteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        <textarea
          className="w-full h-28 border border-slate-200 rounded-md p-2 text-sm"
          value={noteText}
          onChange={(e) => onNoteTextChange(e.target.value)}
          placeholder="Add context or next steps..."
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Add Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Escalate Dialog ─── */

interface EscalateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escalateTo: string;
  onEscalateToChange: (value: string) => void;
  escalateReason: string;
  onEscalateReasonChange: (value: string) => void;
  onSubmit: () => void;
}

export function EscalateDialog({
  open,
  onOpenChange,
  escalateTo,
  onEscalateToChange,
  escalateReason,
  onEscalateReasonChange,
  onSubmit,
}: EscalateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escalate Case</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Escalate To</label>
            <Select value={escalateTo} onValueChange={onEscalateToChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="District Registrar">District Registrar</SelectItem>
                <SelectItem value="Zonal Inspector">Zonal Inspector</SelectItem>
                <SelectItem value="Chief Commissioner">Chief Commissioner</SelectItem>
                <SelectItem value="Revenue Audit Cell">Revenue Audit Cell</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Reason</label>
            <textarea
              className="w-full h-20 border border-slate-200 rounded-md p-2 text-sm mt-1"
              value={escalateReason}
              onChange={(e) => onEscalateReasonChange(e.target.value)}
              placeholder="Explain why this case needs escalation..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} className="bg-amber-600 hover:bg-amber-700">
            <ArrowUpRight className="w-4 h-4 mr-1" />
            Escalate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
