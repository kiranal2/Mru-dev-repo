import { useState } from 'react';
import { WorkbenchShell } from '../components/WorkbenchShell';
import { RailGroup } from '../components/LeftRail';
import { TopNav } from '../components/TopNav';
import { StatusChip } from '../components/ui';
import { FluxTable, FluxSummary } from '../components/subviews';
import { KpiRowSkeleton, TableSkeleton, RefreshingOverlay } from '../components/Skeletons';
import { useAsyncData } from '../hooks/useAsyncData';
import {
  FLUX_COMPARES, FLUX_MATERIALITY, FLUX_OWNERS, WORKBENCHES,
  FLUX_IS, FLUX_BS, FLUX_CF,
  filterFluxRows, fluxComparisonLabel,
} from '../data';
import { usePersona } from '../components/AppShell';

export default function Flux() {
  const persona = usePersona();
  const [compare, setCompare]         = useState('qoq');
  const [materiality, setMateriality] = useState('1m');
  const [owner, setOwner]             = useState('all');
  const [topTab, setTopTab]           = useState('is');

  const compareLabel    = FLUX_COMPARES.find(c => c.k === compare)?.n ?? 'QoQ';
  const materialityLabel = FLUX_MATERIALITY.find(m => m.k === materiality)?.n ?? '> $1M';
  const ownerLabel       = FLUX_OWNERS.find(o => o.k === owner)?.n ?? 'All Owners';
  const comparePeriod    = fluxComparisonLabel(compare);

  // Filtered rows — async so filter changes show a real "fetching" state
  const rowsData = useAsyncData(
    () => ({
      is: filterFluxRows(FLUX_IS, materiality, owner),
      bs: filterFluxRows(FLUX_BS, materiality, owner),
      cf: filterFluxRows(FLUX_CF, materiality, owner),
    }),
    [materiality, owner, compare],
    { delayMs: 440, keepPrevious: true },
  );

  const isRows = rowsData.data?.is ?? [];
  const bsRows = rowsData.data?.bs ?? [];
  const cfRows = rowsData.data?.cf ?? [];

  const activeRows = topTab === 'is' ? isRows : topTab === 'bs' ? bsRows : cfRows;
  const totalRows  = topTab === 'is' ? FLUX_IS.length : topTab === 'bs' ? FLUX_BS.length : FLUX_CF.length;

  const tabSub: Record<string, string> = {
    is: 'Income Statement · revenue to net income',
    bs: 'Balance Sheet · rollforward',
    cf: 'Cash Flow Bridge · operating · investing · financing',
  };

  return (
    <WorkbenchShell
      workbench="flux"
      scopeLabel={`${WORKBENCHES.flux.label} · ${compareLabel} · ${ownerLabel}`}
      leftRail={
        <>
          <RailGroup label="Compare"     items={FLUX_COMPARES}      active={compare}     onSelect={setCompare}     groupKey="compare" />
          <RailGroup label="Materiality" items={FLUX_MATERIALITY}   active={materiality} onSelect={setMateriality} groupKey="materiality" />
          <RailGroup label="Owner"       items={FLUX_OWNERS}        active={owner}       onSelect={setOwner}       groupKey="owner" />
        </>
      }
      topNav={<TopNav tabs={WORKBENCHES.flux.topTabs} active={topTab} onChange={setTopTab} />}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-semibold text-ink tracking-tight">Flux Intelligence · {compareLabel}</h1>
          <p className="text-[11px] text-faint mt-0.5">{tabSub[topTab]} · {comparePeriod} · {persona.role}</p>
        </div>
        <div className="flex items-center gap-2">
          {rowsData.data && <span className="text-[11px] text-faint">Showing {activeRows.length} of {totalRows} lines</span>}
          <StatusChip kind="info">{materialityLabel} · {ownerLabel}</StatusChip>
        </div>
      </div>

      {(materiality !== '1m' || owner !== 'all') && !rowsData.initialLoading && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-rule bg-brand-tint text-[12px]">
          <span className="text-muted">Filters:</span>
          <span className="font-semibold text-brand">{materialityLabel}</span>
          {owner !== 'all' && <><span className="text-muted">·</span><span className="font-semibold text-brand">{ownerLabel}</span></>}
          <button onClick={() => { setMateriality('1m'); setOwner('all'); }} className="ml-auto text-[11px] text-muted hover:text-brand">Reset</button>
        </div>
      )}

      <div className="relative">
        {rowsData.refreshing && <RefreshingOverlay />}
        {rowsData.initialLoading || !rowsData.data ? (
          <>
            <KpiRowSkeleton />
            <TableSkeleton rows={10} cols={8} />
          </>
        ) : (
          <>
            {topTab === 'is' && (
              <>
                <FluxSummary
                  title={`Income Statement · ${comparePeriod}`}
                  kpis={[
                    { lbl: 'Total Revenue',    val: '+$38M', tone: 'pos' },
                    { lbl: 'Total OpEx',        val: '+$25M', tone: 'neg' },
                    { lbl: 'Operating Income', val: '-$15M', tone: 'neg' },
                    { lbl: 'Net Income',        val: '-$10M', tone: 'neg' },
                  ]}
                />
                {isRows.length > 0 ? <FluxTable rows={isRows} unitLabel="$M" /> : <EmptyFilter />}
              </>
            )}
            {topTab === 'bs' && (
              <>
                <FluxSummary
                  title={`Balance Sheet · ${comparePeriod}`}
                  kpis={[
                    { lbl: 'Cash Δ',      val: '-$3.2B', tone: 'neg' },
                    { lbl: 'AR Δ',         val: '+$2.1B', tone: 'warn' },
                    { lbl: 'Inventory Δ',  val: '+$0.8B', tone: 'warn' },
                    { lbl: "Equity Δ",     val: '+$2.0B', tone: 'pos' },
                  ]}
                />
                {bsRows.length > 0 ? <FluxTable rows={bsRows} unitLabel="$M" /> : <EmptyFilter />}
              </>
            )}
            {topTab === 'cf' && (
              <>
                <FluxSummary
                  title={`Cash Flow · ${comparePeriod}`}
                  kpis={[
                    { lbl: 'Ops CF',          val: '-$33M', tone: 'neg' },
                    { lbl: 'Capex Δ',          val: '-$14M', tone: 'neg' },
                    { lbl: 'Buybacks Δ',       val: '-$20M', tone: 'warn' },
                    { lbl: 'Free Cash Flow',   val: '-$47M', tone: 'neg' },
                  ]}
                />
                {cfRows.length > 0 ? <FluxTable rows={cfRows} unitLabel="$M" /> : <EmptyFilter />}
              </>
            )}
          </>
        )}
      </div>
    </WorkbenchShell>
  );
}

function EmptyFilter() {
  return (
    <div className="bg-surface border border-rule rounded-xl p-8 text-center">
      <div className="text-[13px] text-ink font-semibold mb-1">No rows match the current filters</div>
      <div className="text-[11px] text-muted">Try lowering the materiality threshold or clearing the owner filter.</div>
    </div>
  );
}
