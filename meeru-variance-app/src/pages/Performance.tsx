import { useState } from 'react';
import { WorkbenchShell } from '../components/WorkbenchShell';
import { RailGroup } from '../components/LeftRail';
import { TopNav } from '../components/TopNav';
import { KpiRow } from '../components/KpiRow';
import { Commentary } from '../components/Commentary';
import { VarianceChart } from '../components/VarianceChart';
import { NbaMainSection } from '../components/NbaMainSection';
import { StatusChip } from '../components/ui';
import { DrillDownView, ExceptionsView, SignalsView, HistoryView } from '../components/subviews';
import {
  KpiRowSkeleton, CommentarySkeleton, ChartSkeleton, TableSkeleton, ListCardSkeleton,
  RefreshingOverlay,
} from '../components/Skeletons';
import { useAsyncData } from '../hooks/useAsyncData';
import {
  PERF_REGIONS, PERF_COMPARES, PERF_DRIVERS,
  WORKBENCHES,
  PERF_DRILLDOWN, PERF_EXCEPTIONS, PERF_SIGNALS, PERF_HISTORY,
  PERF_REGIONAL, adjustKpisByCompare, filterCommentaryByDriver,
} from '../data';
import { usePersona } from '../components/AppShell';

export default function Performance() {
  const persona = usePersona();
  const [region, setRegion] = useState('global');
  const [compare, setCompare] = useState('plan');
  const [driver, setDriver] = useState<string | null>(null);
  const [topTab, setTopTab] = useState('analysis');

  // ---- Analysis-tab data (reloads on region/compare/driver change) ----
  const analysis = useAsyncData(
    () => {
      const slice = PERF_REGIONAL[region] ?? PERF_REGIONAL.global;
      return {
        regionLabel: PERF_REGIONS.find(r => r.k === region)?.n ?? 'Global',
        compareLabel: PERF_COMPARES.find(c => c.k === compare)?.n ?? 'vs Plan',
        driverLabel: driver ? (PERF_DRIVERS.find(d => d.k === driver)?.n ?? null) : null,
        kpis: adjustKpisByCompare(slice.kpis, compare),
        commentary: filterCommentaryByDriver(slice.commentary, driver),
        statusChip: slice.statusChip,
        chart: slice.chart,
        chartTitle: slice.chartTitle,
      };
    },
    [region, compare, driver],
    { delayMs: 420, keepPrevious: true },
  );

  // ---- Sub-tab data — faster refresh on tab change ----
  const tabRows = useAsyncData(
    () => {
      switch (topTab) {
        case 'drilldown': {
          const map: Record<string, string> = { americas: 'Americas', emea: 'EMEA', apac: 'APAC', latam: 'LATAM' };
          const regionName = map[region];
          if (region === 'global') return { kind: 'drill' as const, rows: PERF_DRILLDOWN };
          const filtered = PERF_DRILLDOWN.filter(r => r.region === regionName);
          return { kind: 'drill' as const, rows: filtered.length ? filtered : PERF_DRILLDOWN };
        }
        case 'exceptions': return { kind: 'exceptions' as const, rows: PERF_EXCEPTIONS };
        case 'signals':    return { kind: 'signals'    as const, rows: PERF_SIGNALS };
        case 'history':    return { kind: 'history'    as const, rows: PERF_HISTORY };
        default:           return { kind: 'none'       as const, rows: [] };
      }
    },
    [topTab, region],
    { delayMs: 340, keepPrevious: false },
  );

  const regionLabel  = analysis.data?.regionLabel  ?? (PERF_REGIONS.find(r => r.k === region)?.n ?? 'Global');
  const compareLabel = analysis.data?.compareLabel ?? (PERF_COMPARES.find(c => c.k === compare)?.n ?? 'vs Plan');
  const driverLabel  = analysis.data?.driverLabel  ?? (driver ? (PERF_DRIVERS.find(d => d.k === driver)?.n ?? null) : null);

  const personaChip = persona.key === 'PREPARER'
    ? { kind: 'warn' as const, text: '3 tasks assigned · due today' }
    : persona.key === 'CONTROLLER'
    ? { kind: 'info' as const, text: 'Close Day 4 · 2 blockers open' }
    : { kind: 'neg' as const, text: 'Variance flagged · action recommended' };

  const chip = analysis.data?.statusChip ?? personaChip;

  const tabSub: Record<string, string> = {
    analysis: driverLabel ? `Filtered by driver: ${driverLabel}` : 'AI commentary · KPIs · variance trend',
    drilldown: `Customer-level ARR · ${regionLabel}`,
    exceptions: '7 flagged items · 3 critical',
    signals: '5 active ML predictions',
    history: 'Rolling 8 quarters',
  };

  return (
    <WorkbenchShell
      workbench="performance"
      scopeLabel={`${WORKBENCHES.performance.label} · Week 10 · ${regionLabel}`}
      leftRail={
        <>
          <RailGroup label="Regions"    items={PERF_REGIONS}  active={region}  onSelect={setRegion}  groupKey="region" />
          <RailGroup label="Comparison" items={PERF_COMPARES} active={compare} onSelect={setCompare} groupKey="compare" />
          <RailGroup label="Drivers"    items={PERF_DRIVERS}  active={driver ?? undefined} onSelect={(k) => setDriver(prev => prev === k ? null : k)} groupKey="driver" />
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
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-semibold text-ink tracking-tight">Performance Intelligence · Week 10 · {regionLabel}</h1>
          <p className="text-[11px] text-faint mt-0.5">{tabSub[topTab]} · {compareLabel} · {persona.role}</p>
        </div>
        <StatusChip kind={chip.kind}>{chip.text}</StatusChip>
      </div>

      {topTab === 'analysis' && (
        <div className="relative">
          {analysis.refreshing && <RefreshingOverlay />}
          {driverLabel && !analysis.initialLoading && (
            <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-rule bg-brand-tint text-[12px]">
              <span className="text-muted">Driver filter:</span>
              <span className="font-semibold text-brand">{driverLabel}</span>
              <button onClick={() => setDriver(null)} className="ml-auto text-[11px] text-muted hover:text-brand">Clear</button>
            </div>
          )}
          {analysis.initialLoading || !analysis.data ? (
            <>
              <KpiRowSkeleton />
              <CommentarySkeleton />
              <ChartSkeleton />
            </>
          ) : (
            <>
              <KpiRow kpis={analysis.data.kpis} />
              <Commentary items={analysis.data.commentary} title={driverLabel ? `Commentary — ${driverLabel}` : 'AI-Generated Commentary — Ranked by Impact'} />
              <VarianceChart title={analysis.data.chartTitle} bars={analysis.data.chart} />
              <NbaMainSection />
            </>
          )}
        </div>
      )}

      {topTab === 'drilldown' && (
        tabRows.loading || tabRows.data?.kind !== 'drill' ? <TableSkeleton rows={8} cols={8} />
        : <DrillDownView rows={tabRows.data.rows} />
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
