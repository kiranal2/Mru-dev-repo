"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ClipboardList,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  ArrowRight,
  MessageSquare,
  ListTodo,
  Flame,
} from "lucide-react";

interface WorkItem {
  id: string;
  title: string;
  description: string;
  module: "Cash Application" | "Reconciliation" | "Close" | "Revenue" | "AP";
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Pending Review" | "Resolved";
  assignee: string;
  createdDate: string;
  dueDate: string;
  age: string;
  comments: { author: string; text: string; date: string }[];
  relatedItems: string[];
}

const MOCK_WORKLIST: WorkItem[] = [
  {
    id: "WRK-4501",
    title: "Unmatched payment from Acme Corp - $45,230.00",
    description: "Payment received on 02/14 does not match any open invoice. Customer reference indicates PO-8812 but no corresponding invoice found. Possible short payment or unapplied credit.",
    module: "Cash Application",
    priority: "High",
    status: "Open",
    assignee: "Sarah Chen",
    createdDate: "2026-02-14",
    dueDate: "2026-02-17",
    age: "2 days",
    comments: [
      { author: "AI Agent", text: "Detected potential match with INV-7723 ($45,180.00) — $50 variance. Recommend review.", date: "2026-02-14 10:30 AM" },
      { author: "Sarah Chen", text: "Checking with customer for remittance details.", date: "2026-02-15 09:15 AM" },
    ],
    relatedItems: ["PAY-9912", "INV-7723"],
  },
  {
    id: "WRK-4502",
    title: "Bank reconciliation variance - Chase Operating Account",
    description: "Auto-reconciliation completed with 3 unmatched bank transactions totaling $12,450.87. Manual review required for clearing items.",
    module: "Reconciliation",
    priority: "Medium",
    status: "In Progress",
    assignee: "John Smith",
    createdDate: "2026-02-16",
    dueDate: "2026-02-18",
    age: "0 days",
    comments: [
      { author: "AI Agent", text: "3 items flagged: 2 appear to be timing differences, 1 requires investigation.", date: "2026-02-16 06:30 AM" },
    ],
    relatedItems: ["RECON-0045"],
  },
  {
    id: "WRK-4503",
    title: "Intercompany balance mismatch - Entity US01 vs UK03",
    description: "Intercompany elimination shows $234,500 variance between US01 payable and UK03 receivable. FX rate difference suspected.",
    module: "Close",
    priority: "Critical",
    status: "Open",
    assignee: "Mike Johnson",
    createdDate: "2026-02-15",
    dueDate: "2026-02-16",
    age: "1 day",
    comments: [
      { author: "AI Agent", text: "FX rate used by UK03 (1.2645) differs from corporate rate (1.2680). Variance: $234,500 × 0.28% = $656.60 residual.", date: "2026-02-15 07:00 PM" },
      { author: "Mike Johnson", text: "Confirmed FX rate issue. Need to rerun UK03 with corporate rate.", date: "2026-02-16 08:30 AM" },
    ],
    relatedItems: ["CLOSE-FEB-2026", "IC-ELIM-0023"],
  },
  {
    id: "WRK-4504",
    title: "Revenue leakage detected - Contract C-4421 undercharged",
    description: "AI analysis detected that contract C-4421 (TechPro Services) has been billing at old rate ($8,500/mo) instead of renewed rate ($9,200/mo) for 3 months.",
    module: "Revenue",
    priority: "High",
    status: "Pending Review",
    assignee: "Lisa Wang",
    createdDate: "2026-02-13",
    dueDate: "2026-02-17",
    age: "3 days",
    comments: [
      { author: "AI Agent", text: "Total undercharge: $2,100. Recommend retroactive billing adjustment and system rate update.", date: "2026-02-13 02:00 PM" },
      { author: "Lisa Wang", text: "Drafted credit memo and rebill. Pending manager approval.", date: "2026-02-14 11:00 AM" },
      { author: "AI Agent", text: "Similar pattern detected for 2 other contracts. Created WRK-4510, WRK-4511.", date: "2026-02-15 08:00 AM" },
    ],
    relatedItems: ["CASE-0087", "C-4421"],
  },
  {
    id: "WRK-4505",
    title: "Duplicate vendor invoice - VendorPay INV-33201",
    description: "Potential duplicate detected: INV-33201 matches INV-32998 from same vendor (amounts $18,750 match, dates 5 days apart).",
    module: "AP",
    priority: "High",
    status: "Open",
    assignee: "David Park",
    createdDate: "2026-02-16",
    dueDate: "2026-02-17",
    age: "0 days",
    comments: [
      { author: "AI Agent", text: "Confidence: 94% duplicate. Same vendor, same amount, similar description. Payment hold recommended.", date: "2026-02-16 09:00 AM" },
    ],
    relatedItems: ["INV-33201", "INV-32998"],
  },
  {
    id: "WRK-4506",
    title: "Month-end accrual review - February utilities",
    description: "Automated accrual estimate for February utilities is $47,200 based on 12-month average. Requires controller sign-off.",
    module: "Close",
    priority: "Medium",
    status: "Pending Review",
    assignee: "Sarah Chen",
    createdDate: "2026-02-15",
    dueDate: "2026-02-28",
    age: "1 day",
    comments: [
      { author: "AI Agent", text: "Estimate within 5% of last 3-month average ($46,100). No anomalies detected.", date: "2026-02-15 05:00 PM" },
    ],
    relatedItems: ["ACCR-FEB-UTIL"],
  },
];

