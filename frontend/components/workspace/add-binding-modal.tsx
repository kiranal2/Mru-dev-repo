"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Link2 } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  type: string;
}

interface AddBindingModalProps {
  open: boolean;
  onClose: () => void;
  scope: string;
  scopeId: string;
  onAdded: () => void;
}

export function AddBindingModal({ open, onClose, scope, scopeId, onAdded }: AddBindingModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [role, setRole] = useState('SUPPORTING');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [parameterOverrides, setParameterOverrides] = useState('{}');

  useEffect(() => {
    if (open) {
      loadTemplates();
      setSelectedTemplate('');
      setRole('SUPPORTING');
      setAutoRefresh(false);
      setDisplayName('');
      setParameterOverrides('{}');
    }
  }, [open]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data-templates/bindings');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate || !role) return;

    setSaving(true);
    try {
      let overrides = {};
      try {
        overrides = JSON.parse(parameterOverrides);
      } catch (e) {
        alert('Invalid JSON in parameter overrides');
        setSaving(false);
        return;
      }

      await fetch('/api/bindings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope,
          scope_id: scopeId,
          template_id: selectedTemplate,
          role,
          auto_refresh: autoRefresh,
          parameter_overrides: overrides,
          display_name: displayName,
          created_by: 'user'
        })
      });

      onAdded();
      onClose();
    } catch (error) {
      console.error('Failed to add binding:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Add Template Binding
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template">Select Template</Label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger id="template">
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Binding Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOURCE">
                  <div>
                    <div className="font-medium">SOURCE</div>
                    <div className="text-xs text-muted-foreground">Primary data source (Balance A)</div>
                  </div>
                </SelectItem>
                <SelectItem value="TARGET">
                  <div>
                    <div className="font-medium">TARGET</div>
                    <div className="text-xs text-muted-foreground">Comparison source (Balance B)</div>
                  </div>
                </SelectItem>
                <SelectItem value="SUPPORTING">
                  <div>
                    <div className="font-medium">SUPPORTING</div>
                    <div className="text-xs text-muted-foreground">Additional detail or drill-down</div>
                  </div>
                </SelectItem>
                <SelectItem value="VALIDATION">
                  <div>
                    <div className="font-medium">VALIDATION</div>
                    <div className="text-xs text-muted-foreground">Quality check or exception report</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name (Optional)</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Custom name for this binding"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="autoRefresh"
              checked={autoRefresh}
              onCheckedChange={(checked) => setAutoRefresh(checked as boolean)}
            />
            <Label htmlFor="autoRefresh" className="cursor-pointer">
              Auto-refresh when opening drawer
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="params">Parameter Overrides (JSON)</Label>
            <Textarea
              id="params"
              value={parameterOverrides}
              onChange={(e) => setParameterOverrides(e.target.value)}
              placeholder='{"include_pending": true}'
              rows={3}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Override template parameters with custom values
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !selectedTemplate || !role}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Binding'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
