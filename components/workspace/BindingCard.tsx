"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Eye, Settings, Trash2, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Binding {
  id: string;
  template_id: string;
  role: string;
  auto_refresh: boolean;
  display_name: string;
  template?: {
    id: string;
    name: string;
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

interface BindingCardProps {
  binding: Binding;
  onRun: () => void;
  onView: () => void;
  onConfigure: () => void;
  onDelete: () => void;
  isRunning?: boolean;
}

export function BindingCard({
  binding,
  onRun,
  onView,
  onConfigure,
  onDelete,
  isRunning = false
}: BindingCardProps) {
  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      SOURCE: "bg-blue-100 text-blue-800",
      TARGET: "bg-purple-100 text-purple-800",
      SUPPORTING: "bg-green-100 text-green-800",
      VALIDATION: "bg-orange-100 text-orange-800"
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status?: string) => {
    if (isRunning) return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    if (!status) return <Clock className="h-4 w-4 text-gray-400" />;
    if (status === 'SUCCESS') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'FAILED') return <XCircle className="h-4 w-4 text-red-500" />;
    return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
  };

  const execution = binding.latest_execution && binding.latest_execution.length > 0 
    ? binding.latest_execution[0] 
    : undefined;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadge(binding.role)}`}>
              {binding.role}
            </span>
            {binding.auto_refresh && (
              <Badge variant="outline" className="text-xs">
                Auto-refresh
              </Badge>
            )}
          </div>
          <h4 className="font-semibold text-slate-900">
            {binding.display_name || binding.template?.name}
          </h4>
          {binding.template?.description && (
            <p className="text-xs text-slate-600 mt-1">{binding.template.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {getStatusIcon(execution?.status)}
        </div>
      </div>

      {execution && (
        <div className="border-t pt-3 mb-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-xs text-slate-500">Last Run</div>
              <div className="font-medium text-slate-900 text-xs">
                {formatDate(execution.started_at)}
              </div>
            </div>
            {execution.row_count && (
              <div>
                <div className="text-xs text-slate-500">Output</div>
                <div className="font-medium text-slate-900 text-xs">
                  {execution.row_count.toLocaleString()} rows
                </div>
              </div>
            )}
            {execution.execution_time_ms && (
              <div>
                <div className="text-xs text-slate-500">Duration</div>
                <div className="font-medium text-slate-900 text-xs">
                  {(execution.execution_time_ms / 1000).toFixed(1)}s
                </div>
              </div>
            )}
            {execution.result_summary?.total_balance && (
              <div>
                <div className="text-xs text-slate-500">Balance</div>
                <div className="font-medium text-slate-900 text-xs">
                  ${execution.result_summary.total_balance.toLocaleString()}
                </div>
              </div>
            )}
          </div>
          {execution.error_message && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
              {execution.error_message}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={onRun}
          disabled={isRunning}
          className="flex-1"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-3 w-3 mr-1" />
              Run
            </>
          )}
        </Button>
        {execution && (
          <Button size="sm" variant="outline" onClick={onView}>
            <Eye className="h-3 w-3" />
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onConfigure}>
          <Settings className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="outline" onClick={onDelete} className="text-red-600 hover:text-red-700">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
}
