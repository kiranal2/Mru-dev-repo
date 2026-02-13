import { supabase, Signal, SignalRow, SignalAction, SignalEvent } from "../lib/supabase";
import { CSVRow } from "../utils/csv";

export type SignalListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  supplierIds?: string[];
  severities?: ("HIGH" | "MEDIUM" | "LOW")[];
  exceptionTypes?: string[];
  aiConfidenceRanges?: { min: number; max: number }[];
  quickView?: string;
  sort?: { field: string; direction: "asc" | "desc" };
};

export type ExceptionType =
  | "SIG_PULL_IN"
  | "SIG_PUSH_OUT"
  | "SIG_ACKNOWLEDGE"
  | "SIG_NO_ACK_T5"
  | "SIG_OK_CONFIRM"
  | "SIG_PAST_DUE"
  | "SIG_CANCEL"
  | "SIG_SUPPLIER_NO_RESPONSE";

export type Severity = "high" | "low";

export type Recommendation =
  | "Counter Date"
  | "Escalate"
  | "AI Auto-Remind T+N / Auto-Respond"
  | "AI Auto-Remind/Wait T+N";

export type ActionPayload = {
  type: "ACCEPT_COMMIT" | "COUNTER_DATE" | "REQUEST_TRACKING" | "ESCALATE";
  payload?: Record<string, any>;
};

