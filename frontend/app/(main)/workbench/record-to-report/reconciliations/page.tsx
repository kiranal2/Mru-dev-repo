'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Play, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import { ExplainPanel } from '@/components/workspace/ExplainPanel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SavedViewsDropdown } from '@/components/workspace/SavedViewsDropdown';
import { BindingsSection } from '@/components/workspace/BindingsSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import Breadcrumb from '@/components/layout/Breadcrumb';

interface Reconciliation {
  id: string;
  entity: string;
  period: string;
  area: string;
  name: string;
  owner_id: string;
  status: string;
  threshold_abs: number;
  threshold_pct: number;
  last_run_at: string;
  variance: number;
  balance_a: number;
  balance_b: number;
  events?: Event[];
  runs?: Run[];
}

interface Run {
  id: string;
  reconciliation_id: string;
  started_at: string;
  ended_at: string;
  status: string;
  row_count: number;
  variance: number;
  balance_a: number;
  balance_b: number;
  result_url: string;
  error_text: string;
  created_by: string;
  created_at: string;
  threshold_abs?: number;
  threshold_pct?: number;
  effective_threshold?: number;
  outcome?: string;
  actor?: string;
}

interface Event {
  id: string;
  type: string;
  message: string;
  actor: string;
  created_at: string;
}

interface Totals {
  open: number;
  atRisk: number;
  readyForReview: number;
  closed: number;
}

