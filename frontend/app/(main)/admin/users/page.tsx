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
  Users,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCog,
  Mail,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Controller" | "Manager" | "Analyst" | "Viewer";
  department: string;
  status: "Active" | "Inactive" | "Locked";
  lastLogin: string;
  createdDate: string;
  permissions: string[];
  mfaEnabled: boolean;
}

const MOCK_USERS: UserRecord[] = [
  {
    id: "USR-001",
    name: "Sarah Chen",
    email: "sarah.chen@company.com",
    role: "Admin",
    department: "Finance",
    status: "Active",
    lastLogin: "2026-02-16 03:12 PM",
    createdDate: "2025-06-15",
    permissions: ["Full Access", "User Management", "System Settings", "Audit Log"],
    mfaEnabled: true,
  },
  {
    id: "USR-002",
    name: "John Smith",
    email: "john.smith@company.com",
    role: "Controller",
    department: "Accounting",
    status: "Active",
    lastLogin: "2026-02-16 02:45 PM",
    createdDate: "2025-07-01",
    permissions: ["Reports", "Close Management", "Reconciliation", "Approvals"],
    mfaEnabled: true,
  },
  {
    id: "USR-003",
    name: "Mike Johnson",
    email: "mike.johnson@company.com",
    role: "Manager",
    department: "Accounts Receivable",
    status: "Active",
    lastLogin: "2026-02-16 01:30 PM",
    createdDate: "2025-08-10",
    permissions: ["Cash Application", "Worklist", "Reports (AR)", "Workflow Approval"],
    mfaEnabled: true,
  },
  {
    id: "USR-004",
    name: "Lisa Wang",
    email: "lisa.wang@company.com",
    role: "Analyst",
    department: "Revenue Operations",
    status: "Active",
    lastLogin: "2026-02-16 11:00 AM",
    createdDate: "2025-09-20",
    permissions: ["Revenue Leakage", "Reports (Revenue)", "Worklist", "Data Templates (View)"],
    mfaEnabled: false,
  },
  {
    id: "USR-005",
    name: "David Park",
    email: "david.park@company.com",
    role: "Analyst",
    department: "Accounts Payable",
    status: "Active",
    lastLogin: "2026-02-15 04:30 PM",
    createdDate: "2025-10-05",
    permissions: ["AP Processing", "Vendor Management", "Worklist", "Reports (AP)"],
    mfaEnabled: true,
  },
  {
    id: "USR-006",
    name: "Emily Roberts",
    email: "emily.roberts@company.com",
    role: "Viewer",
    department: "FP&A",
    status: "Active",
    lastLogin: "2026-02-14 09:15 AM",
    createdDate: "2025-11-15",
    permissions: ["Reports (Read Only)", "Dashboard (View)"],
    mfaEnabled: false,
  },
  {
    id: "USR-007",
    name: "Robert Kim",
    email: "robert.kim@company.com",
    role: "Manager",
    department: "Treasury",
    status: "Inactive",
    lastLogin: "2026-01-20 10:00 AM",
    createdDate: "2025-07-22",
    permissions: ["Treasury", "Cash Position", "Bank Reconciliation"],
    mfaEnabled: true,
  },
  {
    id: "USR-008",
    name: "Amanda Foster",
    email: "amanda.foster@company.com",
    role: "Admin",
    department: "IT",
    status: "Locked",
    lastLogin: "2026-02-10 08:30 AM",
    createdDate: "2025-06-01",
    permissions: ["Full Access", "System Settings", "Integration Management"],
    mfaEnabled: true,
  },
];

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  const filtered = MOCK_USERS.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const activeCount = MOCK_USERS.filter((u) => u.status === "Active").length;
  const adminCount = MOCK_USERS.filter((u) => u.role === "Admin").length;
  const mfaCount = MOCK_USERS.filter((u) => u.mfaEnabled).length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin":
        return <Badge className="bg-red-50 text-red-700 border-red-200"><ShieldAlert className="w-3 h-3 mr-1" />Admin</Badge>;
      case "Controller":
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200"><ShieldCheck className="w-3 h-3 mr-1" />Controller</Badge>;
      case "Manager":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200"><UserCog className="w-3 h-3 mr-1" />Manager</Badge>;
      case "Analyst":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Analyst</Badge>;
      case "Viewer":
        return <Badge className="bg-gray-50 text-gray-500 border-gray-200">Viewer</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>;
      case "Inactive":
        return <Badge className="bg-gray-50 text-gray-500 border-gray-200">Inactive</Badge>;
      case "Locked":
        return <Badge className="bg-red-50 text-red-700 border-red-200">Locked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users & Roles</h1>
          <p className="text-sm text-gray-500 mt-1">Manage user accounts, roles, and access permissions</p>
        </div>
        <Button className="bg-[#1B2A41] hover:bg-[#2d4a6f] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 stagger-children">
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{MOCK_USERS.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Admins</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{adminCount}</p>
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
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">MFA Enabled</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{mfaCount}/{MOCK_USERS.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="Controller">Controller</SelectItem>
            <SelectItem value="Manager">Manager</SelectItem>
            <SelectItem value="Analyst">Analyst</SelectItem>
            <SelectItem value="Viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Locked">Locked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>MFA</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow
                key={u.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedUser(u)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1B2A41] text-white flex items-center justify-center text-sm font-medium">
                      {u.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getRoleBadge(u.role)}</TableCell>
                <TableCell className="text-sm text-gray-600">{u.department}</TableCell>
                <TableCell>
                  {u.mfaEnabled ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Shield className="w-4 h-4 text-gray-300" />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    {u.lastLogin}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(u.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedUser && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1B2A41] text-white flex items-center justify-center font-medium">
                    {selectedUser.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  {selectedUser.name}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-2">
                  {getRoleBadge(selectedUser.role)}
                  {getStatusBadge(selectedUser.status)}
                  {selectedUser.mfaEnabled && (
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                      <ShieldCheck className="w-3 h-3 mr-1" />MFA
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium mt-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {selectedUser.email}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-sm font-medium mt-1">{selectedUser.department}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Last Login</p>
                    <p className="text-sm font-medium mt-1">{selectedUser.lastLogin}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm font-medium mt-1">{selectedUser.createdDate}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Permissions</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.permissions.map((p) => (
                      <Badge key={p} variant="outline" className="text-xs">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-[#1B2A41] hover:bg-[#2d4a6f] text-white">
                    <UserCog className="w-4 h-4 mr-2" />
                    Edit User
                  </Button>
                  {selectedUser.status === "Locked" ? (
                    <Button variant="outline" className="flex-1">
                      Unlock Account
                    </Button>
                  ) : selectedUser.status === "Active" ? (
                    <Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
                      Deactivate
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1">
                      Activate
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
