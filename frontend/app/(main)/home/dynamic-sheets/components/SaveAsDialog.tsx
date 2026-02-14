"use client";

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

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SaveAsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saveAsName: string;
  onSaveAsNameChange: (name: string) => void;
  onConfirm: () => void;
}

export function SaveAsDialog({
  open,
  onOpenChange,
  saveAsName,
  onSaveAsNameChange,
  onConfirm,
}: SaveAsDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save as new Dynamic Sheet</AlertDialogTitle>
          <AlertDialogDescription>
            Create a copy of this sheet with a new name.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="save-as-name">New name</Label>
          <Input
            id="save-as-name"
            value={saveAsName}
            onChange={(e) => onSaveAsNameChange(e.target.value)}
            className="mt-2"
            placeholder="Enter sheet name..."
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={!saveAsName.trim()}>
            Save Sheet
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
