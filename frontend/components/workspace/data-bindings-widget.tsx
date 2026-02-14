"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Play, ArrowRight, Database, CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface TemplateExecution {
  id: string;
  template_id: string;
  status: string;
  started_at: string;
  ended_at?: string;
  row_count?: number;
  result_summary?: any;
  triggered_by: string;
  template?: {
    name: string;
    category?: string;
  };
  binding?: {
    scope: string;
    scope_id: string;
    role: string;
    auto_refresh: boolean;
  };
}

export function DataBindingsWidget() {
  const [executions, setExecutions] = useState<TemplateExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRecentExecutions();
  }, []);

  const fetchRecentExecutions = async () => {
    try {
      const res = await fetch('/api/executions/recent?limit=5');
      if (res.ok) {
        const data = await res.json();
        setExecutions(data.executions || []);
      }
    } catch (error) {
      console.error('Failed to fetch executions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRecentExecutions();
  };

  const getStatusIcon = (status: string) => {
    if (status === 'SUCCESS') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'FAILED') return <XCircle className="h-4 w-4 text-red-500" />;
    if (status === 'RUNNING') return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'SUCCESS') return 'bg-green-100 text-green-800';
    if (status === 'FAILED') return 'bg-red-100 text-red-800';
    if (status === 'RUNNING') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const then = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getRoleBadgeColor = (role?: string) => {
    if (!role) return 'bg-gray-100 text-gray-700';
    if (role === 'SOURCE') return 'bg-blue-100 text-blue-700';
    if (role === 'TARGET') return 'bg-purple-100 text-purple-700';
    if (role === 'SUPPORTING') return 'bg-green-100 text-green-700';
    if (role === 'VALIDATION') return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-sm text-slate-500">Loading template activity...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Template Activity
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link
              href="/automation/data-templates"
              className="text-sm font-normal text-[#6B7EF3] hover:text-[#5A6FE3] flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <div className="text-sm text-slate-500 py-4 text-center">
            No recent template activity. Templates will execute automatically when bound to tasks or reconciliations.
          </div>
        ) : (
          <div className="space-y-3">
            {executions.map((execution) => (
              <div
                key={execution.id}
                className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-slate-900">
                        {execution.template?.name || 'Template'}
                      </span>
                      {getStatusIcon(execution.status)}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {execution.binding?.role && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(execution.binding.role)}`}>
                          {execution.binding.role}
                        </span>
                      )}
                      {execution.template?.category && (
                        <Badge variant="outline" className="text-xs">
                          {execution.template.category}
                        </Badge>
                      )}
                      {execution.binding?.auto_refresh && (
                        <Badge variant="outline" className="text-xs text-blue-600">
                          Auto-refresh
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-2">
                  <div>
                    <span className="text-slate-500">Status:</span>
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(execution.status)}`}>
                      {execution.status}
                    </span>
                  </div>
                  {execution.row_count && (
                    <div>
                      <span className="text-slate-500">Output:</span>
                      <span className="ml-1 text-slate-900 font-medium">
                        {execution.row_count.toLocaleString()} rows
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Executed:</span>
                    <span className="ml-1 text-slate-900">
                      {formatTimeAgo(execution.started_at)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Triggered:</span>
                    <span className="ml-1 text-slate-900 capitalize">
                      {execution.triggered_by.toLowerCase()}
                    </span>
                  </div>
                </div>

                {execution.result_summary && (
                  <div className="text-xs text-slate-600 bg-white p-2 rounded border mt-2">
                    {Object.entries(execution.result_summary).slice(0, 3).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="font-medium">
                          {typeof value === 'number'
                            ? value.toLocaleString()
                            : String(value)
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {execution.binding && (
                  <div className="mt-2 pt-2 border-t flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      Bound to: {execution.binding.scope === 'TASK' ? 'Close Task' : 'Reconciliation'}
                    </div>
                    <Link
                      href={
                        execution.binding.scope === 'TASK'
                          ? '/workbench/close'
                          : '/workbench/reconciliation'
                      }
                      className="text-xs text-[#6B7EF3] hover:text-[#5A6FE3] flex items-center gap-1"
                    >
                      View
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
