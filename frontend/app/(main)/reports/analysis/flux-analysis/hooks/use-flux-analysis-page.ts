"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFluxAnalysis } from "@/hooks/data";
import { toast } from "sonner";
import type {
  FluxRaw,
  FluxRow,
  FluxPageData,
  AiResponse,
  PromptSuggestion,
  MaterialityMode,
} from "@/lib/data/types/flux-analysis";
import {
  FALLBACK_DATA,
  AI_PROMPT_SUGGESTIONS,
  AI_THINKING_STEPS,
  AI_ANALYSIS_MAP,
} from "../constants";
import {
  buildPageData,
  round1,
  generateAIResponse,
  getConfidence,
  fmtMoney,
  fmtPct,
  signedMoney,
  calculateSensitivity,
} from "../helpers";

/* ──────────────────────────────── HOOK ──────────────────────────────── */

export function useFluxAnalysisPage() {
  /* ─── Data fetch ─── */
  const { data: fluxRaw, loading: fluxLoading, error: fluxError } = useFluxAnalysis();

  const data = useMemo<FluxPageData>(() => {
    if (!fluxRaw.length) return FALLBACK_DATA;
    const rawItems = fluxRaw as unknown as FluxRaw[];
    return buildPageData(rawItems);
  }, [fluxRaw]);

  /* ─── State variables ─── */
  const [materiality, setMateriality] = useState<MaterialityMode>("default");
  const [excludeNoise, setExcludeNoise] = useState(false);
  const [activeView, setActiveView] = useState<"is" | "bs" | "cf">("is");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [consolidation, setConsolidation] = useState("Consolidated");
  const [currency, setCurrency] = useState("USD");
  const [page, setPage] = useState(1);
  const [selectedRowId, setSelectedRowId] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);

  // AI state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponses, setAiResponses] = useState<AiResponse[]>([]);
  const [aiIsThinking, setAiIsThinking] = useState(false);
  const [aiPendingQuestion, setAiPendingQuestion] = useState("");
  const [aiThinkingSteps, setAiThinkingSteps] = useState<string[]>([]);

  // Sensitivity sliders
  const [priceSlider, setPriceSlider] = useState([1]);
  const [volumeSlider, setVolumeSlider] = useState([2]);
  const [fxSlider, setFxSlider] = useState([0]);

  // Watch dialog
  const [watchDialogOpen, setWatchDialogOpen] = useState(false);

  // Evidence dialog
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [evidenceTargetRow, setEvidenceTargetRow] = useState<FluxRow | null>(null);
  const [evidenceOverrides, setEvidenceOverrides] = useState<Record<string, boolean>>({});

  /* ─── Refs ─── */
  const aiThinkingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiResponseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageSize = 10;

  /* ─── Computed: row collections ─── */
  const allRows = useMemo(() => [...data.is, ...data.bs], [data.is, data.bs]);

  const ownerOptions = useMemo(() => {
    const unique = new Set(allRows.map((row) => row.owner));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [allRows]);

  const statusOptions = useMemo(() => {
    const unique = new Set(allRows.map((row) => row.status));
    return Array.from(unique);
  }, [allRows]);

  /* ─── Materiality threshold ─── */
  const materialityThreshold = useMemo(() => {
    if (materiality === "tight") return { amt: 0.25, pct: 0.03 };
    if (materiality === "loose") return { amt: 0.05, pct: 0.08 };
    return { amt: 0.1, pct: 0.05 };
  }, [materiality]);

  /* ─── Filter rows ─── */
  const filterRows = useCallback(
    (rows: FluxRow[]) => {
      const { amt, pct } = materialityThreshold;
      return rows
        .filter((row) => {
          const delta = row.actual - row.base;
          const deltaPct = row.base ? delta / row.base : 0;
          const isNoise = Math.abs(delta) < amt && Math.abs(deltaPct) < pct;
          if (excludeNoise && isNoise) return false;
          if (ownerFilter !== "all" && row.owner !== ownerFilter) return false;
          if (statusFilter !== "all" && row.status !== statusFilter) return false;
          return true;
        })
        .sort((a, b) => Math.abs(b.actual - b.base) - Math.abs(a.actual - a.base));
    },
    [excludeNoise, materialityThreshold, ownerFilter, statusFilter]
  );

  const filteredIS = useMemo(() => filterRows(data.is), [data.is, filterRows]);
  const filteredBS = useMemo(() => filterRows(data.bs), [data.bs, filterRows]);
  const filteredAllRows = useMemo(() => [...filteredIS, ...filteredBS], [filteredIS, filteredBS]);

  /* ─── Active rows / pagination ─── */
  const activeRows = useMemo(() => {
    if (activeView === "is") return filteredIS;
    if (activeView === "bs") return filteredBS;
    return [] as FluxRow[];
  }, [activeView, filteredIS, filteredBS]);

  const totalPages = Math.max(1, Math.ceil(activeRows.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pagedRows = activeRows.slice(pageStart, pageStart + pageSize);

  /* ─── Detail row ─── */
  const detailRow = useMemo(
    () => allRows.find((row) => row.id === selectedRowId) ?? null,
    [allRows, selectedRowId]
  );

  /* ─── KPI: revenue + CF total ─── */
  const kpiRevenue = useMemo(() => {
    const revenueRows = filteredAllRows.filter(
      (row) => /revenue/i.test(row.name) && !/cost|deferred/i.test(row.name)
    );
    return revenueRows.sort((a, b) => b.actual - a.actual)[0] ?? null;
  }, [filteredAllRows]);

  const kpiCfTotal = useMemo(() => data.cf.reduce((sum, row) => sum + row.val, 0), [data.cf]);

  /* ─── Dynamic KPIs per active view ─── */
  const viewKpis = useMemo(() => {
    const computeKpi = (rows: FluxRow[], label: string) => {
      const totalActual = rows.reduce((s, r) => s + r.actual, 0);
      const totalBase = rows.reduce((s, r) => s + r.base, 0);
      const delta = round1(totalActual - totalBase);
      const pct = totalBase ? round1(((totalActual - totalBase) / totalBase) * 100) : 0;
      return { label, actual: round1(totalActual), base: round1(totalBase), delta, pct };
    };

    if (activeView === "is") {
      const revRows = filteredIS.filter((r) => /revenue/i.test(r.name) && !/cost|deferred/i.test(r.name));
      const cogsRows = filteredIS.filter((r) => /cogs|cost of/i.test(r.name));
      const opexRows = filteredIS.filter((r) => !/revenue|cogs|cost of|gross|income|ebitda/i.test(r.name));
      const revKpi = computeKpi(revRows.length ? revRows : filteredIS.slice(0, 1), "Revenue");
      const cogsKpi = computeKpi(cogsRows, "COGS");
      const opexKpi = computeKpi(opexRows, "OpEx");
      const openCount = filteredIS.filter((r) => r.status === "Open").length;
      return [
        { label: "Revenue", value: `$${revKpi.actual.toFixed(1)}M`, change: `${revKpi.pct >= 0 ? "+" : ""}${revKpi.pct.toFixed(1)}%`, positive: revKpi.pct >= 0 },
        { label: "COGS", value: `$${cogsKpi.actual.toFixed(1)}M`, change: `${cogsKpi.pct >= 0 ? "+" : ""}${cogsKpi.pct.toFixed(1)}%`, positive: cogsKpi.pct <= 0 },
        { label: "OpEx", value: `$${opexKpi.actual.toFixed(1)}M`, change: `${opexKpi.pct >= 0 ? "+" : ""}${opexKpi.pct.toFixed(1)}%`, positive: opexKpi.pct <= 0 },
        { label: "Open", value: `${openCount}/${filteredIS.length}`, change: "", positive: openCount === 0 },
      ];
    }

    if (activeView === "bs") {
      const assetRows = filteredBS.filter((r) => r.acct.charAt(0) === "1");
      const liabRows = filteredBS.filter((r) => r.acct.charAt(0) === "2");
      const eqRows = filteredBS.filter((r) => r.acct.charAt(0) === "3");
      const aKpi = computeKpi(assetRows, "Assets");
      const lKpi = computeKpi(liabRows, "Liabilities");
      const eKpi = computeKpi(eqRows, "Equity");
      const openCount = filteredBS.filter((r) => r.status === "Open").length;
      return [
        { label: "Assets", value: `$${aKpi.actual.toFixed(1)}M`, change: `${aKpi.pct >= 0 ? "+" : ""}${aKpi.pct.toFixed(1)}%`, positive: aKpi.pct >= 0 },
        { label: "Liabilities", value: `$${lKpi.actual.toFixed(1)}M`, change: `${lKpi.pct >= 0 ? "+" : ""}${lKpi.pct.toFixed(1)}%`, positive: lKpi.pct <= 0 },
        { label: "Equity", value: `$${eKpi.actual.toFixed(1)}M`, change: `${eKpi.pct >= 0 ? "+" : ""}${eKpi.pct.toFixed(1)}%`, positive: eKpi.pct >= 0 },
        { label: "Open", value: `${openCount}/${filteredBS.length}`, change: "", positive: openCount === 0 },
      ];
    }

    // CF view
    const cfTotal = round1(data.cf.reduce((s, r) => s + r.val, 0));
    const opItems = data.cf.filter((r) => !/capex|invest|financ|dividend/i.test(r.label));
    const _opTotal = round1(opItems.reduce((s, r) => s + r.val, 0));
    return [
      { label: "Op CF", value: `$${cfTotal.toFixed(1)}M`, change: "", positive: cfTotal >= 0 },
      { label: "Items", value: `${data.cf.length}`, change: "", positive: true },
      { label: "Sources", value: `${data.cf.filter((r) => r.val >= 0).length}`, change: "", positive: true },
      { label: "Uses", value: `${data.cf.filter((r) => r.val < 0).length}`, change: "", positive: false },
    ];
  }, [activeView, filteredIS, filteredBS, data.cf]);

  /* ─── Top drivers ─── */
  const topDrivers = useMemo(() => {
    if (!filteredAllRows.length) return data.drivers;

    const buckets = new Map<string, { impact: number; count: number; flagged: number }>();
    filteredAllRows.forEach((row) => {
      const delta = row.actual - row.base;
      const pct = row.base ? delta / row.base : 0;
      const bucket = buckets.get(row.driver) ?? { impact: 0, count: 0, flagged: 0 };
      bucket.impact += delta;
      bucket.count += 1;
      if (Math.abs(delta) >= 0.5 || Math.abs(pct) >= 0.08) bucket.flagged += 1;
      buckets.set(row.driver, bucket);
    });

    const mapped = Array.from(buckets.entries()).map(([driver, value]) => ({
      driver,
      impact: round1(value.impact),
      confidence: value.flagged / Math.max(1, value.count) > 0.4 ? ("High" as const) : ("Med" as const),
    }));

    return mapped.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 8);
  }, [filteredAllRows, data.drivers]);

  /* ─── Explanation cards ─── */
  const explanationCards = useMemo(() => {
    const fromRows = filteredAllRows
      .filter((row) => row.aiExplanation || Math.abs(row.actual - row.base) >= 0.3)
      .sort((a, b) => Math.abs(b.actual - b.base) - Math.abs(a.actual - a.base))
      .slice(0, 4)
      .map((row) => {
        const delta = row.actual - row.base;
        const pct = row.base ? delta / row.base : 0;
        return {
          acct: `${row.acct} ${row.name}`,
          delta,
          driver: row.aiExplanation ? `${row.aiExplanation.slice(0, 80)}...` : row.driver,
          conf: getConfidence(delta, pct),
          owner: row.owner,
          evidence: row.evidence,
          status: row.status,
        };
      });
    return fromRows.length ? fromRows : data.aiExplanations;
  }, [filteredAllRows, data.aiExplanations]);

  /* ─── AI autocomplete ─── */
  const promptSuggestions = useMemo(() => {
    if (!detailRow) return AI_PROMPT_SUGGESTIONS;
    return [
      {
        prompt: `Explain ${detailRow.name} variance and next actions`,
      },
      ...AI_PROMPT_SUGGESTIONS,
    ];
  }, [detailRow]);

  const aiAutocompleteSuggestions = useMemo(() => {
    const query = aiPrompt.trim().toLowerCase();
    if (!query) return [] as PromptSuggestion[];

    const words = query.split(/\s+/).filter(Boolean);
    const scored = promptSuggestions.map((suggestion, index) => {
      const text = suggestion.prompt.toLowerCase();
      let score = 0;
      if (text.includes(query)) score += 10;
      if (words.length) {
        score += words.filter((word) => text.includes(word)).length;
      }
      return { suggestion, score, index };
    });

    const matched = scored
      .filter((item) => item.score > 0)
      .sort((a, b) => (b.score === a.score ? a.index - b.index : b.score - a.score))
      .map((item) => item.suggestion);

    return (matched.length ? matched : promptSuggestions).slice(0, 6);
  }, [aiPrompt, promptSuggestions]);

  const showAiAutocomplete =
    !aiIsThinking && aiPrompt.trim().length > 0 && aiAutocompleteSuggestions.length > 0;

  /* ─── Effects ─── */

  // Reset page to 1 when filters/view change
  useEffect(() => {
    setPage(1);
  }, [activeView, materiality, excludeNoise, ownerFilter, statusFilter]);

  // Clamp page when it exceeds totalPages
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Cleanup AI simulation timers on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (aiThinkingIntervalRef.current) clearInterval(aiThinkingIntervalRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (aiResponseTimeoutRef.current) clearTimeout(aiResponseTimeoutRef.current);
    };
  }, []);

  /* ─── AI simulation helpers ─── */
  const clearAiSimulationTimers = useCallback(() => {
    if (aiThinkingIntervalRef.current) {
      clearInterval(aiThinkingIntervalRef.current);
      aiThinkingIntervalRef.current = null;
    }
    if (aiResponseTimeoutRef.current) {
      clearTimeout(aiResponseTimeoutRef.current);
      aiResponseTimeoutRef.current = null;
    }
  }, []);

  const resetAiSimulation = useCallback(() => {
    clearAiSimulationTimers();
    setAiIsThinking(false);
    setAiPendingQuestion("");
    setAiThinkingSteps([]);
  }, [clearAiSimulationTimers]);

  /* ─── Handlers ─── */

  const handleAsk = useCallback(
    (rawPrompt?: string) => {
      if (aiIsThinking) return;
      const nextPrompt = (rawPrompt ?? aiPrompt).trim();
      if (!nextPrompt) return;

      const context = {
        filteredAllRows,
        filteredIS,
        filteredBS,
        topDrivers,
        kpiRevenue,
        kpiCfTotal,
        priceSlider,
        volumeSlider,
        fxSlider,
      };
      const response = generateAIResponse(nextPrompt, context);
      const responseId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setAiPrompt("");
      setAiIsThinking(true);
      setAiPendingQuestion(nextPrompt);
      setAiThinkingSteps(AI_THINKING_STEPS.length ? [AI_THINKING_STEPS[0]] : []);

      clearAiSimulationTimers();

      let stepIndex = 1;
      aiThinkingIntervalRef.current = setInterval(() => {
        if (stepIndex >= AI_THINKING_STEPS.length) {
          if (aiThinkingIntervalRef.current) {
            clearInterval(aiThinkingIntervalRef.current);
            aiThinkingIntervalRef.current = null;
          }
          return;
        }
        const nextStep = AI_THINKING_STEPS[stepIndex];
        stepIndex += 1;
        setAiThinkingSteps((prev) => [...prev, nextStep]);
      }, 360);

      const thinkingDurationMs = Math.max(1200, AI_THINKING_STEPS.length * 360 + 420);
      aiResponseTimeoutRef.current = setTimeout(() => {
        clearAiSimulationTimers();
        setAiResponses((prev) =>
          [
            {
              id: responseId,
              q: nextPrompt,
              ...response,
            },
            ...prev,
          ].slice(0, 8)
        );
        setAiIsThinking(false);
        setAiPendingQuestion("");
        setAiThinkingSteps([]);
      }, thinkingDurationMs);
    },
    [
      aiIsThinking,
      aiPrompt,
      filteredAllRows,
      filteredIS,
      filteredBS,
      topDrivers,
      kpiRevenue,
      kpiCfTotal,
      priceSlider,
      volumeSlider,
      fxSlider,
      clearAiSimulationTimers,
    ]
  );

  const handleSelectPromptSuggestion = useCallback(
    (suggestionPrompt: string) => {
      if (aiIsThinking) return;
      setAiPrompt(suggestionPrompt);
    },
    [aiIsThinking]
  );

  const handleNewChat = useCallback(() => {
    resetAiSimulation();
    setAiResponses([]);
    setAiPrompt("");
    toast.success("Started a new AI chat session");
  }, [resetAiSimulation]);

  const handleOpenWatchDialog = useCallback(() => {
    setWatchDialogOpen(true);
  }, []);

  const handleRowClick = useCallback((row: FluxRow) => {
    setSelectedRowId(row.id);
    setDetailOpen(true);
  }, []);

  const handleOpenEvidenceDialog = useCallback((row: FluxRow) => {
    setEvidenceTargetRow(row);
    setEvidenceDialogOpen(true);
  }, []);

  const handleAttachEvidence = useCallback(
    (rowId: string) => {
      setEvidenceOverrides((prev) => ({ ...prev, [rowId]: true }));
      setEvidenceDialogOpen(false);
    },
    []
  );

  const handleAskAiAboutRow = useCallback(
    (row: FluxRow) => {
      setDetailOpen(false);
      const prompt = `Explain ${row.name} variance`;
      setAiPrompt(prompt);
      // Use setTimeout(0) so state updates flush before handleAsk reads them
      setTimeout(() => {
        handleAsk(prompt);
      }, 0);
    },
    [handleAsk]
  );

  const hasEvidence = useCallback(
    (row: Pick<FluxRow, "id" | "evidence">) => evidenceOverrides[row.id] ?? row.evidence,
    [evidenceOverrides]
  );

  /* ─── Sensitivity ─── */
  const projectedDelta = calculateSensitivity(
    kpiRevenue?.base ?? 48.2,
    priceSlider,
    volumeSlider,
    fxSlider
  );

  /* ─── Detail derived ─── */
  const detailAi = detailRow ? AI_ANALYSIS_MAP[detailRow.acct] ?? null : null;
  const detailHasEvidence = detailRow ? hasEvidence(detailRow) : false;

  /* ─── Table pagination labels ─── */
  const tableStart = activeRows.length === 0 ? 0 : pageStart + 1;
  const tableEnd = Math.min(pageStart + pageSize, activeRows.length);

  /* ─── Return ─── */
  return {
    // Loading/error
    fluxLoading,
    fluxError,

    // Data
    data,
    activeView,

    // Filters
    materiality,
    setMateriality,
    excludeNoise,
    setExcludeNoise,
    ownerFilter,
    setOwnerFilter,
    statusFilter,
    setStatusFilter,
    consolidation,
    setConsolidation,
    currency,
    setCurrency,
    ownerOptions,
    statusOptions,

    // Table
    pagedRows,
    page,
    setPage,
    totalPages,
    tableStart,
    tableEnd,
    activeRows,
    filteredIS,
    filteredBS,

    // View
    setActiveView,
    viewKpis,

    // Drivers & Explanations
    topDrivers,
    explanationCards,
    kpiRevenue,
    kpiCfTotal,

    // Detail drawer
    detailOpen,
    setDetailOpen,
    detailRow,
    detailAi,
    detailHasEvidence,
    handleRowClick,

    // AI
    aiPrompt,
    setAiPrompt,
    aiResponses,
    aiIsThinking,
    aiPendingQuestion,
    aiThinkingSteps,
    showAiAutocomplete,
    autocompleteSuggestions: aiAutocompleteSuggestions,
    handleAsk,
    handleSelectPromptSuggestion,
    handleNewChat,
    handleAskAiAboutRow,

    // Sensitivity
    priceSlider,
    setPriceSlider,
    volumeSlider,
    setVolumeSlider,
    fxSlider,
    setFxSlider,
    projectedDelta,

    // Watch
    watchDialogOpen,
    setWatchDialogOpen,
    handleOpenWatchDialog,

    // Evidence
    evidenceDialogOpen,
    setEvidenceDialogOpen,
    evidenceTargetRow,
    handleOpenEvidenceDialog,
    handleAttachEvidence,
    hasEvidence,
  };
}
