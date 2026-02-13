"use client";

import { useState, useEffect, useRef } from "react";
import { FileUp, Sparkles, Database, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AutonomyCapabilitiesShell } from "@/components/autonomy/capabilities/AutonomyCapabilitiesShell";
import Breadcrumb from "@/components/layout/Breadcrumb";

interface SOP {
  id: string;
  title: string;
  owner: string;
  frequency: string;
  sla: string;
  scope: string;
  raw_text: string;
  sections: string[];
  steps: string[];
  inputs: string[];
  outputs: string[];
}

interface Task {
  title: string;
  owner: string;
  type: string;
  automation: string;
  state: "Auto" | "Review" | "Manual";
}

interface WorkflowNode {
  id: string;
  title: string;
  owner: string;
  type: string;
  auto: string;
  x: number;
  y: number;
}

interface WorkflowEdge {
  from: string;
  to: string;
}

interface AutomationState {
  recipient: string;
  thresholdDays: number;
  dayOfWeek: string;
  time: string;
  timezone: string;
  channel: string;
  subject: string;
}

interface InvoicePreview {
  customer: string;
  invoice: string;
  daysLate: number;
  amount: number;
  owner: string;
}

const SAMPLE_INVOICES: InvoicePreview[] = [
  {
    customer: "Blue Ridge Apparel",
    invoice: "INV-1100",
    daysLate: 133,
    amount: 1503.4,
    owner: "Bob Hoying",
  },
  {
    customer: "Helix Motors",
    invoice: "INV-1046",
    daysLate: 124,
    amount: 8169.16,
    owner: "Bob Hoying",
  },
  {
    customer: "Blue Ridge Apparel",
    invoice: "INV-1088",
    daysLate: 124,
    amount: 6114.25,
    owner: "Bob Hoying",
  },
  {
    customer: "Acme Tools",
    invoice: "INV-1055",
    daysLate: 118,
    amount: 4782.9,
    owner: "Bob Hoying",
  },
  {
    customer: "Nimbus Analytics",
    invoice: "INV-1092",
    daysLate: 112,
    amount: 3456.8,
    owner: "Bob Hoying",
  },
  {
    customer: "Wayfinder Co.",
    invoice: "INV-1034",
    daysLate: 107,
    amount: 5234.15,
    owner: "Bob Hoying",
  },
  {
    customer: "Pioneer Foods",
    invoice: "INV-1067",
    daysLate: 102,
    amount: 2890.5,
    owner: "Bob Hoying",
  },
  {
    customer: "Northwind Traders",
    invoice: "INV-1089",
    daysLate: 98,
    amount: 7123.4,
    owner: "Bob Hoying",
  },
  {
    customer: "Starlight Media",
    invoice: "INV-1045",
    daysLate: 95,
    amount: 4567.25,
    owner: "Bob Hoying",
  },
  {
    customer: "Union Fabricators",
    invoice: "INV-1078",
    daysLate: 93,
    amount: 3890.6,
    owner: "Bob Hoying",
  },
  {
    customer: "Vantage Systems",
    invoice: "INV-1099",
    daysLate: 91,
    amount: 6234.85,
    owner: "Bob Hoying",
  },
  {
    customer: "Maple & Co.",
    invoice: "INV-1104",
    daysLate: 90,
    amount: 2145.3,
    owner: "Bob Hoying",
  },
];

type InputMode = "prompt" | "document" | "process";
type PromptStep = "input" | "config" | "final";
type DocumentTab = "upload" | "sop" | "breakdown" | "workflow";

