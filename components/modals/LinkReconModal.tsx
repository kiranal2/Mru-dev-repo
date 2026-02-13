"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link2, Loader2 } from "lucide-react";

interface Reconciliation {
  id: string;
  account_code: string;
  account_name: string;
  status: string;
  frequency: string;
  linked_close_task_id: string | null;
}

interface LinkReconModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  currentReconId?: string | null;
  onLinked: () => void;
}

export function LinkReconModal({ open, onClose, taskId, currentReconId, onLinked }: LinkReconModalProps) {
  const [recons, setRecons] = useState<Reconciliation[]>([]);
  const [selectedReconId, setSelectedReconId] = useState<string | null>(currentReconId || null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadRecons();
      setSelectedReconId(currentReconId || null);
    }
  }, [open, currentReconId]);

  const loadRecons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recons');
      const data = await res.json();
      setRecons(data);
    } catch (error) {
      console.error('Failed to load reconciliations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/close/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linked_recon_id: selectedReconId,
          actor: 'user'
        })
      });
      onLinked();
      onClose();
    } catch (error) {
      console.error('Failed to link reconciliation:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-slate-100 text-slate-700",
      READY: "bg-blue-100 text-blue-700",
      SUBMITTED: "bg-purple-100 text-purple-700",
      CLOSED: "bg-green-100 text-green-700"
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Link to Reconciliation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Reconciliation</label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select value={selectedReconId || ""} onValueChange={(val) => setSelectedReconId(val || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a reconciliation..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Unlink)</SelectItem>
                  {recons.map((recon) => (
                    <SelectItem
                      key={recon.id}
                      value={recon.id}
                      disabled={!!recon.linked_close_task_id && recon.linked_close_task_id !== taskId}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{recon.account_code}</span>
                        <span>-</span>
                        <span>{recon.account_name}</span>
                        <Badge className={getStatusColor(recon.status)} variant="secondary">
                          {recon.status}
                        </Badge>
                        {recon.linked_close_task_id && recon.linked_close_task_id !== taskId && (
                          <Badge variant="outline" className="text-xs">Linked</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedReconId && (
            <div className="rounded-lg border bg-blue-50 p-3 text-sm text-blue-900">
              <p className="font-medium">Auto-sync enabled</p>
              <p className="text-xs text-blue-700 mt-1">
                When the reconciliation is marked READY or CLOSED, this task will automatically update to COMPLETED.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Link'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
