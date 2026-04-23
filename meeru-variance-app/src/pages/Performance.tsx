import { useEffect, useState, type ReactNode } from 'react';
import { WorkbenchShell } from '../components/WorkbenchShell';
import { RailGroup } from '../components/LeftRail';
import { TopNav } from '../components/TopNav';
import { KpiRow } from '../components/KpiRow';
import { VarianceChart } from '../components/VarianceChart';
import type { BridgeDriver } from '../components/VarianceBridge';
import { CommandCenter } from '../components/CommandCenter';
import { StatusChip, InlineFilterMenu } from '../components/ui';
import { Icon } from '../icons';
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
  national: {
    aha: (
      <>
        <b>Week 10 revenue $30.5M vs plan $33.7M — missed by <span className="text-negative">-$3.2M</span>.</b>
        {' '}California Retail labor surge (<b className="text-negative">-$1.2M</b>) and Texas Energy
        commodity exposure (<b className="text-negative">-$0.8M</b>) drive most of the gap.
        NY Financial Services (<b className="text-positive">+$0.7M</b>) is the only offsetter.
      </>
    ),
    planM: 33.7,
    actualM: 30.5,
    drivers: [
      { label: 'CA Retail',       valueM: -1.2 },
      { label: 'TX Energy',       valueM: -0.8 },
      { label: 'WA Tech Cloud',   valueM: -0.6 },
      { label: 'IL Manufacturing',valueM: -0.5 },
      { label: 'FL Tourism',      valueM: -0.4 },
      { label: 'NY FinServ',      valueM: +0.7 },
      { label: 'Other',           valueM: -0.4 },
    ],
  },
  northeast: {
    aha: (
      <>
        <b>Northeast is carrying the team — $8.1M vs plan $7.4M (<span className="text-positive">+$0.7M</span>).</b>
        {' '}NY Financial Services equity desk +22% on elevated VIX;
        advisory pipeline pulling forward by 3 weeks. Structural capture-rate lift of +15bps
        should persist through Q2.
      </>
    ),
    planM: 7.4,
    actualM: 8.1,
    drivers: [
      { label: 'Equity Trading', valueM: +0.4 },
      { label: 'Advisory',       valueM: +0.2 },
      { label: 'Wealth Mgmt',    valueM: +0.1 },
      { label: 'Other',          valueM: 0 },
    ],
  },
  southeast: {
    aha: (
      <>
        <b>Southeast miss is timing, not demand — $2.9M vs plan $3.3M.</b>
        {' '}Florida spring-break peak moved from W10 to W11. Hotel occupancy 71% vs 84% planned,
        but <b>W11 advance bookings tracking +18%</b>. 4 of 5 historical calendar shifts fully recovered.
      </>
    ),
    planM: 3.3,
    actualM: 2.9,
    drivers: [
      { label: 'FL Tourism',   valueM: -0.4 },
      { label: 'Hotel ADR',    valueM: +0.08 },
      { label: 'Cruise',       valueM: 0 },
      { label: 'Other',        valueM: -0.08 },
    ],
  },
  midwest: {
    aha: (
      <>
        <b>Midwest is supply-constrained — $5.4M vs plan $5.9M.</b>
        {' '}Chicago hub at 94% capacity vs 90% stress threshold; fulfillment cycle 8.2d vs 5.5d target.
        Union Pacific confirmed <b>+15% rail car allocation for W11</b> — recovery by W12 at historical UP accuracy.
      </>
    ),
    planM: 5.9,
    actualM: 5.4,
    drivers: [
      { label: 'IL Mfg',           valueM: -0.5 },
      { label: 'Detroit Auto',     valueM: 0 },
      { label: 'Ohio Distribution',valueM: +0.05 },
      { label: 'Other',            valueM: -0.05 },
    ],
  },
  west: {
    aha: (
      <>
        <b>West is the biggest drag — $11.0M vs plan $12.8M (<span className="text-negative">-$1.8M</span>).</b>
        {' '}California Retail labor (-$1.2M) plus Washington Tech AI training spend (-$0.6M).
        Lever: automation acceleration from W14 → W11 saves ~<b>$0.4M/week</b> (confidence 92%).
      </>
    ),
    planM: 12.8,
    actualM: 11.0,
    drivers: [
      { label: 'CA Retail',        valueM: -1.2 },
      { label: 'WA Tech Cloud',    valueM: -0.6 },
      { label: 'OR Clean Energy',  valueM: +0.2 },
      { label: 'Other',            valueM: -0.2 },
    ],
  },
  southwest: {
    aha: (
      <>
        <b>Southwest is commodity-driven — $3.2M vs plan $4.0M.</b>
        {' '}Henry Hub spot -18% WoW to $2.62/MMBtu. Hedge covers 60%; unhedged 40% fully exposed.
        Forward curve projects stabilization at <b>$2.80 by W12</b> — recommend raising hedge ratio to 75% before W11 close.
      </>
    ),
    planM: 4.0,
    actualM: 3.2,
    drivers: [
      { label: 'TX Energy',        valueM: -0.8 },
      { label: 'AZ Solar',         valueM: +0.05 },
      { label: 'NM Logistics',     valueM: 0 },
      { label: 'Other',            valueM: -0.05 },
    ],
  },
};

