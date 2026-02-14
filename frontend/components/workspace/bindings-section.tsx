"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BindingCard } from "./binding-card";
import { AddBindingModal } from "./add-binding-modal";

interface Binding {
  id: string;
  template_id: string;
  role: string;
  auto_refresh: boolean;
  display_name: string;
  template?: {
    id: string;
    name: string;
    type?: string;
    description: string;
  };
  latest_execution?: Array<{
    id: string;
    status: string;
    started_at: string;
    ended_at?: string;
    row_count?: number;
    result_summary?: any;
    error_message?: string;
    execution_time_ms?: number;
  }>;
}

interface BindingsSectionProps {
  scope: string;
  scopeId: string;
  autoRefreshOnMount?: boolean;
}

export function BindingsSection({ scope, scopeId, autoRefreshOnMount = true }: BindingsSectionProps) {
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [runningBindings, setRunningBindings] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBindings();
  }, [scope, scopeId]);

  useEffect(() => {
    if (autoRefreshOnMount && bindings.length > 0) {
      const autoRefreshBindings = bindings.filter(b => b.auto_refresh);
      autoRefreshBindings.forEach(binding => {
        handleRun(binding.id);
      });
    }
  }, []);

  const loadBindings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bindings?scope=${scope}&scope_id=${scopeId}`);
      const data = await res.json();
      setBindings(data.bindings || []);
    } catch (error) {
      console.error('Failed to load bindings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async (bindingId: string) => {
    setRunningBindings(prev => new Set(prev).add(bindingId));
    try {
      await fetch(`/api/bindings/${bindingId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor: 'user',
          triggered_by: 'MANUAL'
        })
      });

      setTimeout(() => {
        loadBindings();
        setRunningBindings(prev => {
          const next = new Set(prev);
          next.delete(bindingId);
          return next;
        });
      }, 3000);
    } catch (error) {
      console.error('Failed to run binding:', error);
      setRunningBindings(prev => {
        const next = new Set(prev);
        next.delete(bindingId);
        return next;
      });
    }
  };

  const handleDelete = async (bindingId: string) => {
    if (!confirm('Are you sure you want to remove this binding?')) return;

    try {
      await fetch(`/api/bindings/${bindingId}`, { method: 'DELETE' });
      loadBindings();
    } catch (error) {
      console.error('Failed to delete binding:', error);
    }
  };

  const groupedBindings = {
    SOURCE: bindings.filter(b => b.role === 'SOURCE'),
    TARGET: bindings.filter(b => b.role === 'TARGET'),
    SUPPORTING: bindings.filter(b => b.role === 'SUPPORTING'),
    VALIDATION: bindings.filter(b => b.role === 'VALIDATION')
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Loading bindings...</div>;
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedBindings).map(([role, roleBindings]) => {
        if (roleBindings.length === 0) return null;
        return (
          <div key={role}>
            <h4 className="text-sm font-medium text-slate-700 mb-2">{role} Templates</h4>
            <div className="space-y-2">
              {roleBindings.map(binding => (
                <BindingCard
                  key={binding.id}
                  binding={binding}
                  onRun={() => handleRun(binding.id)}
                  onView={() => {}}
                  onConfigure={() => {}}
                  onDelete={() => handleDelete(binding.id)}
                  isRunning={runningBindings.has(binding.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {bindings.length === 0 && (
        <div className="text-center py-8 text-sm text-slate-500">
          No template bindings configured yet
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => setAddModalOpen(true)}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Template Binding
      </Button>

      <AddBindingModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        scope={scope}
        scopeId={scopeId}
        onAdded={loadBindings}
      />
    </div>
  );
}
