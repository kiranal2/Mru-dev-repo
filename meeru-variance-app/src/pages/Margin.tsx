import { useState } from 'react';
import { WorkbenchShell } from '../components/WorkbenchShell';
import { RailGroup } from '../components/LeftRail';
import { TopNav } from '../components/TopNav';
import { KpiRow } from '../components/KpiRow';
import { Commentary } from '../components/Commentary';
import { NbaMainSection } from '../components/NbaMainSection';
import { StatusChip } from '../components/ui';
import { WaterfallView, ProductMixView, CostsView, SensitivityView } from '../components/subviews';
import {
  KpiRowSkeleton, CommentarySkeleton, ChartSkeleton, TableSkeleton,
  RefreshingOverlay,
} from '../components/Skeletons';
import { useAsyncData } from '../hooks/useAsyncData';
import {
  MARGIN_PRODUCTS, MARGIN_CHANNELS, MARGIN_PERIODS,
  WORKBENCHES,
  MARGIN_PRODUCT_MIX, MARGIN_COSTS, MARGIN_SENSITIVITY,
  MARGIN_BY_PRODUCT, adjustMarginDeltaByPeriod,
} from '../data';
import { usePersona } from '../components/AppShell';

export default function Margin() {
  const persona = usePersona();
  const [product, setProduct] = useState('all');
  const [channel, setChannel] = useState('all');
  const [period, setPeriod]   = useState('qtd');
  const [topTab, setTopTab]   = useState('waterfall');

  // ---- Waterfall-tab data (reloads on product/period change) ----
  const waterfallData = useAsyncData(
    () => {
      const slice = MARGIN_BY_PRODUCT[product] ?? MARGIN_BY_PRODUCT.all;
      return {
        productLabel: MARGIN_PRODUCTS.find(p => p.k === product)?.n ?? 'All Products',
        periodLabel:  MARGIN_PERIODS.find(p => p.k === period)?.n  ?? 'Quarter-to-Date',
        channelLabel: MARGIN_CHANNELS.find(c => c.k === channel)?.n ?? 'All Channels',
        statusChip: slice.statusChip,
        kpis: adjustMarginDeltaByPeriod(slice.kpis, period),
        waterfall: slice.waterfall,
        commentary: slice.commentary,
      };
    },
    [product, period, channel],
    { delayMs: 420, keepPrevious: true },
  );

  // ---- Sub-tab data ----
  const tabData = useAsyncData(
    () => {
      switch (topTab) {
        case 'productmix': {
          if (product === 'all') return { kind: 'mix' as const, rows: MARGIN_PRODUCT_MIX };
          const idx = MARGIN_PRODUCT_MIX.findIndex(r => r.product.toLowerCase() === product);
          if (idx === -1) return { kind: 'mix' as const, rows: MARGIN_PRODUCT_MIX };
          const copy = [...MARGIN_PRODUCT_MIX];
          const picked = copy.splice(idx, 1)[0];
          return { kind: 'mix' as const, rows: [picked, ...copy] };
        }
        case 'costs': {
          if (channel === 'all') return { kind: 'costs' as const, rows: MARGIN_COSTS };
          if (channel === 'online' || channel === 'partner') {
            return { kind: 'costs' as const, rows: MARGIN_COSTS.filter(r => !r.category.includes('Direct labor') && !r.category.includes('Overhead')) };
          }
          return { kind: 'costs' as const, rows: MARGIN_COSTS };
        }
        case 'sensitivity': return { kind: 'sensitivity' as const, rows: MARGIN_SENSITIVITY };
        default:            return { kind: 'none' as const, rows: [] };
      }
    },
    [topTab, product, channel],
    { delayMs: 340, keepPrevious: false },
  );

  const productLabel = waterfallData.data?.productLabel ?? 'All Products';
  const periodLabel  = waterfallData.data?.periodLabel  ?? 'Quarter-to-Date';
  const channelLabel = waterfallData.data?.channelLabel ?? 'All Channels';

  const tabSub: Record<string, string> = {
    waterfall:   `${productLabel} · GM bridge · ${periodLabel}`,
    productmix:  `5 products · revenue & margin share · ${periodLabel}`,
    costs:       `COGS decomposition · ${channelLabel}`,
    sensitivity: '5 scenarios modeled',
  };

  const chip = waterfallData.data?.statusChip ?? { kind: 'warn' as const, text: 'Mix compression · watch Wearables' };

  return (
    <WorkbenchShell
      workbench="margin"
      scopeLabel={`${WORKBENCHES.margin.label} · ${periodLabel} · ${productLabel} · ${channelLabel}`}
      scopeRight={<><span>{periodLabel}</span><span className="text-faint">·</span><span>{productLabel}</span><span className="text-faint">·</span><span>{channelLabel}</span></>}
      commentary={waterfallData.data?.commentary}
      commentaryHeadline={`Margin drivers · ${productLabel}`}
      leftRail={
        <>
          <RailGroup label="Product" items={MARGIN_PRODUCTS} active={product} onSelect={setProduct} groupKey="product" />
          <RailGroup label="Channel" items={MARGIN_CHANNELS} active={channel} onSelect={setChannel} groupKey="channel" />
          <RailGroup label="Period"  items={MARGIN_PERIODS}  active={period}  onSelect={setPeriod}  groupKey="period" />
        </>
      }
      topNav={<TopNav tabs={WORKBENCHES.margin.topTabs} active={topTab} onChange={setTopTab} />}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-semibold text-ink tracking-tight">Margin Intelligence · {productLabel}</h1>
          <p className="text-[11px] text-faint mt-0.5">{tabSub[topTab]} · {persona.role}</p>
        </div>
        <StatusChip kind={chip.kind}>{chip.text}</StatusChip>
      </div>

      {topTab === 'waterfall' && (
        <div className="relative">
          {waterfallData.refreshing && <RefreshingOverlay />}
          {waterfallData.initialLoading || !waterfallData.data ? (
            <>
              <KpiRowSkeleton />
              <ChartSkeleton />
              <CommentarySkeleton />
            </>
          ) : (
            <>
              <KpiRow kpis={waterfallData.data.kpis} />
              <WaterfallView steps={waterfallData.data.waterfall} />
              <div className="mt-3"><Commentary items={waterfallData.data.commentary} title={`${productLabel} — ranked drivers`} /></div>
              <NbaMainSection />
            </>
          )}
        </div>
      )}

      {topTab === 'productmix' && (
        tabData.loading || tabData.data?.kind !== 'mix' ? <TableSkeleton rows={5} cols={6} />
        : <ProductMixView rows={tabData.data.rows} />
      )}
      {topTab === 'costs' && (
        tabData.loading || tabData.data?.kind !== 'costs' ? <TableSkeleton rows={8} cols={4} />
        : <CostsView rows={tabData.data.rows} />
      )}
      {topTab === 'sensitivity' && (
        tabData.loading || tabData.data?.kind !== 'sensitivity' ? <TableSkeleton rows={5} cols={4} />
        : <SensitivityView scenarios={tabData.data.rows} />
      )}
    </WorkbenchShell>
  );
}
