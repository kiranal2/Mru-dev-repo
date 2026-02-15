'use client';

import { useState, useMemo } from 'react';
import { Search, Download, AlertCircle, Clock, Ban, Link2 } from 'lucide-react';
import { LinkReconModal } from '@/components/modals/link-recon-modal';
import { QuickCreateTaskModal } from '@/components/modals/quick-create-task-modal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SavedViewsDropdown } from '@/components/workspace/saved-views-dropdown';
import { BindingsSection } from '@/components/workspace/bindings-section';
import { PersonaSwitcher, Persona } from '@/components/workspace/persona-switcher';
import {
  AccountantDashboard,
  ControllerDashboard,
  CFODashboard
} from '@/components/workspace/persona-dashboards';
import Breadcrumb from '@/components/layout/breadcrumb';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCloseTasks } from '@/hooks/data';
import type { CloseTask, CloseTaskFilters } from '@/lib/data/types';

export default function CloseWorkbenchPage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<CloseTask | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [linkReconOpen, setLinkReconOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState('');
  const [currentPersona, setCurrentPersona] = useState<Persona>('ACCOUNTANT');

  const [entity, setEntity] = useState('Consolidated');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filteredTasks, setFilteredTasks] = useState<CloseTask[]>([]);

  // Build filters for the hook
  const filters: CloseTaskFilters = useMemo(() => {
    const f: CloseTaskFilters = {
      page,
      pageSize,
      search: searchQuery || undefined,
      subsidiary: entity !== 'Consolidated' ? entity : undefined,
    };
    if (statusFilter !== 'ALL') f.status = [statusFilter];
    if (assigneeFilter !== 'ALL') f.assignedTo = assigneeFilter;
    return f;
  }, [page, pageSize, searchQuery, entity, statusFilter, assigneeFilter]);

  const { data: tasks, total, loading, error, refetch, updateTask } = useCloseTasks(filters);

  // Map CloseTask[] to the persona dashboard Task shape
  const dashboardTasks = useMemo(() =>
    tasks.map(t => ({
      id: t.id,
      status: t.status,
      priority: t.priority,
      assignee_id: t.assignedTo,
      due_date: t.dueDate,
      type: t.phase,
    })),
    [tasks]
  );

  // Compute KPIs from the tasks array
  const kpis = useMemo(() => {
    if (!tasks || tasks.length === 0) return null;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const totalCount = tasks.length;
    const progressPct = totalCount > 0 ? Math.round((completed / totalCount) * 100) : 0;
    const open = tasks.filter(t => t.status === 'Not Started' || t.status === 'In Progress').length;
    const today = new Date().toISOString().split('T')[0];
    const late = tasks.filter(t => t.dueDate < today && t.status !== 'Completed').length;
    const blocked = tasks.filter(t => t.status === 'Blocked').length;

    // Determine what's missing: look for required task phases that have no tasks in progress or completed
    const phases = new Set(tasks.map(t => t.phase));
    const whatsMissing: string[] = [];
    if (!phases.has('Pre-Close')) whatsMissing.push('Pre-Close');
    if (!phases.has('Core Close')) whatsMissing.push('Core Close');
    if (!phases.has('Post-Close')) whatsMissing.push('Post-Close');
    if (!phases.has('Reporting')) whatsMissing.push('Reporting');

    return { progressPct, open, late, blocked, whatsMissing };
  }, [tasks]);

  const handleRowClick = (task: CloseTask) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const handleTaskAction = async (taskId: string, updates: Partial<CloseTask>) => {
    try {
      const updated = await updateTask(taskId, updates);
      // If the drawer is showing this task, update the selected task state
      if (selectedTask?.id === taskId && updated) {
        setSelectedTask({ ...selectedTask, ...updates, updatedAt: new Date().toISOString() });
      }
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return;

    for (const id of Array.from(selectedIds)) {
      let updates: Partial<CloseTask> = {};
      if (action === 'READY') updates.status = 'In Progress';
      else if (action === 'CLOSED') updates.status = 'Completed';
      await handleTaskAction(id, updates);
    }
    setSelectedIds(new Set());
  };

  const handleBlockAction = async () => {
    if (!selectedTask || !blockReason) return;
    await handleTaskAction(selectedTask.id, {
      status: 'Blocked',
      notes: blockReason,
    });
    setBlockDialogOpen(false);
    setBlockReason('');
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
    if (selectedIds.size === tasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tasks.map(t => t.id)));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Not Started': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending Review': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Blocked': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'default';
    }
  };

  const calculateAging = (dueDate: string, status: string) => {
    if (status === 'Completed') return '—';
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return '—';
    return `${diff}d late`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const uniqueAssignees = Array.from(new Set(tasks.map(t => t.assignedTo).filter(Boolean)));

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Error loading close tasks</h2>
        <p className="text-sm text-slate-600 mb-4">{error}</p>
        <Button onClick={refetch}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white" style={{ height: '100%', minHeight: 0 }}>
      {/* Page Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="workbench/record-to-report/close" className="mb-1.5" />
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-[#000000] mt-2">Close</h1>
          <div className="flex items-center gap-3">
            <PersonaSwitcher
              currentPersona={currentPersona}
              onPersonaChange={setCurrentPersona}
            />
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
          </div>
        </div>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-4">

        {loading && !tasks.length ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-slate-500">Loading close tasks...</div>
          </div>
        ) : (
          <>
            {kpis && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full border-4 border-blue-500 flex items-center justify-center font-semibold text-sm">
                    {kpis.progressPct}%
                  </div>
                  <span className="text-sm text-slate-600">Progress</span>
                </div>
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setStatusFilter('Not Started')}
                >
                  <Clock className="w-3 h-3" />
                  Open: {kpis.open}
                </Badge>
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 text-red-600 border-red-200 cursor-pointer hover:bg-red-50 transition-colors"
                  onClick={() => {
                    setStatusFilter('ALL');
                    const today = new Date().toISOString().split('T')[0];
                    setFilteredTasks(tasks.filter(t => t.dueDate < today && t.status !== 'Completed'));
                  }}
                >
                  <AlertCircle className="w-3 h-3" />
                  Late: {kpis.late}
                </Badge>
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 text-orange-600 border-orange-200 cursor-pointer hover:bg-orange-50 transition-colors"
                  onClick={() => setStatusFilter('Blocked')}
                >
                  <Ban className="w-3 h-3" />
                  Blocked: {kpis.blocked}
                </Badge>
                {kpis.whatsMissing.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-700 font-medium">What's Missing:</span>
                    {kpis.whatsMissing.map((item) => (
                      <Badge
                        key={item}
                        variant="outline"
                        className="cursor-pointer text-amber-700 border-amber-300 hover:bg-amber-50 transition-colors"
                        onClick={() => {
                          setQuickCreateType(item);
                          setQuickCreateOpen(true);
                        }}
                      >
                        + {item}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="bg-white border-b border-slate-200 -mx-6 px-6 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <SavedViewsDropdown
                  workbenchType="close"
                  currentFilters={{ statusFilter, assigneeFilter, searchQuery }}
                  onApplyView={(filters) => {
                    if (filters.status) setStatusFilter(filters.status);
                    if (filters.assignee) setAssigneeFilter(filters.assignee);
                    if (filters.q) setSearchQuery(filters.q);
                  }}
                />
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Pending Review">Pending Review</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Assignees</SelectItem>
                    {uniqueAssignees.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
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
                <h3 className="font-semibold text-sm mb-2">SLA & Due Date Rules</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>* Tasks are marked <strong>Late</strong> when due_date is past and status is not CLOSED</li>
                  <li>* <strong>What's Missing</strong> checks for required task types: BANK Recon, AP Recon, AR Recon, and at least 1 JE in READY/IN_REVIEW/CLOSED status</li>
                  <li>* Progress is calculated as (closed_tasks / total_tasks) x 100</li>
                </ul>
              </Card>
            )}

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                {selectedIds.size === tasks.length && tasks.length > 0 ? 'Deselect All' : 'Select All'}
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        size="sm"
                        onClick={() => handleBulkAction('READY')}
                        disabled={selectedIds.size === 0}
                      >
                        Mark Ready ({selectedIds.size})
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {selectedIds.size === 0 && (
                    <TooltipContent>
                      <p>Select at least one task to mark as ready</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        size="sm"
                        onClick={() => handleBulkAction('CLOSED')}
                        disabled={selectedIds.size === 0}
                      >
                        Close ({selectedIds.size})
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {selectedIds.size === 0 && (
                    <TooltipContent>
                      <p>Select at least one task to close</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {currentPersona === 'ACCOUNTANT' && (
              <AccountantDashboard tasks={dashboardTasks} kpis={kpis} />
            )}
            {currentPersona === 'CONTROLLER' && (
              <ControllerDashboard tasks={dashboardTasks} kpis={kpis} />
            )}
            {currentPersona === 'CFO' && (
              <CFODashboard tasks={dashboardTasks} kpis={kpis} />
            )}

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-12"></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phase</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Subsidiary</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assignee</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Due</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aging</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {tasks.map((task) => (
                      <tr
                        key={task.id}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => handleRowClick(task)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(task.id)}
                            onCheckedChange={() => toggleSelection(task.id)}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{task.phase}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{task.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{task.subsidiary || '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{task.assignedTo || 'Unassigned'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{task.dueDate ? formatDate(task.dueDate) : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{calculateAging(task.dueDate, task.status)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={getPriorityBadge(task.priority)}>{task.priority}</Badge>
                        </td>
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
          {selectedTask && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedTask.name}</SheetTitle>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status}
                  </span>
                  <Badge variant={getPriorityBadge(selectedTask.priority)}>{selectedTask.priority}</Badge>
                </div>
              </SheetHeader>

              <Tabs defaultValue="details" className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="linked">Linked</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Phase</div>
                      <div className="text-sm font-medium">{selectedTask.phase}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Subsidiary</div>
                      <div className="text-sm font-medium">{selectedTask.subsidiary || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Assignee</div>
                      <div className="text-sm font-medium">{selectedTask.assignedTo || 'Unassigned'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Due Date</div>
                      <div className="text-sm font-medium">{selectedTask.dueDate ? formatDate(selectedTask.dueDate) : '—'}</div>
                    </div>
                  </div>
                  {selectedTask.description && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Description</div>
                      <div className="text-sm text-slate-700">{selectedTask.description}</div>
                    </div>
                  )}
                  {selectedTask.notes && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Notes / Blocking Reason</div>
                      <div className="text-sm text-red-600">{selectedTask.notes}</div>
                    </div>
                  )}
                  {selectedTask.checklist && selectedTask.checklist.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Checklist</div>
                      <ul className="text-sm text-slate-600 space-y-1">
                        {selectedTask.checklist.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Checkbox checked={item.checked} disabled />
                            <span className={item.checked ? 'line-through text-slate-400' : ''}>{item.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="text-xs text-slate-500 italic mt-4">
                    Data Template binding will appear here
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500">No activity yet</p>
                  </div>
                </TabsContent>

                <TabsContent value="linked" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">Reconciliation Link</div>
                        <Button size="sm" variant="outline" onClick={() => setLinkReconOpen(true)}>
                          <Link2 className="h-4 w-4 mr-1" />
                          Link
                        </Button>
                      </div>
                      <div className="text-sm text-slate-500 italic">
                        No reconciliation linked
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <div className="text-sm font-medium mb-3">Data Template Bindings</div>
                      {selectedTask && (
                        <BindingsSection
                          scope="TASK"
                          scopeId={selectedTask.id}
                          autoRefreshOnMount={false}
                        />
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <Button
                  onClick={() => handleTaskAction(selectedTask.id, { status: 'In Progress' })}
                  disabled={selectedTask.status === 'In Progress'}
                >
                  Mark Ready (R)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleTaskAction(selectedTask.id, { status: 'Pending Review' })}
                  disabled={selectedTask.status === 'Pending Review'}
                >
                  Send for Review (V)
                </Button>
                <Button
                  onClick={() => handleTaskAction(selectedTask.id, { status: 'Completed' })}
                  disabled={selectedTask.status === 'Completed'}
                >
                  Close (C)
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setBlockDialogOpen(true)}
                  disabled={selectedTask.status === 'Blocked'}
                >
                  Block (B)
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Task</DialogTitle>
            <DialogDescription>
              Provide a reason for blocking this task
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason" className="text-sm font-medium mb-2 block">
              Blocking Reason
            </Label>
            <Textarea
              id="reason"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="e.g., Waiting for vendor invoice..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBlockAction} disabled={!blockReason}>
              Block Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedTask && (
        <LinkReconModal
          open={linkReconOpen}
          onClose={() => setLinkReconOpen(false)}
          taskId={selectedTask.id}
          currentReconId={null}
          onLinked={() => {
            refetch();
            if (selectedTask) {
              handleRowClick(selectedTask);
            }
          }}
        />
      )}

      <QuickCreateTaskModal
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        worklistId="default"
        suggestedType={quickCreateType}
        onCreated={() => {
          refetch();
        }}
      />
        </div>
      </div>
    </div>
  );
}
