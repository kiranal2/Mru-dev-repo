"use client";

import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JE_TYPE_OPTIONS } from "../constants";

interface ActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAction: string;
  selectedJeTypeCode: string;
  onJeTypeCodeChange: (value: string) => void;
  assignTo: string;
  onAssignToChange: (value: string) => void;
  onConfirm: () => void;
}

export function ActionModal({
  open,
  onOpenChange,
  currentAction,
  selectedJeTypeCode,
  onJeTypeCodeChange,
  assignTo,
  onAssignToChange,
  onConfirm,
}: ActionModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {currentAction === "je-type" && "Select JE Type"}
            {currentAction === "assign" && "Assign Payment"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {currentAction === "je-type" && "Select the journal entry type for this payment."}
            {currentAction === "assign" && "Assign this payment to a team member."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {currentAction === "je-type" && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="je-type" className="text-sm font-medium">
                JE Type
              </Label>
              <Select value={selectedJeTypeCode} onValueChange={onJeTypeCodeChange}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select JE type" />
                </SelectTrigger>
                <SelectContent>
                  {JE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedJeTypeCode === "INTERCO" && (
                <p className="text-xs text-slate-500 mt-2">
                  Intercompany JE will be generated from entity split rules.
                </p>
              )}
            </div>
          </div>
        )}
        {currentAction === "assign" && (
          <div className="space-y-4">
            <Select value={assignTo} onValueChange={onAssignToChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sarah Chen">Sarah Chen</SelectItem>
                <SelectItem value="Michael Roberts">Michael Roberts</SelectItem>
                <SelectItem value="Jessica Martinez">Jessica Martinez</SelectItem>
                <SelectItem value="David Kim">David Kim</SelectItem>
                <SelectItem value="Emily Taylor">Emily Taylor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={
              (currentAction === "je-type" && !selectedJeTypeCode) ||
              (currentAction === "assign" && !assignTo)
            }
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
