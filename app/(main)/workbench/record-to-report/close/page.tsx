'use client';

import { useState, useEffect } from 'react';
import { Search, Download, ChevronDown, X, AlertCircle, CheckCircle2, Clock, Ban, Link2 } from 'lucide-react';
import { LinkReconModal } from '@/components/modals/LinkReconModal';
import { QuickCreateTaskModal } from '@/components/modals/QuickCreateTaskModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SavedViewsDropdown } from '@/components/workspace/SavedViewsDropdown';
import { BindingsSection } from '@/components/workspace/BindingsSection';
import { PersonaSwitcher, Persona } from '@/components/workspace/PersonaSwitcher';
import {
  AccountantDashboard,
  ControllerDashboard,
  CFODashboard
} from '@/components/workspace/PersonaDashboards';
import Breadcrumb from '@/components/layout/Breadcrumb';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Task {
  id: string;
  worklist_id: string;
  title: string;
  type: string;
  fsli: string;
  assignee_id: string;
  due_date: string;
  status: string;
  priority: string;
  blocking_reason: string;
  created_at: string;
  updated_at: string;
  linked_recon_id?: string | null;
  events?: Event[];
}

interface Event {
  id: string;
  type: string;
  message: string;
  actor: string;
  created_at: string;
}

interface KPIs {
  progressPct: number;
  open: number;
  late: number;
  blocked: number;
  whatsMissing: string[];
}

