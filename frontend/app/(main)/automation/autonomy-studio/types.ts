export interface SOP {
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

export interface Task {
  title: string;
  owner: string;
  type: string;
  automation: string;
  state: "Auto" | "Review" | "Manual";
}

export interface WorkflowNode {
  id: string;
  title: string;
  owner: string;
  type: string;
  auto: string;
  x: number;
  y: number;
}

export interface WorkflowEdge {
  from: string;
  to: string;
}

export interface AutomationState {
  recipient: string;
  thresholdDays: number;
  dayOfWeek: string;
  time: string;
  timezone: string;
  channel: string;
  subject: string;
}

export interface InvoicePreview {
  customer: string;
  invoice: string;
  daysLate: number;
  amount: number;
  owner: string;
}

export type InputMode = "prompt" | "document" | "process";
export type PromptStep = "input" | "config" | "final";
export type DocumentTab = "upload" | "sop" | "breakdown" | "workflow";