export default function Performance() {
  const persona = usePersona();
  const [region, setRegion] = useState('national');
  const [compare, setCompare] = useState('plan');
  const [driver, setDriver] = useState<string | null>(null);
  const [topTab, setTopTab] = useState('analysis');
  const [ahaOpen, setAhaOpen] = useState(false);

  // Drill-down events from the right-side CommentaryPanel — map driver name
  // to a PERF_DRIVERS key and apply as a filter, rather than dumping the
  // "drill down" verb into the chat (which was confusing vs. "Ask about this").
  useEffect(() => {
    const handler = (e: Event) => {
      const itemName = (e as CustomEvent<{ itemName: string }>).detail?.itemName ?? '';
      const l = itemName.toLowerCase();
      const k = l.includes('california') || l.includes('ca retail') ? 'caretail'
        : l.includes('texas') || l.includes('tx energy') ? 'txenergy'
        : l.includes('new york') || l.includes('ny') || l.includes('financial') || l.includes('advisory') || l.includes('equity') || l.includes('wealth') ? 'nyfinance'
        : l.includes('florida') || l.includes('tourism') || l.includes('hotel') || l.includes('cruise') ? 'fltourism'
        : l.includes('illinois') || l.includes('chicago') || l.includes('manufacturing') || l.includes('detroit') || l.includes('ohio') ? 'ilmfg'
        : l.includes('washington') || l.includes('wa tech') || l.includes('cloud') || l.includes('ai workload') || l.includes('oregon') ? 'watech'
        : null;
      if (k) setDriver(k);
    };
    window.addEventListener('meeru-drill', handler);
    return () => window.removeEventListener('meeru-drill', handler);
  }, []);

  // ---- Analysis-tab data (reloads on region/compare/driver change) ----
  const analysis = useAsyncData(
    () => {
      const slice = PERF_REGIONAL[region] ?? PERF_REGIONAL.national;
      return {
        regionLabel: PERF_REGIONS.find(r => r.k === region)?.n ?? 'National',
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
          const map: Record<string, string> = {
            northeast: 'Northeast',
            southeast: 'Southeast',
            midwest:   'Midwest',
            west:      'West',
            southwest: 'Southwest',
          };
          const regionName = map[region];
          if (region === 'national') return { kind: 'drill' as const, rows: PERF_DRILLDOWN };
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

  const regionLabel  = analysis.data?.regionLabel  ?? (PERF_REGIONS.find(r => r.k === region)?.n ?? 'National');
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
      scopeRight={
        <>
          <InlineFilterMenu
            label="Compare"
            items={PERF_COMPARES}
            value={compare}
            onChange={setCompare}
          />
          <span className="text-faint">·</span>
          <span>Week 10</span>
          <span className="text-faint">·</span>
          <span>{regionLabel}</span>
          <span className="text-faint">·</span>
          <span>Q1 FY2026</span>
        </>
      }
      commentary={analysis.data?.commentary}
      commentaryHeadline={driverLabel ? `${regionLabel} · ${driverLabel}` : `Drivers of Week 10 variance — ${regionLabel}`}
      leftRail={
        <>
          <RailGroup label="Regions"    items={PERF_REGIONS}  active={region}  onSelect={setRegion}  groupKey="region" />
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
      <div className="flex items-center justify-between mb-3 gap-3">
        <h1 className="text-[18px] font-semibold text-ink tracking-tight truncate">
          Performance Intelligence · Week 10 · {regionLabel}
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          {PERF_BRIDGE[region] && topTab === 'analysis' && (
            <button
              type="button"
              onClick={() => setAhaOpen(v => !v)}
              aria-expanded={ahaOpen}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-medium transition-colors ${
                ahaOpen
                  ? 'text-brand bg-brand-tint'
                  : 'text-muted hover:text-brand hover:bg-brand-tint'
              }`}
            >
              <Icon.Sparkle className="w-3 h-3" />
              <span>AI summary</span>
              <svg
                width="9"
                height="9"
                viewBox="0 0 12 12"
                fill="none"
                className={`transition-transform ${ahaOpen ? 'rotate-180' : ''}`}
              >
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <StatusChip kind={chip.kind}>{chip.text}</StatusChip>
        </div>
      </div>

      {/* AI summary body — collapsed by default, reveals below the title row
          when the user clicks the pill. Small muted paragraph so it reads as
          a helper note, not a heavyweight callout. */}
      {ahaOpen && PERF_BRIDGE[region] && topTab === 'analysis' && (
        <p className="mb-3 text-[11.5px] leading-[1.55] text-muted anim-fade-up">
          {PERF_BRIDGE[region].aha}
        </p>
      )}

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
              {/* Option 1 template: title row has AI summary + chip inline; the
                  2-column grid below holds (KPIs + chart) on the left and the
                  Variance Bridge on the right; NBA / Command Center follows. */}
              {/* KPIs stack above the weekly chart. Variance bridge removed
                  so the canvas stays clean with one chart + KPIs. */}
              <div className="space-y-3 mb-3">
                <KpiRow kpis={analysis.data.kpis} />
                <VarianceChart title={analysis.data.chartTitle} bars={analysis.data.chart} />
              </div>

              {/* Inline Commentary removed — ranked explanations render in the
                  right-side CommentaryPanel; this space now belongs to the
                  Command Center adaptive actions. */}
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