export const SignalsService = {
  calculateException(poLine: {
    po_promise_date: string | null;
    mrp_required_date: string | null;
    po_date: string | null;
    supplier_commit: string | null;
  }): { type: ExceptionType; severity: Severity; recommendation: Recommendation; label: string } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if po_promise_date exists but supplier_commit is null
    if (poLine.po_promise_date && !poLine.supplier_commit) {
      return {
        type: "SIG_SUPPLIER_NO_RESPONSE",
        severity: "high",
        recommendation: "Escalate",
        label: "Supplier No Response",
      };
    }

    if (!poLine.po_promise_date) {
      if (poLine.po_date) {
        const poDate = new Date(poLine.po_date);
        const daysSincePO = Math.floor(
          (today.getTime() - poDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSincePO > 5) {
          return {
            type: "SIG_NO_ACK_T5",
            severity: "high",
            recommendation: "Escalate",
            label: "No Ack T+5",
          };
        }
      }

      return {
        type: "SIG_ACKNOWLEDGE",
        severity: "low",
        recommendation: "AI Auto-Remind T+N / Auto-Respond",
        label: "Acknowledge",
      };
    }

    const promiseDate = new Date(poLine.po_promise_date);
    promiseDate.setHours(0, 0, 0, 0);

    if (promiseDate < today) {
      return {
        type: "SIG_PAST_DUE",
        severity: "high",
        recommendation: "Escalate",
        label: "Past Due",
      };
    }

    if (poLine.mrp_required_date) {
      const mrpDate = new Date(poLine.mrp_required_date);
      mrpDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (mrpDate.getTime() - promiseDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (Math.abs(daysDiff) <= 2) {
        return {
          type: "SIG_OK_CONFIRM",
          severity: "low",
          recommendation: "AI Auto-Remind T+N / Auto-Respond",
          label: "OK/Confirm",
        };
      }

      if (mrpDate < promiseDate) {
        return {
          type: "SIG_PULL_IN",
          severity: "high",
          recommendation: "Counter Date",
          label: "Pull-in",
        };
      }

      if (mrpDate > promiseDate) {
        return {
          type: "SIG_PUSH_OUT",
          severity: "high",
          recommendation: "Counter Date",
          label: "Push-out",
        };
      }
    }

    return {
      type: "SIG_OK_CONFIRM",
      severity: "low",
      recommendation: "AI Auto-Remind T+N / Auto-Respond",
      label: "OK/Confirm",
    };
  },

  async list(params: SignalListParams = {}) {
    const {
      page = 1,
      pageSize = 25,
      q = "",
      supplierIds = [],
      severities = [],
      exceptionTypes = [],
      aiConfidenceRanges = [],
      quickView = "NEW",
      sort = { field: "score", direction: "desc" as const },
    } = params;

    let query = supabase
      .from("signals")
      .select(
        `
        *,
        po_line:po_lines!inner(
          *,
          supplier:suppliers!inner(*)
        )
      `,
        { count: "exact" }
      )
      .eq("is_open", true);

    if (quickView.includes(":")) {
      const [status, type] = quickView.split(":");
      query = query.eq("status", status).eq("type", type);
    } else if (quickView === "NEW") {
      query = query.eq("status", "NEW").neq("severity", "LOW").neq("severity", "low");
    } else if (quickView === "MONITORING") {
      query = query.eq("status", "MONITORING");
    } else if (quickView === "COMPLETED") {
      query = query.eq("status", "COMPLETED");
    } else if (quickView.startsWith("SIG_")) {
      query = query.eq("type", quickView);
    }

    if (supplierIds.length > 0) {
      query = query.in("po_line.supplier_id", supplierIds);
    }

    if (severities.length > 0) {
      // Map UI severity values to database values
      const severityMap: Record<string, string[]> = {
        HIGH: ["HIGH", "high"],
        MEDIUM: ["MEDIUM"], // MEDIUM maps to itself (no lowercase equivalent in DB)
        LOW: ["LOW", "low"],
      };

      const dbSeverities = severities.flatMap((s) => severityMap[s] || [s]);
      query = query.in("severity", dbSeverities);
    }

    if (exceptionTypes.length > 0) {
      query = query.in("type", exceptionTypes);
    }

    if (aiConfidenceRanges.length > 0) {
      const conditions = aiConfidenceRanges
        .map((range) => `(ai_confidence.gte.${range.min},ai_confidence.lte.${range.max})`)
        .join(",");
      query = query.or(conditions);
    }

    const { field, direction } = sort;
    if (field === "supplier_name") {
      query = query.order("supplier_name", {
        ascending: direction === "asc",
        referencedTable: "po_lines.supplier",
      });
    } else if (field === "po_number") {
      query = query.order("po_number", {
        ascending: direction === "asc",
        referencedTable: "po_lines",
      });
    } else if (
      field === "mrp_required_date" ||
      field === "po_promise_date" ||
      field === "po_date" ||
      field === "commit_date" ||
      field === "lead_date" ||
      field === "supplier_action" ||
      field === "supplier_commit"
    ) {
      query = query.order(field, { ascending: direction === "asc", referencedTable: "po_lines" });
    } else {
      query = query.order(field, { ascending: direction === "asc" });
    }

    // When searching, we need to fetch more data to filter client-side
    // because PostgREST doesn't support filtering on nested joined columns
    const shouldFetchAll = !!q;

    if (!shouldFetchAll) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    let rows: SignalRow[] = (data as any[]).map((item: any) => ({
      ...item,
      supplier: item.po_line.supplier,
      recommendation: item.recommendation || item.recommended || null,
    }));

    // Apply client-side search filter
    if (q) {
      const searchTerm = q.toLowerCase();
      rows = rows.filter((row) => {
        const poNumber = row.po_line?.po_number?.toLowerCase() || "";
        const supplierName =
          (row.po_line as any)?.supplier?.supplier_name?.toLowerCase() ||
          row.supplier?.supplier_name?.toLowerCase() ||
          "";
        const item = row.po_line?.item?.toLowerCase() || "";
        const itemDescription = row.po_line?.item_description?.toLowerCase() || "";
        const label = row.label?.toLowerCase() || "";

        return (
          poNumber.includes(searchTerm) ||
          supplierName.includes(searchTerm) ||
          item.includes(searchTerm) ||
          itemDescription.includes(searchTerm) ||
          label.includes(searchTerm)
        );
      });

      // Apply pagination after filtering
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedRows = rows.slice(from, to);

      return {
        rows: paginatedRows,
        total: rows.length,
      };
    }

    return {
      rows,
      total: count || 0,
    };
  },

  async get(signalId: string) {
    const { data, error } = await supabase
      .from("signals")
      .select(
        `
        *,
        po_line:po_lines!inner(
          *,
          supplier:suppliers!inner(*)
        )
      `
      )
      .eq("signal_id", signalId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Signal not found");

    const row: SignalRow = {
      ...(data as any),
      supplier: (data as any).po_line.supplier,
    };

    return row;
  },

  async getEvents(signalId: string): Promise<SignalEvent[]> {
    const { data, error } = await supabase
      .from("signal_events")
      .select("*")
      .eq("signal_id", signalId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getActions(signalId: string): Promise<SignalAction[]> {
    const { data, error } = await supabase
      .from("signal_actions")
      .select("*")
      .eq("signal_id", signalId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async act(signalId: string, action: ActionPayload) {
    const signal = await this.get(signalId);

    let updateData: Partial<Signal> = {};
    let poLineUpdate: Record<string, any> | null = null;

    switch (action.type) {
      case "ACCEPT_COMMIT":
        updateData = {
          status: "COMPLETED",
          is_open: false,
          resolved_at: new Date().toISOString(),
        };
        break;

      case "COUNTER_DATE":
        updateData = { status: "MONITORING" };
        if (action.payload?.new_commit_date) {
          poLineUpdate = { commit_date: action.payload.new_commit_date };
        }
        break;

      case "REQUEST_TRACKING":
        updateData = { status: "MONITORING" };
        break;

      case "ESCALATE":
        updateData = { status: "MONITORING" };
        break;
    }

    const { error: updateError } = await supabase
      .from("signals")
      .update(updateData)
      .eq("signal_id", signalId);

    if (updateError) throw updateError;

    if (poLineUpdate) {
      const { error: poError } = await supabase
        .from("po_lines")
        .update(poLineUpdate)
        .eq("po_line_id", signal.po_line_id);

      if (poError) throw poError;
    }

    const { error: actionError } = await supabase.from("signal_actions").insert({
      signal_id: signalId,
      action_type: action.type,
      payload: action.payload || null,
      actor: "demo_user",
    });

    if (actionError) throw actionError;

    const eventMessages: Record<string, string> = {
      ACCEPT_COMMIT: "Accepted commit",
      COUNTER_DATE: `Counter-date requested${action.payload?.new_commit_date ? ": " + action.payload.new_commit_date : ""}`,
      REQUEST_TRACKING: "Tracking requested",
      ESCALATE: "Escalated to supplier",
    };

    const { error: eventError } = await supabase.from("signal_events").insert({
      signal_id: signalId,
      event_type: action.type,
      message: eventMessages[action.type],
    });

    if (eventError) throw eventError;

    return { success: true };
  },

  async explain(signalId: string) {
    const signal = await this.get(signalId);

    const thresholds: Record<string, string> = {
      SIG_PULL_IN: "MRP Required Date is before PO Promise Date",
      SIG_PUSH_OUT: "MRP Required Date is after PO Promise Date",
      SIG_ACKNOWLEDGE: "Awaiting initial supplier acknowledgment",
      SIG_NO_ACK_T5: "5+ days without acknowledgment",
      SIG_OK_CONFIRM: "Dates align within tolerance (±2 days)",
      SIG_PAST_DUE: "PO Promise Date has passed",
      SIG_CANCEL: "Cancellation required",
      SIG_ACK_GT_SYS_LEAD: "7 days beyond need-by date",
      SIG_PARTIAL_COMMIT: "Less than 100% quantity committed",
      SIG_LEADTIME_DRIFT: "2+ days variance from standard",
      SIG_CANCEL_REQUEST: "Supplier cancellation requested",
    };

    return {
      rationale: signal.rationale,
      score: signal.score,
      type: signal.type,
      threshold: thresholds[signal.type] || "N/A",
    };
  },

  async updatePOLine(poLineId: string, data: { poLineData: any; signalData: any }) {
    const { error: poError } = await supabase
      .from("po_lines")
      .update({
        po_date: data.poLineData.po_date || null,
        po_promise_date: data.poLineData.po_promise_date || null,
        mrp_required_date: data.poLineData.mrp_required_date || null,
        supplier_action: data.poLineData.supplier_action || null,
        supplier_commit: data.poLineData.supplier_commit || null,
        commit_date: data.poLineData.commit_date || null,
        item: data.poLineData.item || null,
        item_description: data.poLineData.item_description || null,
      })
      .eq("po_line_id", poLineId);

    if (poError) throw poError;

    const { data: signal } = await supabase
      .from("signals")
      .select("signal_id")
      .eq("po_line_id", poLineId)
      .maybeSingle();

    if (signal) {
      // Map label to exception type
      const labelToType: Record<string, string> = {
        "MRP Required < Supplier Commit": "SIG_PULL_IN",
        "MRP Required > Supplier Commit": "SIG_PUSH_OUT",
        Acknowledge: "SIG_ACKNOWLEDGE",
        "No Ack T+5": "SIG_NO_ACK_T5",
        "OK/Confirm": "SIG_OK_CONFIRM",
        "Past Due": "SIG_PAST_DUE",
        Cancel: "SIG_CANCEL",
        "Partial Commit": "SIG_PARTIAL_COMMIT",
        "Cancel Request": "SIG_CANCEL_REQUEST",
        "Supplier No Response": "SIG_SUPPLIER_NO_RESPONSE",
        // Also support legacy labels
        "Pull-in": "SIG_PULL_IN",
        "Push-out": "SIG_PUSH_OUT",
        "No Acknowledgment T+5": "SIG_NO_ACK_T5",
        "Partial Commitment": "SIG_PARTIAL_COMMIT",
      };

      const updateData: any = {};

      // Use 'in' to check if properties exist, not just if they're truthy
      if (
        "severity" in data.signalData &&
        data.signalData.severity !== undefined &&
        data.signalData.severity !== ""
      ) {
        updateData.severity = data.signalData.severity;
      }

      if (
        "status" in data.signalData &&
        data.signalData.status !== undefined &&
        data.signalData.status !== ""
      ) {
        updateData.status = data.signalData.status;
      }

      if (
        "label" in data.signalData &&
        data.signalData.label !== undefined &&
        data.signalData.label !== ""
      ) {
        updateData.label = data.signalData.label;
        // Derive the type from the label
        updateData.type = labelToType[data.signalData.label] || "SIG_PUSH_OUT";
      }

      if (
        "recommendation" in data.signalData &&
        data.signalData.recommendation !== undefined &&
        data.signalData.recommendation !== ""
      ) {
        updateData.recommendation = data.signalData.recommendation;
      }

      // Only update if there's something to update
      if (Object.keys(updateData).length > 0) {
        const { error: signalError } = await supabase
          .from("signals")
          .update(updateData)
          .eq("signal_id", signal.signal_id);

        if (signalError) throw signalError;
      }
    }

    return { success: true };
  },

  async uploadCSV(csvRows: CSVRow[]) {
    const poNumbers = csvRows.map((row) => row.po_number);

    const { data: existingPOLines, error: checkError } = await supabase
      .from("po_lines")
      .select("po_number")
      .in("po_number", poNumbers);

    if (checkError) throw checkError;

    const existingPOLineSet = new Set(
      existingPOLines?.map((pl: { po_number: string }) => pl.po_number) || []
    );
    const uniqueRows = csvRows.filter((row) => !existingPOLineSet.has(row.po_number));

    if (uniqueRows.length === 0) {
      return {
        imported: 0,
        skipped: csvRows.length,
        message: "All PO lines already exist in the database",
      };
    }

    const suppliersToCreate = new Set(uniqueRows.map((row) => row.supplier_name));
    const { data: existingSuppliers } = await supabase
      .from("suppliers")
      .select("supplier_id, supplier_name")
      .in("supplier_name", Array.from(suppliersToCreate));

    const existingSupplierMap = new Map(
      existingSuppliers?.map((s: { supplier_name: string; supplier_id: string }) => [
        s.supplier_name,
        s.supplier_id,
      ]) || []
    );

    const newSuppliers = Array.from(suppliersToCreate)
      .filter((supplier_name) => !existingSupplierMap.has(supplier_name))
      .map((supplier_name) => ({ supplier_name }));

    if (newSuppliers.length > 0) {
      const { data: insertedSuppliers, error: supplierError } = await supabase
        .from("suppliers")
        .insert(newSuppliers)
        .select("supplier_id, supplier_name");

      if (supplierError) throw supplierError;

      insertedSuppliers?.forEach((s: { supplier_name: string; supplier_id: string }) => {
        existingSupplierMap.set(s.supplier_name, s.supplier_id);
      });
    }

    const poLinesToInsert = uniqueRows.map((row) => ({
      po_number: row.po_number,
      supplier_id: existingSupplierMap.get(row.supplier_name)!,
      org_code: row.org_code || null,
      item: row.item || null,
      item_description: row.item_description || null,
      po_date: row.po_date || null,
      po_promise_date: row.po_promise_date || null,
      mrp_required_date: row.mrp_required_date || null,
      supplier_action: row.supplier_action || null,
      commit_date: row.commit_date || null,
      delta_mrp: row.delta_mrp || null,
      lead_date: row.lead_date || null,
      quarter_end: row.quarter_end || null,
    }));

    const { data: insertedPOLines, error: poError } = await supabase
      .from("po_lines")
      .insert(poLinesToInsert)
      .select("po_line_id, po_number");

    if (poError) throw poError;

    const poLineMap = new Map(
      insertedPOLines?.map((pl: { po_number: string; po_line_id: string }) => [
        pl.po_number,
        pl.po_line_id,
      ]) || []
    );

    const signalsToInsert = uniqueRows.map((row) => {
      const poLineId = poLineMap.get(row.po_number)!;
      const poLineData = uniqueRows.find((r) => r.po_number === row.po_number)!;

      const calculatedException = this.calculateException({
        po_promise_date: poLineData.po_promise_date || null,
        mrp_required_date: poLineData.mrp_required_date || null,
        po_date: poLineData.po_date || null,
        supplier_commit: (poLineData as any).supplier_commit || null,
      });

      return {
        po_line_id: poLineId,
        type: calculatedException.type,
        label: calculatedException.label,
        severity: calculatedException.severity,
        status: row.status || "NEW",
        recommendation: calculatedException.recommendation,
        rationale: row.rationale || `Exception detected: ${calculatedException.label}`,
        score: calculatedException.severity === "high" ? 90 : 20,
        is_open: true,
      };
    });

    const { error: signalError } = await supabase.from("signals").insert(signalsToInsert);

    if (signalError) throw signalError;

    return {
      imported: uniqueRows.length,
      skipped: csvRows.length - uniqueRows.length,
      message: `Successfully imported ${uniqueRows.length} new PO lines. Skipped ${csvRows.length - uniqueRows.length} existing lines.`,
    };
  },
};
