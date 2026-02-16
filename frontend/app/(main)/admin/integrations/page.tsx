"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Link2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Database,
  Cloud,
  FileText,
  CreditCard,
  Settings,
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: "ERP" | "Banking" | "CRM" | "Cloud Storage" | "Payment" | "Communication";
  provider: string;
  status: "Connected" | "Disconnected" | "Error" | "Pending Setup";
  lastSync: string;
  syncFrequency: string;
  dataFlow: "Inbound" | "Outbound" | "Bidirectional";
  recordsSynced: number;
  apiVersion: string;
  config: { key: string; value: string }[];
}

const MOCK_INTEGRATIONS: Integration[] = [
  {
    id: "INT-001",
    name: "SAP S/4HANA",
    description: "Enterprise ERP system — GL, AP, AR, and Fixed Assets integration",
    category: "ERP",
    provider: "SAP",
    status: "Connected",
    lastSync: "2026-02-16 03:00 PM",
    syncFrequency: "Every 15 minutes",
    dataFlow: "Bidirectional",
    recordsSynced: 1245800,
    apiVersion: "v2.1",
    config: [
      { key: "Endpoint", value: "https://sap-prod.company.com/api/v2" },
      { key: "Client ID", value: "meeru-prod-001" },
      { key: "Company Codes", value: "US01, US02, UK03, DE04" },
      { key: "Sync Modules", value: "GL, AP, AR, FA" },
    ],
  },
  {
    id: "INT-002",
    name: "Chase Commercial Banking",
    description: "Daily bank statement import and payment file submission",
    category: "Banking",
    provider: "JPMorgan Chase",
    status: "Connected",
    lastSync: "2026-02-16 06:00 AM",
    syncFrequency: "Daily at 6:00 AM",
    dataFlow: "Bidirectional",
    recordsSynced: 89450,
    apiVersion: "BAI2",
    config: [
      { key: "SFTP Host", value: "sftp.chase.com" },
      { key: "Account Mask", value: "****7890" },
      { key: "Statement Format", value: "BAI2" },
      { key: "Payment Format", value: "NACHA" },
    ],
  },
  {
    id: "INT-003",
    name: "Salesforce CRM",
    description: "Customer master data sync and contract information for revenue recognition",
    category: "CRM",
    provider: "Salesforce",
    status: "Connected",
    lastSync: "2026-02-16 02:30 PM",
    syncFrequency: "Every 30 minutes",
    dataFlow: "Inbound",
    recordsSynced: 34200,
    apiVersion: "v58.0",
    config: [
      { key: "Instance", value: "company.my.salesforce.com" },
      { key: "Objects", value: "Account, Opportunity, Contract" },
      { key: "Sync Filter", value: "Stage = 'Closed Won'" },
    ],
  },
  {
    id: "INT-004",
    name: "Bank of America",
    description: "Secondary banking connection for treasury and cash management",
    category: "Banking",
    provider: "Bank of America",
    status: "Error",
    lastSync: "2026-02-15 06:00 AM",
    syncFrequency: "Daily at 6:00 AM",
    dataFlow: "Inbound",
    recordsSynced: 45230,
    apiVersion: "SWIFT MT940",
    config: [
      { key: "SFTP Host", value: "sftp.bofaml.com" },
      { key: "Account Mask", value: "****4567" },
      { key: "Error", value: "Certificate expired on 2026-02-15" },
    ],
  },
  {
    id: "INT-005",
    name: "Microsoft SharePoint",
    description: "Document storage for invoices, receipts, and audit evidence",
    category: "Cloud Storage",
    provider: "Microsoft",
    status: "Connected",
    lastSync: "2026-02-16 03:15 PM",
    syncFrequency: "Real-time",
    dataFlow: "Bidirectional",
    recordsSynced: 12800,
    apiVersion: "Graph v1.0",
    config: [
      { key: "Tenant", value: "company.onmicrosoft.com" },
      { key: "Site", value: "Finance Document Library" },
      { key: "Auto-classify", value: "Enabled" },
    ],
  },
  {
    id: "INT-006",
    name: "Stripe",
    description: "Payment processing data for cash application and reconciliation",
    category: "Payment",
    provider: "Stripe",
    status: "Connected",
    lastSync: "2026-02-16 03:10 PM",
    syncFrequency: "Real-time (webhook)",
    dataFlow: "Inbound",
    recordsSynced: 156700,
    apiVersion: "2025-12-01",
    config: [
      { key: "Mode", value: "Live" },
      { key: "Events", value: "payment_intent.succeeded, charge.refunded" },
      { key: "Webhook URL", value: "/api/webhooks/stripe" },
    ],
  },
  {
    id: "INT-007",
    name: "Oracle NetSuite",
    description: "Secondary ERP for international subsidiaries",
    category: "ERP",
    provider: "Oracle",
    status: "Pending Setup",
    lastSync: "Never",
    syncFrequency: "Not configured",
    dataFlow: "Bidirectional",
    recordsSynced: 0,
    apiVersion: "SuiteTalk v2025.1",
    config: [
      { key: "Account ID", value: "Pending" },
      { key: "Status", value: "Awaiting credentials from IT" },
    ],
  },
  {
    id: "INT-008",
    name: "Slack",
    description: "Notifications and alerts for workflow approvals and exceptions",
    category: "Communication",
    provider: "Slack",
    status: "Disconnected",
    lastSync: "2026-01-31 05:00 PM",
    syncFrequency: "Event-driven",
    dataFlow: "Outbound",
    recordsSynced: 8900,
    apiVersion: "Web API v2",
    config: [
      { key: "Workspace", value: "company-finance" },
      { key: "Channels", value: "#close-alerts, #cash-exceptions" },
      { key: "Reason", value: "Token revoked during security audit" },
    ],
  },
];

