"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight,
  Home,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  Bell,
  Users,
  Activity,
  FileText,
  Play,
  ExternalLink,
  Settings,
  Send,
  Circle,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Bot,
  MessageSquare,
  Plus,
  Filter,
  ListTodo,
  Target,
  Paperclip,
  BarChart3,
  PieChart,
  ChevronDown,
} from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";

export default function MyWorkspace2Page() {
  const [entity, setEntity] = useState("amazon");
  const [period, setPeriod] = useState("feb-2025");
  const [view, setView] = useState("my-work");
  const [commandInput, setCommandInput] = useState("");
  const [showCommandHints, setShowCommandHints] = useState(false);

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      {/* Header with Breadcrumb and Title */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="home/workspace/workspace-2" className="mb-1.5" />
        <div className="flex items-start justify-between mb-1">
          <div>
            <h1 className="text-2xl font-bold text-[#000000] mt-2 mb-1">My Workspace 2</h1>
            <p className="text-sm text-[#606060]">Your personalized close command center.</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Customize Workspace
          </Button>
        </div>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-[1440px] mx-auto px-6 py-8">
          {/* Global Context Bar */}
          <Card className="mb-6 shadow-sm border-slate-200">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Entity Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Entity:</span>
                  <Select value={entity} onValueChange={setEntity}>
                    <SelectTrigger className="w-[140px] border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Entities</SelectItem>
                      <SelectItem value="amazon">Amazon</SelectItem>
                      <SelectItem value="tesla">Tesla</SelectItem>
                      <SelectItem value="apple">Apple</SelectItem>
                      <SelectItem value="emea">EMEA</SelectItem>
                      <SelectItem value="us">US</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Period Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Period:</span>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[160px] border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jan-2025">
                        <div>
                          <div>Jan 2025</div>
                          <div className="text-xs text-muted-foreground">Closed</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="feb-2025">
                        <div>
                          <div>Feb 2025</div>
                          <div className="text-xs text-green-600">Close in progress</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="mar-2025">Mar 2025</SelectItem>
                      <SelectItem value="apr-2025">Apr 2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  <Button
                    variant={view === "my-work" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("my-work")}
                    className="h-8"
                  >
                    My Work
                  </Button>
                  <Button
                    variant={view === "my-team" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("my-team")}
                    className="h-8"
                  >
                    My Team
                  </Button>
                  <Button
                    variant={view === "all-finance" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("all-finance")}
                    className="h-8"
                  >
                    All Finance
                  </Button>
                </div>

                {/* Close Health */}
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 px-3 py-1.5 gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>On Track · 92% complete · 3 days to close</span>
                </Badge>

                {/* Meeru Command Bar */}
                <div className="flex-1 min-w-[300px] ml-auto">
                  <div className="relative">
                    <Input
                      placeholder="Ask Meeru or type / for commands…"
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      onFocus={() => setShowCommandHints(true)}
                      onBlur={() => setTimeout(() => setShowCommandHints(false), 200)}
                      className="pr-10"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    >
                      <Sparkles className="h-4 w-4 text-purple-600" />
                    </Button>
                    {showCommandHints && (
                      <div className="absolute top-full mt-2 left-0 right-0 bg-white border rounded-lg shadow-lg p-3 text-xs text-muted-foreground z-10">
                        <div className="font-medium text-foreground mb-1">Examples:</div>
                        <div>/variance AR Aging Amazon</div>
                        <div>What's blocking Feb close?</div>
                        <div>Create a task for Lisa to review CEI</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Stats */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Critical Numbers</h2>
                  <span className="text-sm text-muted-foreground">As of Feb 28, 2025</span>
                </div>

                {/* Operational Metrics Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-sm text-muted-foreground">Approvals Due</div>
                        <Circle className="h-2 w-2 fill-amber-500 text-amber-500" />
                      </div>
                      <div className="text-3xl font-bold text-slate-900 mb-1">7</div>
                      <div className="text-xs text-muted-foreground mb-2">Due next 5 days</div>
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <TrendingUp className="h-3 w-3" />
                        <span>+18% vs last month</span>
                      </div>
                      <Button variant="link" className="text-xs p-0 h-auto mt-2 text-purple-600">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Ask Meeru about this
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-sm text-muted-foreground">Reviews Due</div>
                        <Circle className="h-2 w-2 fill-blue-500 text-blue-500" />
                      </div>
                      <div className="text-3xl font-bold text-slate-900 mb-1">12</div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Pending in this period
                      </div>
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <TrendingDown className="h-3 w-3" />
                        <span>-8% vs last month</span>
                      </div>
                      <Button variant="link" className="text-xs p-0 h-auto mt-2 text-purple-600">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Ask Meeru about this
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-sm text-muted-foreground">Follow-ups</div>
                        <Circle className="h-2 w-2 fill-amber-500 text-amber-500" />
                      </div>
                      <div className="text-3xl font-bold text-slate-900 mb-1">3</div>
                      <div className="text-xs text-muted-foreground mb-2">Need your attention</div>
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <span>No change</span>
                      </div>
                      <Button variant="link" className="text-xs p-0 h-auto mt-2 text-purple-600">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Ask Meeru about this
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-sm text-muted-foreground">Open Exceptions</div>
                        <Circle className="h-2 w-2 fill-red-500 text-red-500" />
                      </div>
                      <div className="text-3xl font-bold text-slate-900 mb-1">5</div>
                      <div className="text-xs text-muted-foreground mb-2">High-risk items only</div>
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <TrendingUp className="h-3 w-3" />
                        <span>+25% vs last month</span>
                      </div>
                      <Button variant="link" className="text-xs p-0 h-auto mt-2 text-purple-600">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Ask Meeru about this
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Financial & Risk Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-200">
                    <CardContent className="p-5">
                      <div className="text-sm text-muted-foreground mb-2">DSO</div>
                      <div className="text-3xl font-bold text-slate-900 mb-2">42.3 days</div>
                      <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                        Target &lt; 45
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
                        <TrendingDown className="h-3 w-3" />
                        <span>-2.1 days vs last month</span>
                      </div>
                      <Button variant="link" className="text-xs p-0 h-auto mt-2 text-purple-600">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Ask Meeru about this
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-200">
                    <CardContent className="p-5">
                      <div className="text-sm text-muted-foreground mb-2">
                        Collection Effectiveness Index
                      </div>
                      <div className="text-3xl font-bold text-slate-900 mb-2">83%</div>
                      <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                        vs 80% target
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
                        <TrendingUp className="h-3 w-3" />
                        <span>+3% vs last month</span>
                      </div>
                      <Button variant="link" className="text-xs p-0 h-auto mt-2 text-purple-600">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Ask Meeru about this
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-200">
                    <CardContent className="p-5">
                      <div className="text-sm text-muted-foreground mb-2">High-Risk Recons</div>
                      <div className="text-3xl font-bold text-slate-900 mb-2">4</div>
                      <div className="text-xs text-muted-foreground mb-2">&gt; $1M and overdue</div>
                      <div className="flex items-center gap-1 text-xs text-red-600 mt-2">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Requires immediate attention</span>
                      </div>
                      <Button variant="link" className="text-xs p-0 h-auto mt-2 text-purple-600">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Ask Meeru about this
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Live Tracking Panel */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Live Tracking</CardTitle>
                    <Button variant="link" className="text-sm">
                      Manage pins <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Live Pins Grid */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Live Pins</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Pin 1 */}
                      <Card className="border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="space-y-1">
                              <Badge variant="secondary" className="text-xs">
                                SOURCE
                              </Badge>
                              <Badge variant="outline" className="text-xs ml-1">
                                Accounts Receivable
                              </Badge>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="font-semibold text-slate-900 mb-2">AR Aging – Amazon</div>
                          <div className="text-2xl font-bold text-slate-900 mb-2">
                            &gt;90 Bucket: 12.4%
                          </div>
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            WARNING
                          </Badge>
                          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                            <span>Last refreshed 2h ago</span>
                            <div className="flex items-center gap-1 text-red-600">
                              <TrendingUp className="h-3 w-3" />
                              <span>+1.2%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Pin 2 */}
                      <Card className="border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="space-y-1">
                              <Badge variant="secondary" className="text-xs">
                                SOURCE
                              </Badge>
                              <Badge variant="outline" className="text-xs ml-1">
                                Accounts Receivable
                              </Badge>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="font-semibold text-slate-900 mb-2">AR Aging – Tesla</div>
                          <div className="text-2xl font-bold text-slate-900 mb-2">
                            &gt;90 Bucket: 8.1%
                          </div>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            PASS
                          </Badge>
                          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                            <span>Last refreshed 1h ago</span>
                            <div className="flex items-center gap-1 text-green-600">
                              <TrendingDown className="h-3 w-3" />
                              <span>-0.8%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Pin 3 */}
                      <Card className="border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="space-y-1">
                              <Badge variant="secondary" className="text-xs">
                                VALIDATION
                              </Badge>
                              <Badge variant="outline" className="text-xs ml-1">
                                Cash Management
                              </Badge>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="font-semibold text-slate-900 mb-2">
                            Bank Recons – EMEA
                          </div>
                          <div className="text-2xl font-bold text-slate-900 mb-2">
                            Balance: $24.2M
                          </div>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            PASS
                          </Badge>
                          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                            <span>Last refreshed 30m ago</span>
                            <div className="flex items-center gap-1 text-slate-600">
                              <span>No change</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Pin 4 */}
                      <Card className="border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="space-y-1">
                              <Badge variant="secondary" className="text-xs">
                                VALIDATION
                              </Badge>
                              <Badge variant="outline" className="text-xs ml-1">
                                Accounts Receivable
                              </Badge>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="font-semibold text-slate-900 mb-2">CEI – Global</div>
                          <div className="text-2xl font-bold text-slate-900 mb-2">83.2%</div>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            PASS
                          </Badge>
                          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                            <span>Last refreshed 3h ago</span>
                            <div className="flex items-center gap-1 text-green-600">
                              <TrendingUp className="h-3 w-3" />
                              <span>+3.1%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Anomalies Strip */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-3">
                      Anomalies & Exceptions
                    </h3>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      <Badge variant="destructive" className="whitespace-nowrap gap-1 px-3 py-1.5">
                        <AlertTriangle className="h-3 w-3" />3 unusual FX variances
                      </Badge>
                      <Badge variant="destructive" className="whitespace-nowrap gap-1 px-3 py-1.5">
                        <Zap className="h-3 w-3" />2 vendor spikes in EMEA
                      </Badge>
                      <Badge variant="destructive" className="whitespace-nowrap gap-1 px-3 py-1.5">
                        <Clock className="h-3 w-3" />1 stale AR template (26 days)
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Template Activity */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Data Template Activity</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="cursor-pointer">
                        All
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer">
                        Failed
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer">
                        Stale
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer">
                        Bound to Close
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Template 1 */}
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-slate-900">
                          AR Aging Report – Current
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          SOURCE
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Accounts Receivable
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          SUCCESS
                        </Badge>
                        <span>Executed: 2h ago (SLA: Daily)</span>
                        <span>1,414 rows · $797,884 total balance</span>
                        <Badge variant="outline" className="text-xs">
                          Bound to: Reconciliation
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="gap-2">
                        <Play className="h-3 w-3" />
                        Run now
                      </Button>
                      <Button size="sm" variant="link">
                        View log
                      </Button>
                    </div>
                  </div>

                  {/* Template 2 */}
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-slate-900">
                          Bank Reconciliation – Daily
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          VALIDATION
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Cash Management
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          SUCCESS
                        </Badge>
                        <span>Executed: 4h ago (SLA: Daily)</span>
                        <span>342 rows · $24.2M total balance</span>
                        <Badge variant="outline" className="text-xs">
                          Bound to: Close Tasks
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="gap-2">
                        <Play className="h-3 w-3" />
                        Run now
                      </Button>
                      <Button size="sm" variant="link">
                        View log
                      </Button>
                    </div>
                  </div>

                  {/* Template 3 - FAILED */}
                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50/30 hover:bg-red-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-slate-900">
                          AP Aging Report – Weekly
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          SOURCE
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Accounts Payable
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">FAILED</Badge>
                        <span>Executed: 1d ago (SLA: Weekly)</span>
                        <span className="text-red-700">Error: Database connection timeout</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="gap-2">
                        <RefreshCw className="h-3 w-3" />
                        Retry
                      </Button>
                      <Button size="sm" variant="link">
                        View log
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reconciliations Snapshot */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Reconciliations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Donut Charts Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-slate-700 mb-4">Preparer Status</h4>
                      <div className="relative w-40 h-40 mx-auto">
                        <svg viewBox="0 0 100 100" className="transform -rotate-90">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="12"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="12"
                            strokeDasharray="175 251"
                            strokeLinecap="round"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="12"
                            strokeDasharray="50 251"
                            strokeDashoffset="-175"
                            strokeLinecap="round"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="12"
                            strokeDasharray="26 251"
                            strokeDashoffset="-225"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold">28</span>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span>Completed</span>
                          </div>
                          <span className="font-medium">20 (71%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span>In Progress</span>
                          </div>
                          <span className="font-medium">6 (21%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span>Overdue</span>
                          </div>
                          <span className="font-medium">2 (8%)</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <h4 className="text-sm font-medium text-slate-700 mb-4">Reviewer Status</h4>
                      <div className="relative w-40 h-40 mx-auto">
                        <svg viewBox="0 0 100 100" className="transform -rotate-90">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="12"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="12"
                            strokeDasharray="150 251"
                            strokeLinecap="round"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="12"
                            strokeDasharray="63 251"
                            strokeDashoffset="-150"
                            strokeLinecap="round"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="12"
                            strokeDasharray="38 251"
                            strokeDashoffset="-213"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold">28</span>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span>Completed</span>
                          </div>
                          <span className="font-medium">17 (61%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span>In Progress</span>
                          </div>
                          <span className="font-medium">8 (29%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span>Overdue</span>
                          </div>
                          <span className="font-medium">3 (10%)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Target vs Actual Chart */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-4">
                      Target vs Actual Completion
                    </h4>
                    <div className="h-32 flex items-end gap-8 border-b border-l pl-8 pb-2">
                      {[
                        { month: "Jan", target: 95, actual: 98 },
                        { month: "Feb", target: 95, actual: 92 },
                        { month: "Mar", target: 95, actual: 0 },
                        { month: "Apr", target: 95, actual: 0 },
                        { month: "May", target: 95, actual: 0 },
                      ].map((data, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full flex items-end justify-center gap-1 h-24">
                            {data.actual > 0 && (
                              <div
                                className="w-4 bg-blue-500 rounded-t"
                                style={{ height: `${data.actual}%` }}
                              />
                            )}
                            <div
                              className="w-4 border-2 border-dashed border-slate-400 rounded-t"
                              style={{ height: `${data.target}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{data.month}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded" />
                        <span>Actual</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-dashed border-slate-400 rounded" />
                        <span>Target</span>
                      </div>
                    </div>
                  </div>

                  {/* At-Risk Recons Table */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-3">At-Risk Recons</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="text-left p-3 font-medium">Recon ID</th>
                            <th className="text-left p-3 font-medium">Entity</th>
                            <th className="text-right p-3 font-medium">Balance</th>
                            <th className="text-right p-3 font-medium">Days Overdue</th>
                            <th className="text-center p-3 font-medium">Risk Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <tr className="hover:bg-slate-50 cursor-pointer">
                            <td className="p-3">
                              <Button variant="link" className="p-0 h-auto text-blue-600">
                                R-1245
                              </Button>
                            </td>
                            <td className="p-3">Amazon</td>
                            <td className="p-3 text-right font-medium">$2,450,000</td>
                            <td className="p-3 text-right">12</td>
                            <td className="p-3 text-center">
                              <Badge variant="destructive" className="text-xs">
                                High
                              </Badge>
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50 cursor-pointer">
                            <td className="p-3">
                              <Button variant="link" className="p-0 h-auto text-blue-600">
                                R-1389
                              </Button>
                            </td>
                            <td className="p-3">Tesla</td>
                            <td className="p-3 text-right font-medium">$1,850,000</td>
                            <td className="p-3 text-right">8</td>
                            <td className="p-3 text-center">
                              <Badge variant="destructive" className="text-xs">
                                High
                              </Badge>
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50 cursor-pointer">
                            <td className="p-3">
                              <Button variant="link" className="p-0 h-auto text-blue-600">
                                R-1502
                              </Button>
                            </td>
                            <td className="p-3">EMEA</td>
                            <td className="p-3 text-right font-medium">$1,200,000</td>
                            <td className="p-3 text-right">5</td>
                            <td className="p-3 text-center">
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs">
                                Medium
                              </Badge>
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50 cursor-pointer">
                            <td className="p-3">
                              <Button variant="link" className="p-0 h-auto text-blue-600">
                                R-1623
                              </Button>
                            </td>
                            <td className="p-3">Apple</td>
                            <td className="p-3 text-right font-medium">$980,000</td>
                            <td className="p-3 text-right">3</td>
                            <td className="p-3 text-center">
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs">
                                Medium
                              </Badge>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Worklist Management */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Worklist Management</CardTitle>
                    <Button variant="link" className="text-sm">
                      Manage Tasks <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Donut Chart */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <Button size="sm" variant="default" className="h-7">
                          My tasks
                        </Button>
                        <Button size="sm" variant="outline" className="h-7">
                          Team tasks
                        </Button>
                      </div>
                      <div className="relative w-40 h-40 mx-auto">
                        <svg viewBox="0 0 100 100" className="transform -rotate-90">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="12"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="12"
                            strokeDasharray="188 251"
                            strokeLinecap="round"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="12"
                            strokeDasharray="38 251"
                            strokeDashoffset="-188"
                            strokeLinecap="round"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="12"
                            strokeDasharray="25 251"
                            strokeDashoffset="-226"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-2xl font-bold">42</span>
                          <span className="text-xs text-muted-foreground">Total</span>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span>Completed</span>
                          </div>
                          <span className="font-medium">32 (76%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span>In Progress</span>
                          </div>
                          <span className="font-medium">7 (17%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span>Overdue</span>
                          </div>
                          <span className="font-medium">3 (7%)</span>
                        </div>
                      </div>
                    </div>

                    {/* Top Overdue Tasks */}
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-3">Top Overdue Tasks</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="flex-1">
                            <div className="font-medium text-sm">T-1842</div>
                            <div className="text-xs text-muted-foreground">
                              Review AR aging variance
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-blue-100">ML</AvatarFallback>
                            </Avatar>
                            <Badge variant="destructive" className="text-xs">
                              High
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="flex-1">
                            <div className="font-medium text-sm">T-1901</div>
                            <div className="text-xs text-muted-foreground">Approve bank recon</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-green-100">DK</AvatarFallback>
                            </Avatar>
                            <Badge variant="destructive" className="text-xs">
                              High
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="flex-1">
                            <div className="font-medium text-sm">T-1923</div>
                            <div className="text-xs text-muted-foreground">
                              Submit journal entry
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-purple-100">SA</AvatarFallback>
                            </Avatar>
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs">
                              Medium
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button variant="link" className="text-sm w-full">
                    View Board View <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column (1/3) */}
            <div className="space-y-6">
              {/* Watchlist */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Watchlist</CardTitle>
                    <Button variant="link" className="text-sm">
                      View all <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Watch Rule 1 */}
                  <div className="p-3 border rounded-lg hover:shadow-md transition-all cursor-pointer">
                    <div className="font-medium text-sm mb-2">AR &gt;90 Amazon &gt; 10%</div>
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-xs mb-2">
                      Triggered 2d ago
                    </Badge>
                    <div className="text-xs text-muted-foreground mb-2">
                      Current: 12.1% (threshold: 10%)
                    </div>
                    <div className="flex items-center gap-2">
                      <Bell className="h-3 w-3 text-muted-foreground" />
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      <div className="w-3 h-3 rounded bg-green-600" />
                    </div>
                  </div>

                  {/* Watch Rule 2 */}
                  <div className="p-3 border rounded-lg hover:shadow-md transition-all cursor-pointer">
                    <div className="font-medium text-sm mb-2">CEI &lt; 75%</div>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs mb-2">
                      Healthy
                    </Badge>
                    <div className="text-xs text-muted-foreground mb-2">
                      Current: 83% (threshold: 75%)
                    </div>
                    <div className="flex items-center gap-2">
                      <Bell className="h-3 w-3 text-muted-foreground" />
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Watch Rule 3 */}
                  <div className="p-3 border rounded-lg hover:shadow-md transition-all cursor-pointer">
                    <div className="font-medium text-sm mb-2">High-risk recons &gt; 3</div>
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs mb-2">
                      At risk
                    </Badge>
                    <div className="text-xs text-muted-foreground mb-2">
                      Current: 4 (threshold: 3)
                    </div>
                    <div className="flex items-center gap-2">
                      <Bell className="h-3 w-3 text-muted-foreground" />
                      <div className="w-3 h-3 rounded bg-green-600" />
                    </div>
                  </div>

                  <Button variant="outline" className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    Add Watch
                  </Button>
                </CardContent>
              </Card>

              {/* Team Feed */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Team Feed & Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Daily AI Digest */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <span className="font-semibold text-sm">Meeru Daily Brief</span>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-xs text-slate-700 space-y-1.5">
                      <div className="flex gap-2">
                        <span>•</span>
                        <span>Close is on track for Feb (92% of tasks complete).</span>
                      </div>
                      <div className="flex gap-2">
                        <span>•</span>
                        <span>4 AR recons over $1M are still overdue for Amazon.</span>
                      </div>
                      <div className="flex gap-2">
                        <span>•</span>
                        <span>
                          CEI improved by 3% vs last month, mainly due to EMEA collections.
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">Last 24 hours</div>
                  </div>

                  {/* Post Composer */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Share an update… (@mention team members)"
                      className="min-h-[80px] resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                        <Paperclip className="h-4 w-4" />
                        Attach
                      </Button>
                      <Button size="sm" className="gap-2">
                        <Send className="h-4 w-4" />
                        Post
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Activity Stream */}
                  <div className="space-y-4">
                    {/* Human Post */}
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                          ML
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">Mai Lane</span>
                          <span className="text-xs text-muted-foreground">2h ago</span>
                        </div>
                        <div className="text-sm text-slate-700">
                          Close cut-off is Friday <span className="text-blue-600">@David Kim</span>.
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="link" className="text-xs p-0 h-auto">
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* System Event */}
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">1h ago</span>
                        </div>
                        <div className="text-sm text-slate-700">
                          Recon <span className="font-medium">R-1245 (Amazon Cash)</span> moved to
                          'Ready for Review'.
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="link" className="text-xs p-0 h-auto">
                            Open recon
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* System Event 2 */}
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">3h ago</span>
                        </div>
                        <div className="text-sm text-slate-700">
                          <span className="font-medium">AR Aging Template - Amazon</span> SUCCESS ·
                          1,414 rows, $797,884 balance.
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="link" className="text-xs p-0 h-auto">
                            View template run
                          </Button>
                          <Button variant="link" className="text-xs p-0 h-auto">
                            Convert to task
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Suggested Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button className="w-full p-4 border rounded-lg hover:shadow-md hover:border-purple-300 transition-all text-left group">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">
                          Review high-risk AR recons (4)
                        </div>
                        <div className="text-xs text-muted-foreground">
                          AI-identified recons requiring attention
                        </div>
                      </div>
                    </div>
                  </button>

                  <button className="w-full p-4 border rounded-lg hover:shadow-md hover:border-blue-300 transition-all text-left group">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                        <Play className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">
                          Run AR Aging Template for Feb
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Execute scheduled data extraction
                        </div>
                      </div>
                    </div>
                  </button>

                  <button className="w-full p-4 border rounded-lg hover:shadow-md hover:border-green-300 transition-all text-left group">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">
                          Generate flux commentary for Amazon
                        </div>
                        <div className="text-xs text-muted-foreground">
                          AI-powered variance analysis
                        </div>
                      </div>
                    </div>
                  </button>

                  <button className="w-full p-4 border rounded-lg hover:shadow-md hover:border-amber-300 transition-all text-left group">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 group-hover:bg-amber-200 transition-colors">
                        <Target className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">
                          Prepare close summary for CFO
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Executive-ready insights
                        </div>
                      </div>
                    </div>
                  </button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="queries" className="w-full">
                    <TabsList className="w-full">
                      <TabsTrigger value="queries" className="flex-1">
                        Queries
                      </TabsTrigger>
                      <TabsTrigger value="objects" className="flex-1">
                        Objects
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="queries" className="space-y-3 mt-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex-1">
                          <div className="text-sm">Explain CEI variance for Amazon in Feb.</div>
                          <div className="text-xs text-muted-foreground mt-1">2h ago</div>
                        </div>
                        <Button size="sm" variant="outline">
                          Re-run
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex-1">
                          <div className="text-sm">List overdue bank recons &gt; $500k.</div>
                          <div className="text-xs text-muted-foreground mt-1">5h ago</div>
                        </div>
                        <Button size="sm" variant="outline">
                          Re-run
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex-1">
                          <div className="text-sm">What are the key risks for Feb close?</div>
                          <div className="text-xs text-muted-foreground mt-1">1d ago</div>
                        </div>
                        <Button size="sm" variant="outline">
                          Re-run
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="objects" className="space-y-3 mt-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="text-sm">Recon R-1245 · Amazon Cash</div>
                            <div className="text-xs text-muted-foreground">2h ago</div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 flex-1">
                          <Activity className="h-4 w-4 text-green-600" />
                          <div>
                            <div className="text-sm">AR Aging Template – Amazon</div>
                            <div className="text-xs text-muted-foreground">3h ago</div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 flex-1">
                          <BarChart3 className="h-4 w-4 text-purple-600" />
                          <div>
                            <div className="text-sm">CEI Validation – Global</div>
                            <div className="text-xs text-muted-foreground">5h ago</div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
