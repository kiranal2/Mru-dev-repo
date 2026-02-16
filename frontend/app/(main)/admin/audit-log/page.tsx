"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  ScrollText,
  Search,
  User,
  Clock,
  Shield,
  FileEdit,
  LogIn,
  Settings,
  Trash2,
  Download,
  Eye,
} from "lucide-react";

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: "Login" | "Logout" | "Create" | "Update" | "Delete" | "Export" | "View" | "Approve" | "Config Change";
  category: "Authentication" | "Data" | "Configuration" | "Workflow" | "Report";
  resource: string;
  details: string;
  ipAddress: string;
  severity: "Info" | "Warning" | "Critical";
  changes?: { field: string; oldValue: string; newValue: string }[];
}

const MOCK_AUDIT_LOG: AuditEntry[] = [
  {
    id: "AUD-10001",
    timestamp: "2026-02-16 03:15:22 PM",
    user: "Sarah Chen",
    action: "Approve",
    category: "Workflow",
    resource: "Invoice INV-33201",
    details: "Approved vendor invoice payment of $18,750.00 for TechPro Services",
    ipAddress: "10.0.1.45",
    severity: "Info",
  },
  {
    id: "AUD-10002",
    timestamp: "2026-02-16 03:12:05 PM",
    user: "Sarah Chen",
    action: "Login",
    category: "Authentication",
    resource: "Web Application",
    details: "Successful login via SSO (Okta). MFA verified.",
    ipAddress: "10.0.1.45",
    severity: "Info",
  },
  {
    id: "AUD-10003",
    timestamp: "2026-02-16 02:58:30 PM",
    user: "John Smith",
    action: "Update",
    category: "Data",
    resource: "Bank Reconciliation - Chase Operating",
    details: "Resolved 2 exceptions and matched 45 transactions manually",
    ipAddress: "10.0.2.112",
    severity: "Info",
    changes: [
      { field: "matched_count", oldValue: "1802", newValue: "1847" },
      { field: "exception_count", oldValue: "5", newValue: "3" },
      { field: "status", oldValue: "In Progress", newValue: "Completed" },
    ],
  },
  {
    id: "AUD-10004",
    timestamp: "2026-02-16 02:45:11 PM",
    user: "Mike Johnson",
    action: "Export",
    category: "Report",
    resource: "AR Aging Report - February 2026",
    details: "Exported AR aging report to Excel format (1,247 records, 3.2 MB)",
    ipAddress: "10.0.3.78",
    severity: "Info",
  },
  {
    id: "AUD-10005",
    timestamp: "2026-02-16 01:30:00 PM",
    user: "System",
    action: "Config Change",
    category: "Configuration",
    resource: "Cash Application Rules Engine",
    details: "Auto-match confidence threshold changed from 90% to 95%",
    ipAddress: "System",
    severity: "Warning",
    changes: [
      { field: "auto_match_threshold", oldValue: "0.90", newValue: "0.95" },
      { field: "modified_by", oldValue: "-", newValue: "Sarah Chen (Admin)" },
    ],
  },
  {
    id: "AUD-10006",
    timestamp: "2026-02-16 11:22:45 AM",
    user: "Amanda Foster",
    action: "Login",
    category: "Authentication",
    resource: "Web Application",
    details: "Failed login attempt (3rd attempt). Account locked.",
    ipAddress: "192.168.1.100",
    severity: "Critical",
  },
  {
    id: "AUD-10007",
    timestamp: "2026-02-16 10:15:30 AM",
    user: "Lisa Wang",
    action: "Create",
    category: "Data",
    resource: "Revenue Leakage Case CASE-0087",
    details: "Created new revenue leakage case for contract C-4421 (TechPro Services). Estimated impact: $2,100",
    ipAddress: "10.0.4.56",
    severity: "Info",
  },
  {
    id: "AUD-10008",
    timestamp: "2026-02-16 09:00:00 AM",
    user: "System",
    action: "Delete",
    category: "Data",
    resource: "Temporary staging data",
    details: "Automated cleanup: removed 12,340 staging records older than 30 days",
    ipAddress: "System",
    severity: "Warning",
    changes: [
      { field: "records_deleted", oldValue: "0", newValue: "12340" },
      { field: "storage_freed", oldValue: "-", newValue: "450 MB" },
    ],
  },
  {
    id: "AUD-10009",
    timestamp: "2026-02-16 08:30:15 AM",
    user: "David Park",
    action: "View",
    category: "Report",
    resource: "Vendor Payment History - Q4 2025",
    details: "Viewed payment history for 23 vendors. Total viewed amount: $4.2M",
    ipAddress: "10.0.2.89",
    severity: "Info",
  },
  {
    id: "AUD-10010",
    timestamp: "2026-02-16 07:00:00 AM",
    user: "System",
    action: "Config Change",
    category: "Configuration",
    resource: "Integration - Bank of America SFTP",
    details: "SSL certificate validation failed. Integration auto-disabled.",
    ipAddress: "System",
    severity: "Critical",
    changes: [
      { field: "status", oldValue: "Connected", newValue: "Error" },
      { field: "error", oldValue: "-", newValue: "SSL_CERT_EXPIRED" },
    ],
  },
];

