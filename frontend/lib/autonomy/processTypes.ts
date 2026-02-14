export type AutonomyStage = "INGEST" | "DESIGN" | "SIMULATE" | "DEPLOY";

export type AgentProcessTaskId =
  | "T1_INTAKE"
  | "T2_EXTRACT_VALIDATE"
  | "T3_CODING"
  | "T4_REVIEW"
  | "T5_ROUTE"
  | "T6_APPROVE"
  | "T7_POST_ERP"
  | "T8_SCHEDULE_PAYMENT"
  | "T9_ARCHIVE_CLOSE";

export interface AgentProcessTask {
  id: AgentProcessTaskId;
  label: string;
  description: string;
  humanRole: "PREPARER" | "REVIEWER" | "APPROVER" | "SYSTEM";
  agentName: string;
  slaLabel?: string;
  requiresHumanAction: boolean;
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
}

export interface AgentConfig {
  name: string;
  type: "SUPERVISOR" | "WORKER";
  description: string;
  handlesTasks: AgentProcessTaskId[];
}

export interface AgentSimulationEvent {
  timestamp: string;
  taskId: AgentProcessTaskId;
  title: string;
  details: string;
  severity?: "INFO" | "WARN" | "ERROR";
}

export interface AgentProcessDesign {
  id: string;
  name: string;
  sourceType: "SOP" | "PROMPT" | "OTHER";
  sourceSummary: string;
  tasks: AgentProcessTask[];
  agents: AgentConfig[];
  stage: AutonomyStage;
}

export const mockProcessDesign: AgentProcessDesign = {
  id: "proc-001",
  name: "Non-PO Vendor Invoice Processing",
  sourceType: "SOP",
  sourceSummary:
    "SOP FIN-AP-SOP-002: Automated workflow for processing vendor invoices that do not require purchase orders. Covers intake, validation, coding, approval routing, and payment scheduling.",
  stage: "INGEST",
  tasks: [
    {
      id: "T1_INTAKE",
      label: "Invoice Intake",
      description: "Receive invoice via email or portal and create draft record",
      humanRole: "SYSTEM",
      agentName: "AP Intake Agent",
      slaLabel: "Within 1 business day",
      requiresHumanAction: false,
      status: "PENDING",
    },
    {
      id: "T2_EXTRACT_VALIDATE",
      label: "Extract & Validate",
      description: "OCR/extract invoice fields and validate against vendor master data",
      humanRole: "SYSTEM",
      agentName: "Extract & Validate Agent",
      slaLabel: "Within 4 hours",
      requiresHumanAction: false,
      status: "PENDING",
    },
    {
      id: "T3_CODING",
      label: "GL Coding",
      description: "Assign GL account codes based on vendor, amount, and historical patterns",
      humanRole: "PREPARER",
      agentName: "Coding Agent",
      slaLabel: "Within 1 business day",
      requiresHumanAction: true,
      status: "PENDING",
    },
    {
      id: "T4_REVIEW",
      label: "Review & Adjust",
      description: "AP specialist reviews coding and adjusts if needed",
      humanRole: "REVIEWER",
      agentName: "Reviewer Agent",
      slaLabel: "Within 2 business days",
      requiresHumanAction: true,
      status: "PENDING",
    },
    {
      id: "T5_ROUTE",
      label: "Approval Routing",
      description: "Route to appropriate approver based on amount threshold and GL account",
      humanRole: "SYSTEM",
      agentName: "Approval Router Agent",
      slaLabel: "Immediate",
      requiresHumanAction: false,
      status: "PENDING",
    },
    {
      id: "T6_APPROVE",
      label: "Approve/Reject",
      description: "Manager reviews and approves or rejects invoice",
      humanRole: "APPROVER",
      agentName: "Approval Agent",
      slaLabel: "Within 3 business days",
      requiresHumanAction: true,
      status: "PENDING",
    },
    {
      id: "T7_POST_ERP",
      label: "Post to ERP",
      description: "Create accounting entry in ERP system",
      humanRole: "SYSTEM",
      agentName: "ERP Posting Agent",
      slaLabel: "Within 1 hour",
      requiresHumanAction: false,
      status: "PENDING",
    },
    {
      id: "T8_SCHEDULE_PAYMENT",
      label: "Schedule Payment",
      description: "Calculate payment date based on terms and add to payment run",
      humanRole: "SYSTEM",
      agentName: "Payment Agent",
      slaLabel: "Same day as posting",
      requiresHumanAction: false,
      status: "PENDING",
    },
    {
      id: "T9_ARCHIVE_CLOSE",
      label: "Archive & Close",
      description: "Archive invoice document and mark process complete",
      humanRole: "SYSTEM",
      agentName: "Archival Agent",
      slaLabel: "Within 1 hour",
      requiresHumanAction: false,
      status: "PENDING",
    },
  ],
  agents: [
    {
      name: "AP Supervisor Agent",
      type: "SUPERVISOR",
      description:
        "Orchestrates the entire invoice processing workflow, monitors progress, handles exceptions, and ensures SLA compliance",
      handlesTasks: [],
    },
    {
      name: "AP Intake Agent",
      type: "WORKER",
      description: "Monitors email inbox and vendor portal for new invoices, creates draft records",
      handlesTasks: ["T1_INTAKE"],
    },
    {
      name: "Extract & Validate Agent",
      type: "WORKER",
      description: "Performs OCR, extracts invoice data, validates against vendor master",
      handlesTasks: ["T2_EXTRACT_VALIDATE"],
    },
    {
      name: "Coding Agent",
      type: "WORKER",
      description: "Suggests GL codes using ML models based on vendor and historical data",
      handlesTasks: ["T3_CODING"],
    },
    {
      name: "Reviewer Agent",
      type: "WORKER",
      description: "Facilitates human review, highlights exceptions, provides context",
      handlesTasks: ["T4_REVIEW"],
    },
    {
      name: "Approval Router Agent",
      type: "WORKER",
      description: "Determines approval path based on business rules and amount thresholds",
      handlesTasks: ["T5_ROUTE"],
    },
    {
      name: "Approval Agent",
      type: "WORKER",
      description: "Manages approval workflow and notifications",
      handlesTasks: ["T6_APPROVE"],
    },
    {
      name: "ERP Posting Agent",
      type: "WORKER",
      description: "Creates accounting entries in ERP system via API integration",
      handlesTasks: ["T7_POST_ERP"],
    },
    {
      name: "Payment Agent",
      type: "WORKER",
      description: "Calculates payment dates and schedules payments according to terms",
      handlesTasks: ["T8_SCHEDULE_PAYMENT"],
    },
    {
      name: "Archival Agent",
      type: "WORKER",
      description: "Archives documents to document management system and closes records",
      handlesTasks: ["T9_ARCHIVE_CLOSE"],
    },
  ],
};
