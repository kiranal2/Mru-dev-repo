import { useMemo, useState } from 'react';
import { WorkbenchShell } from '../components/WorkbenchShell';
import { RailGroup } from '../components/LeftRail';
import { TopNav } from '../components/TopNav';
import { KpiRow } from '../components/KpiRow';
import { Commentary } from '../components/Commentary';
import { VarianceChart } from '../components/VarianceChart';
import { StatusChip } from '../components/ui';
import { DrillDownView, ExceptionsView, SignalsView, HistoryView } from '../components/subviews';
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

  const regionLabel = PERF_REGIONS.find(r => r.k === region)?.n ?? 'Global';
  const compareLabel = PERF_COMPARES.find(c => c.k === compare)?.n ?? 'vs Plan';
  const driverLabel = driver ? (PERF_DRIVERS.find(d => d.k === driver)?.n ?? null) : null;

  // --- Derived data that actually changes when the left rail changes ---
  const slice = PERF_REGIONAL[region] ?? PERF_REGIONAL.global;
  const kpis = useMemo(() => adjustKpisByCompare(slice.kpis, compare), [slice, compare]);
  const commentary = useMemo(() => filterCommentaryByDriver(slice.commentary, driver), [slice, driver]);

  // Drill-Down also responds to region: filter customer rows by region (best-effort)
  const drillRows = useMemo(() => {
    if (region === 'global') return PERF_DRILLDOWN;
    const map: Record<string, string> = { americas: 'Americas', emea: 'EMEA', apac: 'APAC', latam: 'LATAM' };
    const regionMatch = map[region];
    const filtered = PERF_DRILLDOWN.filter(r => r.region === regionMatch);
    return filtered.length ? filtered : PERF_DRILLDOWN;
  }, [region]);

  const tabSub: Record<string, string> = {
    analysis: driverLabel ? `Filtered by driver: ${driverLabel}` : 'AI commentary · KPIs · variance trend',
    drilldown: `${drillRows.length} customer${drillRows.length === 1 ? '' : 's'} in ${regionLabel}`,
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
        <StatusChip kind={slice.statusChip.kind}>{slice.statusChip.text}</StatusChip>
      </div>

      {topTab === 'analysis' && (
        <>
          {driverLabel && (
            <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-rule bg-brand-tint text-[12px]">
              <span className="text-muted">Driver filter:</span>
              <span className="font-semibold text-brand">{driverLabel}</span>
              <button onClick={() => setDriver(null)} className="ml-auto text-[11px] text-muted hover:text-brand">Clear</button>
            </div>
          )}
          <KpiRow kpis={kpis} />
          <Commentary items={commentary} title={driverLabel ? `Commentary — ${driverLabel}` : 'AI-Generated Commentary — Ranked by Impact'} />
          <VarianceChart title={slice.chartTitle} bars={slice.chart} />
        </>
      )}

      {topTab === 'drilldown'  && <DrillDownView rows={drillRows} />}
      {topTab === 'exceptions' && <ExceptionsView items={PERF_EXCEPTIONS} />}
      {topTab === 'signals'    && <SignalsView items={PERF_SIGNALS} />}
      {topTab === 'history'    && <HistoryView rows={PERF_HISTORY} />}
    </WorkbenchShell>
  );
}
