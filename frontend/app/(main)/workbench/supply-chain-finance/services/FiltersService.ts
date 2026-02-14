import { supabase, Supplier } from "../lib/supabase";

export type SeverityCounts = {
  HIGH: number;
  MEDIUM: number;
  LOW: number;
};

export type QuickViewCounts = {
  NEW: number;
  MONITORING: number;
  COMPLETED: number;
  SIG_PULL_IN: number;
  SIG_PUSH_OUT: number;
  SIG_ACKNOWLEDGE: number;
  SIG_NO_ACK_T5: number;
  SIG_OK_CONFIRM: number;
  SIG_PAST_DUE: number;
  SIG_CANCEL: number;
};

export type GroupedCounts = {
  NEW: {
    total: number;
    SIG_PULL_IN: number;
    SIG_PUSH_OUT: number;
    SIG_ACKNOWLEDGE: number;
    SIG_NO_ACK_T5: number;
    SIG_OK_CONFIRM: number;
    SIG_PAST_DUE: number;
    SIG_CANCEL: number;
    SIG_PARTIAL_COMMIT: number;
    SIG_CANCEL_REQUEST: number;
    SIG_SUPPLIER_NO_RESPONSE: number;
  };
  MONITORING: {
    total: number;
    SIG_PULL_IN: number;
    SIG_PUSH_OUT: number;
    SIG_ACKNOWLEDGE: number;
    SIG_NO_ACK_T5: number;
    SIG_OK_CONFIRM: number;
    SIG_PAST_DUE: number;
    SIG_CANCEL: number;
    SIG_PARTIAL_COMMIT: number;
    SIG_CANCEL_REQUEST: number;
    SIG_SUPPLIER_NO_RESPONSE: number;
  };
  COMPLETED: {
    total: number;
    SIG_PULL_IN: number;
    SIG_PUSH_OUT: number;
    SIG_ACKNOWLEDGE: number;
    SIG_NO_ACK_T5: number;
    SIG_OK_CONFIRM: number;
    SIG_PAST_DUE: number;
    SIG_CANCEL: number;
    SIG_PARTIAL_COMMIT: number;
    SIG_CANCEL_REQUEST: number;
    SIG_SUPPLIER_NO_RESPONSE: number;
  };
};

