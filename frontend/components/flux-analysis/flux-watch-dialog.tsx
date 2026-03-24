"use client";

import { useMemo, useState, useCallback } from "react";
import type { FluxRow } from "@/lib/data/types/flux-analysis";
import { statusClass } from "@/app/(main)/reports/analysis/flux-analysis/helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Bell, Eye, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ─────────────────────────── Props ─────────────────────────── */

interface FluxWatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRows: FluxRow[];
  bsRows: FluxRow[];
  defaultPeriodLabel: string;
  ownerOptions: string[];
}

/* ─────────────────────────── Component ─────────────────────────── */

export function FluxWatchDialog({
  open,
  onOpenChange,
  isRows,
  bsRows,
  defaultPeriodLabel,
  ownerOptions,
}: FluxWatchDialogProps) {
  /* ── Derived data (stable across renders) ── */

  const sortedIsRows = useMemo(
    () =>
      [...isRows].sort((a, b) =>
        a.acct.localeCompare(b.acct, undefined, { numeric: true })
      ),
    [isRows]
  );

  const sortedBsRows = useMemo(
    () =>
      [...bsRows].sort((a, b) =>
        a.acct.localeCompare(b.acct, undefined, { numeric: true })
      ),
    [bsRows]
  );

  const allWatchRows = useMemo(
    () => [...sortedIsRows, ...sortedBsRows],
    [sortedIsRows, sortedBsRows]
  );

  const defaultSelectedIds = useMemo(
    () =>
      allWatchRows
        .filter((row) => row.status !== "Closed")
        .map((row) => row.id),
    [allWatchRows]
  );

  const watchRecipientOptions = useMemo(() => {
    const unique = new Set(["Controller", "FP&A", ...ownerOptions]);
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [ownerOptions]);

  const defaultRecipients = useMemo(() => {
    const preferred = ["Controller", "FP&A"].filter((p) =>
      watchRecipientOptions.includes(p)
    );
    return preferred.length ? preferred : watchRecipientOptions.slice(0, 2);
  }, [watchRecipientOptions]);

  /* ── Ephemeral form state ── */

  const [watchName, setWatchName] = useState("");
  const [watchThresholdType, setWatchThresholdType] = useState<
    "variance_pct" | "variance_amount"
  >("variance_pct");
  const [watchThresholdValue, setWatchThresholdValue] = useState("5");
  const [watchFrequency, setWatchFrequency] = useState("daily");
  const [watchNotifyVia, setWatchNotifyVia] = useState("email");
  const [watchSelectedIds, setWatchSelectedIds] = useState<string[]>([]);
  const [watchRecipients, setWatchRecipients] = useState<string[]>([]);

  const watchSelectedSet = useMemo(
    () => new Set(watchSelectedIds),
    [watchSelectedIds]
  );

  /* ── Reset state on open ── */

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setWatchName(`Flux Watch — ${defaultPeriodLabel}`);
        setWatchThresholdType("variance_pct");
        setWatchThresholdValue("5");
        setWatchFrequency("daily");
        setWatchNotifyVia("email");
        setWatchSelectedIds(defaultSelectedIds);
        setWatchRecipients(defaultRecipients);
      }
      onOpenChange(nextOpen);
    },
    [defaultPeriodLabel, defaultSelectedIds, defaultRecipients, onOpenChange]
  );

  /* ── Toggle helpers ── */

  const toggleWatchAccount = useCallback(
    (id: string, shouldInclude: boolean) => {
      setWatchSelectedIds((prev) => {
        if (shouldInclude) {
          if (prev.includes(id)) return prev;
          return [...prev, id];
        }
        return prev.filter((v) => v !== id);
      });
    },
    []
  );

  const toggleWatchRecipient = useCallback((recipient: string) => {
    setWatchRecipients((prev) =>
      prev.includes(recipient)
        ? prev.filter((v) => v !== recipient)
        : [...prev, recipient]
    );
  }, []);

  /* ── Create handler ── */

  const handleCreateWatch = useCallback(() => {
    if (!watchName.trim()) {
      toast.error("Watch name is required");
      return;
    }
    if (!watchSelectedIds.length) {
      toast.error("Select at least one account to monitor");
      return;
    }
    if (!watchRecipients.length) {
      toast.error("Select at least one recipient");
      return;
    }
    toast.success(
      `Watch "${watchName}" created for ${watchSelectedIds.length} accounts`
    );
    onOpenChange(false);
  }, [watchName, watchSelectedIds, watchRecipients, onOpenChange]);

  /* ── Render helpers ── */

  const renderAccountRows = (rows: FluxRow[]) =>
    rows.map((row) => {
      const isSelected = watchSelectedSet.has(row.id);
      return (
        <div
          key={row.id}
          className="flex cursor-pointer items-center gap-2.5 border-b border-slate-100 px-3 py-2 hover:bg-slate-50"
          onClick={() => toggleWatchAccount(row.id, !isSelected)}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) =>
              toggleWatchAccount(row.id, Boolean(checked))
            }
            onClick={(e) => e.stopPropagation()}
          />
          <span className="w-14 font-mono text-xs text-slate-400">
            {row.acct}
          </span>
          <span className="text-xs text-slate-800">{row.name}</span>
          <Badge
            className={cn(
              "ml-auto border text-[10px]",
              statusClass(row.status)
            )}
          >
            {row.status}
          </Badge>
        </div>
      );
    });

  /* ── JSX ── */

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[88vh] gap-3 overflow-y-auto p-4 sm:max-w-[700px]">
        <DialogHeader className="space-y-1 pr-8">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Eye className="h-4.5 w-4.5 text-slate-700" />
            Create Watch
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600">
            Monitor accounts for variance changes and get notified when
            thresholds are breached.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Watch Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-800">
              Watch Name
            </Label>
            <Input
              value={watchName}
              onChange={(e) => setWatchName(e.target.value)}
              className="h-9 text-sm"
              placeholder="Flux Watch — Q3 2025"
            />
          </div>

          {/* Accounts to Monitor */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-xs font-semibold text-slate-800">
                Accounts to Monitor
              </Label>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
                <button
                  type="button"
                  className="hover:text-slate-900"
                  onClick={() =>
                    setWatchSelectedIds(allWatchRows.map((row) => row.id))
                  }
                >
                  Select all
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  className="hover:text-slate-900"
                  onClick={() =>
                    setWatchSelectedIds(
                      allWatchRows
                        .filter((row) => row.status !== "Closed")
                        .map((row) => row.id)
                    )
                  }
                >
                  Open only
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  className="hover:text-slate-900"
                  onClick={() => setWatchSelectedIds([])}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="max-h-[220px] overflow-y-auto">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold tracking-wide text-slate-500">
                  INCOME STATEMENT
                </div>
                {renderAccountRows(sortedIsRows)}

                <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold tracking-wide text-slate-500">
                  BALANCE SHEET
                </div>
                {renderAccountRows(sortedBsRows)}
              </div>
            </div>

            <p className="text-xs text-slate-500">
              {watchSelectedIds.length} of {allWatchRows.length} accounts
              selected
            </p>
          </div>

          {/* Alert Threshold */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-800">
              Alert Threshold
            </Label>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
              <Select
                value={watchThresholdType}
                onValueChange={(value) =>
                  setWatchThresholdType(
                    value as "variance_pct" | "variance_amount"
                  )
                }
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="variance_pct">Variance %</SelectItem>
                  <SelectItem value="variance_amount">
                    Variance Amount
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Input
                  type="number"
                  value={watchThresholdValue}
                  onChange={(e) => setWatchThresholdValue(e.target.value)}
                  className="h-9 pr-10 text-sm"
                  min="0"
                  step={
                    watchThresholdType === "variance_pct" ? "0.1" : "0.1"
                  }
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  {watchThresholdType === "variance_pct" ? "%" : "M"}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Alert when any monitored account variance exceeds{" "}
              {watchThresholdValue || "0"}
              {watchThresholdType === "variance_pct" ? "%" : "M"}.
            </p>
          </div>

          {/* Frequency + Notify Via */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-800">
                Check Frequency
              </Label>
              <Select value={watchFrequency} onValueChange={setWatchFrequency}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-800">
                Notify Via
              </Label>
              <Select value={watchNotifyVia} onValueChange={setWatchNotifyVia}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <span className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </span>
                  </SelectItem>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="teams">Teams</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-800">
              Recipients
            </Label>
            <div className="flex flex-wrap gap-2">
              {watchRecipientOptions.map((recipient) => {
                const selected = watchRecipients.includes(recipient);
                return (
                  <button
                    type="button"
                    key={recipient}
                    onClick={() => toggleWatchRecipient(recipient)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      selected
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {recipient}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <Button
              variant="outline"
              className="h-9 px-5 text-sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="h-9 bg-primary px-5 text-sm text-white hover:bg-primary/90"
              onClick={handleCreateWatch}
            >
              <Bell className="mr-2 h-4 w-4" />
              Create Watch ({watchSelectedIds.length} accounts)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
