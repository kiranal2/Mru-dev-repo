"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { CheckSquare, ArrowRight, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Badge } from '../ui/badge';

const taskStatusData = [
  { name: 'Completed', value: 68, color: '#22C55E' },
  { name: 'In Progress', value: 22, color: '#3B82F6' },
  { name: 'Overdue', value: 10, color: '#EF4444' }
];

const overdueTasksData = [
  {
    id: 'WL-001',
    description: 'Verify Q4 bank reconcil...',
    assignee: 'Sarah Chen',
    due: '1/20/2025',
    priority: 'High'
  },
  {
    id: 'WL-002',
    description: 'Review Tesla cash flow...',
    assignee: 'Mike Johnson',
    due: '1/21/2025',
    priority: 'Medium'
  },
  {
    id: 'WL-003',
    description: 'Complete Apple accrua...',
    assignee: 'Lisa Wang',
    due: '1/22/2025',
    priority: 'High'
  },
  {
    id: 'WL-004',
    description: 'Update Amazon revenue...',
    assignee: 'David Kim',
    due: '1/23/2025',
    priority: 'Low'
  }
];

const priorityColors = {
  High: 'bg-red-100 text-red-700 border-red-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Low: 'bg-green-100 text-green-700 border-green-200'
};

export function WorklistManagementSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-semibold text-slate-900">Worklist Management</span>
          <Link
            href="#"
            className="text-sm font-normal text-slate-600 hover:text-slate-900 flex items-center gap-1"
          >
            <CheckSquare className="h-4 w-4" />
            Manage Tasks
            <ArrowRight className="h-3 w-3" />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Task Status Overview</h3>
          <div className="flex items-center gap-8">
            <div className="flex justify-center">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 space-y-3">
              {taskStatusData.map((status, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-sm text-slate-700">{status.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{status.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Top Overdue Tasks</h3>
            <Link
              href="#"
              className="text-xs text-slate-600 hover:text-slate-900"
            >
              View All
            </Link>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold text-slate-700">ID</TableHead>
                  <TableHead className="font-semibold text-slate-700">Description</TableHead>
                  <TableHead className="font-semibold text-slate-700">Assignee</TableHead>
                  <TableHead className="font-semibold text-slate-700">Due</TableHead>
                  <TableHead className="font-semibold text-slate-700">Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueTasksData.map((task) => (
                  <TableRow key={task.id} className="hover:bg-slate-50">
                    <TableCell>
                      <Link
                        href="#"
                        className="text-[#6B7EF3] hover:text-[#5A6FE3] font-medium text-sm"
                      >
                        {task.id}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-slate-900">{task.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <User className="h-3 w-3" />
                        {task.assignee}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Clock className="h-3 w-3 text-red-500" />
                        {task.due}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${priorityColors[task.priority as keyof typeof priorityColors]} text-xs`}
                      >
                        {task.priority}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