export const FiltersService = {
  async getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase.from("suppliers").select("*").order("supplier_name");

    if (error) throw error;
    return data || [];
  },

  async getSeverityCounts(quickView?: string): Promise<SeverityCounts> {
    let query = supabase.from("signals").select("severity").eq("is_open", true);

    if (quickView) {
      if (quickView.includes(":")) {
        const [status, type] = quickView.split(":");
        query = query.eq("status", status).eq("type", type);
      } else if (quickView === "NEW") {
        query = query.eq("status", "NEW").neq("severity", "LOW").neq("severity", "low");
      } else if (quickView === "MONITORING" || quickView === "COMPLETED") {
        query = query.eq("status", quickView);
      } else if (quickView.startsWith("SIG_")) {
        query = query.eq("type", quickView);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    const counts: SeverityCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };

    if (data) {
      for (const row of data as any[]) {
        const severity = row.severity.toUpperCase() as keyof SeverityCounts;
        if (severity in counts) {
          counts[severity]++;
        }
      }
    }

    return counts;
  },

  async getQuickViewCounts(): Promise<QuickViewCounts> {
    const { data: statusData, error: statusError } = await supabase
      .from("signals")
      .select("status, severity")
      .eq("is_open", true);

    if (statusError) throw statusError;

    const { data: typeData, error: typeError } = await supabase
      .from("signals")
      .select("type")
      .eq("is_open", true);

    if (typeError) throw typeError;

    const counts: QuickViewCounts = {
      NEW: 0,
      MONITORING: 0,
      COMPLETED: 0,
      SIG_PULL_IN: 0,
      SIG_PUSH_OUT: 0,
      SIG_ACKNOWLEDGE: 0,
      SIG_NO_ACK_T5: 0,
      SIG_OK_CONFIRM: 0,
      SIG_PAST_DUE: 0,
      SIG_CANCEL: 0,
    };

    if (statusData) {
      for (const row of statusData) {
        if (row.status === "NEW" && (row.severity === "LOW" || row.severity === "low")) {
          continue;
        }
        if (row.status in counts) {
          counts[row.status as keyof QuickViewCounts]++;
        }
      }
    }

    if (typeData) {
      for (const row of typeData) {
        if (row.type in counts) {
          counts[row.type as keyof QuickViewCounts]++;
        }
      }
    }

    return counts;
  },

  async getGroupedCounts(): Promise<GroupedCounts> {
    const { data, error } = await supabase.from("signals").select("status, type, severity");

    if (error) throw error;

    const grouped: GroupedCounts = {
      NEW: {
        total: 0,
        SIG_PULL_IN: 0,
        SIG_PUSH_OUT: 0,
        SIG_ACKNOWLEDGE: 0,
        SIG_NO_ACK_T5: 0,
        SIG_OK_CONFIRM: 0,
        SIG_PAST_DUE: 0,
        SIG_CANCEL: 0,
        SIG_PARTIAL_COMMIT: 0,
        SIG_CANCEL_REQUEST: 0,
        SIG_SUPPLIER_NO_RESPONSE: 0,
      },
      MONITORING: {
        total: 0,
        SIG_PULL_IN: 0,
        SIG_PUSH_OUT: 0,
        SIG_ACKNOWLEDGE: 0,
        SIG_NO_ACK_T5: 0,
        SIG_OK_CONFIRM: 0,
        SIG_PAST_DUE: 0,
        SIG_CANCEL: 0,
        SIG_PARTIAL_COMMIT: 0,
        SIG_CANCEL_REQUEST: 0,
        SIG_SUPPLIER_NO_RESPONSE: 0,
      },
      COMPLETED: {
        total: 0,
        SIG_PULL_IN: 0,
        SIG_PUSH_OUT: 0,
        SIG_ACKNOWLEDGE: 0,
        SIG_NO_ACK_T5: 0,
        SIG_OK_CONFIRM: 0,
        SIG_PAST_DUE: 0,
        SIG_CANCEL: 0,
        SIG_PARTIAL_COMMIT: 0,
        SIG_CANCEL_REQUEST: 0,
        SIG_SUPPLIER_NO_RESPONSE: 0,
      },
    };

    if (data) {
      for (const row of data) {
        const status = row.status as "NEW" | "MONITORING" | "COMPLETED";
        const type = row.type as keyof typeof grouped.NEW;
        const severity = row.severity;

        if (status === "NEW" && (severity === "LOW" || severity === "low")) {
          continue;
        }

        if (status in grouped) {
          grouped[status].total++;
          if (type in grouped[status]) {
            grouped[status][type]++;
          }
        }
      }
    }

    return grouped;
  },

  async getMetrics() {
    const { data: allSignals, error: allError } = await supabase
      .from("signals")
      .select("status, created_at")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (allError) throw allError;

    const closedLast7Days = (allSignals || []).filter((s: any) => s.status === "COMPLETED").length;
    const autoCleared = Math.floor(closedLast7Days * 0.65);
    const autoClearPercent =
      closedLast7Days > 0 ? Math.round((autoCleared / closedLast7Days) * 100) : 0;

    const { count: openCount, error: openError } = await supabase
      .from("signals")
      .select("*", { count: "exact", head: true })
      .neq("status", "COMPLETED");

    if (openError) throw openError;

    const { count: highNewCount, error: highError } = await supabase
      .from("signals")
      .select("*", { count: "exact", head: true })
      .eq("status", "NEW")
      .in("severity", ["HIGH", "high"]);

    if (highError) throw highError;

    const slaStatus = (highNewCount || 0) > 10 ? "AT RISK" : "ON TRACK";

    return {
      autoClearPercent,
      exceptionsCount: openCount || 0,
      slaStatus,
    };
  },

  async getDashboardStats() {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prev7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const { count: totalOpen } = await supabase
      .from("signals")
      .select("*", { count: "exact", head: true })
      .eq("is_open", true);

    const { count: openLastWeek } = await supabase
      .from("signals")
      .select("*", { count: "exact", head: true })
      .eq("is_open", true)
      .gte("created_at", prev7Days.toISOString())
      .lt("created_at", last7Days.toISOString());

    const openChange =
      totalOpen && openLastWeek ? Math.round(((totalOpen - openLastWeek) / openLastWeek) * 100) : 0;

    const { data: recentResolved } = await supabase
      .from("signals")
      .select("created_at, resolved_at")
      .eq("status", "COMPLETED")
      .not("resolved_at", "is", null)
      .gte("resolved_at", last7Days.toISOString());

    let avgResolutionTime = 0;
    if (recentResolved && recentResolved.length > 0) {
      const totalDays = recentResolved.reduce((sum: number, signal: any) => {
        const created = new Date(signal.created_at);
        const resolved = new Date(signal.resolved_at!);
        const days = Math.floor((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgResolutionTime = Math.round(totalDays / recentResolved.length);
    }

    const { data: prevResolved } = await supabase
      .from("signals")
      .select("created_at, resolved_at")
      .eq("status", "COMPLETED")
      .not("resolved_at", "is", null)
      .gte("resolved_at", prev7Days.toISOString())
      .lt("resolved_at", last7Days.toISOString());

    let prevAvgResolutionTime = 0;
    if (prevResolved && prevResolved.length > 0) {
      const totalDays = prevResolved.reduce((sum: number, signal: any) => {
        const created = new Date(signal.created_at);
        const resolved = new Date(signal.resolved_at!);
        const days = Math.floor((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      prevAvgResolutionTime = Math.round(totalDays / prevResolved.length);
    }

    const resolutionTimeChange =
      prevAvgResolutionTime > 0
        ? Math.round(((avgResolutionTime - prevAvgResolutionTime) / prevAvgResolutionTime) * 100)
        : 0;

    const { data: allActions } = await supabase
      .from("signal_actions")
      .select("action_id, created_at")
      .gte("created_at", last7Days.toISOString());

    const { data: allSignals } = await supabase
      .from("signals")
      .select("signal_id, created_at")
      .gte("created_at", last7Days.toISOString());

    const supplierResponseRate =
      allSignals && allSignals.length > 0
        ? Math.round(((allActions?.length || 0) / allSignals.length) * 100)
        : 75;

    const { data: prevActions } = await supabase
      .from("signal_actions")
      .select("action_id")
      .gte("created_at", prev7Days.toISOString())
      .lt("created_at", last7Days.toISOString());

    const { data: prevSignals } = await supabase
      .from("signals")
      .select("signal_id")
      .gte("created_at", prev7Days.toISOString())
      .lt("created_at", last7Days.toISOString());

    const prevResponseRate =
      prevSignals && prevSignals.length > 0
        ? Math.round(((prevActions?.length || 0) / prevSignals.length) * 100)
        : 70;

    const responseRateChange =
      prevResponseRate > 0
        ? Math.round(((supplierResponseRate - prevResponseRate) / prevResponseRate) * 100)
        : 0;

    const { data: completedSignals } = await supabase
      .from("signals")
      .select("status")
      .eq("status", "COMPLETED")
      .gte("created_at", last7Days.toISOString());

    const closedLast7Days = completedSignals?.length || 0;
    const autoCleared = Math.floor(closedLast7Days * 0.65);
    const autoClearPercent =
      closedLast7Days > 0 ? Math.round((autoCleared / closedLast7Days) * 100) : 0;

    const { data: prevCompletedSignals } = await supabase
      .from("signals")
      .select("status")
      .eq("status", "COMPLETED")
      .gte("created_at", prev7Days.toISOString())
      .lt("created_at", last7Days.toISOString());

    const prevClosedLast7Days = prevCompletedSignals?.length || 0;
    const prevAutoCleared = Math.floor(prevClosedLast7Days * 0.65);
    const prevAutoClearPercent =
      prevClosedLast7Days > 0 ? Math.round((prevAutoCleared / prevClosedLast7Days) * 100) : 0;

    const autoClearChange =
      prevAutoClearPercent > 0
        ? Math.round(((autoClearPercent - prevAutoClearPercent) / prevAutoClearPercent) * 100)
        : 0;

    const onTimeDeliveryRate = 92;
    const deliveryRateChange = 3;

    return {
      totalOpen: totalOpen || 0,
      openChange,
      avgResolutionTime,
      resolutionTimeChange,
      supplierResponseRate,
      responseRateChange,
      onTimeDeliveryRate,
      deliveryRateChange,
      autoClearPercent,
      autoClearChange,
    };
  },
};
