import { useEffect, useState } from 'react';
import { WorkbenchShell } from '../components/WorkbenchShell';
import { RailGroup } from '../components/LeftRail';
import { TopNav } from '../components/TopNav';
import { KpiRow } from '../components/KpiRow';
import { VarianceChart } from '../components/VarianceChart';
import { CommandCenter } from '../components/CommandCenter';
import { InlineFilterMenu } from '../components/ui';
import { AISummaryPanel } from '../components/AISummaryPanel';
import type { Severity } from '../components/AISummaryPanel';
import { Icon } from '../icons';
import { DrillDownView, ExceptionsView, SignalsView, HistoryView } from '../components/subviews';
import {
  KpiRowSkeleton, ChartSkeleton, TableSkeleton, ListCardSkeleton,
  RefreshingOverlay,
} from '../components/Skeletons';
import { useAsyncData } from '../hooks/useAsyncData';
import { WORKBENCHES, adjustKpisByCompare, filterCommentaryByDriver } from '../data';
import { useIndustryData } from '../store';
import { usePersona } from '../components/AppShell';

export default function Performance() {
  const persona = usePersona();
  const industry = useIndustryData();
  const PERF_REGIONS = industry.regions;
  const PERF_COMPARES = industry.compares;
  const PERF_DRIVERS = industry.segments;
  const PERF_REGIONAL = industry.regional;
  const PERF_DRILLDOWN = industry.drilldown;
  const PERF_EXCEPTIONS = industry.exceptions;
  const PERF_SIGNALS = industry.signals;
  const PERF_HISTORY = industry.history;
  const PERF_BRIDGE = industry.bridges;
  const [region, setRegion] = useState(industry.regions[0]?.k ?? 'global');
  const [compare, setCompare] = useState('plan');
  const [driver, setDriver] = useState<string | null>(null);
  const [topTab, setTopTab] = useState('analysis');
  // AI summary callout — shown by default; user can dismiss with the × button.
  // Preference persists across sessions via localStorage.
  const [ahaOpen, setAhaOpen] = useState<boolean>(() => {
    try { return localStorage.getItem('meeru.perf.aiSummaryOpen') !== '0'; } catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem('meeru.perf.aiSummaryOpen', ahaOpen ? '1' : '0'); } catch {}
  }, [ahaOpen]);
  // Segment the user most recently drilled into — used by Drill-Down view to
  // highlight the matching card/row when arriving from the right-nav.
  const [focusSegment, setFocusSegment] = useState<string | null>(null);

  // Drill-down events from the right-side Variance Deep-Dive:
  //   1) switch to the Drill-Down tab
  //   2) mark the clicked segment as focus so it highlights
  //   3) apply the category filter (industry-dependent)
  useEffect(() => {
    const handler = (e: Event) => {
      const itemName = (e as CustomEvent<{ itemName: string }>).detail?.itemName ?? '';
      const k = industry.drillKeywordMap(itemName);
      setTopTab('drilldown');
      setFocusSegment(itemName || null);
      if (k) setDriver(k);
    };
    window.addEventListener('meeru-drill', handler);
    return () => window.removeEventListener('meeru-drill', handler);
  }, [industry]);

  // Reset region + filter when industry changes — keys from one preset may not
  // exist in another (e.g. 'latam' exists in delivery + saas but not retail
  // which uses 'row').
  useEffect(() => {
    setRegion(industry.regions[0]?.k ?? 'global');
    setDriver(null);
    setFocusSegment(null);
  }, [industry.meta.key]);

  // Clear segment focus whenever the user navigates away from the Drill-Down tab.
  useEffect(() => {
    if (topTab !== 'drilldown') setFocusSegment(null);
  }, [topTab]);

  // Navigation events from action-card modals ("Open Drill-Down", "Open
  // Exceptions", etc.). Map the card's label/body keywords to a sub-tab.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ label: string; body: string; who: string; kind: string }>).detail;
      const hay = `${detail?.label ?? ''} ${detail?.body ?? ''} ${detail?.who ?? ''}`.toLowerCase();
      const nextTab =
        /history|rolling weeks|12-week/.test(hay) ? 'history'
      : /signal|ml model|prediction|forecast flag/.test(hay) ? 'signals'
      : /exception|critical|flagged|alert/.test(hay) ? 'exceptions'
      : /drill|segment|investigate|detail|account/.test(hay) ? 'drilldown'
      : null;
      if (nextTab) setTopTab(nextTab);
    };
    window.addEventListener('meeru-navigate', handler);
    return () => window.removeEventListener('meeru-navigate', handler);
  }, []);

  // KPI-card click routing — index → tab (mirrors the Uberflux pattern where
  // each metric tile is a shortcut into the relevant detail view).
  const onKpiClick = (i: number) => {
    switch (i) {
      case 0: setAhaOpen(v => !v); break;          // Total Variance → toggle AI summary
      case 1: setTopTab('exceptions'); break;       // Segments Flagged → Exceptions
      case 2: setTopTab('signals'); break;          // Top Driver → Signals
      case 3: setTopTab('drilldown'); break;        // Commentary → Drill-Down
    }
  };

  // ---- Analysis-tab data (reloads on region/compare/driver/industry change) ----
  const firstRegionKey = industry.regions[0]?.k ?? 'global';
  const analysis = useAsyncData(
    () => {
      const slice = PERF_REGIONAL[region] ?? PERF_REGIONAL[firstRegionKey] ?? Object.values(PERF_REGIONAL)[0];
      // Compare-override dollar amounts (e.g. "-$4.2M vs Plan") are authored
      // only for the delivery preset today. For SaaS/Retail, return the
      // region's authored KPIs unchanged so the numbers stay in-domain.
      const kpis = industry.meta.key === 'delivery'
        ? adjustKpisByCompare(slice.kpis, compare)
        : slice.kpis;
      return {
        regionLabel: PERF_REGIONS.find(r => r.k === region)?.n ?? (PERF_REGIONS[0]?.n ?? 'Global'),
        compareLabel: PERF_COMPARES.find(c => c.k === compare)?.n ?? 'vs Plan',
        driverLabel: driver ? (PERF_DRIVERS.find(d => d.k === driver)?.n ?? null) : null,
        kpis,
        commentary: filterCommentaryByDriver(slice.commentary, driver, industry.segmentKeywords),
        statusChip: slice.statusChip,
        chart: slice.chart,
        chartTitle: slice.chartTitle,
      };
    },
    [region, compare, driver, industry.meta.key],
    { delayMs: 420, keepPrevious: true },
  );

  // ---- Sub-tab data — faster refresh on tab change ----
  const tabRows = useAsyncData(
    () => {
      switch (topTab) {
        case 'drilldown': {
          // First region in the preset is always the "roll-up" (Global / Corp);
          // selecting anything else narrows to rows matching that region's label.
          const regionName = PERF_REGIONS.find(r => r.k === region)?.n ?? '';
          if (region === firstRegionKey) return { kind: 'drill' as const, rows: PERF_DRILLDOWN };
          const filtered = PERF_DRILLDOWN.filter(r => r.region === regionName);
          return { kind: 'drill' as const, rows: filtered.length ? filtered : PERF_DRILLDOWN };
        }
        case 'exceptions': return { kind: 'exceptions' as const, rows: PERF_EXCEPTIONS };
        case 'signals':    return { kind: 'signals'    as const, rows: PERF_SIGNALS };
        case 'history':    return { kind: 'history'    as const, rows: PERF_HISTORY };
        default:           return { kind: 'none'       as const, rows: [] };
      }
    },
    [topTab, region, industry.meta.key],
    { delayMs: 340, keepPrevious: false },
  );

  const regionLabel  = analysis.data?.regionLabel  ?? (PERF_REGIONS.find(r => r.k === region)?.n ?? 'Global');
  const driverLabel  = analysis.data?.driverLabel  ?? (driver ? (PERF_DRIVERS.find(d => d.k === driver)?.n ?? null) : null);

  const personaChip = persona.key === 'STAFF'
    ? { kind: 'warn' as const, text: '3 tasks assigned · due today' }
    : persona.key === 'CONTROLLER'
    ? { kind: 'info' as const, text: 'Close Day 4 · 2 blockers open' }
    : { kind: 'neg' as const, text: 'Variance flagged · action recommended' };

  const chip = analysis.data?.statusChip ?? personaChip;

  // Map StatusChip kind → AI Summary severity. Drives the left border, icon
  // tint, and action button set inside the consolidated AI Summary card.
  const severity: Severity = chip.kind === 'neg' ? 'critical'
    : chip.kind === 'warn' ? 'warning'
    : 'note';

  return (
    <WorkbenchShell
      workbench="performance"
      scopeLabel={`${WORKBENCHES.performance.label} · ${industry.meta.periodLabel} · ${regionLabel}`}
      scopeRight={
        <>
          <InlineFilterMenu
            label="Compare"
            items={PERF_COMPARES}
            value={compare}
            onChange={setCompare}
          />
          <span className="text-faint">·</span>
          <span>{industry.meta.periodLabel}</span>
          <span className="text-faint">·</span>
          <span>{regionLabel}</span>
        </>
      }
      commentary={analysis.data?.commentary}
      commentaryHeadline={driverLabel ? `${regionLabel} · ${driverLabel}` : `Drivers of ${industry.meta.periodLabel} variance — ${regionLabel}`}
      leftRail={
        <>
          <RailGroup label="Regions"  items={PERF_REGIONS}  active={region}  onSelect={setRegion}  groupKey="region" />
          <RailGroup label="Segments" items={PERF_DRIVERS}  active={driver ?? undefined} onSelect={(k) => setDriver(prev => prev === k ? null : k)} groupKey="driver" />
        </>
      }
      topNav={
        <TopNav
          tabs={WORKBENCHES.performance.topTabs}
          active={topTab}
          onChange={setTopTab}
          dots={{ exceptions: 3 }}
        />
      }
      dock={<CommandCenter />}
    >
      {/* H1 trimmed to just the workbench name — the scope row at the top of
          the shell already carries period + region, so repeating them inline
          here was redundant. */}
      <h1 className="text-[18px] font-semibold text-ink tracking-tight mb-3 truncate">
        Performance Intelligence
      </h1>

      {/* Unified AI Summary + Variance Flag — single container. Severity drives
          the left edge color, icon, chip, and which action buttons appear, so
          the user reads one connected callout instead of two competing ones. */}
      {PERF_BRIDGE[region] && topTab === 'analysis' && (
        <AISummaryPanel
          severity={severity}
          severityLabel={chip.text}
          text={PERF_BRIDGE[region].aha}
          scopeLabel={`${WORKBENCHES.performance.label} · ${industry.meta.periodLabel} · ${regionLabel}`}
          varianceDelta={analysis.data?.kpis?.[0]?.delta}
          open={ahaOpen}
          onToggle={() => setAhaOpen(v => !v)}
          onClose={() => setAhaOpen(false)}
        />
      )}

      {topTab === 'analysis' && (
        <div className="relative">
          {analysis.refreshing && <RefreshingOverlay />}
          {driverLabel && !analysis.initialLoading && (
            <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-rule bg-brand-tint text-[12px]">
              <span className="text-muted">Segment filter:</span>
              <span className="font-semibold text-brand">{driverLabel}</span>
              <button onClick={() => setDriver(null)} className="ml-auto text-[11px] text-muted hover:text-brand">Clear</button>
            </div>
          )}
          {analysis.initialLoading || !analysis.data ? (
            <>
              <KpiRowSkeleton />
              <ChartSkeleton />
            </>
          ) : (
            <>
              {/* Option 1 template: title row has AI summary + chip inline; the
                  2-column grid below holds (KPIs + chart) on the left and the
                  Variance Bridge on the right; NBA / Command Center follows. */}
              {/* KPIs stack above the weekly chart. Variance bridge removed
                  so the canvas stays clean with one chart + KPIs. */}
              <div className="space-y-3">
                <KpiRow kpis={analysis.data.kpis} onCardClick={onKpiClick} />
                <VarianceChart title={analysis.data.chartTitle} bars={analysis.data.chart} />
              </div>
            </>
          )}
        </div>
      )}

      {topTab === 'drilldown' && (
        tabRows.loading || tabRows.data?.kind !== 'drill' ? <TableSkeleton rows={8} cols={8} />
        : <DrillDownView rows={tabRows.data.rows} focusSegment={focusSegment} />
      )}
      {topTab === 'exceptions' && (
        tabRows.loading || tabRows.data?.kind !== 'exceptions' ? <ListCardSkeleton items={5} />
        : <ExceptionsView items={tabRows.data.rows} />
      )}
      {topTab === 'signals' && (
        tabRows.loading || tabRows.data?.kind !== 'signals' ? <ListCardSkeleton items={5} />
        : <SignalsView items={tabRows.data.rows} />
      )}
      {topTab === 'history' && (
        tabRows.loading || tabRows.data?.kind !== 'history' ? <TableSkeleton rows={8} cols={8} />
        : <HistoryView rows={tabRows.data.rows} />
      )}
    </WorkbenchShell>
  );
}