export default function WorklistPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);

  const filtered = MOCK_WORKLIST.filter((w) => {
    const matchSearch =
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchModule = moduleFilter === "all" || w.module === moduleFilter;
    const matchPriority = priorityFilter === "all" || w.priority === priorityFilter;
    const matchStatus = statusFilter === "all" || w.status === statusFilter;
    return matchSearch && matchModule && matchPriority && matchStatus;
  });

  const openCount = MOCK_WORKLIST.filter((w) => w.status === "Open").length;
  const criticalCount = MOCK_WORKLIST.filter((w) => w.priority === "Critical").length;
  const inProgressCount = MOCK_WORKLIST.filter((w) => w.status === "In Progress").length;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Critical":
        return <Badge className="bg-red-50 text-red-700 border-red-200"><Flame className="w-3 h-3 mr-1" />Critical</Badge>;
      case "High":
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200">High</Badge>;
      case "Medium":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Medium</Badge>;
      case "Low":
        return <Badge className="bg-gray-50 text-gray-500 border-gray-200">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Open</Badge>;
      case "In Progress":
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200">In Progress</Badge>;
      case "Pending Review":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Pending Review</Badge>;
      case "Resolved":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Worklist</h1>
          <p className="text-sm text-gray-500 mt-1">Unified task inbox — exceptions and action items across all modules</p>
        </div>
        <Button className="bg-[#1B2A41] hover:bg-[#2d4a6f] text-white">
          <ClipboardList className="w-4 h-4 mr-2" />
          Create Work Item
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 stagger-children">
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{MOCK_WORKLIST.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <ListTodo className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Open</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{openCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Critical</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{criticalCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <Flame className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">In Progress</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{inProgressCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search work items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            <SelectItem value="Cash Application">Cash Application</SelectItem>
            <SelectItem value="Reconciliation">Reconciliation</SelectItem>
            <SelectItem value="Close">Close</SelectItem>
            <SelectItem value="Revenue">Revenue</SelectItem>
            <SelectItem value="AP">AP</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Pending Review">Pending Review</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((w) => (
              <TableRow
                key={w.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedItem(w)}
              >
                <TableCell className="font-mono text-sm">{w.id}</TableCell>
                <TableCell>
                  <p className="font-medium text-gray-900 max-w-xs truncate">{w.title}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{w.module}</Badge>
                </TableCell>
                <TableCell>{getPriorityBadge(w.priority)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <User className="w-3.5 h-3.5" />
                    {w.assignee}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-500">{w.age}</TableCell>
                <TableCell className="text-sm text-gray-500">{w.dueDate}</TableCell>
                <TableCell>{getStatusBadge(w.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedItem && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                  {selectedItem.id}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedItem.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    {getPriorityBadge(selectedItem.priority)}
                    {getStatusBadge(selectedItem.status)}
                    <Badge variant="outline">{selectedItem.module}</Badge>
                  </div>
                </div>

                <p className="text-sm text-gray-600">{selectedItem.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Assignee</p>
                    <p className="text-sm font-medium mt-1">{selectedItem.assignee}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Due Date</p>
                    <p className="text-sm font-medium mt-1">{selectedItem.dueDate}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm font-medium mt-1">{selectedItem.createdDate}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Age</p>
                    <p className="text-sm font-medium mt-1">{selectedItem.age}</p>
                  </div>
                </div>

                {selectedItem.relatedItems.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Related Items</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.relatedItems.map((item) => (
                        <Badge key={item} variant="outline" className="font-mono text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Activity</h3>
                  <div className="space-y-3">
                    {selectedItem.comments.map((c, i) => (
                      <div key={i} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            {c.author === "AI Agent" ? (
                              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-blue-600">AI</span>
                              </div>
                            ) : (
                              <User className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-sm font-medium text-gray-700">{c.author}</span>
                          </div>
                          <span className="text-xs text-gray-400">{c.date}</span>
                        </div>
                        <p className="text-sm text-gray-600">{c.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-[#1B2A41] hover:bg-[#2d4a6f] text-white">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Take Action
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Add Comment
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