export default function AutonomyStudioPage() {
  const [inputMode, setInputMode] = useState<InputMode>("prompt");

  const [promptStep, setPromptStep] = useState<PromptStep>("input");
  const [promptText, setPromptText] = useState(
    "Send Bob Hoying a report of all his customers that are over 90 days late every Monday at 9am"
  );
  const [automationState, setAutomationState] = useState<AutomationState>({
    recipient: "Bob Hoying",
    thresholdDays: 90,
    dayOfWeek: "Monday",
    time: "09:00",
    timezone: "America/Los_Angeles",
    channel: "Email (PDF report)",
    subject: "Overdue customers over 90 days – weekly report",
  });

  const [documentTab, setDocumentTab] = useState<DocumentTab>("upload");
  const [unlocked, setUnlocked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Ready");
  const [parserLog, setParserLog] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [currentSOP, setCurrentSOP] = useState<SOP | null>(null);
  const [sopText, setSOPText] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState<{ from: string } | null>(null);
  const [nodeForm, setNodeForm] = useState({
    title: "",
    owner: "",
    type: "Get Data",
    auto: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSampleSOP();
  }, []);

  const loadSampleSOP = async () => {
    try {
      const res = await fetch("/api/p2a");
      const sops = await res.json();
      if (sops && sops.length > 0) {
        setCurrentSOP(sops[0]);
      }
    } catch (error) {
      console.error("Error loading sample SOP:", error);
    }
  };

  const log = (msg: string) => {
    setParserLog((prev) => [`${new Date().toISOString()} - ${msg}`, ...prev]);
  };

  const parsePrompt = (text: string): Partial<AutomationState> => {
    const updates: Partial<AutomationState> = {};

    const recipientMatch = text.match(/Send\s+([^,]+?)\s+(?:a\s+report|the|an)\b/i);
    if (recipientMatch) updates.recipient = recipientMatch[1].trim();

    const daysMatch = text.match(/(?:over|>\s*|\b)\s*(\d{1,3})\s*\+?\s*days\b/i);
    if (daysMatch) updates.thresholdDays = Math.max(1, parseInt(daysMatch[1], 10));

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    for (const d of days) {
      if (new RegExp(d, "i").test(text)) {
        updates.dayOfWeek = d;
        break;
      }
    }

    const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const ampm = timeMatch[3].toLowerCase();
      if (ampm === "pm" && h < 12) h += 12;
      if (ampm === "am" && h === 12) h = 0;
      updates.time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    return updates;
  };

  const handleBuild = () => {
    const parsed = parsePrompt(promptText);
    setAutomationState((prev) => ({ ...prev, ...parsed }));
    setPromptStep("config");
  };

  const filteredInvoices = SAMPLE_INVOICES.filter(
    (inv) =>
      inv.owner === automationState.recipient && inv.daysLate >= automationState.thresholdDays
  )
    .sort((a, b) => b.daysLate - a.daysLate)
    .slice(0, 12);

  const calculateNextRun = () => {
    const dayMap: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };
    const now = new Date();
    const [hh, mm] = automationState.time.split(":").map(Number);
    const target = new Date(now);
    target.setHours(hh, mm, 0, 0);
    const diffDays = (dayMap[automationState.dayOfWeek] - now.getDay() + 7) % 7;
    if (diffDays === 0 && target <= now) {
      target.setDate(target.getDate() + 7);
    } else {
      target.setDate(target.getDate() + diffDays);
    }
    return (
      target.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      ` at ${automationState.time}`
    );
  };

  const handleFinalize = () => {
    toast.success("Automation created successfully");
    setPromptStep("final");
  };

  const simulateIngest = (text: string, extras?: Partial<SOP>) => {
    let p = 0;
    setStatus("Parsing...");
    const interval = setInterval(() => {
      p = Math.min(100, p + Math.floor(Math.random() * 18) + 7);
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setStatus("Complete");
          setProgress(100);
          processUpload(text, extras);
        }, 300);
      }
    }, 350);
  };

  const processUpload = (text: string, extras?: Partial<SOP>) => {
    setSOPText(text);

    const extractedTasks = extractTasksFromText(text, extras);
    setTasks(extractedTasks);

    seedDefaultNodes();

    setUnlocked(true);
    setDocumentTab("sop");
  };

  const extractTasksFromText = (text: string, extras?: Partial<SOP>): Task[] => {
    const steps = extras?.steps || [];
    const defaultTasks =
      steps.length > 0
        ? steps
        : [
            "Collect inputs and validate scope",
            "Prepare templates or forms",
            "Route for review or approval",
            "Execute action",
            "Log outcome and notify stakeholders",
          ];

    const owners = [
      "Data Bot",
      "Analyst",
      "Content Bot",
      "Scheduler",
      "CRM Bot",
      "Controller",
      "Finance Lead",
    ];
    const types = [
      "Get Data",
      "Transform",
      "Send Email",
      "Schedule",
      "Update System",
      "Decision",
      "Notify",
    ];

    return defaultTasks.slice(0, 8).map((title, i) => ({
      title,
      owner: owners[i % owners.length],
      type: types[i % types.length],
      automation: autoSuggest(title),
      state: i % 3 === 0 ? "Auto" : i % 3 === 1 ? "Review" : "Manual",
    }));
  };

  const autoSuggest = (title: string): string => {
    const s = title.toLowerCase();
    if (s.includes("extract") || s.includes("collect") || s.includes("get") || s.includes("pull"))
      return "Use connector to fetch data with filters";
    if (
      s.includes("segment") ||
      s.includes("classify") ||
      s.includes("validate") ||
      s.includes("transform")
    )
      return "Apply business rules; enrich with lookups";
    if (s.includes("reminder") || s.includes("email") || s.includes("notify"))
      return "Generate email draft from template with tokens";
    if (s.includes("schedule") || s.includes("post at"))
      return "Set weekday schedule; timezone aware; avoid weekends";
    if (s.includes("log") || s.includes("update")) return "Write back to system with tags";
    if (s.includes("approve") || s.includes("review")) return "Route to approver; collect comments";
    return "Suggest automation based on task type";
  };

  const seedDefaultNodes = () => {
    const defaultNodes: WorkflowNode[] = [
      {
        id: "n1",
        title: "Get Data",
        owner: "Data Bot",
        type: "Get Data",
        auto: "Fetch with filters",
        x: 20,
        y: 40,
      },
      {
        id: "n2",
        title: "Transform",
        owner: "Analyst",
        type: "Transform",
        auto: "Apply rules",
        x: 260,
        y: 60,
      },
      {
        id: "n3",
        title: "Send Email",
        owner: "Content Bot",
        type: "Send Email",
        auto: "Templates with tokens",
        x: 520,
        y: 40,
      },
      {
        id: "n4",
        title: "Schedule",
        owner: "Scheduler",
        type: "Schedule",
        auto: "TZ aware, weekdays",
        x: 780,
        y: 60,
      },
      {
        id: "n5",
        title: "Update System",
        owner: "CRM Bot",
        type: "Update System",
        auto: "Writeback and tag",
        x: 520,
        y: 200,
      },
      {
        id: "n6",
        title: "Decision",
        owner: "Controller",
        type: "Decision",
        auto: "Classify outcomes",
        x: 780,
        y: 220,
      },
      {
        id: "n7",
        title: "Notify",
        owner: "Finance Lead",
        type: "Notify",
        auto: "Escalation ticket",
        x: 1040,
        y: 120,
      },
    ];

    const defaultEdges: WorkflowEdge[] = [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
      { from: "n3", to: "n4" },
      { from: "n3", to: "n5" },
      { from: "n5", to: "n6" },
      { from: "n6", to: "n7" },
    ];

    setNodes(defaultNodes);
    setEdges(defaultEdges);
  };

  const handleFileSelect = (file: File) => {
    log(`Received file: ${file.name}`);
    const ext = file.name.split(".").pop()?.toLowerCase() || "";

    if (ext === "docx" || ext === "pdf") {
      log(`Parsing ${ext.toUpperCase()} via adapter`);
      const sampleText = `Title: Parsed ${ext.toUpperCase()} Document\nOwner: Unassigned\nFrequency: Ad hoc\nSLA: None\nScope: Adapter extracted structure\n\nProcess Steps:\n1. Identify key inputs\n2. Extract headings and bullet points\n3. Generate tasks and automations\n4. Route exceptions to manual review\n5. Produce summary\n\nInputs:\n- File content\n- Metadata\n\nOutputs:\n- Task list\n- Workflow JSON`;

      simulateIngest(sampleText, {
        steps: [
          "Identify key inputs",
          "Extract headings and bullet points",
          "Generate tasks and automations",
          "Route exceptions to manual review",
          "Produce summary",
        ],
        inputs: ["File content", "Metadata"],
        outputs: ["Task list", "Workflow JSON"],
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        simulateIngest(text || `[Empty file: ${file.name}]`);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSimulatedUpload = (fileType: "docx" | "pdf") => {
    const fileName = fileType === "docx" ? "AR_Dunning_SOP.docx" : "Month_End_Close.pdf";
    const blob = new Blob(["Simulated content"], { type: "application/" + fileType });
    const file = new File([blob], fileName, { type: blob.type });
    handleFileSelect(file);
  };

  const gotoDocumentTab = (tab: DocumentTab) => {
    if (!unlocked && tab !== "upload") {
      alert("Please upload a document first.");
      return;
    }
    setDocumentTab(tab);
  };

  const addTask = () => {
    setTasks([
      ...tasks,
      {
        title: "New Task",
        owner: "Unassigned",
        type: "Transform",
        automation: "Describe automation",
        state: "Review",
      },
    ]);
  };

  const updateTask = (index: number, field: keyof Task, value: string) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setTasks(newTasks);
  };

  const addNode = () => {
    const id = "n" + Math.random().toString(36).slice(2, 8);
    setNodes([
      ...nodes,
      {
        id,
        title: "New Step",
        owner: "Unassigned",
        type: "Transform",
        auto: "",
        x: 60 + nodes.length * 30,
        y: 60,
      },
    ]);
    setSelectedNodeId(id);
  };

  const selectNode = (id: string) => {
    setSelectedNodeId(id);
    const node = nodes.find((n) => n.id === id);
    if (node) {
      setNodeForm({
        title: node.title,
        owner: node.owner,
        type: node.type,
        auto: node.auto,
      });
    }
  };

  const applyNodeChanges = () => {
    if (!selectedNodeId) return;
    setNodes(nodes.map((n) => (n.id === selectedNodeId ? { ...n, ...nodeForm } : n)));
  };

  const deleteNode = () => {
    if (!selectedNodeId) return;
    setNodes(nodes.filter((n) => n.id !== selectedNodeId));
    setEdges(edges.filter((e) => e.from !== selectedNodeId && e.to !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const handleConnectFrom = () => {
    if (!selectedNodeId) {
      alert("Select a node first.");
      return;
    }
    setConnectMode({ from: selectedNodeId });
    alert("Now select the destination node and click Connect To Selected.");
  };

  const handleConnectTo = () => {
    if (!selectedNodeId) {
      alert("Select a node first.");
      return;
    }
    if (!connectMode) {
      alert("Choose a from node first.");
      return;
    }
    if (connectMode.from === selectedNodeId) {
      alert("Cannot connect a node to itself.");
      return;
    }
    setEdges([...edges, { from: connectMode.from, to: selectedNodeId }]);
    setConnectMode(null);
  };

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0 }}>
      {/* Page Header */}
      <header className="sticky top-0 z-10 bg-white px-6 py-2 flex-shrink-0">
        <Breadcrumb activeRoute="automation/autonomy-studio" className="mb-1.5" />
        <h1 className="text-2xl font-bold text-[#000000] mt-2">Autonomy Studio</h1>
        <p className="text-sm text-[#606060]">
          Create automations using natural language or document upload
        </p>
        <div className="border-b border-[#B7B7B7] mt-4"></div>
      </header>
      <div className="flex-1 overflow-auto">
        <div className="w-full p-6">
          <Tabs
            value={inputMode}
            onValueChange={(v) => setInputMode(v as InputMode)}
            className="mb-6"
          >
            <TabsList className="grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="prompt">Prompt Mode</TabsTrigger>
              <TabsTrigger value="document">Document Mode</TabsTrigger>
              <TabsTrigger value="process">Process Autonomy</TabsTrigger>
            </TabsList>

            <TabsContent value="prompt" className="space-y-4">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border-2",
                    promptStep === "input"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white border-dashed"
                  )}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      promptStep === "input" ? "bg-blue-500" : "bg-slate-300"
                    )}
                  />
                  <span
                    className={
                      promptStep === "input" ? "text-slate-900 font-medium" : "text-slate-500"
                    }
                  >
                    1. Prompt
                  </span>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border-2",
                    promptStep === "config"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white border-dashed"
                  )}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      promptStep === "config" ? "bg-blue-500" : "bg-slate-300"
                    )}
                  />
                  <span
                    className={
                      promptStep === "config" ? "text-slate-900 font-medium" : "text-slate-500"
                    }
                  >
                    2. Configure
                  </span>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border-2",
                    promptStep === "final"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white border-dashed"
                  )}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      promptStep === "final" ? "bg-blue-500" : "bg-slate-300"
                    )}
                  />
                  <span
                    className={
                      promptStep === "final" ? "text-slate-900 font-medium" : "text-slate-500"
                    }
                  >
                    3. Finalize
                  </span>
                </div>
              </div>

              {promptStep === "input" && (
                <>
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Describe the automation you want</h2>
                    <div className="flex gap-3 mb-2">
                      <Textarea
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        placeholder="e.g., Send Bob Hoying a report of all his customers that are over 90 days late every Monday at 9am"
                        className="flex-1 min-h-[100px]"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-500">
                        Tip: mention a recipient, the condition (e.g., over 60/90 days late), and a
                        schedule (e.g., every Tuesday at 10am).
                      </p>
                      <Button onClick={handleBuild} className="bg-blue-600 hover:bg-blue-700">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Build
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <p className="text-sm text-slate-700">Mock data only – for UX demo purposes.</p>
                  </Card>
                </>
              )}

              {promptStep === "config" && (
                <div className="space-y-4">
                  <Card className="p-4 bg-white">
                    <p className="text-sm text-blue-600 mb-3">
                      We parsed your prompt into editable building blocks. Tweak anything below,
                      then finalize.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Data: Overdue &gt; {automationState.thresholdDays} days
                      </Badge>
                      <Badge variant="outline" className="gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        Recipient: {automationState.recipient}
                      </Badge>
                      <Badge variant="outline" className="gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Schedule: Every {automationState.dayOfWeek} @ {automationState.time}{" "}
                        {automationState.timezone}
                      </Badge>
                    </div>
                  </Card>

                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4 bg-white">
                      <div className="flex items-center gap-2 mb-3">
                        <Database className="h-4 w-4 text-blue-600" />
                        <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                          Get Data
                        </h3>
                      </div>
                      <h4 className="text-lg font-semibold mb-4">
                        Customers over {automationState.thresholdDays} Days Late
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs text-slate-600">Overdue threshold (days)</Label>
                          <Input
                            type="number"
                            value={automationState.thresholdDays}
                            onChange={(e) =>
                              setAutomationState((prev) => ({
                                ...prev,
                                thresholdDays: parseInt(e.target.value) || 0,
                              }))
                            }
                            min="1"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-slate-600">Filters</Label>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              Owner: {automationState.recipient}
                            </Badge>
                            <Badge variant="outline" className="gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                              Open invoices only
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs text-slate-600">
                            Preview ({filteredInvoices.length} matches)
                          </Label>
                          <div className="mt-1 border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-50">
                                  <TableHead className="text-xs">Customer</TableHead>
                                  <TableHead className="text-xs">Invoice</TableHead>
                                  <TableHead className="text-xs">Days Late</TableHead>
                                  <TableHead className="text-xs text-right">Amount</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredInvoices.map((inv, idx) => (
                                  <TableRow key={idx} className="text-sm">
                                    <TableCell>{inv.customer}</TableCell>
                                    <TableCell>{inv.invoice}</TableCell>
                                    <TableCell>{inv.daysLate}</TableCell>
                                    <TableCell className="text-right">
                                      $
                                      {inv.amount.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                      })}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-white">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="h-4 w-4 text-blue-600" />
                        <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                          Recipient
                        </h3>
                      </div>
                      <h4 className="text-lg font-semibold mb-4">{automationState.recipient}</h4>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs text-slate-600">
                            Send To (person or group)
                          </Label>
                          <Input
                            value={automationState.recipient}
                            onChange={(e) =>
                              setAutomationState((prev) => ({ ...prev, recipient: e.target.value }))
                            }
                            list="people"
                            className="mt-1"
                          />
                          <datalist id="people">
                            <option>Bob Hoying</option>
                            <option>Ana Delgado</option>
                            <option>Samir Patel</option>
                          </datalist>
                        </div>

                        <div>
                          <Label className="text-xs text-slate-600">Delivery channel</Label>
                          <Select
                            value={automationState.channel}
                            onValueChange={(v) =>
                              setAutomationState((prev) => ({ ...prev, channel: v }))
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Email (PDF report)">Email (PDF report)</SelectItem>
                              <SelectItem value="Slack DM (link + summary)">
                                Slack DM (link + summary)
                              </SelectItem>
                              <SelectItem value="Teams chat (link + summary)">
                                Teams chat (link + summary)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs text-slate-600">Subject / Message</Label>
                          <Input
                            value={automationState.subject}
                            onChange={(e) =>
                              setAutomationState((prev) => ({ ...prev, subject: e.target.value }))
                            }
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-slate-600">Sample message preview</Label>
                          <div className="mt-1 p-3 border rounded-lg bg-blue-50 text-sm">
                            <strong>Hi {automationState.recipient.split(" ")[0]},</strong>
                            <br />
                            Here is your weekly list of customers with invoices over{" "}
                            {automationState.thresholdDays} days late. I'll deliver this every{" "}
                            {automationState.dayOfWeek} at {automationState.time}{" "}
                            {automationState.timezone}.
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-white">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                          Schedule
                        </h3>
                      </div>
                      <h4 className="text-lg font-semibold mb-4">
                        Every {automationState.dayOfWeek} at {automationState.time}
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs text-slate-600">Day of week</Label>
                          <Select
                            value={automationState.dayOfWeek}
                            onValueChange={(v) =>
                              setAutomationState((prev) => ({ ...prev, dayOfWeek: v }))
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Monday">Monday</SelectItem>
                              <SelectItem value="Tuesday">Tuesday</SelectItem>
                              <SelectItem value="Wednesday">Wednesday</SelectItem>
                              <SelectItem value="Thursday">Thursday</SelectItem>
                              <SelectItem value="Friday">Friday</SelectItem>
                              <SelectItem value="Saturday">Saturday</SelectItem>
                              <SelectItem value="Sunday">Sunday</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs text-slate-600">Time</Label>
                          <Input
                            type="time"
                            value={automationState.time}
                            onChange={(e) =>
                              setAutomationState((prev) => ({ ...prev, time: e.target.value }))
                            }
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-slate-600">Timezone</Label>
                          <Select
                            value={automationState.timezone}
                            onValueChange={(v) =>
                              setAutomationState((prev) => ({ ...prev, timezone: v }))
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="America/Los_Angeles">
                                America/Los_Angeles
                              </SelectItem>
                              <SelectItem value="America/New_York">America/New_York</SelectItem>
                              <SelectItem value="UTC">UTC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs text-slate-600">Next run</Label>
                          <Badge variant="outline" className="gap-1.5 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            {calculateNextRun()} ({automationState.timezone})
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-4 bg-white">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => toast.info("Test run simulated")}>
                        Test run (simulate)
                      </Button>
                      <Button variant="outline" onClick={() => setPromptStep("input")}>
                        Edit prompt
                      </Button>
                      <Button
                        onClick={handleFinalize}
                        className="bg-green-600 hover:bg-green-700 font-bold"
                      >
                        Finalize & Create Agent Task
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

              {promptStep === "final" && (
                <Card className="p-6 bg-white">
                  <h2 className="text-lg font-semibold mb-2">Agent Task Created</h2>
                  <p className="text-sm text-blue-600 mb-4">
                    Your automation is live. You can pause or adjust it anytime.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Badge variant="outline" className="gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Data: Overdue &gt; {automationState.thresholdDays} days
                    </Badge>
                    <Badge variant="outline" className="gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      Recipient: {automationState.recipient}
                    </Badge>
                    <Badge variant="outline" className="gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Schedule: Every {automationState.dayOfWeek} @ {automationState.time}{" "}
                      {automationState.timezone}
                    </Badge>
                    <Badge variant="outline" className="gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      Channel: {automationState.channel}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => {
                      setPromptStep("input");
                      setPromptText("");
                    }}
                  >
                    Create another automation
                  </Button>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="document" className="space-y-4">
              <div className="flex gap-2 mb-4 flex-wrap">
                <Button
                  variant={documentTab === "upload" ? "default" : "outline"}
                  onClick={() => gotoDocumentTab("upload")}
                  className={unlocked ? "" : "opacity-100"}
                >
                  0) Upload
                </Button>
                <Button
                  variant={documentTab === "sop" ? "default" : "outline"}
                  onClick={() => gotoDocumentTab("sop")}
                  disabled={!unlocked}
                >
                  1) SOP
                </Button>
                <Button
                  variant={documentTab === "breakdown" ? "default" : "outline"}
                  onClick={() => gotoDocumentTab("breakdown")}
                  disabled={!unlocked}
                >
                  2) AI Task Breakdown
                </Button>
                <Button
                  variant={documentTab === "workflow" ? "default" : "outline"}
                  onClick={() => gotoDocumentTab("workflow")}
                  disabled={!unlocked}
                >
                  3) Workflow
                </Button>
              </div>

              {documentTab === "upload" && (
                <Card className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700 mb-3">UPLOAD AN SOP</h3>
                      <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                          dragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50"
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FileUp className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                        <p className="font-medium text-slate-700">
                          Drag and drop your SOP here, or click to select
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          Native: .txt .md .csv .json. Adapters: .docx .pdf
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                        />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSimulatedUpload("docx")}
                        >
                          Simulate DOCX Upload
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSimulatedUpload("pdf")}
                        >
                          Simulate PDF Upload
                        </Button>
                      </div>

                      <div className="mt-6">
                        <h3 className="text-sm font-medium text-slate-700 mb-3">PROGRESS</h3>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full bg-blue-600 transition-all"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-slate-600">
                          Status: <span className="font-medium">{status}</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-slate-700">PARSER LOG</h3>
                        <Button variant="ghost" size="sm" onClick={() => setParserLog([])}>
                          Clear Log
                        </Button>
                      </div>
                      <Card className="p-3 bg-slate-900 text-slate-300 font-mono text-xs h-80 overflow-auto">
                        {parserLog.map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                        {parserLog.length === 0 && (
                          <div className="text-slate-500">No logs yet...</div>
                        )}
                      </Card>
                    </div>
                  </div>
                </Card>
              )}

              {documentTab === "sop" && (
                <Card className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700 mb-3">SOP TEXT</h3>
                      <Textarea
                        value={sopText}
                        onChange={(e) => setSOPText(e.target.value)}
                        className="min-h-[400px] font-mono text-sm"
                      />
                      <Button className="mt-3 bg-blue-600 hover:bg-blue-700">
                        AI Suggest Breakdown
                      </Button>
                      <p className="text-xs text-slate-500 mt-2">
                        You can edit the SOP and regenerate the breakdown.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-slate-700 mb-3">SOP HIGHLIGHTS</h3>
                      <Card className="p-4 mb-4 font-mono text-sm space-y-1">
                        <div>Title: {currentSOP?.title || "Untitled SOP"}</div>
                        <div>Owner: {currentSOP?.owner || "Unassigned"}</div>
                        <div>Frequency: {currentSOP?.frequency || "Ad hoc"}</div>
                        <div>SLA: {currentSOP?.sla || "None"}</div>
                        <div>Scope: {currentSOP?.scope || "Not specified"}</div>
                      </Card>

                      <h3 className="text-sm font-medium text-slate-700 mb-3 mt-6">
                        EXTRACTED STRUCTURE
                      </h3>
                      <Card className="p-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-xs font-medium text-slate-600 mb-2">Sections</div>
                            <div className="font-mono text-xs">
                              {currentSOP?.sections.map((s, i) => (
                                <div key={i}>
                                  {i + 1}. {s}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-slate-600 mb-2">
                              Detected Steps
                            </div>
                            <div className="font-mono text-xs">
                              {currentSOP?.steps.map((s, i) => (
                                <div key={i}>
                                  {i + 1}. {s}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-4 grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-medium text-slate-600 mb-2">Inputs</div>
                            <div className="font-mono text-xs">
                              {currentSOP?.inputs.map((inp, i) => (
                                <div key={i}>- {inp}</div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-slate-600 mb-2">Outputs</div>
                            <div className="font-mono text-xs">
                              {currentSOP?.outputs.map((out, i) => (
                                <div key={i}>- {out}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                </Card>
              )}

              {documentTab === "breakdown" && (
                <Card className="p-6">
                  <div className="flex gap-2 mb-4">
                    <Button variant="outline" onClick={addTask}>
                      Add Task
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTasks(tasks.map((t) => ({ ...t, automation: autoSuggest(t.title) })));
                        alert("Automations updated based on task names.");
                      }}
                    >
                      Recommend Automations
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => gotoDocumentTab("workflow")}
                    >
                      Continue to Workflow
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-[40px_1fr_1fr_2fr_120px] gap-3 font-medium text-xs text-slate-600 pb-2 border-b">
                      <div className="text-center">#</div>
                      <div>Task</div>
                      <div>Owner</div>
                      <div>Automation</div>
                      <div>State</div>
                    </div>

                    {tasks.map((task, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[40px_1fr_1fr_2fr_120px] gap-3 items-center py-2 border-b"
                      >
                        <div className="text-center font-semibold text-slate-500">{i + 1}</div>
                        <Input
                          value={task.title}
                          onChange={(e) => updateTask(i, "title", e.target.value)}
                          className="h-8 text-sm"
                        />
                        <Input
                          value={task.owner}
                          onChange={(e) => updateTask(i, "owner", e.target.value)}
                          className="h-8 text-sm"
                        />
                        <Input
                          value={task.automation}
                          onChange={(e) => updateTask(i, "automation", e.target.value)}
                          className="h-8 text-sm"
                        />
                        <Select
                          value={task.state}
                          onValueChange={(v) => updateTask(i, "state", v as Task["state"])}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Auto">Auto</SelectItem>
                            <SelectItem value="Review">Review</SelectItem>
                            <SelectItem value="Manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-slate-500 mt-4">
                    Inline-editable. States: Auto, Review, Manual.
                  </p>
                </Card>
              )}

              {documentTab === "workflow" && (
                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-sm font-medium text-slate-700 mb-3">VISUAL FLOW</h3>
                    <div
                      className="relative border-2 border-dashed border-slate-300 rounded-lg p-4 min-h-[400px] bg-slate-50"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(45deg, #fafafa, #fafafa 10px, #fff 10px, #fff 20px)",
                      }}
                    >
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{ zIndex: 0 }}
                      >
                        <defs>
                          <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="10"
                            refX="6"
                            refY="3"
                            orient="auto"
                          >
                            <path d="M0,0 L0,6 L6,3 z" fill="#94a3b8" />
                          </marker>
                        </defs>
                        {edges.map((edge, i) => {
                          const fromNode = nodes.find((n) => n.id === edge.from);
                          const toNode = nodes.find((n) => n.id === edge.to);
                          if (!fromNode || !toNode) return null;
                          const x1 = fromNode.x + 130;
                          const y1 = fromNode.y + 60;
                          const x2 = toNode.x + 20;
                          const y2 = toNode.y + 20;
                          return (
                            <path
                              key={i}
                              d={`M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x2 - 60} ${y2}, ${x2} ${y2}`}
                              fill="none"
                              stroke="#94a3b8"
                              strokeWidth="2"
                              markerEnd="url(#arrowhead)"
                            />
                          );
                        })}
                      </svg>

                      {nodes.map((node) => (
                        <div
                          key={node.id}
                          className="absolute bg-white border border-slate-300 rounded-lg p-3 shadow-md cursor-move min-w-[190px] max-w-[260px]"
                          style={{ left: node.x, top: node.y, zIndex: 1 }}
                        >
                          <h4 className="font-semibold text-sm mb-1">{node.title}</h4>
                          <div className="text-xs text-slate-600 mb-1">Owner: {node.owner}</div>
                          <div className="text-xs text-slate-600 mb-1">Type: {node.type}</div>
                          <div className="text-xs text-slate-600 mb-2">
                            Automation: {node.auto || "None"}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => selectNode(node.id)}
                            >
                              Select
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => selectNode(node.id)}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" onClick={addNode}>
                        Add Node
                      </Button>
                      <Button variant="ghost" onClick={seedDefaultNodes}>
                        Reset Layout
                      </Button>
                      <Button variant="outline">Validate</Button>
                      <Button className="bg-blue-600 hover:bg-blue-700">Finalize Automation</Button>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-sm font-medium text-slate-700 mb-3">NODE INSPECTOR</h3>
                    <div className="grid gap-3">
                      <div>
                        <label className="text-xs text-slate-600 mb-1 block">Title</label>
                        <Input
                          value={nodeForm.title}
                          onChange={(e) => setNodeForm({ ...nodeForm, title: e.target.value })}
                          placeholder="Node title"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 mb-1 block">Owner</label>
                        <Input
                          value={nodeForm.owner}
                          onChange={(e) => setNodeForm({ ...nodeForm, owner: e.target.value })}
                          placeholder="Owner or Role"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 mb-1 block">Action Type</label>
                        <Select
                          value={nodeForm.type}
                          onValueChange={(v) => setNodeForm({ ...nodeForm, type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Get Data">Get Data</SelectItem>
                            <SelectItem value="Transform">Transform</SelectItem>
                            <SelectItem value="Send Email">Send Email</SelectItem>
                            <SelectItem value="Create Task">Create Task</SelectItem>
                            <SelectItem value="Schedule">Schedule</SelectItem>
                            <SelectItem value="Decision">Decision</SelectItem>
                            <SelectItem value="Notify">Notify</SelectItem>
                            <SelectItem value="Update System">Update System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 mb-1 block">Automation</label>
                        <Input
                          value={nodeForm.auto}
                          onChange={(e) => setNodeForm({ ...nodeForm, auto: e.target.value })}
                          placeholder="e.g., Generate email draft from template"
                        />
                      </div>

                      <div className="flex gap-2 mt-2">
                        <Button
                          className="bg-green-600 hover:bg-green-700"
                          onClick={applyNodeChanges}
                        >
                          Apply
                        </Button>
                        <Button variant="destructive" onClick={deleteNode}>
                          Delete Node
                        </Button>
                      </div>

                      <div className="border-t pt-3 mt-2">
                        <h4 className="text-xs font-medium text-slate-600 mb-2">CONNECTIONS</h4>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleConnectFrom}>
                            Connect From Selected
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleConnectTo}>
                            Connect To Selected
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="process" className="space-y-4">
              <AutonomyCapabilitiesShell />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