export default function CloseWorkbenchPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [worklistId, setWorklistId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
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
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchWorklist();
  }, [entity, period]);

  useEffect(() => {
    if (worklistId) {
      fetchTasks();
    }
  }, [worklistId, statusFilter, assigneeFilter, searchQuery, page, pageSize]);

  const fetchWorklist = async () => {
    try {
      const res = await fetch(`/api/close/worklist?entity=${entity}&period=${period}`);
      const data = await res.json();
      if (data.worklist) {
        setWorklistId(data.worklist.id);
      }
      setKpis(data.kpis);
    } catch (error) {
      console.error('Error fetching worklist:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams({
        worklist_id: worklistId,
        page: page.toString(),
        pageSize: pageSize.toString()
      });
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (assigneeFilter !== 'ALL') params.append('assignee', assigneeFilter);
      if (searchQuery) params.append('q', searchQuery);

      const res = await fetch(`/api/close/tasks?${params}`);
      const data = await res.json();
      setTasks(data.tasks || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleRowClick = async (task: Task) => {
    try {
      const res = await fetch(`/api/close/tasks/${task.id}`);
      const data = await res.json();
      setSelectedTask(data);
      setDrawerOpen(true);
    } catch (error) {
      console.error('Error fetching task details:', error);
    }
  };

  const handleTaskAction = async (taskId: string, updates: any) => {
    try {
      await fetch(`/api/close/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      fetchTasks();
      fetchWorklist();
      if (selectedTask?.id === taskId) {
        const res = await fetch(`/api/close/tasks/${taskId}`);
        const data = await res.json();
        setSelectedTask(data);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return;

    for (const id of Array.from(selectedIds)) {
      let updates: any = {};
      if (action === 'READY') updates.status = 'READY';
      else if (action === 'CLOSED') updates.status = 'CLOSED';
      await handleTaskAction(id, updates);
    }
    setSelectedIds(new Set());
  };

  const handleBlockAction = async () => {
    if (!selectedTask || !blockReason) return;
    await handleTaskAction(selectedTask.id, {
      status: 'BLOCKED',
      blocking_reason: blockReason
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
      case 'CLOSED': return 'bg-green-100 text-green-800 border-green-200';
      case 'OPEN': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'READY': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_REVIEW': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'BLOCKED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'default';
    }
  };

  const calculateAging = (dueDate: string, status: string) => {
    if (status === 'CLOSED') return '—';
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

  const uniqueAssignees = Array.from(new Set(tasks.map(t => t.assignee_id).filter(Boolean)));

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
              onClick={() => setStatusFilter('OPEN')}
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
                setFilteredTasks(tasks.filter(t => t.due_date < today && t.status !== 'CLOSED'));
              }}
            >
              <AlertCircle className="w-3 h-3" />
              Late: {kpis.late}
            </Badge>
            <Badge
              variant="outline"
              className="flex items-center gap-1 text-orange-600 border-orange-200 cursor-pointer hover:bg-orange-50 transition-colors"
              onClick={() => setStatusFilter('BLOCKED')}
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
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="READY">Ready</SelectItem>
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
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
              <li>• Tasks are marked <strong>Late</strong> when due_date is past and status is not CLOSED</li>
              <li>• <strong>What's Missing</strong> checks for required task types: BANK Recon, AP Recon, AR Recon, and at least 1 JE in READY/IN_REVIEW/CLOSED status</li>
              <li>• Progress is calculated as (closed_tasks / total_tasks) × 100</li>
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
          <AccountantDashboard tasks={tasks} kpis={kpis} />
        )}
        {currentPersona === 'CONTROLLER' && (
          <ControllerDashboard tasks={tasks} kpis={kpis} />
        )}
        {currentPersona === 'CFO' && (
          <CFODashboard tasks={tasks} kpis={kpis} />
        )}

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-12"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">FSLI/Area</th>
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
                    <td className="px-4 py-3 text-sm text-slate-600">{task.type}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{task.title}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{task.fsli || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{task.assignee_id || 'Unassigned'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{task.due_date ? formatDate(task.due_date) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{calculateAging(task.due_date, task.status)}</td>
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

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[600px] sm:w-[600px] overflow-y-auto">
          {selectedTask && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedTask.title}</SheetTitle>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status.replace('_', ' ')}
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
                      <div className="text-xs text-slate-500 mb-1">Type</div>
                      <div className="text-sm font-medium">{selectedTask.type}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">FSLI/Area</div>
                      <div className="text-sm font-medium">{selectedTask.fsli || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Assignee</div>
                      <div className="text-sm font-medium">{selectedTask.assignee_id || 'Unassigned'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Due Date</div>
                      <div className="text-sm font-medium">{selectedTask.due_date ? formatDate(selectedTask.due_date) : '—'}</div>
                    </div>
                  </div>
                  {selectedTask.blocking_reason && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Blocking Reason</div>
                      <div className="text-sm text-red-600">{selectedTask.blocking_reason}</div>
                    </div>
                  )}
                  <div className="text-xs text-slate-500 italic mt-4">
                    Data Template binding will appear here
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                  <div className="space-y-3">
                    {selectedTask.events && selectedTask.events.length > 0 ? (
                      selectedTask.events.map((event) => (
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

                <TabsContent value="linked" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">Reconciliation Link</div>
                        <Button size="sm" variant="outline" onClick={() => setLinkReconOpen(true)}>
                          <Link2 className="h-4 w-4 mr-1" />
                          {selectedTask.linked_recon_id ? 'Change' : 'Link'}
                        </Button>
                      </div>
                      {selectedTask.linked_recon_id ? (
                        <div className="rounded-lg border bg-blue-50 p-3">
                          <div className="text-sm font-medium text-blue-900 mb-1">
                            Linked to Reconciliation
                          </div>
                          <div className="text-xs text-blue-700">
                            ID: {selectedTask.linked_recon_id}
                          </div>
                          <div className="text-xs text-blue-600 mt-2">
                            Auto-sync: When reconciliation is READY/CLOSED, this task will update to COMPLETED
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 italic">
                          No reconciliation linked
                        </div>
                      )}
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
                  onClick={() => handleTaskAction(selectedTask.id, { status: 'READY' })}
                  disabled={selectedTask.status === 'READY'}
                >
                  Mark Ready (R)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleTaskAction(selectedTask.id, { status: 'IN_REVIEW' })}
                  disabled={selectedTask.status === 'IN_REVIEW'}
                >
                  Send for Review (V)
                </Button>
                <Button
                  onClick={() => handleTaskAction(selectedTask.id, { status: 'CLOSED' })}
                  disabled={selectedTask.status === 'CLOSED'}
                >
                  Close (C)
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setBlockDialogOpen(true)}
                  disabled={selectedTask.status === 'BLOCKED'}
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
          currentReconId={selectedTask.linked_recon_id}
          onLinked={() => {
            fetchTasks();
            if (selectedTask) {
              handleRowClick(selectedTask);
            }
          }}
        />
      )}

      {worklistId && (
        <QuickCreateTaskModal
          open={quickCreateOpen}
          onClose={() => setQuickCreateOpen(false)}
          worklistId={worklistId}
          suggestedType={quickCreateType}
          onCreated={() => {
            fetchTasks();
            fetchWorklist();
          }}
        />
      )}
        </div>
      </div>
    </div>
  );
}
