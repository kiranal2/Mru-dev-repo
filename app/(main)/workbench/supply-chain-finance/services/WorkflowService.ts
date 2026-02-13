import { supabase } from "../lib/supabase";

export interface WorkflowHistoryEntry {
  id: string;
  signal_id: string;
  workflow_status: string;
  workflow_category: string;
  sla_days: number | null;
  sla_due_date: string | null;
  action_by: string | null;
  details: string | null;
  status_date: string;
  created_at: string;
  is_current: boolean;
}

export interface WorkflowScenario {
  id: string;
  scenario_name: string;
  description: string | null;
}

export type WorkflowAction = "Counter Date" | "Escalate" | "Auto-Remind" | "Accept";

export const WorkflowService = {
  async getWorkflowHistory(signalId: string): Promise<WorkflowHistoryEntry[]> {
    const { data, error } = await supabase
      .from("signal_workflow_history")
      .select("*")
      .eq("signal_id", signalId)
      .order("status_date", { ascending: true });

    if (error) {
      console.error("Error fetching workflow history:", error);
      throw error;
    }

    return data || [];
  },

  async getCurrentWorkflowStatus(signalId: string): Promise<WorkflowHistoryEntry | null> {
    const { data, error } = await supabase
      .from("signal_workflow_history")
      .select("*")
      .eq("signal_id", signalId)
      .eq("is_current", true)
      .maybeSingle();

    if (error) {
      console.error("Error fetching current workflow status:", error);
      throw error;
    }

    return data;
  },

  async addWorkflowEntry(entry: Omit<WorkflowHistoryEntry, "id" | "created_at">): Promise<void> {
    const { error: updateError } = await supabase
      .from("signal_workflow_history")
      .update({ is_current: false })
      .eq("signal_id", entry.signal_id)
      .eq("is_current", true);

    if (updateError) {
      console.error("Error updating previous workflow status:", updateError);
      throw updateError;
    }

    const { error: insertError } = await supabase.from("signal_workflow_history").insert(entry);

    if (insertError) {
      console.error("Error adding workflow entry:", insertError);
      throw insertError;
    }
  },

  async performAction(signalId: string, action: WorkflowAction, details?: string): Promise<void> {
    const signal = await supabase
      .from("signals")
      .select("*, po_line:po_lines(*)")
      .eq("signal_id", signalId)
      .maybeSingle();

    if (signal.error || !signal.data) {
      throw new Error("Signal not found");
    }

    let newStatus: "NEW" | "MONITORING" | "COMPLETED" = signal.data.status;
    let newRecommendation = signal.data.recommendation;

    switch (action) {
      case "Counter Date":
        newStatus = "MONITORING";
        newRecommendation = "AI Auto-Remind/Wait T+N";
        break;

      case "Escalate":
        newStatus = "COMPLETED";
        break;

      case "Accept":
        newStatus = "COMPLETED";
        break;

      case "Auto-Remind":
        newStatus = "MONITORING";
        break;
    }

    const { error: updateError } = await supabase
      .from("signals")
      .update({
        status: newStatus,
        recommendation: newRecommendation,
        is_open: newStatus !== "COMPLETED",
        resolved_at: newStatus === "COMPLETED" ? new Date().toISOString() : null,
      })
      .eq("signal_id", signalId);

    if (updateError) {
      console.error("Error updating signal:", updateError);
      throw updateError;
    }

    await this.addWorkflowEntry({
      signal_id: signalId,
      workflow_status: newStatus,
      workflow_category: action,
      sla_days: null,
      sla_due_date: null,
      action_by: "demo_user",
      details: details || `Action taken: ${action}`,
      status_date: new Date().toISOString().split("T")[0],
      is_current: true,
    });
  },

  async getWorkflowScenarios(): Promise<WorkflowScenario[]> {
    const { data, error } = await supabase
      .from("workflow_scenarios")
      .select("*")
      .order("scenario_name");

    if (error) {
      console.error("Error fetching workflow scenarios:", error);
      throw error;
    }

    return data || [];
  },
};
