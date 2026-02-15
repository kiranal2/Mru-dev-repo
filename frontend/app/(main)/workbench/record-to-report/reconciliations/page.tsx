'use client';

import { useState, useMemo } from 'react';
import { Search, Download, Play, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SavedViewsDropdown } from '@/components/workspace/saved-views-dropdown';
import { BindingsSection } from '@/components/workspace/bindings-section';
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
import Breadcrumb from '@/components/layout/breadcrumb';

import { useReconciliations } from '@/hooks/data';
import type { Reconciliation, ReconFilters } from '@/lib/data/types';

export default function ReconciliationWorkbenchPage() {
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

  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    area: 'Bank',
    name: '',
    owner_id: '',
    threshold_abs: 1000,
    threshold_pct: 1.0
  });

  // Build filters for the hook
  const filters: ReconFilters = useMemo(() => {
    const f: ReconFilters = {
      page,
      pageSize,
      search: searchQuery || undefined,
    };
    if (areaFilter !== 'ALL') f.type = [areaFilter];
    if (statusFilter !== 'ALL') f.status = [statusFilter];
    return f;
  }, [page, pageSize, searchQuery, areaFilter, statusFilter]);

  const { data: recons, total, loading, error, refetch } = useReconciliations(filters);

  // Compute totals from the recons array
  const totals = useMemo(() => {
    if (!recons || recons.length === 0) return null;
    return {
      open: recons.filter(r => r.status === 'Not Started' || r.status === 'In Progress').length,
      atRisk: recons.filter(r => r.status === 'Exceptions').length,
      readyForReview: recons.filter(r => r.status === 'Matched').length,
      closed: recons.filter(r => r.status === 'Completed').length,
    };
  }, [recons]);

  const handleRowClick = (recon: Reconciliation) => {
    setSelectedRecon(recon);
    setDrawerOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedRecon) return;

    if (confirmAction === 'CLOSE') {
      if (selectedRecon.unmatchedRecords > 0) {
        alert('Cannot close: there are unmatched records. Override not implemented in this demo.');
        setConfirmOpen(false);
        return;
      }
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
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Not Started': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Matched': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Progress': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Exceptions': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isAtRisk = (recon: Reconciliation) => {
    return recon.status === 'Exceptions' || recon.unmatchedRecords > 0;
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Error loading reconciliations</h2>
        <p className="text-sm text-slate-600 mb-4">{error}</p>
        <Button onClick={refetch}>Retry</Button>
      </div>
    );
  }

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

        {loading && !recons.length ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-slate-500">Loading reconciliations...</div>
          </div>
        ) : (
          <>
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
                    <SelectItem value="Bank">Bank</SelectItem>
                    <SelectItem value="Intercompany">Intercompany</SelectItem>
                    <SelectItem value="Subledger">Subledger</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Matched">Matched</SelectItem>
                    <SelectItem value="Exceptions">Exceptions</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
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
                  <li>* <strong>Match Rate</strong> = (matchedRecords / totalSourceRecords) x 100</li>
                  <li>* <strong>Exception Amount</strong> = total monetary value of unmatched items</li>
                  <li>* <strong>At Risk</strong> when status is Exceptions or unmatched records exist</li>
                  <li>* Example: If 950 of 1,000 source records matched, match rate = 95%</li>
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
                        onClick={() => {
                          // Bulk run is a no-op until a run method is added to the data layer
                          setSelectedIds(new Set());
                        }}
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned To</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Source Records</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Target Records</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Match Rate</th>
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
                        <td className="px-4 py-3 text-sm text-slate-600">{recon.type}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{recon.assignedTo || 'Unassigned'}</td>
                        <td className="px-4 py-3 text-sm text-slate-900">{recon.totalSourceRecords.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-slate-900">{recon.totalTargetRecords.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          <span className={isAtRisk(recon) ? 'text-red-600' : 'text-green-600'}>
                            {recon.matchRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getStatusColor(recon.status)}`}>
                            {recon.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{formatDate(recon.lastRunAt || '')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          </>
        )}

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
                  <Badge variant="secondary">{selectedRecon.type}</Badge>
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
                      <div className="text-xs text-slate-500 mb-1">Type</div>
                      <div className="text-sm font-medium">{selectedRecon.type}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Period End</div>
                      <div className="text-sm font-medium">{selectedRecon.periodEnd}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Source System</div>
                      <div className="text-sm font-medium">{selectedRecon.sourceSystem}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Target System</div>
                      <div className="text-sm font-medium">{selectedRecon.targetSystem}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Assigned To</div>
                      <div className="text-sm font-medium">{selectedRecon.assignedTo || 'Unassigned'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Match Rate</div>
                      <div className="text-sm font-medium">{selectedRecon.matchRate}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Source Records</div>
                      <div className="text-sm font-medium">{selectedRecon.totalSourceRecords.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Target Records</div>
                      <div className="text-sm font-medium">{selectedRecon.totalTargetRecords.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Matched</div>
                      <div className="text-sm font-medium">{selectedRecon.matchedRecords.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Unmatched</div>
                      <div className={`text-sm font-medium ${selectedRecon.unmatchedRecords > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {selectedRecon.unmatchedRecords.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Exception Amount</div>
                      <div className={`text-sm font-medium ${selectedRecon.exceptionAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(selectedRecon.exceptionAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Last Run</div>
                      <div className="text-sm font-medium">{formatDate(selectedRecon.lastRunAt || '')}</div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="runs" className="mt-4">
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500">No runs yet</p>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500">No activity yet</p>
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
                  onClick={() => {
                    // Run is a no-op until a run method is added to the data layer
                  }}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Now (U)
                </Button>
                <Button
                  variant="secondary"
                  disabled={selectedRecon.status === 'Matched'}
                >
                  Mark Reviewed (M)
                </Button>
                <Button
                  onClick={() => {
                    setConfirmAction('CLOSE');
                    setConfirmOpen(true);
                  }}
                  disabled={selectedRecon.status === 'Completed'}
                >
                  Close (C)
                </Button>
                <Button
                  variant="outline"
                  disabled={selectedRecon.status === 'Not Started'}
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
                <Label className="text-sm font-medium mb-2 block">Type</Label>
                <Select value={wizardData.area} onValueChange={(v) => setWizardData({ ...wizardData, area: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank">Bank</SelectItem>
                    <SelectItem value="Intercompany">Intercompany</SelectItem>
                    <SelectItem value="Subledger">Subledger</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
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
              <Button
                onClick={() => {
                  // Create is a no-op until a create method is added to the data layer
                  setWizardOpen(false);
                  setWizardStep(1);
                  setWizardData({
                    area: 'Bank',
                    name: '',
                    owner_id: '',
                    threshold_abs: 1000,
                    threshold_pct: 1.0
                  });
                  refetch();
                }}
                disabled={!wizardData.name}
              >
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
