"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";

interface QuickCreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  worklistId: string;
  suggestedType: string;
  onCreated: () => void;
}

export function QuickCreateTaskModal({ open, onClose, worklistId, suggestedType, onCreated }: QuickCreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [fsli, setFsli] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [saving, setSaving] = useState(false);

  const parseTaskType = (suggested: string) => {
    if (suggested.includes('BANK')) {
      setType('Recon');
      setFsli('BANK');
      setTitle('Bank Reconciliation');
    } else if (suggested.includes('AP')) {
      setType('Recon');
      setFsli('AP');
      setTitle('AP Reconciliation');
    } else if (suggested.includes('AR')) {
      setType('Recon');
      setFsli('AR');
      setTitle('AR Reconciliation');
    } else if (suggested.includes('JE')) {
      setType('JE');
      setFsli('');
      setTitle('Journal Entry Review');
    } else {
      setType('Analysis');
      setTitle(suggested);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && suggestedType) {
      parseTaskType(suggestedType);
    } else if (!isOpen) {
      setTitle('');
      setType('');
      setFsli('');
      setAssignee('');
      setDueDate('');
      setPriority('MEDIUM');
      onClose();
    }
  };

  const handleCreate = async () => {
    if (!title || !type) return;

    setSaving(true);
    try {
      await fetch('/api/close/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worklist_id: worklistId,
          title,
          type,
          fsli,
          assignee_id: assignee || null,
          due_date: dueDate || null,
          priority,
          status: 'OPEN'
        })
      });
      onCreated();
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Create Task
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Recon">Recon</SelectItem>
                  <SelectItem value="JE">JE</SelectItem>
                  <SelectItem value="Analysis">Analysis</SelectItem>
                  <SelectItem value="Provision">Provision</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fsli">FSLI/Area</Label>
              <Input
                id="fsli"
                value={fsli}
                onChange={(e) => setFsli(e.target.value)}
                placeholder="e.g., BANK, AP, AR"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Input
                id="assignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={saving || !title || !type}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Task'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
