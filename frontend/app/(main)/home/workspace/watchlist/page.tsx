"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  Eye,
  RefreshCw,
  Bell,
  BellOff,
  Edit,
  Trash2,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  WatchItem,
  formatCurrency,
  formatTimeAgo,
  getWatchTypeLabel,
  computeWatchValue,
  evaluateThreshold,
} from "@/lib/watch-utils";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Breadcrumb from "@/components/layout/breadcrumb";
import { useWatchlist } from "@/hooks/data";
import type { WatchlistItem as DataWatchlistItem } from "@/lib/data/types";

/** Transform a data-layer WatchlistItem into the WatchItem shape used by UI components */
function transformToWatchItem(item: DataWatchlistItem): WatchItem {
  const thresholdValue = item.threshold ?? 0;
  const currentVal = typeof item.currentValue === 'number'
    ? item.currentValue
    : parseFloat(String(item.currentValue)) || 0;

  let status: WatchItem['status'] = 'ok';
  if (item.status === 'Alert') status = 'breached';
  else if (item.status === 'Warning') status = 'breached';
  else status = 'ok';

  return {
    id: item.id,
    title: item.label,
    watch_type: 'ar_open_amount',
    entity_id: item.entityId,
    entity_name: item.entityType || item.module,
    params: { status: item.status },
    operator: item.thresholdDirection === 'below' ? '<' : '>',
    threshold_value: thresholdValue,
    metric: {
      agg: 'sum',
      field: 'amount',
      label: item.description || item.label,
      where: {},
    },
    bucket: null,
    currency: 'USD',
    last_value: currentVal,
    last_evaluated_at: item.lastChecked,
    status,
    notify_channels: ['in_app'],
    recipients: null,
    is_active: true,
    created_at: item.createdAt,
    updated_at: item.lastChecked,
  };
}

function WatchlistPageContent() {
  const { data: rawWatchlist, loading: hookLoading, error: hookError, removeItem } = useWatchlist();

  // Transform data-layer items into WatchItem shape for UI
  const initialWatches = useMemo(() => rawWatchlist.map(transformToWatchItem), [rawWatchlist]);

  const [watches, setWatches] = useState<WatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);

  // Sync hook data into local state for mutation support
  useEffect(() => {
    if (!hookLoading) {
      setWatches(initialWatches);
    }
  }, [initialWatches, hookLoading]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#watch-")) {
      setTimeout(() => {
        const element = document.getElementById(hash.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-2", "ring-blue-400", "ring-offset-2");
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-blue-400", "ring-offset-2");
          }, 2000);
        }
      }, 100);
    }
  }, []);

  const handleCheckNow = async (watchId: string) => {
    setChecking(watchId);
    try {
      const watch = watches.find((w) => w.id === watchId);
      if (!watch) return;

      const value = watch.last_value || 0;

      const response = await fetch(`/api/watchlist/${watchId}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });

      if (response.ok) {
        const updatedWatch = await response.json();
        setWatches(watches.map((w) => (w.id === watchId ? updatedWatch : w)));

        if (updatedWatch.event_type === "breached") {
          toast.error(`Watch breached — ${watch.title}`, {
            description: `Current ${watch.metric.label}: ${formatCurrency(value)} (threshold ${watch.operator} ${formatCurrency(watch.threshold_value)})`,
            action: {
              label: "View",
              onClick: () => {
                const element = document.getElementById(`watch-${watchId}`);
                if (element) element.scrollIntoView({ behavior: "smooth" });
              },
            },
          });
        } else if (updatedWatch.event_type === "resolved") {
          toast.success(`Watch resolved — ${watch.title}`);
        } else {
          toast.success("Watch checked successfully");
        }
      }
    } catch (error) {
      console.error("Error checking watch:", error);
      toast.error("Failed to check watch");
    } finally {
      setChecking(null);
    }
  };

  const handleMute = async (watchId: string) => {
    try {
      const watch = watches.find((w) => w.id === watchId);
      if (!watch) return;

      const newStatus = watch.status === "muted" ? "ok" : "muted";

      const response = await fetch(`/api/watchlist/${watchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updated = await response.json();
        setWatches(watches.map((w) => (w.id === watchId ? updated : w)));
        toast.success(newStatus === "muted" ? "Watch muted" : "Watch unmuted");
      }
    } catch (error) {
      console.error("Error toggling mute:", error);
      toast.error("Failed to update watch");
    }
  };

  const handleDelete = async (watchId: string) => {
    if (!confirm("Are you sure you want to delete this watch?")) return;

    try {
      const response = await fetch(`/api/watchlist/${watchId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setWatches(watches.filter((w) => w.id !== watchId));
        toast.success("Watch deleted");
      }
    } catch (error) {
      console.error("Error deleting watch:", error);
      toast.error("Failed to delete watch");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
        return "bg-green-500";
      case "breached":
        return "bg-red-500";
      case "muted":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case "ok":
        return "#10b981"; // green-500
      case "breached":
        return "#ef4444"; // red-500
      case "muted":
        return "#9ca3af"; // gray-400
      default:
        return "#9ca3af"; // gray-400
    }
  };

  if (loading || hookLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (hookError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {hookError}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      {/* Header with Breadcrumb and Title */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="home/workspace/watchlist" className="mb-1.5" />
        <div className="flex items-center gap-3 mb-1">
          <Eye className="h-6 w-6 text-slate-700" />
          <h1 className="text-2xl font-bold text-[#000000] mt-2">Watchlist</h1>
        </div>
        <p className="text-sm text-[#606060]">Monitor key metrics with threshold-based alerts</p>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>
      <div className="flex-1 overflow-auto">
        <div className="w-full px-6 py-6">
          {watches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Eye className="h-16 w-16 text-slate-300 mb-4" />
              <h2 className="text-xl font-semibold text-slate-700 mb-2">No Watchlist Items yet</h2>
              <p className="text-slate-600 max-w-md">
                Set up threshold-based alerts to automatically monitor important metrics and get
                notified when they exceed your defined limits.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {watches.map((watch) => (
                <Card
                  key={watch.id}
                  id={`watch-${watch.id}`}
                  className="transition-all duration-200 border"
                  style={{
                    borderColor: getBorderColor(watch.status),
                    borderWidth: "1px",
                  }}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(watch.status)}`}
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">{watch.title}</div>
                          <div className="text-sm font-normal text-slate-500 mt-1">
                            {watch.entity_name}
                          </div>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getWatchTypeLabel(watch.watch_type, watch.bucket)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {watch.operator} {formatCurrency(watch.threshold_value)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        As of {watch.params.as_of || "N/A"}
                      </Badge>
                    </div>

                    <div>
                      <div className="text-2xl font-semibold text-slate-900">
                        {watch.last_value !== null && watch.last_value !== undefined
                          ? formatCurrency(watch.last_value)
                          : "N/A"}
                      </div>
                      {watch.last_evaluated_at && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 cursor-help">
                                <Clock className="h-3 w-3" />
                                Checked {formatTimeAgo(watch.last_evaluated_at)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {new Date(watch.last_evaluated_at).toLocaleString()}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleCheckNow(watch.id)}
                        disabled={checking === watch.id}
                      >
                        <RefreshCw
                          className={`h-3 w-3 ${checking === watch.id ? "animate-spin" : ""}`}
                        />
                        Check now
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleMute(watch.id)}
                      >
                        {watch.status === "muted" ? (
                          <>
                            <Bell className="h-3 w-3" /> Unmute
                          </>
                        ) : (
                          <>
                            <BellOff className="h-3 w-3" /> Mute
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleDelete(watch.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return <WatchlistPageContent />;
}
