"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";

interface Task {
  id: string;
  status: string;
  priority: string;
  assignee_id: string;
  due_date: string;
  type: string;
}

interface DashboardProps {
  tasks: Task[];
  kpis: {
    progressPct: number;
    open: number;
    late: number;
    blocked: number;
  } | null;
}

export function AccountantDashboard({ tasks, kpis }: DashboardProps) {
  const myTasks = tasks.filter(t => t.assignee_id === 'current_user');
  const completedToday = myTasks.filter(t => t.status === 'CLOSED').length;
  const dueToday = myTasks.filter(t => {
    const today = new Date().toISOString().split('T')[0];
    return t.due_date === today && t.status !== 'CLOSED';
  }).length;
  const highPriority = myTasks.filter(t => t.priority === 'HIGH' && t.status !== 'CLOSED').length;

  const tasksByType = tasks.reduce((acc, task) => {
    acc[task.type] = (acc[task.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topTaskTypes = Object.entries(tasksByType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-slate-600">My Tasks</div>
          <CheckCircle2 className="h-4 w-4 text-blue-500" />
        </div>
        <div className="text-2xl font-bold text-slate-900">{myTasks.length}</div>
        <div className="text-xs text-slate-500 mt-1">
          {completedToday} completed today
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-slate-600">Due Today</div>
          <Clock className="h-4 w-4 text-amber-500" />
        </div>
        <div className="text-2xl font-bold text-slate-900">{dueToday}</div>
        <div className="text-xs text-slate-500 mt-1">
          Requires immediate attention
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-slate-600">High Priority</div>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </div>
        <div className="text-2xl font-bold text-slate-900">{highPriority}</div>
        <div className="text-xs text-slate-500 mt-1">
          Critical items pending
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-slate-600">My Progress</div>
          <Target className="h-4 w-4 text-green-500" />
        </div>
        <div className="text-2xl font-bold text-slate-900">
          {myTasks.length > 0
            ? Math.round((completedToday / myTasks.length) * 100)
            : 0}%
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Completion rate
        </div>
      </Card>

      <Card className="p-4 md:col-span-2 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-slate-900">Task Breakdown by Type</div>
          <BarChart3 className="h-4 w-4 text-slate-400" />
        </div>
        <div className="space-y-3">
          {topTaskTypes.map(([type, count]) => {
            const pct = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
            return (
              <div key={type}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-700">{type}</span>
                  <span className="font-medium text-slate-900">{count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 md:col-span-2 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-slate-900">My Weekly Performance</div>
          <Activity className="h-4 w-4 text-slate-400" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-xs text-slate-500 mb-2">Tasks Completed</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{completedToday * 5}</span>
              <span className="text-sm text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                12%
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">vs last week</div>
          </div>
          <div className="flex-1 border-l pl-4">
            <div className="text-xs text-slate-500 mb-2">Avg. Completion Time</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">2.3</span>
              <span className="text-sm text-slate-600">days</span>
            </div>
            <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              8% faster
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function ControllerDashboard({ tasks, kpis }: DashboardProps) {
  const teamMembers = Array.from(new Set(tasks.map(t => t.assignee_id).filter(Boolean)));
  const avgTasksPerPerson = teamMembers.length > 0 ? Math.round(tasks.length / teamMembers.length) : 0;

  const statusBreakdown = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityBreakdown = tasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const teamPerformance = teamMembers.map(member => {
    const memberTasks = tasks.filter(t => t.assignee_id === member);
    const completed = memberTasks.filter(t => t.status === 'CLOSED').length;
    return {
      name: member,
      total: memberTasks.length,
      completed,
      pct: memberTasks.length > 0 ? Math.round((completed / memberTasks.length) * 100) : 0
    };
  }).sort((a, b) => b.pct - a.pct).slice(0, 5);

  const lateTasksByAssignee = tasks
    .filter(t => {
      const today = new Date().toISOString().split('T')[0];
      return t.due_date < today && t.status !== 'CLOSED';
    })
    .reduce((acc, task) => {
      acc[task.assignee_id] = (acc[task.assignee_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-slate-600">Team Size</div>
          <Users className="h-4 w-4 text-blue-500" />
        </div>
        <div className="text-2xl font-bold text-slate-900">{teamMembers.length}</div>
        <div className="text-xs text-slate-500 mt-1">
          Active team members
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-slate-600">Total Tasks</div>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </div>
        <div className="text-2xl font-bold text-slate-900">{tasks.length}</div>
        <div className="text-xs text-slate-500 mt-1">
          {avgTasksPerPerson} avg per person
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-slate-600">On Track</div>
          <Target className="h-4 w-4 text-green-500" />
        </div>
        <div className="text-2xl font-bold text-slate-900">{kpis?.progressPct || 0}%</div>
        <div className="text-xs text-slate-500 mt-1">
          Overall completion
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-slate-600">At Risk</div>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </div>
        <div className="text-2xl font-bold text-slate-900">{kpis?.late || 0}</div>
        <div className="text-xs text-slate-500 mt-1">
          Tasks overdue
        </div>
      </Card>

      <Card className="p-4 md:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-slate-900">Status Distribution</div>
          <PieChart className="h-4 w-4 text-slate-400" />
        </div>
        <div className="space-y-3">
          {Object.entries(statusBreakdown).map(([status, count]) => {
            const pct = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
            const colorClass =
              status === 'CLOSED' ? 'bg-green-500' :
              status === 'BLOCKED' ? 'bg-red-500' :
              status === 'IN_REVIEW' ? 'bg-amber-500' :
              status === 'READY' ? 'bg-blue-500' :
              'bg-slate-400';

            return (
              <div key={status}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-700">{status.replace('_', ' ')}</span>
                  <span className="font-medium text-slate-900">{count} ({Math.round(pct)}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`${colorClass} h-2 rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 md:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-slate-900">Team Performance</div>
          <BarChart3 className="h-4 w-4 text-slate-400" />
        </div>
        <div className="space-y-3">
          {teamPerformance.map((member, idx) => (
            <div key={member.name}>
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">#{idx + 1}</Badge>
                  <span className="text-slate-700 font-medium">{member.name}</span>
                </div>
                <span className="text-sm text-slate-600">
                  {member.completed}/{member.total} ({member.pct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${member.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 md:col-span-2 lg:col-span-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-slate-900">Priority Breakdown & Late Tasks</div>
          <Activity className="h-4 w-4 text-slate-400" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-xs text-slate-500 mb-3">By Priority</div>
            <div className="space-y-2">
              {Object.entries(priorityBreakdown).map(([priority, count]) => {
                const colorClass =
                  priority === 'HIGH' ? 'text-red-600' :
                  priority === 'MEDIUM' ? 'text-amber-600' :
                  'text-slate-600';

                return (
                  <div key={priority} className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${colorClass}`}>{priority}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-3">Late Tasks by Assignee</div>
            <div className="space-y-2">
              {Object.entries(lateTasksByAssignee).slice(0, 5).map(([assignee, count]) => (
                <div key={assignee} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">{assignee}</span>
                  <Badge variant="destructive">{count}</Badge>
                </div>
              ))}
              {Object.keys(lateTasksByAssignee).length === 0 && (
                <div className="text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  No late tasks
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function CFODashboard({ tasks, kpis }: DashboardProps) {
  const closedTasks = tasks.filter(t => t.status === 'CLOSED').length;
  const onTimeTasks = tasks.filter(t => {
    if (t.status !== 'CLOSED') return false;
    return new Date(t.due_date) >= new Date();
  }).length;
  const onTimeRate = closedTasks > 0 ? Math.round((onTimeTasks / closedTasks) * 100) : 0;

  const criticalAreas = [
    {
      name: 'Revenue Recognition',
      status: 'On Track',
      progress: 85,
      color: 'bg-green-500',
      icon: TrendingUp,
      risk: 'Low'
    },
    {
      name: 'AP Close',
      status: 'At Risk',
      progress: 45,
      color: 'bg-amber-500',
      icon: Clock,
      risk: 'Medium'
    },
    {
      name: 'Bank Reconciliation',
      status: 'Complete',
      progress: 100,
      color: 'bg-green-500',
      icon: CheckCircle2,
      risk: 'Low'
    },
    {
      name: 'Fixed Assets',
      status: 'Behind',
      progress: 30,
      color: 'bg-red-500',
      icon: AlertTriangle,
      risk: 'High'
    }
  ];

  const daysInPeriod = 30;
  const daysElapsed = Math.floor(kpis?.progressPct || 0 * daysInPeriod / 100);
  const projectedCloseDate = new Date();
  projectedCloseDate.setDate(projectedCloseDate.getDate() + (daysInPeriod - daysElapsed));

  return (
    <div className="space-y-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-slate-600">Close Progress</div>
            <Target className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-4xl font-bold text-slate-900 mb-2">{kpis?.progressPct || 0}%</div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
                style={{ width: `${kpis?.progressPct || 0}%` }}
              />
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {closedTasks} of {tasks.length} tasks complete
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-slate-600">On-Time Rate</div>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-4xl font-bold text-slate-900 mb-2">{onTimeRate}%</div>
          <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
            <TrendingUp className="h-4 w-4" />
            <span>5% vs last month</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {onTimeTasks} tasks completed on time
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-slate-600">Projected Close</div>
            <Calendar className="h-5 w-5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-2">
            {projectedCloseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-1 text-sm text-amber-600 mt-1">
            <Clock className="h-4 w-4" />
            <span>2 days ahead of target</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Based on current velocity
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-slate-600">Risk Score</div>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="text-4xl font-bold text-amber-600 mb-2">Medium</div>
          <div className="text-xs text-slate-600 mt-1">
            {kpis?.blocked || 0} blocked items
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Requires management attention
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Critical Area Status</h3>
            <p className="text-sm text-slate-500 mt-1">High-level view of key close activities</p>
          </div>
          <Activity className="h-5 w-5 text-slate-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {criticalAreas.map((area) => {
            const Icon = area.icon;
            return (
              <div key={area.name} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium text-slate-900 mb-1">{area.name}</div>
                    <Badge
                      variant={
                        area.risk === 'Low' ? 'default' :
                        area.risk === 'Medium' ? 'secondary' :
                        'destructive'
                      }
                      className="text-xs"
                    >
                      {area.risk} Risk
                    </Badge>
                  </div>
                  <Icon className={`h-5 w-5 ${
                    area.progress === 100 ? 'text-green-500' :
                    area.progress >= 70 ? 'text-blue-500' :
                    area.progress >= 50 ? 'text-amber-500' :
                    'text-red-500'
                  }`} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{area.status}</span>
                    <span className="font-semibold text-slate-900">{area.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`${area.color} h-2 rounded-full transition-all`}
                      style={{ width: `${area.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Close Velocity Trend</h3>
            <p className="text-sm text-slate-500 mt-1">Task completion over time</p>
          </div>
          <TrendingUp className="h-5 w-5 text-green-500" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center border-r">
            <div className="text-3xl font-bold text-slate-900">127</div>
            <div className="text-xs text-slate-500 mt-1">Tasks This Month</div>
            <div className="text-sm text-green-600 mt-2 flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +15% vs last month
            </div>
          </div>
          <div className="flex-1 text-center border-r">
            <div className="text-3xl font-bold text-slate-900">3.2</div>
            <div className="text-xs text-slate-500 mt-1">Days Avg Close Time</div>
            <div className="text-sm text-green-600 mt-2 flex items-center justify-center gap-1">
              <TrendingDown className="h-3 w-3" />
              -12% improvement
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-3xl font-bold text-slate-900">98%</div>
            <div className="text-xs text-slate-500 mt-1">Quality Score</div>
            <div className="text-sm text-green-600 mt-2 flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +2% improvement
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
