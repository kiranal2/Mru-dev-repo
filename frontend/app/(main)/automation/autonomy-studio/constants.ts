import type { InvoicePreview, WorkflowNode, WorkflowEdge } from "./types";

export const SAMPLE_INVOICES: InvoicePreview[] = [
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

export const DEFAULT_NODES: WorkflowNode[] = [
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

export const DEFAULT_EDGES: WorkflowEdge[] = [
  { from: "n1", to: "n2" },
  { from: "n2", to: "n3" },
  { from: "n3", to: "n4" },
  { from: "n3", to: "n5" },
  { from: "n5", to: "n6" },
  { from: "n6", to: "n7" },
];

export const TASK_OWNERS = [
  "Data Bot",
  "Analyst",
  "Content Bot",
  "Scheduler",
  "CRM Bot",
  "Controller",
  "Finance Lead",
];

export const TASK_TYPES = [
  "Get Data",
  "Transform",
  "Send Email",
  "Schedule",
  "Update System",
  "Decision",
  "Notify",
];

export const DEFAULT_PROMPT_TEXT =
  "Send Bob Hoying a report of all his customers that are over 90 days late every Monday at 9am";

export const DEFAULT_AUTOMATION_STATE: import("./types").AutomationState = {
  recipient: "Bob Hoying",
  thresholdDays: 90,
  dayOfWeek: "Monday",
  time: "09:00",
  timezone: "America/Los_Angeles",
  channel: "Email (PDF report)",
  subject: "Overdue customers over 90 days -- weekly report",
};
