"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import type {
  SOP,
  Task,
  WorkflowNode,
  WorkflowEdge,
  AutomationState,
  InputMode,
  PromptStep,
  DocumentTab,
} from "../types";
import {
  SAMPLE_INVOICES,
  DEFAULT_NODES,
  DEFAULT_EDGES,
  TASK_OWNERS,
  TASK_TYPES,
  DEFAULT_PROMPT_TEXT,
  DEFAULT_AUTOMATION_STATE,
} from "../constants";

export function useAutonomyStudio() {
  const [inputMode, setInputMode] = useState<InputMode>("prompt");

  const [promptStep, setPromptStep] = useState<PromptStep>("input");
  const [promptText, setPromptText] = useState(DEFAULT_PROMPT_TEXT);
  const [automationState, setAutomationState] = useState<AutomationState>(DEFAULT_AUTOMATION_STATE);

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

  const fileInputRef = useRef<HTMLInputElement>(null!);

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

    return defaultTasks.slice(0, 8).map((title, i) => ({
      title,
      owner: TASK_OWNERS[i % TASK_OWNERS.length],
      type: TASK_TYPES[i % TASK_TYPES.length],
      automation: autoSuggest(title),
      state: i % 3 === 0 ? "Auto" : i % 3 === 1 ? "Review" : "Manual",
    }));
  };

  const seedDefaultNodes = () => {
    setNodes(DEFAULT_NODES);
    setEdges(DEFAULT_EDGES);
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

  return {
    // Input mode
    inputMode,
    setInputMode,

    // Prompt mode
    promptStep,
    setPromptStep,
    promptText,
    setPromptText,
    automationState,
    setAutomationState,
    handleBuild,
    handleFinalize,
    filteredInvoices,
    calculateNextRun,

    // Document mode
    documentTab,
    setDocumentTab,
    unlocked,
    progress,
    status,
    parserLog,
    setParserLog,
    dragOver,
    setDragOver,
    currentSOP,
    sopText,
    setSOPText,
    tasks,
    setTasks,
    nodes,
    edges,
    selectedNodeId,
    nodeForm,
    setNodeForm,
    fileInputRef,

    // Document actions
    handleDrop,
    handleFileSelect,
    handleSimulatedUpload,
    gotoDocumentTab,
    addTask,
    updateTask,
    autoSuggest,
    addNode,
    selectNode,
    applyNodeChanges,
    deleteNode,
    handleConnectFrom,
    handleConnectTo,
    seedDefaultNodes,
  };
}
