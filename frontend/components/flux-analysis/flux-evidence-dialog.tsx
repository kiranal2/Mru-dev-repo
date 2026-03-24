"use client";

import { useRef, useState, useMemo } from "react";
import type { FluxRow } from "@/lib/data/types/flux-analysis";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Paperclip, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { EVIDENCE_TYPE_OPTIONS, QUICK_LINK_EVIDENCE_OPTIONS } from "@/app/(main)/reports/analysis/flux-analysis/constants";

interface FluxEvidenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetRow: FluxRow | null;
  onAttach: (rowId: string) => void;
}

export function FluxEvidenceDialog({
  open,
  onOpenChange,
  targetRow,
  onAttach,
}: FluxEvidenceDialogProps) {
  const [evidenceType, setEvidenceType] = useState("journal-entry");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [evidenceFileName, setEvidenceFileName] = useState("");
  const [evidenceQuickLinks, setEvidenceQuickLinks] = useState<string[]>([]);
  const evidenceFileInputRef = useRef<HTMLInputElement>(null);

  const evidenceQuickLinkSet = useMemo(() => new Set(evidenceQuickLinks), [evidenceQuickLinks]);

  const handleFileSelection = (file?: File | null) => {
    if (!file) return;
    setEvidenceFileName(file.name);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(event.target.files?.[0]);
    event.currentTarget.value = "";
  };

  const toggleQuickLink = (quickLink: string) => {
    setEvidenceQuickLinks((prev) =>
      prev.includes(quickLink) ? prev.filter((item) => item !== quickLink) : [...prev, quickLink]
    );
  };

  const handleAttach = () => {
    if (!targetRow) return;
    if (!evidenceFileName && evidenceQuickLinks.length === 0) {
      toast.error("Add a file or quick-link before attaching evidence");
      return;
    }
    onAttach(targetRow.id);
    onOpenChange(false);
    toast.success(`Evidence attached for ${targetRow.name} (${targetRow.acct})`);
  };

  // Reset form when dialog opens
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setEvidenceType("journal-entry");
      setEvidenceNotes("");
      setEvidenceFileName("");
      setEvidenceQuickLinks([]);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[88vh] gap-3 overflow-y-auto p-4 sm:max-w-[560px]">
        <DialogHeader className="space-y-2 pr-8">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Paperclip className="h-4.5 w-4.5 text-primary" />
            Attach Evidence
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Upload supporting documentation for{" "}
            {targetRow ? `${targetRow.name} (${targetRow.acct})` : "the selected account"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">Evidence Type</Label>
            <Select value={evidenceType} onValueChange={setEvidenceType}>
              <SelectTrigger className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVIDENCE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">Upload File</Label>
            <input
              ref={evidenceFileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.png,.jpg,.jpeg,.webp"
              onChange={handleFileChange}
            />
            <button
              type="button"
              className={cn(
                "w-full rounded-lg border border-dashed p-5 text-center transition-colors",
                evidenceFileName ? "border-emerald-200 bg-emerald-50" : "border-slate-200 hover:bg-slate-50"
              )}
              onClick={() => evidenceFileInputRef.current?.click()}
              onDragOver={(event) => { event.preventDefault(); }}
              onDrop={(event) => {
                event.preventDefault();
                handleFileSelection(event.dataTransfer.files?.[0]);
              }}
            >
              {evidenceFileName ? (
                <div>
                  <p className="text-sm font-semibold text-emerald-700">{evidenceFileName}</p>
                  <p className="text-xs text-emerald-600">Selected file. Click to replace.</p>
                </div>
              ) : (
                <div>
                  <Upload className="mx-auto mb-1.5 h-7 w-7 text-slate-300" />
                  <p className="text-base font-medium text-slate-700">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-400">PDF, Excel, CSV, Word, Images (max 25MB)</p>
                </div>
              )}
            </button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">Notes (optional)</Label>
            <Textarea
              value={evidenceNotes}
              onChange={(event) => setEvidenceNotes(event.target.value)}
              className="min-h-[84px] rounded-lg border-slate-200 text-sm"
              placeholder="Add context, reference numbers, or reviewer instructions..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">Or quick-link existing</Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_LINK_EVIDENCE_OPTIONS.map((option) => {
                const selected = evidenceQuickLinkSet.has(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleQuickLink(option)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                      selected
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
          <Button
            variant="outline"
            className="h-9 px-4 text-sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="h-9 bg-primary px-4 text-sm text-white hover:bg-primary/90"
            onClick={handleAttach}
          >
            <Paperclip className="mr-2 h-4 w-4" />
            Attach Evidence
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
