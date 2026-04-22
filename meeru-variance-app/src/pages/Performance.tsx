import { useState, type ReactNode } from 'react';
import { WorkbenchShell } from '../components/WorkbenchShell';
import { RailGroup } from '../components/LeftRail';
import { TopNav } from '../components/TopNav';
import { KpiRow } from '../components/KpiRow';
import { VarianceChart } from '../components/VarianceChart';
import { AhaLine } from '../components/AhaLine';
import { VarianceBridge } from '../components/VarianceBridge';
import type { BridgeDriver } from '../components/VarianceBridge';
import { CommandCenter } from '../components/CommandCenter';
import { StatusChip } from '../components/ui';
import { DrillDownView, ExceptionsView, SignalsView, HistoryView } from '../components/subviews';
import {
  KpiRowSkeleton, ChartSkeleton, TableSkeleton, ListCardSkeleton,
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

// -----------------------------------------------------------------------------
// Per-region AHA headline + Variance Bridge data
// (Inline here rather than in data.ts to keep the demo swap surgical. If this
//  becomes canonical we can migrate these into PERF_REGIONAL.)
// -----------------------------------------------------------------------------
interface RegionBridgeData {
  aha: ReactNode; // rich JSX headline with inline number formatting
  planM: number;
  actualM: number;
  drivers: BridgeDriver[];
}

const PERF_BRIDGE: Record<string, RegionBridgeData> = {
  global: {
    aha: (
      <>
        <b>Q1 revenue $46.8M vs plan $50.0M — missed by <span className="text-negative">-$3.2M</span>.</b>
        {' '}New business beat plan (+12% on New ARR), but Enterprise churn (
        <b className="text-negative">-$2.1M</b>, 3 logos) dragged NRR to 108% (▼7pp).
        The miss is a <b>retention story, not a sales story</b>.
      </>
    ),
    planM: 50.0,
    actualM: 46.8,
    drivers: [
      { label: 'Enterprise', valueM: -2.1 },
      { label: 'Mid-Market', valueM: +0.5 },
      { label: 'SMB', valueM: -0.4 },
      { label: 'Services', valueM: -0.4 },
      { label: 'Other', valueM: -0.8 },
    ],
  },
  americas: {
    aha: (
      <>
        <b>Americas ARR -$1.8M vs plan — the epicenter of the global miss.</b>
        {' '}California Retail labor surge (-$1.6M) and 3 Enterprise churns drove most of the gap.
        Similar pattern to <b>NY Q1 2024 wage adjustment</b>.
      </>
    ),
    planM: 21.0,
    actualM: 19.2,
    drivers: [
      { label: 'CA Retail', valueM: -1.6 },
      { label: 'Enterprise', valueM: -1.35 },
      { label: 'Mid-Market', valueM: +0.9 },
      { label: 'Texas Energy', valueM: -0.3 },
      { label: 'Other', valueM: +0.55 },
    ],
  },
  emea: {
    aha: (
      <>
        <b>EMEA ARR +$0.2M vs plan — quietly beat despite a GlobalTech churn.</b>
        {' '}London trading desks captured W9–W10 volatility; Nordics self-serve still accelerating.
        No further at-risk DE accounts this quarter.
      </>
    ),
    planM: 12.0,
    actualM: 12.2,
    drivers: [
      { label: 'UK FinServ', valueM: +0.7 },
      { label: 'GlobalTech', valueM: -0.75 },
      { label: 'Nordics', valueM: +0.25 },
      { label: 'Other', valueM: 0 },
    ],
  },
  apac: {
    aha: (
      <>
        <b>APAC ARR -$0.5M vs plan but NRR jumped to 121% (▲2pp).</b>
        {' '}Northbridge expansion (+$0.18M) signals 3 more Enterprise accounts may follow;
        Singapore/Tokyo renewing at <b>127% NRR</b> — the portfolio's best cohort.
      </>
    ),
    planM: 10.5,
    actualM: 10.0,
    drivers: [
      { label: 'Northbridge', valueM: +0.18 },
      { label: 'SG/Tokyo', valueM: +0.32 },
      { label: 'SMB Pricing', valueM: +0.12 },
      { label: 'Other', valueM: -1.12 },
    ],
  },
  latam: {
    aha: (
      <>
        <b>LATAM ARR -$0.3M vs plan — FX headwind absorbing local growth.</b>
        {' '}BRL devalued 6%, compressing USD-reported revenue despite healthy BRL growth.
        Mexico SMB momentum partially offsets; Argentina enterprise pipeline stalling.
      </>
    ),
    planM: 3.3,
    actualM: 3.0,
    drivers: [
      { label: 'Brazil FX', valueM: -0.2 },
      { label: 'Mexico SMB', valueM: +0.15 },
      { label: 'Argentina', valueM: -0.1 },
      { label: 'Other', valueM: -0.15 },
    ],
  },
};

export default function Performance() {
  const persona = usePersona();
  const [region, setRegion] = useState('global');
  const [compare, setCompare] = useState('plan');
  const [driver, setDriver] = useState<string | null>(null);
  const [topTab, setTopTab] = useState('analysis');
  const [showAha, setShowAha] = useState(false);

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
  const driverLabel  = analysis.data?.driverLabel  ?? (driver ? (PERF_DRIVERS.find(d => d.k === driver)?.n ?? null) : null);

  const personaChip = persona.key === 'PREPARER'
    ? { kind: 'warn' as const, text: '3 tasks assigned · due today' }
    : persona.key === 'CONTROLLER'
    ? { kind: 'info' as const, text: 'Close Day 4 · 2 blockers open' }
    : { kind: 'neg' as const, text: 'Variance flagged · action recommended' };

  const chip = analysis.data?.statusChip ?? personaChip;

  return (
    <WorkbenchShell
      workbench="performance"
      scopeLabel={`${WORKBENCHES.performance.label} · Week 10 · ${regionLabel}`}
      commentary={analysis.data?.commentary}
      commentaryHeadline={driverLabel ? `${regionLabel} · ${driverLabel}` : `Drivers of Week 10 variance — ${regionLabel}`}
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
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="text-[18px] font-semibold text-ink tracking-tight truncate">Performance Intelligence · Week 10 · {regionLabel}</h1>
        <div className="flex items-center gap-2 shrink-0">
          {PERF_BRIDGE[region] && topTab === 'analysis' && (
            <button
              onClick={() => setShowAha(v => !v)}
              title={showAha ? 'Hide AI summary' : 'Show AI summary'}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                showAha
                  ? 'bg-brand-tint text-brand border-brand/30'
                  : 'text-muted hover:text-brand border-rule hover:bg-brand-tint'
              }`}
            >
              <span className="w-[14px] h-[14px] rounded-full bg-brand text-white text-[8px] font-bold grid place-items-center">AI</span>
              {showAha ? 'Hide summary' : 'AI summary'}
            </button>
          )}
          <StatusChip kind={chip.kind}>{chip.text}</StatusChip>
        </div>
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
              <ChartSkeleton />
            </>
          ) : (
            <>
              {/* Option 1 template: AHA one-liner → KPIs → Variance Bridge → Chart → NBAs.
                  The AhaLine is hidden by default to keep the top of the page clean;
                  users can reveal it via the "AI summary" toggle in the header. */}
              {showAha && PERF_BRIDGE[region] && (
                <AhaLine onSeeWhy={() => setShowAha(false)}>
                  {PERF_BRIDGE[region].aha}
                </AhaLine>
              )}
              <KpiRow kpis={analysis.data.kpis} />
              {PERF_BRIDGE[region] && (
                <VarianceBridge
                  planM={PERF_BRIDGE[region].planM}
                  actualM={PERF_BRIDGE[region].actualM}
                  drivers={PERF_BRIDGE[region].drivers}
                  subtitle={`Plan $${PERF_BRIDGE[region].planM.toFixed(1)}M → Actual $${PERF_BRIDGE[region].actualM.toFixed(1)}M · ${PERF_BRIDGE[region].drivers.length} drivers explain the gap · ranked by absolute impact`}
                  onDrill={(label) => {
                    // Try to map bridge driver label → PERF_DRIVERS key
                    const k = label.toLowerCase().includes('enterprise') ? 'enterprise'
                      : label.toLowerCase().includes('mid') ? 'midmarket'
                      : label.toLowerCase().includes('expansion') ? 'expansion'
                      : label.toLowerCase().includes('cloud') ? 'cloud'
                      : label.toLowerCase().includes('services') ? 'services'
                      : null;
                    if (k) setDriver(k);
                  }}
                />
              )}
              <VarianceChart title={analysis.data.chartTitle} bars={analysis.data.chart} />
              {/* Inline Commentary removed — the same ranked explanations
                  already render in the right-side CommentaryPanel, so the
                  duplicate here just consumed vertical space. */}
              <CommandCenter />
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