export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const filtered = MOCK_INTEGRATIONS.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const connectedCount = MOCK_INTEGRATIONS.filter((i) => i.status === "Connected").length;
  const errorCount = MOCK_INTEGRATIONS.filter((i) => i.status === "Error").length;
  const totalRecords = MOCK_INTEGRATIONS.reduce((sum, i) => sum + i.recordsSynced, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Connected":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" />Connected</Badge>;
      case "Disconnected":
        return <Badge className="bg-gray-50 text-gray-500 border-gray-200"><XCircle className="w-3 h-3 mr-1" />Disconnected</Badge>;
      case "Error":
        return <Badge className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      case "Pending Setup":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" />Pending Setup</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "ERP":
        return <Database className="w-5 h-5" />;
      case "Banking":
        return <CreditCard className="w-5 h-5" />;
      case "CRM":
        return <FileText className="w-5 h-5" />;
      case "Cloud Storage":
        return <Cloud className="w-5 h-5" />;
      case "Payment":
        return <CreditCard className="w-5 h-5" />;
      case "Communication":
        return <FileText className="w-5 h-5" />;
      default:
        return <Link2 className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-sm text-gray-500 mt-1">Connect and manage external system integrations</p>
        </div>
        <Button className="bg-[#1B2A41] hover:bg-[#2d4a6f] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 stagger-children">
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{MOCK_INTEGRATIONS.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Connected</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{connectedCount}</p>
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
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Errors</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{errorCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Records Synced</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{(totalRecords / 1000000).toFixed(1)}M</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search integrations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map((integration) => (
          <Card
            key={integration.id}
            className="card-interactive cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedIntegration(integration)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    integration.status === "Connected" ? "bg-emerald-50 text-emerald-600" :
                    integration.status === "Error" ? "bg-red-50 text-red-600" :
                    "bg-gray-50 text-gray-400"
                  }`}>
                    {getCategoryIcon(integration.category)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                    <p className="text-xs text-gray-500">{integration.provider}</p>
                  </div>
                </div>
                {getStatusBadge(integration.status)}
              </div>

              <p className="text-sm text-gray-500 mb-4">{integration.description}</p>

              <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{integration.syncFrequency}</span>
                </div>
                <div className="flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{integration.recordsSynced.toLocaleString()} records</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={!!selectedIntegration} onOpenChange={() => setSelectedIntegration(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedIntegration && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-blue-600" />
                  {selectedIntegration.name}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedIntegration.status)}
                  <Badge variant="outline">{selectedIntegration.category}</Badge>
                  <Badge variant="outline">{selectedIntegration.dataFlow}</Badge>
                </div>

                <p className="text-sm text-gray-600">{selectedIntegration.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Provider</p>
                    <p className="text-sm font-medium mt-1">{selectedIntegration.provider}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">API Version</p>
                    <p className="text-sm font-medium mt-1">{selectedIntegration.apiVersion}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Sync Frequency</p>
                    <p className="text-sm font-medium mt-1">{selectedIntegration.syncFrequency}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500">Last Sync</p>
                    <p className="text-sm font-medium mt-1">{selectedIntegration.lastSync}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium">Records Synced</p>
                  <p className="text-lg font-bold text-blue-800 mt-1">{selectedIntegration.recordsSynced.toLocaleString()}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Configuration</h3>
                  <div className="space-y-2">
                    {selectedIntegration.config.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                        <span className="text-sm text-gray-500">{c.key}</span>
                        <span className="text-sm font-mono text-gray-700">{c.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-[#1B2A41] hover:bg-[#2d4a6f] text-white">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                  {selectedIntegration.status === "Connected" ? (
                    <Button variant="outline" className="flex-1">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync Now
                    </Button>
                  ) : selectedIntegration.status === "Error" ? (
                    <Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
                      Reconnect
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1">
                      Connect
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