export default function AuditLogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  const filtered = MOCK_AUDIT_LOG.filter((a) => {
    const matchSearch =
      a.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchAction = actionFilter === "all" || a.action === actionFilter;
    const matchSeverity = severityFilter === "all" || a.severity === severityFilter;
    return matchSearch && matchAction && matchSeverity;
  });

  const criticalCount = MOCK_AUDIT_LOG.filter((a) => a.severity === "Critical").length;
  const warningCount = MOCK_AUDIT_LOG.filter((a) => a.severity === "Warning").length;
  const todayCount = MOCK_AUDIT_LOG.length;

  const getActionIcon = (action: string) => {
    switch (action) {
      case "Login":
      case "Logout":
        return <LogIn className="w-3.5 h-3.5" />;
      case "Create":
      case "Update":
        return <FileEdit className="w-3.5 h-3.5" />;
      case "Delete":
        return <Trash2 className="w-3.5 h-3.5" />;
      case "Export":
        return <Download className="w-3.5 h-3.5" />;
      case "View":
        return <Eye className="w-3.5 h-3.5" />;
      case "Approve":
        return <Shield className="w-3.5 h-3.5" />;
      case "Config Change":
        return <Settings className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Info":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Info</Badge>;
      case "Warning":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Warning</Badge>;
      case "Critical":
        return <Badge className="bg-red-50 text-red-700 border-red-200">Critical</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-1">Track all system activities, changes, and access events</p>
      </div>

      <div className="grid grid-cols-4 gap-4 stagger-children">
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Today&apos;s Events</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{todayCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <ScrollText className="w-5 h-5 text-blue-600" />
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
                <Shield className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Warnings</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{warningCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Users</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {new Set(MOCK_AUDIT_LOG.map((a) => a.user)).size}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search audit log..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="Login">Login</SelectItem>
            <SelectItem value="Create">Create</SelectItem>
            <SelectItem value="Update">Update</SelectItem>
            <SelectItem value="Delete">Delete</SelectItem>
            <SelectItem value="Export">Export</SelectItem>
            <SelectItem value="Approve">Approve</SelectItem>
            <SelectItem value="Config Change">Config Change</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="Info">Info</SelectItem>
            <SelectItem value="Warning">Warning</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Severity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a) => (
              <TableRow
                key={a.id}
                className={`cursor-pointer hover:bg-gray-50 ${
                  a.severity === "Critical" ? "bg-red-50/30" : ""
                }`}
                onClick={() => setSelectedEntry(a)}
              >
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    {a.timestamp}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {a.user === "System" ? (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <Settings className="w-3 h-3 text-gray-500" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#1B2A41] text-white flex items-center justify-center text-[10px] font-medium">
                        {a.user.split(" ").map((n) => n[0]).join("")}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700">{a.user}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {getActionIcon(a.action)}
                    <span className="text-sm">{a.action}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">{a.resource}</TableCell>
                <TableCell className="text-sm text-gray-500 max-w-[250px] truncate">{a.details}</TableCell>
                <TableCell>{getSeverityBadge(a.severity)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedEntry && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <ScrollText className="w-5 h-5 text-blue-600" />
                  {selectedEntry.id}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-2">
                  {getSeverityBadge(selectedEntry.severity)}
                  <Badge variant="outline">{selectedEntry.action}</Badge>
                  <Badge variant="outline">{selectedEntry.category}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">User</p>
                    <p className="text-sm font-medium mt-1">{selectedEntry.user}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Timestamp</p>
                    <p className="text-sm font-medium mt-1">{selectedEntry.timestamp}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">IP Address</p>
                    <p className="text-sm font-mono font-medium mt-1">{selectedEntry.ipAddress}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Resource</p>
                    <p className="text-sm font-medium mt-1">{selectedEntry.resource}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">Details</p>
                  <p className="text-sm text-gray-700">{selectedEntry.details}</p>
                </div>

                {selectedEntry.changes && selectedEntry.changes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Changes</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Field</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Previous</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">New</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedEntry.changes.map((c, i) => (
                            <tr key={i} className="border-t">
                              <td className="px-3 py-2 font-medium text-gray-700">{c.field}</td>
                              <td className="px-3 py-2 text-red-600 font-mono text-xs">{c.oldValue}</td>
                              <td className="px-3 py-2 text-emerald-600 font-mono text-xs">{c.newValue}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