export default function ReconciliationWorkbenchPage() {
  const [recons, setRecons] = useState<Reconciliation[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedRecon, setSelectedRecon] = useState<Reconciliation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string>('');
  const [compareToBaseline, setCompareToBaseline] = useState(false);

  const [entity, setEntity] = useState('Consolidated');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [areaFilter, setAreaFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    area: 'BANK',
    name: '',
    owner_id: '',
    threshold_abs: 1000,
    threshold_pct: 1.0
  });

  useEffect(() => {
    fetchRecons();
  }, [entity, period, areaFilter, statusFilter, searchQuery, page, pageSize]);

  const fetchRecons = async () => {
    try {
      const params = new URLSearchParams({
        entity,
        period,
        page: page.toString(),
        pageSize: pageSize.toString()
      });
      if (areaFilter !== 'ALL') params.append('area', areaFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchQuery) params.append('q', searchQuery);

      const res = await fetch(`/api/recons?${params}`);
      const data = await res.json();
      setRecons(data.reconciliations || []);
      setTotal(data.total || 0);
      setTotals(data.totals);
    } catch (error) {
      console.error('Error fetching reconciliations:', error);
    }
  };

  const handleRowClick = async (recon: Reconciliation) => {
    try {
      const res = await fetch(`/api/recons/${recon.id}`);
      const data = await res.json();
      setSelectedRecon(data);
      setDrawerOpen(true);
    } catch (error) {
      console.error('Error fetching reconciliation details:', error);
    }
  };

  const handleReconAction = async (reconId: string, updates: any) => {
    try {
      await fetch(`/api/recons/${reconId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      fetchRecons();
      if (selectedRecon?.id === reconId) {
        const res = await fetch(`/api/recons/${reconId}`);
        const data = await res.json();
        setSelectedRecon(data);
      }
    } catch (error) {
      console.error('Error updating reconciliation:', error);
    }
  };

  const handleRunRecon = async (reconId: string) => {
    try {
      await fetch(`/api/recons/${reconId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ created_by: 'system' })
      });

      setTimeout(() => {
        fetchRecons();
        if (selectedRecon?.id === reconId) {
          handleRowClick(selectedRecon);
        }
      }, 3000);
    } catch (error) {
      console.error('Error running reconciliation:', error);
    }
  };

  const handleBulkRun = async () => {
    if (selectedIds.size === 0) return;
    for (const id of Array.from(selectedIds)) {
      await handleRunRecon(id);
    }
    setSelectedIds(new Set());
  };

  const handleWizardSubmit = async () => {
    try {
      await fetch('/api/recons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...wizardData,
          entity,
          period
        })
      });
      setWizardOpen(false);
      setWizardStep(1);
      setWizardData({
        area: 'BANK',
        name: '',
        owner_id: '',
        threshold_abs: 1000,
        threshold_pct: 1.0
      });
      fetchRecons();
    } catch (error) {
      console.error('Error creating reconciliation:', error);
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedRecon) return;

    if (confirmAction === 'CLOSE') {
      const threshold = Math.max(
        selectedRecon.threshold_abs,
        (selectedRecon.threshold_pct / 100) * Math.abs(selectedRecon.balance_b)
      );

      if (Math.abs(selectedRecon.variance) > threshold) {
        alert('Cannot close: variance exceeds threshold. Override not implemented in this demo.');
        setConfirmOpen(false);
        return;
      }

      await handleReconAction(selectedRecon.id, { status: 'CLOSED' });
    }

    setConfirmOpen(false);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === recons.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(recons.map(r => r.id)));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CLOSED': return 'bg-green-100 text-green-800 border-green-200';
      case 'OPEN': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'READY': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REVIEWED': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isAtRisk = (recon: Reconciliation) => {
    const threshold = Math.max(
      recon.threshold_abs,
      (recon.threshold_pct / 100) * Math.abs(recon.balance_b)
    );
    return Math.abs(recon.variance) > threshold;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col bg-white" style={{ height: '100%', minHeight: 0 }}>
      {/* Page Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="workbench/record-to-report/reconciliations" className="mb-1.5" />
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-[#000000] mt-2">Reconciliations</h1>
          <div className="flex items-center gap-3">
            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Consolidated">Consolidated</SelectItem>
                <SelectItem value="US">US</SelectItem>
                <SelectItem value="EU">EU</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-40"
            />
            <div className="flex items-center gap-2 border-l pl-3">
              <label className="text-sm text-slate-600 cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={compareToBaseline}
                  onChange={(e) => setCompareToBaseline(e.target.checked)}
                  className="rounded"
                />
                Compare to Baseline
              </label>
            </div>
          </div>
        </div>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-4">

        {totals && (
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              Open: {totals.open}
            </Badge>
            <Badge variant="outline" className="text-red-600 border-red-200">
              <AlertTriangle className="w-3 h-3 mr-1" />
              At Risk: {totals.atRisk}
            </Badge>
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              Ready for Review: {totals.readyForReview}
            </Badge>
            <Badge variant="outline" className="text-green-600 border-green-200">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Closed: {totals.closed}
            </Badge>
          </div>
        )}

        <div className="bg-white border-b border-slate-200 -mx-6 px-6 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <SavedViewsDropdown
              workbenchType="reconciliation"
              currentFilters={{ statusFilter, areaFilter, searchQuery }}
              onApplyView={(filters) => {
                if (filters.status) setStatusFilter(filters.status);
                if (filters.area) setAreaFilter(filters.area);
                if (filters.q) setSearchQuery(filters.q);
              }}
            />
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search reconciliations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Areas</SelectItem>
                <SelectItem value="BANK">Bank</SelectItem>
                <SelectItem value="AP">AP</SelectItem>
                <SelectItem value="AR">AR</SelectItem>
                <SelectItem value="INTERCO">Intercompany</SelectItem>
                <SelectItem value="ACCRUALS">Accruals</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="READY">Ready</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setExplainOpen(!explainOpen)}>
              Explain (E)
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {explainOpen && (
          <Card className="p-4 mb-3 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-sm mb-2">Variance & Threshold Formula</h3>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• <strong>variance</strong> = |balance_a - balance_b|</li>
              <li>• <strong>threshold</strong> = max(threshold_abs, threshold_pct × balance_b)</li>
              <li>• <strong>At Risk</strong> when variance &gt; threshold</li>
              <li>• Example: If threshold_abs = $1,000 and threshold_pct = 1%, with balance_b = $100,000, then threshold = max($1,000, $1,000) = $1,000</li>
            </ul>
          </Card>
        )}

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleSelectAll}>
            {selectedIds.size === recons.length && recons.length > 0 ? 'Deselect All' : 'Select All'}
          </Button>
          <Button
            size="sm"
            onClick={() => setWizardOpen(true)}
          >
            New Reconciliation
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    size="sm"
                    onClick={handleBulkRun}
                    disabled={selectedIds.size === 0}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Run Selected ({selectedIds.size})
                  </Button>
                </span>
              </TooltipTrigger>
              {selectedIds.size === 0 && (
                <TooltipContent>
                  <p>Select at least one reconciliation to run</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-12"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Area</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Balance A</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Balance B</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Variance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Run</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {recons.map((recon) => (
                  <tr
                    key={recon.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(recon)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(recon.id)}
                        onCheckedChange={() => toggleSelection(recon.id)}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {recon.name}
                      {isAtRisk(recon) && (
                        <AlertTriangle className="w-4 h-4 inline ml-2 text-red-500" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{recon.area}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{recon.owner_id || 'Unassigned'}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{formatCurrency(recon.balance_a)}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{formatCurrency(recon.balance_b)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      <span className={isAtRisk(recon) ? 'text-red-600' : 'text-green-600'}>
                        {formatCurrency(recon.variance)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getStatusColor(recon.status)}`}>
                        {recon.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(recon.last_run_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[600px] sm:w-[600px] overflow-y-auto">
          {selectedRecon && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedRecon.name}</SheetTitle>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getStatusColor(selectedRecon.status)}`}>
                    {selectedRecon.status}
                  </span>
                  <Badge variant="secondary">{selectedRecon.area}</Badge>
                  {isAtRisk(selectedRecon) && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      At Risk
                    </Badge>
                  )}
                </div>
              </SheetHeader>

              <Tabs defaultValue="details" className="mt-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="runs">Runs</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="binding">Binding</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Entity</div>
                      <div className="text-sm font-medium">{selectedRecon.entity}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Period</div>
                      <div className="text-sm font-medium">{selectedRecon.period}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Area</div>
                      <div className="text-sm font-medium">{selectedRecon.area}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Owner</div>
                      <div className="text-sm font-medium">{selectedRecon.owner_id || 'Unassigned'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Threshold (Abs)</div>
                      <div className="text-sm font-medium">{formatCurrency(selectedRecon.threshold_abs)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Threshold (%)</div>
                      <div className="text-sm font-medium">{selectedRecon.threshold_pct}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Balance A (Source)</div>
                      <div className="text-sm font-medium">{formatCurrency(selectedRecon.balance_a)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Balance B (Target)</div>
                      <div className="text-sm font-medium">{formatCurrency(selectedRecon.balance_b)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Variance</div>
                      <div className={`text-sm font-medium ${isAtRisk(selectedRecon) ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(selectedRecon.variance)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Last Run</div>
                      <div className="text-sm font-medium">{formatDate(selectedRecon.last_run_at)}</div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <ExplainPanel
                      title="Threshold Calculation Explained"
                      variance={selectedRecon.variance}
                      thresholdAbs={selectedRecon.threshold_abs}
                      thresholdPct={selectedRecon.threshold_pct}
                      balanceA={selectedRecon.balance_a}
                      balanceB={selectedRecon.balance_b}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="runs" className="mt-4">
                  <div className="space-y-3">
                    {selectedRecon.runs && selectedRecon.runs.length > 0 ? (
                      selectedRecon.runs.map((run) => {
                        const getOutcomeBadge = (outcome: string) => {
                          if (outcome === 'PASS') return 'bg-green-100 text-green-800';
                          if (outcome === 'FAIL') return 'bg-red-100 text-red-800';
                          return 'bg-gray-100 text-gray-800';
                        };

                        return (
                          <Card key={run.id} className="p-4 border-2">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge variant={run.status === 'SUCCEEDED' ? 'default' : run.status === 'RUNNING' ? 'secondary' : 'destructive'}>
                                  {run.status}
                                </Badge>
                                {run.outcome && (
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getOutcomeBadge(run.outcome)}`}>
                                    {run.outcome}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500">{formatDate(run.started_at)}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                              <div>
                                <span className="text-slate-500">Balance A:</span>
                                <div className="font-medium">{formatCurrency(run.balance_a)}</div>
                              </div>
                              <div>
                                <span className="text-slate-500">Balance B:</span>
                                <div className="font-medium">{formatCurrency(run.balance_b)}</div>
                              </div>
                              <div>
                                <span className="text-slate-500">Variance:</span>
                                <div className={`font-medium ${run.outcome === 'FAIL' ? 'text-red-600' : 'text-green-600'}`}>
                                  {formatCurrency(run.variance)}
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-500">Rows:</span>
                                <div className="font-medium">{run.row_count.toLocaleString()}</div>
                              </div>
                            </div>

                            {(run.threshold_abs || run.threshold_pct || run.effective_threshold) && (
                              <div className="border-t pt-2 mt-2">
                                <div className="text-xs text-slate-500 mb-1">Threshold Calculation</div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  {run.threshold_abs && (
                                    <div>
                                      <span className="text-slate-500">Abs:</span> {formatCurrency(run.threshold_abs)}
                                    </div>
                                  )}
                                  {run.threshold_pct && (
                                    <div>
                                      <span className="text-slate-500">Pct:</span> {run.threshold_pct}%
                                    </div>
                                  )}
                                  {run.effective_threshold && (
                                    <div>
                                      <span className="text-slate-500">Effective:</span> {formatCurrency(run.effective_threshold)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {run.actor && (
                              <div className="text-xs text-slate-500 mt-2">
                                Run by {run.actor}
                              </div>
                            )}

                            {run.result_url && (
                              <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                                Open result
                              </Button>
                            )}
                          </Card>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-500">No runs yet</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                  <div className="space-y-3">
                    {selectedRecon.events && selectedRecon.events.length > 0 ? (
                      selectedRecon.events.map((event) => (
                        <div key={event.id} className="flex gap-3 pb-3 border-b border-slate-200 last:border-0">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-slate-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-slate-900">{event.type.replace('_', ' ')}</span>
                              <span className="text-xs text-slate-500">{formatDate(event.created_at)}</span>
                            </div>
                            <p className="text-sm text-slate-600">{event.message}</p>
                            {event.actor && <p className="text-xs text-slate-500 mt-1">By {event.actor}</p>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No activity yet</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="binding" className="mt-4">
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-blue-50 p-3">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">How Bindings Work</h4>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li><strong>SOURCE:</strong> Provides Balance A (primary data source)</li>
                        <li><strong>TARGET:</strong> Provides Balance B (comparison source)</li>
                        <li><strong>SUPPORTING:</strong> Additional detail or drill-down data</li>
                        <li><strong>VALIDATION:</strong> Quality checks or exception reports</li>
                      </ul>
                    </div>
                    {selectedRecon && (
                      <BindingsSection
                        scope="RECONCILIATION"
                        scopeId={selectedRecon.id}
                        autoRefreshOnMount={true}
                      />
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <Button
                  onClick={() => handleRunRecon(selectedRecon.id)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Now (U)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleReconAction(selectedRecon.id, { status: 'REVIEWED' })}
                  disabled={selectedRecon.status === 'REVIEWED'}
                >
                  Mark Reviewed (M)
                </Button>
                <Button
                  onClick={() => {
                    setConfirmAction('CLOSE');
                    setConfirmOpen(true);
                  }}
                  disabled={selectedRecon.status === 'CLOSED'}
                >
                  Close (C)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleReconAction(selectedRecon.id, { status: 'OPEN' })}
                  disabled={selectedRecon.status === 'OPEN'}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reopen (O)
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Reconciliation - Step {wizardStep} of 3</DialogTitle>
            <DialogDescription>
              {wizardStep === 1 && 'Select the reconciliation type and area'}
              {wizardStep === 2 && 'Enter basic information'}
              {wizardStep === 3 && 'Configure control thresholds'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {wizardStep === 1 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Area</Label>
                <Select value={wizardData.area} onValueChange={(v) => setWizardData({ ...wizardData, area: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANK">Bank</SelectItem>
                    <SelectItem value="AP">AP vs GL</SelectItem>
                    <SelectItem value="AR">AR</SelectItem>
                    <SelectItem value="INTERCO">Intercompany</SelectItem>
                    <SelectItem value="ACCRUALS">Accruals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium mb-2 block">Name</Label>
                  <Input
                    id="name"
                    value={wizardData.name}
                    onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                    placeholder="e.g., Operating Account Reconciliation"
                  />
                </div>
                <div>
                  <Label htmlFor="owner" className="text-sm font-medium mb-2 block">Owner</Label>
                  <Input
                    id="owner"
                    value={wizardData.owner_id}
                    onChange={(e) => setWizardData({ ...wizardData, owner_id: e.target.value })}
                    placeholder="e.g., sarah.accountant"
                  />
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="threshold_abs" className="text-sm font-medium mb-2 block">Absolute Threshold ($)</Label>
                  <Input
                    id="threshold_abs"
                    type="number"
                    value={wizardData.threshold_abs}
                    onChange={(e) => setWizardData({ ...wizardData, threshold_abs: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="threshold_pct" className="text-sm font-medium mb-2 block">Percentage Threshold (%)</Label>
                  <Input
                    id="threshold_pct"
                    type="number"
                    step="0.1"
                    value={wizardData.threshold_pct}
                    onChange={(e) => setWizardData({ ...wizardData, threshold_pct: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {wizardStep > 1 && (
              <Button variant="outline" onClick={() => setWizardStep(wizardStep - 1)}>
                Back
              </Button>
            )}
            {wizardStep < 3 ? (
              <Button onClick={() => setWizardStep(wizardStep + 1)}>
                Next
              </Button>
            ) : (
              <Button onClick={handleWizardSubmit} disabled={!wizardData.name}>
                Create Reconciliation
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              {confirmAction === 'CLOSE' && 'Are you sure you want to close this reconciliation?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAction}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
}
